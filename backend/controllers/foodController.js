const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { toNumber, isUuid } = require('../utils/validation');
const { saveImageFromDataUrl, deleteImageByPublicPath } = require('../utils/uploads');

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeCurrency = (value) => {
  if (!value) return 'NGN';
  const normalized = String(value).trim().toUpperCase();
  return normalized || 'NGN';
};

const resolveCategory = async (connection, { categoryId, categoryName, required = false }) => {
  const categoryIdValue = toTrimmedString(categoryId);
  const categoryNameValue = toTrimmedString(categoryName);

  if (!categoryIdValue && !categoryNameValue) {
    if (required) throw new Error('Category is required');
    return null;
  }

  if (categoryIdValue) {
    if (!isUuid(categoryIdValue)) throw new Error('Invalid category id');
    const [rows] = await connection.query('SELECT id, name FROM meal_categories WHERE id = ?', [categoryIdValue]);
    if (rows.length === 0) throw new Error('Category not found');
    return rows[0];
  }

  const normalizedName = categoryNameValue.slice(0, 100);
  const [existing] = await connection.query('SELECT id, name FROM meal_categories WHERE LOWER(name) = LOWER(?)', [normalizedName]);
  if (existing.length > 0) return existing[0];

  const id = uuidv4();
  await connection.query(
    `INSERT INTO meal_categories (id, name, created_at, updated_at)
     VALUES (?, ?, NOW(), NOW())`,
    [id, normalizedName]
  );
  return { id, name: normalizedName };
};

const FOOD_SELECT_BASE_SQL = `
  SELECT
    fi.id,
    fi.name,
    fi.price,
    fi.description,
    fi.category_id AS categoryId,
    COALESCE(mc.name, fi.category) AS category,
    fi.image_url AS imageUrl,
    fi.currency,
    fi.available,
    fi.created_at,
    fi.updated_at
  FROM food_items fi
  LEFT JOIN meal_categories mc ON mc.id = fi.category_id
`;

exports.getAllFoods = async (req, res) => {
  try {
    const [foods] = await db.query(
      `${FOOD_SELECT_BASE_SQL}
       WHERE fi.available = 1
       ORDER BY COALESCE(mc.name, fi.category, ''), fi.name`
    );
    return res.json(foods);
  } catch (err) {
    console.error('Get foods error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllFoodsForAdmin = async (req, res) => {
  try {
    const [foods] = await db.query(
      `${FOOD_SELECT_BASE_SQL}
       ORDER BY COALESCE(mc.name, fi.category, ''), fi.name`
    );
    return res.json(foods);
  } catch (err) {
    console.error('Get admin foods error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFoodById = async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ error: 'Invalid food id' });
  }

  try {
    const [foods] = await db.query(
      `${FOOD_SELECT_BASE_SQL}
       WHERE fi.available = 1
       AND fi.id = ?`,
      [id]
    );
    if (foods.length === 0) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    return res.json(foods[0]);
  } catch (err) {
    console.error('Get food by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.listCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mc.id, mc.name, COUNT(fi.id) AS foodCount, mc.created_at, mc.updated_at
       FROM meal_categories mc
       LEFT JOIN food_items fi ON fi.category_id = mc.id
       GROUP BY mc.id, mc.name, mc.created_at, mc.updated_at
       ORDER BY mc.name ASC`
    );
    return res.json(rows);
  } catch (err) {
    console.error('List categories error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createCategory = async (req, res) => {
  const name = toTrimmedString(req.body && req.body.name);
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  try {
    const [existing] = await db.query('SELECT id, name, created_at, updated_at FROM meal_categories WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing.length > 0) return res.status(409).json({ error: 'Category already exists', category: existing[0] });

    const id = uuidv4();
    await db.query(
      `INSERT INTO meal_categories (id, name, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [id, name.slice(0, 100)]
    );

    const [rows] = await db.query('SELECT id, name, created_at, updated_at FROM meal_categories WHERE id = ?', [id]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const name = toTrimmedString(req.body && req.body.name);
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid category id' });
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  try {
    const [dup] = await db.query('SELECT id FROM meal_categories WHERE LOWER(name) = LOWER(?) AND id <> ?', [name, id]);
    if (dup.length > 0) return res.status(409).json({ error: 'Category name already exists' });

    const [result] = await db.query(
      `UPDATE meal_categories
       SET name = ?, updated_at = NOW()
       WHERE id = ?`,
      [name.slice(0, 100), id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });

    await db.query('UPDATE food_items SET category = ?, updated_at = NOW() WHERE category_id = ?', [name.slice(0, 100), id]);
    const [rows] = await db.query('SELECT id, name, created_at, updated_at FROM meal_categories WHERE id = ?', [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid category id' });

  try {
    const [foods] = await db.query('SELECT COUNT(*) AS total FROM food_items WHERE category_id = ?', [id]);
    if (Number(foods[0].total) > 0) {
      return res.status(409).json({ error: 'Category has meals assigned. Reassign meals before deleting.' });
    }

    const [result] = await db.query('DELETE FROM meal_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found' });
    return res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addFood = async (req, res) => {
  const name = toTrimmedString(req.body && req.body.name);
  const priceValue = toNumber(req.body && req.body.price);
  const description = toTrimmedString(req.body && req.body.description);
  const currency = normalizeCurrency(req.body && req.body.currency);
  const imageDataUrl = req.body && req.body.imageDataUrl;
  const imageFileName = req.body && req.body.imageFileName;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (priceValue === null || priceValue <= 0) return res.status(400).json({ error: 'Price must be a positive number' });
  if (currency !== 'NGN') return res.status(400).json({ error: 'Only NGN currency is supported' });

  const connection = await db.getConnection();
  let uploadedImagePath = null;
  try {
    await connection.beginTransaction();

    const category = await resolveCategory(connection, {
      categoryId: req.body && req.body.categoryId,
      categoryName: req.body && req.body.category,
      required: true,
    });

    if (imageDataUrl) {
      const saved = await saveImageFromDataUrl(imageDataUrl, imageFileName || name);
      uploadedImagePath = saved.publicPath;
    }

    const foodId = uuidv4();
    await connection.query(
      `INSERT INTO food_items (id, name, price, description, category_id, category, image_url, currency, available, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [foodId, name, priceValue, description || null, category.id, category.name, uploadedImagePath, currency]
    );

    const [newFood] = await connection.query(
      `${FOOD_SELECT_BASE_SQL}
       WHERE fi.id = ?`,
      [foodId]
    );

    await connection.commit();
    return res.status(201).json(newFood[0]);
  } catch (err) {
    await connection.rollback();
    if (uploadedImagePath) {
      await deleteImageByPublicPath(uploadedImagePath).catch(() => {});
    }
    if (err && err.message) {
      const known = ['Category is required', 'Invalid category id', 'Category not found', 'Unsupported image type. Use jpeg, png, webp, or gif.', 'Invalid image format. Expected base64 data URL.', 'Image payload exceeds 5MB.', 'Image payload is empty.'];
      if (known.includes(err.message)) {
        return res.status(400).json({ error: err.message });
      }
    }
    console.error('Add food error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

exports.updateFood = async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid food id' });

  const connection = await db.getConnection();
  let uploadedImagePath = null;
  let oldImagePathForDeletion = null;
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT id, name, image_url, currency
       FROM food_items
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Food item not found' });
    }
    const existing = rows[0];

    const fields = [];
    const values = [];

    if (req.body && req.body.name !== undefined) {
      const name = toTrimmedString(req.body.name);
      if (!name) return res.status(400).json({ error: 'Name must be a non-empty string' });
      fields.push('name = ?');
      values.push(name);
    }

    if (req.body && req.body.price !== undefined) {
      const priceValue = toNumber(req.body.price);
      if (priceValue === null || priceValue <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
      }
      fields.push('price = ?');
      values.push(priceValue);
    }

    if (req.body && req.body.description !== undefined) {
      fields.push('description = ?');
      values.push(toTrimmedString(req.body.description) || null);
    }

    if (req.body && req.body.currency !== undefined) {
      const currency = normalizeCurrency(req.body.currency);
      if (currency !== 'NGN') return res.status(400).json({ error: 'Only NGN currency is supported' });
      fields.push('currency = ?');
      values.push(currency);
    }

    if (req.body && (req.body.categoryId !== undefined || req.body.category !== undefined)) {
      const category = await resolveCategory(connection, {
        categoryId: req.body.categoryId,
        categoryName: req.body.category,
        required: true,
      });
      fields.push('category_id = ?');
      values.push(category.id);
      fields.push('category = ?');
      values.push(category.name);
    }

    if (req.body && req.body.imageDataUrl) {
      const nextName = (req.body.name ? toTrimmedString(req.body.name) : existing.name) || existing.name;
      const saved = await saveImageFromDataUrl(req.body.imageDataUrl, req.body.imageFileName || nextName);
      uploadedImagePath = saved.publicPath;
      fields.push('image_url = ?');
      values.push(uploadedImagePath);
      oldImagePathForDeletion = existing.image_url || null;
    } else if (req.body && req.body.removeImage === true) {
      fields.push('image_url = ?');
      values.push(null);
      oldImagePathForDeletion = existing.image_url || null;
    }

    if (req.body && req.body.available !== undefined) {
      const availableValue = req.body.available;
      if (typeof availableValue !== 'boolean' && availableValue !== 0 && availableValue !== 1) {
        return res.status(400).json({ error: 'available must be a boolean' });
      }
      fields.push('available = ?');
      values.push(availableValue ? 1 : 0);
    }

    if (fields.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = NOW()');
    await connection.query(`UPDATE food_items SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);

    const [updatedFood] = await connection.query(
      `${FOOD_SELECT_BASE_SQL}
       WHERE fi.id = ?`,
      [id]
    );

    await connection.commit();

    if (oldImagePathForDeletion && oldImagePathForDeletion !== uploadedImagePath) {
      await deleteImageByPublicPath(oldImagePathForDeletion).catch(() => {});
    }

    return res.json(updatedFood[0]);
  } catch (err) {
    await connection.rollback();
    if (uploadedImagePath) {
      await deleteImageByPublicPath(uploadedImagePath).catch(() => {});
    }
    if (err && err.message) {
      const known = ['Category is required', 'Invalid category id', 'Category not found', 'Unsupported image type. Use jpeg, png, webp, or gif.', 'Invalid image format. Expected base64 data URL.', 'Image payload exceeds 5MB.', 'Image payload is empty.'];
      if (known.includes(err.message)) {
        return res.status(400).json({ error: err.message });
      }
    }
    console.error('Update food error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};

exports.deleteFood = async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid food id' });

  try {
    const [result] = await db.query(
      'UPDATE food_items SET available = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Food item not found' });
    }
    return res.json({ message: 'Food item marked as unavailable' });
  } catch (err) {
    console.error('Delete food error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
