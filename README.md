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

Verify the browser-side Pixel calls with Puppeteer:

```powershell
npm run pixel:test
```

The verifier starts a local Vite server, stubs `window.fbq` so no real Meta traffic is sent, and checks the public funnel routes for the expected calls. If Puppeteer reports that Chrome is missing, run this once:

```powershell
npm run pixel:install-browser
```

To test an already-deployed site instead of the local Vite server:

```powershell
$env:SAGESET_PIXEL_TEST_URL="https://sagesetfitness.com"
npm run pixel:test
Remove-Item Env:\SAGESET_PIXEL_TEST_URL
```

