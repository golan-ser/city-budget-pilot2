-- ==================================================
-- יצירת תשתית Tenant System עם משתמש דמו
-- ==================================================

-- 1. יצירת טבלת רשויות (tenants)
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. יצירת טבלת משתמשים
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  role VARCHAR(50) DEFAULT 'demo',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- 3. הוספת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 4. הוספת רשות דמו
INSERT INTO tenants (name, status) VALUES ('רשות דמו', 'active')
ON CONFLICT DO NOTHING;

-- 5. הוספת משתמש דמו (סיסמא: demo123)
-- Hash של הסיסמא demo123 עם bcrypt
INSERT INTO users (full_name, email, password_hash, tenant_id, role)
VALUES (
  'Demo User', 
  'demo@demo.com', 
  '$2b$10$rOtEat6RqjFjWjCLQeH8..ZeL8Kk7EZ8gY8r1pYV4FsKjF1K.vKm2', 
  1, 
  'demo'
)
ON CONFLICT (email) DO NOTHING;

-- 6. יצירת טבלת sessions לניהול כניסות
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id); 