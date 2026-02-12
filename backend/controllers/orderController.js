const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { isTransitionAllowed } = require('../utils/statusTransitions');
const { isUuid, toInt } = require('../utils/validation');

const COUPON_CODE_REGEX = /^[A-Z0-9_-]{4,40}$/;
const SIMPLE_PHONE_REGEX = /^[0-9+\-() ]{7,30}$/;

const normalizeCouponCode = (value) => String(value || '').trim().toUpperCase();
const cleanText = (value, max = 255) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return normalized.slice(0, max);
};

const normalizeAddressInput = (value) => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    label: cleanText(source.label, 100),
    recipientName: cleanText(source.recipientName || source.recipient_name, 120),
    phone: cleanText(source.phone, 30),
    addressLine1: cleanText(source.addressLine1 || source.address_line1, 255),
    addressLine2: cleanText(source.addressLine2 || source.address_line2, 255),
    city: cleanText(source.city, 120),
    state: cleanText(source.state, 120),
    country: cleanText(source.country, 120) || 'Nigeria',
    postalCode: cleanText(source.postalCode || source.postal_code, 30),
    notes: cleanText(source.notes, 500),
  };
};

const validateAddressInput = (address) => {
  if (!address.recipientName) return 'recipientName is required';
  if (!address.phone) return 'phone is required';
  if (!SIMPLE_PHONE_REGEX.test(address.phone)) return 'Invalid phone';
  if (!address.addressLine1) return 'addressLine1 is required';
  if (!address.city) return 'city is required';
  if (!address.state) return 'state is required';
  if (!address.country) return 'country is required';
  return null;
};

const validateCouponWindow = (coupon) => {
  if (!coupon || !coupon.is_active) return { valid: false, reason: 'Coupon is not active' };
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, reason: 'Coupon is not active yet' };
  }
  if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
    return { valid: false, reason: 'Coupon has expired' };
  }
  if (coupon.max_redemptions !== null && coupon.redemptions_count >= coupon.max_redemptions) {
    return { valid: false, reason: 'Coupon redemption limit reached' };
  }
  return { valid: true };
};

const computeCouponAmounts = (totalAmount, coupon) => {
  const total = Number(totalAmount);
  if (!Number.isFinite(total) || total <= 0) {
    return { error: 'Invalid order amount' };
  }

  let discountAmount = 0;
  const couponType = String(coupon.discount_type || '').toLowerCase();
  const discountValue = Number(coupon.discount_value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: 'Invalid coupon discount value' };
  }
  if (couponType === 'percentage') {
    if (discountValue > 100) {
      return { error: 'Invalid coupon discount value' };
    }
    discountAmount = (total * discountValue) / 100;
  } else if (couponType === 'fixed') {
    discountAmount = discountValue;
  } else {
    return { error: 'Unsupported coupon type' };
  }

  discountAmount = Number(discountAmount.toFixed(2));
  const payableAmount = Number((total - discountAmount).toFixed(2));
  if (payableAmount <= 0) {
    return { error: 'Coupon discount cannot reduce order to zero' };
  }

  return {
    discountAmount,
    payableAmount,
  };
};

const reserveCouponCount = async (connection, couponId) => {
  const [result] = await connection.query(
    `UPDATE coupons
     SET redemptions_count = redemptions_count + 1, updated_at = NOW()
     WHERE id = ?
       AND is_active = 1
       AND (starts_at IS NULL OR starts_at <= NOW())
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_redemptions IS NULL OR redemptions_count < max_redemptions)`,
    [couponId]
  );
  return result.affectedRows > 0;
};

const releaseCouponCount = async (connection, couponId) => {
  await connection.query(
    `UPDATE coupons
     SET redemptions_count = CASE WHEN redemptions_count > 0 THEN redemptions_count - 1 ELSE 0 END,
         updated_at = NOW()
     WHERE id = ?`,
    [couponId]
  );
};

// -------------------- GET /orders (List current user's orders) --------------------
exports.listMyOrders = async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(toInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(toInt(req.query.limit) || 20, 1), 100);
  const offset = (page - 1) * limit;
  const status = req.query.status ? String(req.query.status) : null;

  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  const where = ['user_id = ?'];
  const values = [userId];
  if (status) {
    where.push('status = ?');
    values.push(status);
  }

  const whereClause = `WHERE ${where.join(' AND ')}`;

  try {
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM orders
       ${whereClause}`,
      values
    );

    const [orders] = await db.query(
      `SELECT id, user_id, total_amount, discount_amount, payable_amount, coupon_code, status, created_at, updated_at,
              delivery_address_id, delivery_label, delivery_recipient_name, delivery_phone, delivery_address_line1,
              delivery_address_line2, delivery_city, delivery_state, delivery_country, delivery_postal_code, delivery_notes
       FROM orders
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    res.json({
      page,
      limit,
      total: countRows[0].total,
      orders,
    });
  } catch (err) {
    console.error('List orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listMyAddresses = async (req, res) => {
  const userId = req.user.id;
  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, user_id, label, recipient_name, phone, address_line1, address_line2, city, state, country, postal_code, notes, is_default, created_at, updated_at
       FROM user_addresses
       WHERE user_id = ?
       ORDER BY is_default DESC, updated_at DESC`,
      [userId]
    );
    return res.json({ addresses: rows });
  } catch (err) {
    console.error('List user addresses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createAddress = async (req, res) => {
  const userId = req.user.id;
  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  const payload = normalizeAddressInput(req.body || {});
  const validationError = validateAddressInput(payload);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const wantsDefault = Boolean(req.body && req.body.isDefault);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [defaults] = await connection.query(
      'SELECT id FROM user_addresses WHERE user_id = ? AND is_default = 1 FOR UPDATE',
      [userId]
    );
    const shouldDefault = wantsDefault || defaults.length === 0;
    if (shouldDefault) {
      await connection.query(
        'UPDATE user_addresses SET is_default = 0, updated_at = NOW() WHERE user_id = ?',
        [userId]
      );
    }

    const id = uuidv4();
    await connection.query(
      `INSERT INTO user_addresses
       (id, user_id, label, recipient_name, phone, address_line1, address_line2, city, state, country, postal_code, notes, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        userId,
        payload.label,
        payload.recipientName,
        payload.phone,
        payload.addressLine1,
        payload.addressLine2,
        payload.city,
        payload.state,
        payload.country,
        payload.postalCode,
        payload.notes,
        shouldDefault ? 1 : 0,
      ]
    );
    const [rows] = await connection.query(
      'SELECT * FROM user_addresses WHERE id = ?',
      [id]
    );
    await connection.commit();
    return res.status(201).json(rows[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Create address error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

exports.updateAddress = async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;
  if (!userId || !isUuid(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  if (!isUuid(addressId)) return res.status(400).json({ error: 'Invalid addressId' });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, user_id, label, recipient_name, phone, address_line1, address_line2, city, state, country, postal_code, notes, is_default
       FROM user_addresses WHERE id = ? AND user_id = ? FOR UPDATE`,
      [addressId, userId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }

    const existing = rows[0];
    const incoming = normalizeAddressInput(req.body || {});
    const merged = {
      label: incoming.label !== null ? incoming.label : existing.label,
      recipientName: incoming.recipientName !== null ? incoming.recipientName : existing.recipient_name,
      phone: incoming.phone !== null ? incoming.phone : existing.phone,
      addressLine1: incoming.addressLine1 !== null ? incoming.addressLine1 : existing.address_line1,
      addressLine2: incoming.addressLine2 !== null ? incoming.addressLine2 : existing.address_line2,
      city: incoming.city !== null ? incoming.city : existing.city,
      state: incoming.state !== null ? incoming.state : existing.state,
      country: incoming.country !== null ? incoming.country : existing.country,
      postalCode: incoming.postalCode !== null ? incoming.postalCode : existing.postal_code,
      notes: incoming.notes !== null ? incoming.notes : existing.notes,
    };
    const validationError = validateAddressInput(merged);
    if (validationError) {
      await connection.rollback();
      return res.status(400).json({ error: validationError });
    }

    const wantsDefault = req.body && req.body.isDefault === true;
    if (wantsDefault) {
      await connection.query(
        'UPDATE user_addresses SET is_default = 0, updated_at = NOW() WHERE user_id = ?',
        [userId]
      );
    }

    await connection.query(
      `UPDATE user_addresses
       SET label = ?, recipient_name = ?, phone = ?, address_line1 = ?, address_line2 = ?, city = ?, state = ?,
           country = ?, postal_code = ?, notes = ?, is_default = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        merged.label,
        merged.recipientName,
        merged.phone,
        merged.addressLine1,
        merged.addressLine2,
        merged.city,
        merged.state,
        merged.country,
        merged.postalCode,
        merged.notes,
        wantsDefault ? 1 : existing.is_default,
        addressId,
        userId,
      ]
    );

    const [updated] = await connection.query('SELECT * FROM user_addresses WHERE id = ?', [addressId]);
    await connection.commit();
    return res.json(updated[0]);
  } catch (err) {
    await connection.rollback();
    console.error('Update address error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

exports.deleteAddress = async (req, res) => {
  const userId = req.user.id;
  const { addressId } = req.params;
  if (!userId || !isUuid(userId)) return res.status(400).json({ error: 'Valid userId is required' });
  if (!isUuid(addressId)) return res.status(400).json({ error: 'Invalid addressId' });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ? FOR UPDATE',
      [addressId, userId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Address not found' });
    }
    const wasDefault = Boolean(rows[0].is_default);
    await connection.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (wasDefault) {
      const [candidate] = await connection.query(
        'SELECT id FROM user_addresses WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
        [userId]
      );
      if (candidate.length > 0) {
        await connection.query('UPDATE user_addresses SET is_default = 1, updated_at = NOW() WHERE id = ?', [candidate[0].id]);
      }
    }
    await connection.commit();
    return res.json({ message: 'Address deleted' });
  } catch (err) {
    await connection.rollback();
    console.error('Delete address error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// -------------------- POST /orders (Create order from cart) --------------------
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { addressId, deliveryAddress, saveAddress, saveAsDefault } = req.body || {};

  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }
  if (addressId !== undefined && addressId !== null && !isUuid(String(addressId))) {
    return res.status(400).json({ error: 'Invalid addressId' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let selectedAddress = null;
    if (addressId) {
      const [addressRows] = await connection.query(
        `SELECT id, label, recipient_name, phone, address_line1, address_line2, city, state, country, postal_code, notes
         FROM user_addresses
         WHERE id = ? AND user_id = ?
         FOR UPDATE`,
        [addressId, userId]
      );
      if (addressRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Selected address not found' });
      }
      selectedAddress = addressRows[0];
      if (saveAsDefault) {
        await connection.query('UPDATE user_addresses SET is_default = 0, updated_at = NOW() WHERE user_id = ?', [userId]);
        await connection.query('UPDATE user_addresses SET is_default = 1, updated_at = NOW() WHERE id = ?', [selectedAddress.id]);
      }
    } else {
      const normalized = normalizeAddressInput(deliveryAddress);
      const validationError = validateAddressInput(normalized);
      if (validationError) {
        await connection.rollback();
        return res.status(400).json({ error: validationError });
      }
      selectedAddress = {
        id: null,
        label: normalized.label,
        recipient_name: normalized.recipientName,
        phone: normalized.phone,
        address_line1: normalized.addressLine1,
        address_line2: normalized.addressLine2,
        city: normalized.city,
        state: normalized.state,
        country: normalized.country,
        postal_code: normalized.postalCode,
        notes: normalized.notes,
      };
      if (saveAddress) {
        const [defaultRows] = await connection.query(
          'SELECT id FROM user_addresses WHERE user_id = ? AND is_default = 1 FOR UPDATE',
          [userId]
        );
        const shouldDefault = Boolean(saveAsDefault) || defaultRows.length === 0;
        if (shouldDefault) {
          await connection.query('UPDATE user_addresses SET is_default = 0, updated_at = NOW() WHERE user_id = ?', [userId]);
        }
        const newAddressId = uuidv4();
        await connection.query(
          `INSERT INTO user_addresses
           (id, user_id, label, recipient_name, phone, address_line1, address_line2, city, state, country, postal_code, notes, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            newAddressId,
            userId,
            selectedAddress.label,
            selectedAddress.recipient_name,
            selectedAddress.phone,
            selectedAddress.address_line1,
            selectedAddress.address_line2,
            selectedAddress.city,
            selectedAddress.state,
            selectedAddress.country,
            selectedAddress.postal_code,
            selectedAddress.notes,
            shouldDefault ? 1 : 0,
          ]
        );
        selectedAddress.id = newAddressId;
      }
    }

    const [cartItems] = await connection.query(
      `SELECT 
         ci.food_id,
         ci.quantity,
         fi.price,
         fi.available,
         fi.name
       FROM cart_items ci
       JOIN food_items fi ON ci.food_id = fi.id
       WHERE ci.user_id = ?
       FOR UPDATE`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const unavailableItems = cartItems.filter((item) => !item.available);
    if (unavailableItems.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Some items are no longer available',
        items: unavailableItems.map((i) => i.name),
      });
    }

    const total = cartItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    const orderId = uuidv4();
    await connection.query(
      `INSERT INTO orders
       (id, user_id, total_amount, discount_amount, payable_amount, coupon_id, coupon_code, coupon_discount_type, coupon_discount_value,
        delivery_address_id, delivery_label, delivery_recipient_name, delivery_phone, delivery_address_line1, delivery_address_line2,
        delivery_city, delivery_state, delivery_country, delivery_postal_code, delivery_notes,
        status, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        orderId,
        userId,
        total,
        total,
        selectedAddress.id,
        selectedAddress.label,
        selectedAddress.recipient_name,
        selectedAddress.phone,
        selectedAddress.address_line1,
        selectedAddress.address_line2,
        selectedAddress.city,
        selectedAddress.state,
        selectedAddress.country,
        selectedAddress.postal_code,
        selectedAddress.notes,
      ]
    );

    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (id, order_id, food_id, quantity, price_at_order)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), orderId, item.food_id, item.quantity, item.price]
      );
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await connection.commit();

    res.status(201).json({
      orderId,
      status: 'pending',
      total: total.toFixed(2),
      payableAmount: total.toFixed(2),
      deliveryAddress: {
        addressId: selectedAddress.id,
        label: selectedAddress.label,
        recipientName: selectedAddress.recipient_name,
        phone: selectedAddress.phone,
        addressLine1: selectedAddress.address_line1,
        addressLine2: selectedAddress.address_line2,
        city: selectedAddress.city,
        state: selectedAddress.state,
        country: selectedAddress.country,
        postalCode: selectedAddress.postal_code,
        notes: selectedAddress.notes,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// -------------------- GET /orders/:id (Get order details) --------------------
exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  try {
    const [orders] = await db.query(
      `SELECT o.*, u.email, u.phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.*, fi.name, fi.description
       FROM order_items oi
       JOIN food_items fi ON oi.food_id = fi.id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({
      ...order,
      items,
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------------- POST /orders/:id/coupon/validate --------------------
exports.validateCouponForOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const couponCode = normalizeCouponCode(req.body && req.body.couponCode);

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }
  if (!COUPON_CODE_REGEX.test(couponCode)) {
    return res.status(400).json({ error: 'Invalid coupon code format' });
  }

  try {
    const [orders] = await db.query(
      `SELECT id, user_id, total_amount, status, coupon_code
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orders[0];
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Coupon can only be applied to pending orders' });
    }

    const [coupons] = await db.query(
      `SELECT id, code, discount_type, discount_value, max_redemptions, redemptions_count, starts_at, expires_at, is_active
       FROM coupons
       WHERE code = ?`,
      [couponCode]
    );
    if (coupons.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const coupon = coupons[0];
    const availability = validateCouponWindow(coupon);
    if (!availability.valid) {
      return res.status(400).json({ error: availability.reason });
    }

    const computed = computeCouponAmounts(order.total_amount, coupon);
    if (computed.error) {
      return res.status(400).json({ error: computed.error });
    }

    return res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
      },
      order: {
        totalAmount: Number(order.total_amount),
        discountAmount: computed.discountAmount,
        payableAmount: computed.payableAmount,
        alreadyApplied: order.coupon_code === coupon.code,
      },
    });
  } catch (err) {
    console.error('Validate coupon error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------------- POST /orders/:id/coupon/apply --------------------
exports.applyCouponToOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const couponCode = normalizeCouponCode(req.body && req.body.couponCode);

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }
  if (!COUPON_CODE_REGEX.test(couponCode)) {
    return res.status(400).json({ error: 'Invalid coupon code format' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT id, user_id, total_amount, status, coupon_id
       FROM orders
       WHERE id = ? AND user_id = ?
       FOR UPDATE`,
      [id, userId]
    );
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orders[0];
    if (order.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Coupon can only be applied to pending orders' });
    }

    const [couponRows] = await connection.query(
      `SELECT id, code, discount_type, discount_value, max_redemptions, redemptions_count, starts_at, expires_at, is_active
       FROM coupons
       WHERE code = ?
       FOR UPDATE`,
      [couponCode]
    );
    if (couponRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const coupon = couponRows[0];

    const [redemptions] = await connection.query(
      `SELECT id, coupon_id, status
       FROM coupon_redemptions
       WHERE order_id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );
    const alreadyReservedSameCoupon = redemptions.length > 0
      && redemptions[0].coupon_id === coupon.id
      && redemptions[0].status === 'reserved';

    const availability = validateCouponWindow(coupon);
    if (!availability.valid && !alreadyReservedSameCoupon) {
      await connection.rollback();
      return res.status(400).json({ error: availability.reason });
    }

    const computed = computeCouponAmounts(order.total_amount, coupon);
    if (computed.error) {
      await connection.rollback();
      return res.status(400).json({ error: computed.error });
    }

    let shouldReserveNew = false;
    if (redemptions.length === 0) {
      shouldReserveNew = true;
      await connection.query(
        `INSERT INTO coupon_redemptions
         (id, coupon_id, order_id, user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'reserved', NOW(), NOW())`,
        [uuidv4(), coupon.id, id, userId]
      );
    } else {
      const redemption = redemptions[0];
      if (redemption.status === 'consumed') {
        await connection.rollback();
        return res.status(409).json({ error: 'Coupon for this order is already consumed' });
      }

      if (redemption.coupon_id !== coupon.id) {
        if (redemption.status === 'reserved') {
          await releaseCouponCount(connection, redemption.coupon_id);
        }
        shouldReserveNew = true;
        await connection.query(
          `UPDATE coupon_redemptions
           SET coupon_id = ?, status = 'reserved', updated_at = NOW()
           WHERE id = ?`,
          [coupon.id, redemption.id]
        );
      } else if (redemption.status === 'released') {
        shouldReserveNew = true;
        await connection.query(
          `UPDATE coupon_redemptions
           SET status = 'reserved', updated_at = NOW()
           WHERE id = ?`,
          [redemption.id]
        );
      }
    }

    if (shouldReserveNew) {
      const reserved = await reserveCouponCount(connection, coupon.id);
      if (!reserved) {
        await connection.rollback();
        return res.status(400).json({ error: 'Coupon redemption limit reached' });
      }
    }

    await connection.query(
      `UPDATE orders
       SET coupon_id = ?,
           coupon_code = ?,
           coupon_discount_type = ?,
           coupon_discount_value = ?,
           discount_amount = ?,
           payable_amount = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        coupon.id,
        coupon.code,
        coupon.discount_type,
        coupon.discount_value,
        computed.discountAmount,
        computed.payableAmount,
        id,
      ]
    );

    await connection.commit();
    return res.json({
      message: 'Coupon applied successfully',
      orderId: id,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
      },
      amounts: {
        totalAmount: Number(order.total_amount),
        discountAmount: computed.discountAmount,
        payableAmount: computed.payableAmount,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Apply coupon error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// -------------------- DELETE /orders/:id/coupon --------------------
exports.removeCouponFromOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT id, total_amount, status, coupon_id
       FROM orders
       WHERE id = ? AND user_id = ?
       FOR UPDATE`,
      [id, userId]
    );
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    if (order.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Coupon can only be removed from pending orders' });
    }
    if (!order.coupon_id) {
      await connection.rollback();
      return res.status(400).json({ error: 'No coupon applied on this order' });
    }

    const [redemptions] = await connection.query(
      `SELECT id, coupon_id, status
       FROM coupon_redemptions
       WHERE order_id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (redemptions.length > 0 && redemptions[0].status === 'reserved') {
      await releaseCouponCount(connection, redemptions[0].coupon_id);
      await connection.query(
        `UPDATE coupon_redemptions
         SET status = 'released', updated_at = NOW()
         WHERE id = ?`,
        [redemptions[0].id]
      );
    }

    await connection.query(
      `UPDATE orders
       SET coupon_id = NULL,
           coupon_code = NULL,
           coupon_discount_type = NULL,
           coupon_discount_value = NULL,
           discount_amount = 0,
           payable_amount = total_amount,
           updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    await connection.commit();
    return res.json({
      message: 'Coupon removed successfully',
      orderId: id,
      payableAmount: Number(order.total_amount),
    });
  } catch (err) {
    await connection.rollback();
    console.error('Remove coupon error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

// -------------------- PATCH /orders/:id/status (Update order status) --------------------
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const [orders] = await db.query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = orders[0].status;
    if (!isTransitionAllowed(currentStatus, status)) {
      return res.status(400).json({
        error: `Cannot transition order from '${currentStatus}' to '${status}'`,
      });
    }

    await db.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    res.json({
      message: 'Order status updated successfully',
      orderId: id,
      newStatus: status,
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// -------------------- POST /orders/:id/cancel (Customer cancel) --------------------
exports.cancelOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!userId || !isUuid(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }
  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT id, status, total_amount, coupon_id
       FROM orders
       WHERE id = ? AND user_id = ?
       FOR UPDATE`,
      [id, userId]
    );
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    if (order.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        error: `Cannot cancel order in '${order.status}' status. Only pending orders can be cancelled.`,
      });
    }

    if (order.coupon_id) {
      const [redemptions] = await connection.query(
        `SELECT id, coupon_id, status
         FROM coupon_redemptions
         WHERE order_id = ?
         LIMIT 1
         FOR UPDATE`,
        [id]
      );
      if (redemptions.length > 0 && redemptions[0].status === 'reserved') {
        await releaseCouponCount(connection, redemptions[0].coupon_id);
        await connection.query(
          `UPDATE coupon_redemptions
           SET status = 'released', updated_at = NOW()
           WHERE id = ?`,
          [redemptions[0].id]
        );
      }

      await connection.query(
        `UPDATE orders
         SET coupon_id = NULL,
             coupon_code = NULL,
             coupon_discount_type = NULL,
             coupon_discount_value = NULL,
             discount_amount = 0,
             payable_amount = total_amount,
             updated_at = NOW()
         WHERE id = ?`,
        [id]
      );
    }

    await connection.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['cancelled', id]
    );

    await connection.commit();
    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};
