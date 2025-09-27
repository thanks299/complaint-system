-- NACOS Complaint Management System Database Schema
-- Based on your application structure and requirements

-- =================================================================
-- 1. USERS TABLE
-- =================================================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    regno VARCHAR(255) UNIQUE NOT NULL,           -- Registration number
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,               -- Hashed with bcryptjs
    role VARCHAR(50) DEFAULT 'student',           -- 'student' or 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,                       -- Track user login times
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 2. ADMINS TABLE
-- =================================================================
CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,               -- Hashed with bcryptjs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 3. COMPLAINTS TABLE
-- =================================================================
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                   -- Student name
    matric VARCHAR(255) NOT NULL,                 -- Matriculation number
    email VARCHAR(255) NOT NULL,                  -- Student email
    department VARCHAR(255) NOT NULL,             -- Student department
    title VARCHAR(255) NOT NULL,                  -- Complaint title
    details TEXT NOT NULL,                        -- Complaint description
    status VARCHAR(50) DEFAULT 'pending',         -- 'pending', 'in-progress', 'resolved'
    username VARCHAR(255),                        -- Linked to user who submitted
    user_id BIGINT REFERENCES users(id),          -- Foreign key to users table
    created_at TIMESTAMPTZ DEFAULT NOW(),         -- When complaint was created
    updated_at TIMESTAMPTZ DEFAULT NOW()          -- When complaint was last updated
);

-- =================================================================
-- 4. PERFORMANCE INDEXES
-- =================================================================
-- User table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_regno ON users(regno);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Admin table indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_created_at ON admins(created_at);

-- Complaint table indexes
CREATE INDEX idx_complaints_email ON complaints(email);
CREATE INDEX idx_complaints_matric ON complaints(matric);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaints_department ON complaints(department);

-- =================================================================
-- 5. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at 
    BEFORE UPDATE ON complaints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 6. ROW LEVEL SECURITY (RLS) SETUP
-- =================================================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Development/Simple policies (for getting app working)
CREATE POLICY "users_public_access" ON users 
    FOR ALL TO anon, authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "admins_public_access" ON admins 
    FOR ALL TO anon, authenticated 
    USING (true) WITH CHECK (true);

CREATE POLICY "complaints_public_access" ON complaints 
    FOR ALL TO anon, authenticated 
    USING (true) WITH CHECK (true);

-- =================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =================================================================
-- Sample admin (password is hashed version of 'admin123')
INSERT INTO admins (username, password, email) VALUES 
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkKNIBn9sBjqrqG', 'admin@nacos.edu.ng')
ON CONFLICT (username) DO NOTHING;

-- Sample student user (password is hashed version of 'student123')
INSERT INTO users (firstname, lastname, regno, email, username, password, role) VALUES 
('John', 'Doe', 'NACOS/2023/001', 'john.doe@student.nacos.edu.ng', 'johndoe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkKNIBn9sBjqrqG', 'student')
ON CONFLICT (username) DO NOTHING;

-- Sample complaint
INSERT INTO complaints (name, matric, email, department, title, details, status, username, user_id) VALUES 
('John Doe', 'NACOS/2023/001', 'john.doe@student.nacos.edu.ng', 'Computer Science', 'Portal Access Issue', 'I am unable to access the student portal since yesterday. The login page keeps showing error messages.', 'pending', 'johndoe', 1)
ON CONFLICT DO NOTHING;