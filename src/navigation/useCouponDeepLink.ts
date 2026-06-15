import { useEffect } from 'react';
import { Linking } from 'react-native';
import { isCouponScanDeepLink } from '../utils/couponLink';
import {
  consumePendingOpenScan,
  requestOpenScanTab,
} from './rootNavigation';

function handleCouponDeepLink(url: string | null | undefined) {
  if (!url || !isCouponScanDeepLink(url)) return;
  requestOpenScanTab();
}

/** Opens the Scan tab when a coupon link is opened (no auto-redeem). */
export function useCouponDeepLink() {
  useEffect(() => {
    void Linking.getInitialURL().then(handleCouponDeepLink);

    const sub = Linking.addEventListener('url', event => {
      handleCouponDeepLink(event.url);
    });

    return () => sub.remove();
  }, []);
}

/** Call when the customer main shell mounts (after login). */
export function usePendingCouponScanNavigation() {
  useEffect(() => {
    consumePendingOpenScan();
  }, []);
}
