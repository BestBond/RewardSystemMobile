import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Browse rewards only; checkout lives under the Cart tab (Figma). */
export type RewardsStackParamList = {
  RewardsHome: undefined;
};

/** Cart tab: empty checkout, confirm redemption, success (Rewards & Redemption flow). */
export type CartStackParamList = {
  CartHome: undefined;
  RewardCheckout: { rewardId: string };
  RewardSuccess: {
    trackingId: string;
    eta: string;
    status: string;
  };
};

export type ProfileStackParamList = {
  /** Figma Account Management — User Profile */
  UserProfile: undefined;
  TransactionHistory: undefined;
  CustomerSupport: undefined;
  GiftDeliveryStatus: undefined;
  DeliveryStatus: { redemptionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Cart: NavigatorScreenParams<CartStackParamList> | undefined;
  Scan: undefined;
  Rewards: NavigatorScreenParams<RewardsStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type AdminUsersStackParamList = {
  AdminUsersList: undefined;
  AdminUserDetail: { userId: string };
  AdminUserTransactions: { userId: string };
  AdminOpsApprovals: undefined;
};

export type AdminApprovalsStackParamList = {
  AdminApprovalsList: undefined;
  AdminApprovalDetail: { requestId: string };
};

export type AdminProfileStackParamList = {
  AdminProfileHome: undefined;
  AdminSecurityPreferences: undefined;
  AdminSystemNotification: undefined;
};

/** Super Admin — Coupon Generation (figmadesign/SuperAdmin/Coupon Generation Screens). */
export type AdminCouponStackParamList = {
  AdminCouponGenerate: undefined;
  AdminCouponPreview: {
    slabPts: number;
    quantity: number;
    totalPts: number;
    batchId: string;
    batchNumber: number;
    /** First ≤80 real codes returned by POST /coupons/generate */
    previewCodes: string[];
    createdAtIso: string;
  };
  AdminCouponExport: {
    batchId: string;
    createdAtLabel: string;
    totalCoupons: number;
    totalPts: number;
    slabPts: number;
  };
  AdminCouponPdfViewer: {
    batchId: string;
  };
};

/** Superadmin / operational admin shell (Figma SuperAdmin tab bar). */
export type AdminTabParamList = {
  AdminHome: undefined;
  AdminUsers: NavigatorScreenParams<AdminUsersStackParamList> | undefined;
  AdminScan: NavigatorScreenParams<AdminCouponStackParamList> | undefined;
  AdminApprovals: NavigatorScreenParams<AdminApprovalsStackParamList> | undefined;
  AdminProfile: NavigatorScreenParams<AdminProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  AuthLanding: undefined;
  CustomerAuth: undefined;
  AdminLogin: undefined;
  OpsAdminSignUp: undefined;
  PendingApproval: undefined;
  /** `edit` opens the form even when the profile is already complete (Account → Edit). */
  ProfileSetup: { edit?: boolean } | undefined;
  AdminProfileSetup: undefined;
  Main: undefined;
  AdminMain: undefined;
};

export interface CouponBatch {
  batchId: string;
  batchNumber: number;
  createdAt: string; // or Date if you parse it
  expiresAt: string | null;
  items: any[]; // define below if needed
  points: number;
  previewCodes: string[];
  quantity: number;
  site: string | null;
  title: string;
}

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type AdminTabScreenProps<T extends keyof AdminTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<AdminTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;


