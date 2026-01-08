# Create admin user
node createUser.mjs --email admin@worksidesoftware.com --password SecurePass123! --admin

# Create regular user with display name
node createUser.mjs --email test@example.com --password TestPass123! --displayName "Test User"

# Update existing user's password
node createUser.mjs --email admin@worksidesoftware.com --password NewPassword456!

//////////////////////////////////////////////////////
Access admin portal at /admin route of your web app

