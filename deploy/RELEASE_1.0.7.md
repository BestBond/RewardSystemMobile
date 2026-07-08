# BestBond mobile release 1.0.7

**Version:** 1.0.7  
**iOS build:** 13  
**Android versionCode:** 9  

## What's New (App Store / Play Store)

Use this text for **What's New** / **Release notes**:

```
• Wallet shows how many days until your points reset (annual expiry)
• Unused points reset to zero each year from your signup date
• Admin: download large coupon batches (300+) as ZIP with progress
• Simpler sign up — place instead of address, no email field
• Coupon QR scans open the app scanner; redeem points in-app only
```

## Prerequisites — deploy API first

Release **1.0.7** depends on API changes that are not on production yet:

| Feature | API repo changes |
|---------|------------------|
| Wallet expiry | `wallet_points_expires_at`, `POINTS_EXPIRE`, profile `pointsExpireInDays` |
| Large export | Already on prod (async ZIP) |

From `api.bestbond.in` on `main`:

1. Commit and push wallet-expiry changes
2. On VPS: pull, `npm ci`, `npm run build`, `pm2 reload bestbond-reward-api --update-env`
3. Verify: `curl https://api.bestbond.in/health` and profile returns `pointsExpireInDays`

## Mobile — commit and push

Repo: `BestBond` (mobile app root)

Includes:

- Wallet expiry UI (`WalletExpiryNotice`)
- Admin async coupon ZIP export
- Sign-up flow (no email, Place field)
- Version bump 1.0.7

Do **not** commit `vendor/` (local CocoaPods bundle).

## Build artifacts

### Android AAB

```sh
cd BestBond
npm ci
npm test
npm run android:bundle
```

Upload: `android/app/build/outputs/bundle/release/app-release.aab`

### iOS archive

Requires **Associated Domains** on App ID `com.nuvate.bestbond` (for coupon QR Universal Links).

```sh
cd BestBond
npm ci
npm run ios:archive
# or: npm run ios:upload
```

Select build **13** in App Store Connect.

## Post-upload checklist

- [ ] API wallet expiry live on `https://api.bestbond.in`
- [ ] Play Console: production release 1.0.7 (versionCode 9)
- [ ] App Store Connect: version 1.0.7, build 13
- [ ] Smoke test: sign up (Place field), wallet expiry banner, admin large batch ZIP export
