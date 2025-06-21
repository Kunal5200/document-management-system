-- Insert admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES (
  'admin@example.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'admin', 
  'Admin', 
  'User'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample customers (password: password123)
-- Password hash for 'password123' using bcrypt
INSERT INTO users (email, password_hash, role, first_name, last_name) 
VALUES 
  ('customer1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'John', 'Doe'),
  ('customer2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', 'Jane', 'Smith')
ON CONFLICT (email) DO NOTHING;

-- Insert sample documents
INSERT INTO documents (user_id, document_type, file_name, file_url, file_size, status, uploaded_at)
SELECT 
  u.id,
  'Identity Card',
  'john_id_card.pdf',
  '/uploads/john_id_card.pdf',
  1024000,
  'pending',
  NOW()
FROM users u WHERE u.email = 'customer1@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO documents (user_id, document_type, file_name, file_url, file_size, status, uploaded_at)
SELECT 
  u.id,
  'Passport',
  'jane_passport.pdf',
  '/uploads/jane_passport.pdf',
  2048000,
  'approved',
  NOW() - INTERVAL '1 day'
FROM users u WHERE u.email = 'customer2@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO documents (user_id, document_type, file_name, file_url, file_size, status, rejection_reason, uploaded_at)
SELECT 
  u.id,
  'Driver License',
  'john_license.pdf',
  '/uploads/john_license.pdf',
  1536000,
  'rejected',
  'Document image is not clear. Please upload a higher quality scan.',
  NOW() - INTERVAL '2 days'
FROM users u WHERE u.email = 'customer1@example.com'
ON CONFLICT DO NOTHING;

SELECT * FROM users WHERE email = 'admin@example.com' AND role = 'admin';
