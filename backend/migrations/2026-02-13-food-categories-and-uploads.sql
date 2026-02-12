-- Add admin-managed meal categories and image storage support

CREATE TABLE IF NOT EXISTS meal_categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at DATETIME,
  updated_at DATETIME
);

ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS category_id VARCHAR(36),
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';

-- Backfill categories from existing food_items.category values
INSERT INTO meal_categories (id, name, created_at, updated_at)
SELECT UUID(), fi.category, NOW(), NOW()
FROM food_items fi
LEFT JOIN meal_categories mc ON LOWER(mc.name) = LOWER(fi.category)
WHERE fi.category IS NOT NULL
  AND TRIM(fi.category) <> ''
  AND mc.id IS NULL
GROUP BY fi.category;

UPDATE food_items fi
JOIN meal_categories mc ON LOWER(mc.name) = LOWER(fi.category)
SET fi.category_id = mc.id
WHERE fi.category_id IS NULL
  AND fi.category IS NOT NULL
  AND TRIM(fi.category) <> '';
