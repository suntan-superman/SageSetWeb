# Create admin user
node createUser.mjs --email admin@sagesetfitness.com --password SecurePass123! --admin

# Create regular user with display name
node createUser.mjs --email test@example.com --password TestPass123! --displayName "Test User"

# Update existing user's password
node createUser.mjs --email admin@sagesetfitness.com --password NewPassword456!

//////////////////////////////////////////////////////
Access admin portal at /admin route of your web app

admin@sagesetfitness.com
P55
/////////////////////////////////////////////////////

## Meta Pixel

Set the public Pixel ID in `web/.env`:

```env
VITE_META_PIXEL_ID=your_meta_pixel_id
```

Tracked browser events:

- `PageView` on route changes
- `ViewContent` on signup and marketing content
- `Lead` on signup intent
- `CompleteRegistration` after successful web signup
- `StartTrial` on `/billing/success`
- `InitiateCheckout` when the Stripe checkout flow starts
- `Subscribe` on `/billing/success`
- custom `CheckoutCancelled`, `CheckoutSessionCreated`, and `DownloadClicked`

