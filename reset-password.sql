-- Reset password for imyogesh82@gmail.com
-- This script will set a temporary password that the user should change after login

-- First, let's check if the user exists
SELECT id, email, first_name, last_name, user_type, created_at 
FROM users 
WHERE email = 'imyogesh82@gmail.com';

-- Generate a bcrypt hash for the temporary password "TempPassword123!"
-- Hash generated with bcrypt cost factor 10: $2b$10$FX.DR1ObDoDBeKnJFDyjGO/Fxsb6xlhz9FVMfFCQr9R.or9gmTvi2
-- This corresponds to the password: "TempPassword123!"

-- Update the password
UPDATE users 
SET 
    password_hash = '$2b$10$FX.DR1ObDoDBeKnJFDyjGO/Fxsb6xlhz9FVMfFCQr9R.or9gmTvi2',
    updated_at = NOW()
WHERE email = 'imyogesh82@gmail.com';

-- Verify the update
SELECT id, email, first_name, last_name, user_type, updated_at 
FROM users 
WHERE email = 'imyogesh82@gmail.com';

-- Display the temporary password information
SELECT 
    'Password reset completed for: imyogesh82@gmail.com' as message,
    'Temporary password: TempPassword123!' as temp_password,
    'Please ask the user to change this password after login' as note;