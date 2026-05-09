# UI Migration Checklist (Figma -> React Native)

This checklist maps updated `figmadesign` screens to current app screens and defines execution phases.

## Execution Rules

- Keep existing API flows intact while upgrading visuals.
- Complete one phase at a time with visual parity checks before moving ahead.
- Do not merge style updates and flow logic rewrites in the same micro-step unless required.
- Treat each screen done only after matching:
  - layout, spacing, typography scale, colors, border radius, shadows
  - states (loading, empty, error, disabled)
  - interaction behavior from design flow

## Phase 1 - Foundations (Theme + Primitives)

- [x] Finalize tokens from `figmadesign/Assets/image.png`
  - [x] color scale
  - [x] spacing scale
  - [x] radius scale
  - [x] typography scale
  - [x] elevation/shadow presets
- [x] Standardize shared components
  - [x] primary/secondary/ghost button variants
  - [x] top app header variants
  - [x] card primitives (metric, list row, info)
  - [x] input primitives (default, PIN, OTP, search)
  - [x] status chips/badges
  - [x] bottom tab consistency

## Phase 2 - User App (Onboarding + Core)

Figma refs:
- `figmadesign/User/Onboarding & Authentication Screens/*.png`
- `figmadesign/User/Core Screens (Home & Scanning)/*.png`

Target files:
- `src/screens/SplashScreen.tsx`
- `src/screens/SignUpScreen.tsx`
- `src/screens/SetPinScreen.tsx`
- `src/screens/LoginScreen.tsx`
- `src/screens/ProfileSetupScreen.tsx`
- `src/screens/HomeScreen.tsx`
- `src/screens/ScanScreen.tsx`
- `src/components/ScanSuccessModal.tsx`

- [x] Splash
- [x] OTP signup
- [x] Set PIN
- [x] Login
- [x] Profile setup (dealer toggle + profession cards + address)
- [x] Home dashboard
- [x] Scan (camera + manual entry + success modal)

## Phase 3 - User App (Rewards + Redemption + Account)

Figma refs:
- `figmadesign/User/Rewards & Redemption/*.png`
- `figmadesign/User/Account Management/*.png`

Target files:
- `src/screens/rewards/RewardsHomeScreen.tsx`
- `src/screens/rewards/RewardCheckoutScreen.tsx`
- `src/screens/rewards/RewardSuccessScreen.tsx`
- `src/screens/cart/CartHomeScreen.tsx`
- `src/screens/account/UserProfileScreen.tsx`
- `src/screens/account/TransactionHistoryScreen.tsx`
- `src/screens/account/CustomerSupportScreen.tsx`
- `src/screens/account/GiftDeliveryStatusScreen.tsx`
- `src/screens/account/DeliveryStatusScreen.tsx`

- [x] Rewards list (unlocked/locked states + low-balance experience)
- [x] Checkout
- [x] Success/processing
- [x] Cart empty/recommendation state
- [x] Profile
- [x] Transaction history
- [x] Customer support
- [x] Delivery status + cancel confirmation sheet

## Phase 4 - Super Admin

Figma refs:
- `figmadesign/SuperAdmin/Dashboard/*.png`
- `figmadesign/SuperAdmin/User Management Screens/*.png`
- `figmadesign/SuperAdmin/Redemption Approvals Screens/*.png`
- `figmadesign/SuperAdmin/Coupon Generation Screens/*.png`
- `figmadesign/SuperAdmin/Account Management Screens/*.png`

Target files:
- `src/screens/admin/SuperAdminDashboardScreen.tsx`
- `src/screens/admin/AdminUsersListScreen.tsx`
- `src/screens/admin/AdminUserDetailScreen.tsx`
- `src/screens/admin/AdminUserTransactionsScreen.tsx`
- `src/screens/admin/AdminApprovalsListScreen.tsx`
- `src/screens/admin/AdminApprovalDetailScreen.tsx`
- `src/screens/admin/coupon/AdminCouponGenerateScreen.tsx`
- `src/screens/admin/coupon/AdminCouponPreviewScreen.tsx`
- `src/screens/admin/coupon/AdminCouponExportScreen.tsx`
- `src/screens/admin/AdminProfileHomeScreen.tsx`
- `src/screens/admin/AdminSecurityScreen.tsx`
- `src/screens/admin/AdminSystemNotificationScreen.tsx`

- [x] Dashboard metrics + cards
- [x] User management list/detail/ledger + suspend flow
- [x] Redemption approvals list/detail/approve/reject/deliver
- [x] Coupon generation preview export
- [x] Account management and security screens

## Phase 5 - Operational Admin Specialization

Figma refs:
- `figmadesign/Operational Admin/Operational Admin Dashboard/*.png`
- `figmadesign/Operational Admin/Reward Approvals Screen/*.png`
- `figmadesign/Operational Admin/Account Management/*.png`

- [x] Role-specific dashboard variant
- [x] Role-specific approvals copy/actions
- [x] Role-specific account screens
- [x] Verify role-based visibility in tab flows

## Phase 6 - Pixel Perfect QA

- [ ] Run side-by-side visual pass for every screen state
- [ ] Verify typography and spacing deltas
- [ ] Verify touch targets and accessibility labels
- [ ] Verify no functional regressions in auth, scan, redeem, approvals, admin actions
- [ ] Final pass on Android + iOS

## Current Progress

- [x] Initial audit complete
- [x] Screen mapping complete
- [x] Phase 1 implementation started
- [x] Phase 1 onboarding screens moved to shared button/label primitives
- [x] Phase 1 complete
- [x] Phase 2 complete
- [x] Phase 3 complete
- [x] Phase 4 complete
- [x] Phase 5 complete
- [x] Phase 6 started
