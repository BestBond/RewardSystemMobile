# BestBond Android — Play Store release

## Version bump (each release)

In `android/app/build.gradle`:

- `versionCode` — must **increase** every upload (integer)
- `versionName` — user-visible version (e.g. `1.0.3`)

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
3. **Release name:** `1.0.3` (match `versionName`).
4. **Release notes** (example):

   ```
   • Delete your account from Profile → Delete Account
   • Security and stability improvements
   ```

5. **App content** (if prompted):
   - **Data safety:** match App Store — name, phone, email, address; **no location**, **no tracking**
   - **Account deletion:** in-app under Profile → Delete Account

6. **Review and roll out**.

## Notes

- Production API: `https://api.bestbond.in` (release builds only).
- Account deletion requires API `DELETE /users/me` on production (deployed with backend).
