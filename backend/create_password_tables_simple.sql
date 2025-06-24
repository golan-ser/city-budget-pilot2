-- Create password management tables
CREATE TABLE IF NOT EXISTS password_reset_history (
  reset_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reset_by INTEGER REFERENCES users(id),
  reset_method VARCHAR(50) NOT NULL,
  reset_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  tenant_id INTEGER REFERENCES tenants(tenant_id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_reset_by ON password_reset_history(reset_by);
CREATE INDEX IF NOT EXISTS idx_password_reset_tenant_id ON password_reset_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_date ON password_reset_history(reset_at);

-- Add updated_at column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create or replace update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 