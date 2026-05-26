#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS="$ROOT/ios"
SCHEME="BestBond"
WORKSPACE="$IOS/BestBond.xcworkspace"
ARCHIVE_PATH="${ARCHIVE_PATH:-$IOS/build/BestBond.xcarchive}"
EXPORT_OPTIONS="$ROOT/deploy/ios/ExportOptions.plist"

cd "$ROOT"

echo "==> Installing JS dependencies"
npm ci

echo "==> Installing CocoaPods"
cd "$IOS"
bundle install
bundle exec pod install

echo "==> Archiving $SCHEME (Release, device)"
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  archive

if [[ "${UPLOAD:-0}" == "1" ]]; then
  echo "==> Exporting and uploading to App Store Connect"
  EXPORT_DIR="$IOS/build/AppStoreExport"
  rm -rf "$EXPORT_DIR"
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -exportPath "$EXPORT_DIR" \
    -allowProvisioningUpdates
  echo "Upload complete. Check App Store Connect → TestFlight / Distribution."
else
  echo "Archive ready: $ARCHIVE_PATH"
  echo "Open in Xcode Organizer: open -a Xcode \"$ARCHIVE_PATH\""
  echo "Or upload from CLI: UPLOAD=1 $0"
fi
