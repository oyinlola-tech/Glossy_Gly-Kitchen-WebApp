USE glossy_gly_kitchen;

CREATE TABLE IF NOT EXISTS user_addresses (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  label VARCHAR(100),
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL DEFAULT 'Nigeria',
  postal_code VARCHAR(30),
  notes VARCHAR(500),
  is_default BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_addresses_user (user_id),
  INDEX idx_user_addresses_default (user_id, is_default)
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address_id VARCHAR(36) NULL AFTER coupon_discount_value,
  ADD COLUMN IF NOT EXISTS delivery_label VARCHAR(100) NULL AFTER delivery_address_id,
  ADD COLUMN IF NOT EXISTS delivery_recipient_name VARCHAR(120) NULL AFTER delivery_label,
  ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(30) NULL AFTER delivery_recipient_name,
  ADD COLUMN IF NOT EXISTS delivery_address_line1 VARCHAR(255) NULL AFTER delivery_phone,
  ADD COLUMN IF NOT EXISTS delivery_address_line2 VARCHAR(255) NULL AFTER delivery_address_line1,
  ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(120) NULL AFTER delivery_address_line2,
  ADD COLUMN IF NOT EXISTS delivery_state VARCHAR(120) NULL AFTER delivery_city,
  ADD COLUMN IF NOT EXISTS delivery_country VARCHAR(120) NULL AFTER delivery_state,
  ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(30) NULL AFTER delivery_country,
  ADD COLUMN IF NOT EXISTS delivery_notes VARCHAR(500) NULL AFTER delivery_postal_code;

ALTER TABLE orders
  ADD INDEX IF NOT EXISTS idx_orders_delivery_address_id (delivery_address_id);
