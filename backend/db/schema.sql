-- DAIMUZ DELIVERY - Database Schema Phase 1 MVP
-- Run this to create the database and all tables

CREATE DATABASE IF NOT EXISTS daimuz_delivery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE daimuz_delivery;

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id              VARCHAR(36) PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(30) NULL,
  role            ENUM('customer','dealer','admin') NOT NULL DEFAULT 'customer',
  avatar_url      VARCHAR(500) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id              VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  image_url       VARCHAR(500) NULL,
  sort_order      INT DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  INDEX idx_categories_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id              VARCHAR(36) PRIMARY KEY,
  category_id     VARCHAR(36) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  description     TEXT NULL,
  price           DECIMAL(10,2) NOT NULL,
  image_url       VARCHAR(500) NULL,
  is_available    TINYINT(1) DEFAULT 1,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_available (is_available),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- DELIVERY ZONES
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id              VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  center_lat      DECIMAL(10,7) NOT NULL,
  center_lng      DECIMAL(10,7) NOT NULL,
  radius_km       DECIMAL(5,2) NOT NULL,
  is_active       TINYINT(1) DEFAULT 1,
  INDEX idx_zones_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(36) PRIMARY KEY,
  customer_id     VARCHAR(36) NOT NULL,
  dealer_id       VARCHAR(36) NULL,
  status          ENUM('pending','waiting_dealer','accepted','picked_up','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_address VARCHAR(500) NOT NULL,
  delivery_lat    DECIMAL(10,7) NOT NULL,
  delivery_lng    DECIMAL(10,7) NOT NULL,
  notes           TEXT NULL,
  payment_method  VARCHAR(30) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_dealer (dealer_id),
  INDEX idx_orders_status (status),
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dealer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id              VARCHAR(36) PRIMARY KEY,
  order_id        VARCHAR(36) NOT NULL,
  product_id      VARCHAR(36) NOT NULL,
  product_name    VARCHAR(200) NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  INDEX idx_items_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- MESSAGES (CHAT PER ORDER)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id              VARCHAR(36) PRIMARY KEY,
  order_id        VARCHAR(36) NOT NULL,
  sender_id       VARCHAR(36) NOT NULL,
  sender_role     ENUM('customer','dealer','admin','system') NOT NULL,
  message_type    ENUM('text','image','system') NOT NULL DEFAULT 'text',
  message         TEXT NULL,
  image_url       VARCHAR(500) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read         TINYINT(1) DEFAULT 0,
  INDEX idx_messages_order (order_id),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_read (is_read),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- TRACKING LOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS tracking_locations (
  id              VARCHAR(36) PRIMARY KEY,
  order_id        VARCHAR(36) NOT NULL,
  dealer_id       VARCHAR(36) NOT NULL,
  lat             DECIMAL(10,7) NOT NULL,
  lng             DECIMAL(10,7) NOT NULL,
  recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tracking_order (order_id),
  INDEX idx_tracking_time (recorded_at),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- DEALER STATS
-- ============================================
CREATE TABLE IF NOT EXISTS dealer_stats (
  id              VARCHAR(36) PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL UNIQUE,
  completed_orders INT DEFAULT 0,
  rating_avg      DECIMAL(3,2) DEFAULT 0,
  xp              INT DEFAULT 0,
  `rank`          VARCHAR(20) DEFAULT 'Bronze',
  total_distance  DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- REWARD WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS reward_wallets (
  id              VARCHAR(36) PRIMARY KEY,
  user_id         VARCHAR(36) NOT NULL UNIQUE,
  points          INT DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Configuración de la aplicación (key-value): credenciales Cloudinary, etc.
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key     VARCHAR(100) PRIMARY KEY,
  setting_value   TEXT,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
