# BestBond iOS — App Store release

## Version bump (each release)

In `ios/BestBond.xcodeproj/project.pbxproj` (Debug + Release):

- `MARKETING_VERSION` — user-visible version (e.g. `1.0.7`)
- `CURRENT_PROJECT_VERSION` — build number; must **increase** every upload

Also align `package.json` and Android `versionCode` / `versionName`.

## Build archive

From `BestBond/`:

```sh
npm run ios:archive
```

Archive output:

```
ios/build/BestBond.xcarchive
```

Open in Xcode Organizer:

```sh
open -a Xcode ios/build/BestBond.xcarchive
```

## Upload to App Store Connect

CLI (automatic signing):

```sh
npm run ios:upload
```

Or in **Xcode Organizer** → **Distribute App** → **App Store Connect** → Upload.

Export options: `deploy/ios/ExportOptions.plist` (team `J22N5WHHN9`).

## App Store Connect — publish update

1. **App Store Connect** → **BestBond** → new version **1.0.7**.
2. Select the uploaded build (build **13**).
3. **What's New** (example):

   ```
   • Wallet shows days until points reset; unused balance resets annually
   • Admin: large coupon batches download as ZIP with progress
   • Simpler sign up with Place field (no email)
   • Coupon QR opens app scanner; redeem in-app only
   ```

4. Submit for review.

## Associated Domains (required for coupon QR)

Before archiving a **Release** build, enable **Associated Domains** on App ID `com.nuvate.bestbond` in [Apple Developer](https://developer.apple.com/account/resources/identifiers) and add `applinks:api.bestbond.in`. The API serves `/.well-known/apple-app-site-association` for `/c/*` paths.

## Notes

- Production API: `https://api.bestbond.in` (release builds only).
- Requires valid Apple Developer signing (Automatic, team J22N5WHHN9).
