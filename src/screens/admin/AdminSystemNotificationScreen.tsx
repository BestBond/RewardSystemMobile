import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TxTicketOrange } from '../../assets/svgs';
import { adminUi } from '../../theme/adminUi';
import { AdminHeader } from './components/AdminHeader';
import {
  getAdminPreferences,
  updateAdminPreferences,
} from '../../api/adminPreferences';
import { isApiError, userFacingApiMessage } from '../../api/client';

export function AdminSystemNotificationScreen() {
  const insets = useSafeAreaInsets();
  const [highValue, setHighValue] = useState(true);
  const [failedExports, setFailedExports] = useState(true);
  const [suspiciousUsers, setSuspiciousUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getAdminPreferences()
      .then((prefs) => {
        if (cancelled) return;
        setHighValue(prefs.notifications.highValueRedemptions);
        setFailedExports(prefs.notifications.couponExportFailures);
        setSuspiciousUsers(prefs.notifications.suspiciousUserActivity);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    setError(null);
    try {
      await updateAdminPreferences({
        highValueRedemptions: highValue,
        couponExportFailures: failedExports,
        suspiciousUserActivity: suspiciousUsers,
      });
      setSavedMsg('Notification preferences saved.');
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="System Notification" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 32 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.hero}>Alert Protocols</Text>
        <Text style={styles.sub}>
          Configure high-priority system signals that require immediate
          administrative oversight.
        </Text>
        <Text style={styles.section}>System Alerts</Text>
        <View style={[styles.row, adminUi.shadowCard]}>
          <View style={styles.iconWrap}>
            <TxTicketOrange width={26} height={26} />
          </View>
          <View style={styles.mid}>
            <Text style={styles.rowTitle}>High-Value Redemptions</Text>
            <Text style={styles.rowSub}>Immediate SMS & Email</Text>
          </View>
          <Switch
            value={highValue}
            disabled={loading || saving}
            onValueChange={setHighValue}
            trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
            thumbColor={highValue ? adminUi.accentOrange : '#f4f3f4'}
          />
        </View>

        <View style={[styles.row, adminUi.shadowCard]}>
          <View style={styles.iconWrap}>
            <TxTicketOrange width={26} height={26} />
          </View>
          <View style={styles.mid}>
            <Text style={styles.rowTitle}>Coupon Export Failures</Text>
            <Text style={styles.rowSub}>Email summary every 15 minutes</Text>
          </View>
          <Switch
            value={failedExports}
            disabled={loading || saving}
            onValueChange={setFailedExports}
            trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
            thumbColor={failedExports ? adminUi.accentOrange : '#f4f3f4'}
          />
        </View>

        <View style={[styles.row, adminUi.shadowCard]}>
          <View style={styles.iconWrap}>
            <TxTicketOrange width={26} height={26} />
          </View>
          <View style={styles.mid}>
            <Text style={styles.rowTitle}>Suspicious User Activity</Text>
            <Text style={styles.rowSub}>Fraud-risk pattern detection alerts</Text>
          </View>
          <Switch
            value={suspiciousUsers}
            disabled={loading || saving}
            onValueChange={setSuspiciousUsers}
            trackColor={{ false: '#E5E7EB', true: '#FDBA74' }}
            thumbColor={suspiciousUsers ? adminUi.accentOrange : '#f4f3f4'}
          />
        </View>

        {error ? <Text style={styles.errMsg}>{error}</Text> : null}
        {savedMsg ? <Text style={styles.savedMsg}>{savedMsg}</Text> : null}
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            saving && styles.saveBtnDisabled,
            pressed && styles.saveBtnPressed,
          ]}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save notification preferences"
          onPress={() => {
            onSave().catch(() => {});
          }}>
          {saving ? (
            <ActivityIndicator color={adminUi.white} />
          ) : (
            <Text style={styles.saveBtnTxt}>Save Preferences</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  hero: {
    fontSize: 24,
    fontWeight: '800',
    color: adminUi.sectionTitle,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: adminUi.labelMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  section: {
    fontSize: 13,
    fontWeight: '800',
    color: adminUi.labelMuted,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: adminUi.radiusLg,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: adminUi.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminUi.sectionTitle,
  },
  rowSub: {
    fontSize: 13,
    color: adminUi.labelMuted,
    marginTop: 2,
  },
  savedMsg: {
    fontSize: 13,
    color: adminUi.successGreen,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
  },
  errMsg: {
    fontSize: 13,
    color: adminUi.pointsDebit,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 8,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnPressed: { opacity: 0.92 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnTxt: {
    color: adminUi.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
