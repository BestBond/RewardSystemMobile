# BestBond Android — Play Store release

## Version bump (each release)

In `android/app/build.gradle`:

- `versionCode` — must **increase** every upload (integer)
- `versionName` — user-visible version (e.g. `1.0.6`)

Also align `package.json`, and iOS `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in `ios/BestBond.xcodeproj/project.pbxproj`.

## Build signed AAB

1. Ensure `android/keystore.properties` exists (copy from `keystore.properties.example`).
2. From `BestBond/`:

   ```sh
   npm ci
   npm run android:bundle
   ```

3. Upload this file to **Google Play Console**:

   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

## Play Console — publish update

1. **Google Play Console** → **BestBond** → **Production** (or Testing track first).
2. **Create new release** → upload **app-release.aab**.
3. **Release name:** `1.0.6` (match `versionName`).
4. **Release notes** (example):

   ```
   • Coupon QR codes open the BestBond app scanner when scanned with the phone camera
   • If the app is not installed, scan redirects to Google Play
   • Scan in the app to redeem points (camera scan alone does not add points)
   ```

5. **App content** (if prompted):
   - **Data safety:** match App Store — name, phone, email, address; **no location**, **no tracking**
   - **Account deletion:** in-app under Profile → Delete Account

6. **Review and roll out**.

## App Links (optional, improves coupon QR)

Set `ANDROID_APP_LINK_SHA256` on the API VPS (Play App Signing SHA-256) so `https://api.bestbond.in/.well-known/assetlinks.json` verifies. Without it, camera scan still opens the app via the browser fallback page (`bestbond://scan`).

## Notes

- Production API: `https://api.bestbond.in` (release builds only; `__DEV__` is false).
- Account deletion requires API `DELETE /users/me` on production.
