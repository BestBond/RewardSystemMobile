# BestBond mobile release 1.0.8

**Version:** 1.0.8
**iOS build:** 14
**Android versionCode:** 10

## What's New (App Store / Play Store)

Use this text for **What's New** / **Release notes**:

```
• Home screen: quick WhatsApp Support button
• Clearer link to Admin Login on the sign-in screen
• More reliable Indian phone number input (leading 0 / spaces)
• Home balance no longer disappears if recent activity fails to load
```

## Prerequisites — deploy API first

No backend changes required for this release.

## Mobile — commit and push

Repo: `BestBond` (mobile app root)

Includes:

- Home screen points badge replaced with a "Support" button (opens WhatsApp to the support number)
- Sign-in screen: "Go to Management" renamed to "Are you an admin?: Admin Login"
- Admin: Delete Account action on the user detail screen, superadmin-only (matches admin web + existing `DELETE /admin/users/:id`; no backend changes needed)
- Indian phone input normalization (leading 0 / spaces) — `73e95d28`
- Home balance kept when recent activity fetch fails — `252a6b5d`
- Version bump 1.0.8

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

```sh
cd BestBond
npm ci
npm run ios:archive
# or: npm run ios:upload
```

Select build **14** in App Store Connect.

## Post-upload checklist

- [ ] Play Console: production release 1.0.8 (versionCode 10)
- [ ] App Store Connect: version 1.0.8, build 14
- [ ] Smoke test: Home "Support" button opens WhatsApp, Admin Login link on sign-in screen, phone input with leading 0
- [ ] Smoke test: superadmin sees "Delete Account" on a user's detail screen (an ops admin / non-superadmin does not); do **not** confirm an actual delete against production data
