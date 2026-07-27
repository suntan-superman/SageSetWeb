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
VITE_META_CAPI_ENDPOINT=https://us-central1-greencheck-d3d88.cloudfunctions.net/sendMetaConversion
VITE_FIREBASE_APPCHECK_SITE_KEY=your_recaptcha_enterprise_site_key
```

`ViewContent` is the only event currently paired with the server-side Meta Conversions API. The browser generates one `vc_<UUID>` and supplies the same value as Pixel `eventID` and CAPI `event_id`. Other events remain Pixel-only until ViewContent is certified.

The CAPI access token and dataset ID are Firebase runtime secrets. They must never be configured as `VITE_*` variables.

Tracked browser events:

- `PageView` on route changes
- `ViewContent` on signup and marketing content
- `Lead` on signup intent
- `CompleteRegistration` after successful web signup
- `StartTrial` on `/billing/success`
- `InitiateCheckout` when the Stripe checkout flow starts
- `Subscribe` on `/billing/success`
- custom `CheckoutCancelled`, `CheckoutSessionCreated`, and `DownloadClicked`

Verify the browser-side Pixel calls with Puppeteer without sending traffic to Meta:

```powershell
npm run pixel:test
```

The verifier starts a local Vite server, stubs `window.fbq` so no real Meta traffic is sent, and checks the public funnel routes for the expected calls. If Puppeteer reports that Chrome is missing, run this once:

```powershell
npm run pixel:install-browser
```

To send real browser events to Meta Events Manager Test Events, copy the active test event code from Meta and run:

```powershell
$env:SAGESET_META_TEST_EVENT_CODE="TEST20042"
npm run pixel:test:live:headful
Remove-Item Env:\SAGESET_META_TEST_EVENT_CODE
```

Headful mode opens a visible Chrome session. Meta's browser Pixel library may load in headless Puppeteer without emitting the final `facebook.com/tr` collection requests, so use headful mode when confirming events inside Meta Events Manager.

For CAPI Test Events, temporarily configure `META_TEST_EVENT_CODE` on the Firebase function runtime, validate the matching browser/server ID in Meta, and remove it before production validation. Never accept a Test Events code from an untrusted browser request.

To test the already-deployed site, temporarily add `VITE_META_TEST_EVENT_CODE` in Netlify, redeploy, run the live check, then remove the variable and redeploy before production validation:

```powershell
$env:SAGESET_PIXEL_TEST_URL="https://sagesetfitness.com"
$env:SAGESET_META_TEST_EVENT_CODE="TEST20042"
npm run pixel:test:live:headful
Remove-Item Env:\SAGESET_META_TEST_EVENT_CODE
Remove-Item Env:\SAGESET_PIXEL_TEST_URL
```

The URL query string is ignored by production bundles; this prevents visitors from injecting a Meta Test Events code.

