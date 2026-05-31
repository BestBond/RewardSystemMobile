import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AdminHomeStackParamList } from '../../navigation/types';
import { adminUi } from '../../theme/adminUi';
import {
  createAdminReward,
  listAdminRewards,
  toggleAdminRewardActive,
  updateAdminReward,
  type AdminReward,
  type GiftTier,
} from '../../api/adminRewards';
import { isApiError, userFacingApiMessage } from '../../api/client';
import { useRefreshOnFocusAndForeground } from '../../hooks/useRefreshOnFocusAndForeground';
import { AdminHeader } from './components/AdminHeader';
import { RewardImageBlock } from '../rewards/RewardImageBlock';

type Nav = NativeStackNavigationProp<AdminHomeStackParamList, 'AdminGiftCatalog'>;

const TIERS = ['all', 'WORKER', 'CONTRACTOR'] as const;
type TierFilter = (typeof TIERS)[number];

function formatPoints(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

type GiftForm = {
  title: string;
  description: string;
  pointsCost: string;
  giftTier: GiftTier;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm = (): GiftForm => ({
  title: '',
  description: '',
  pointsCost: '1000',
  giftTier: 'WORKER',
  imageUrl: '',
  sortOrder: '0',
  isActive: true,
});

export function AdminGiftCatalogScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gifts, setGifts] = useState<AdminReward[]>([]);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReward | null>(null);
  const [form, setForm] = useState<GiftForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await listAdminRewards();
      setGifts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not load gift catalog.');
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useRefreshOnFocusAndForeground(() => {
    setLoading(true);
    load().catch(() => {});
  });

  const visibleGifts = useMemo(() => {
    if (tierFilter === 'all') return gifts;
    return gifts.filter(g => g.giftTier === tierFilter);
  }, [gifts, tierFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (gift: AdminReward) => {
    setEditing(gift);
    setForm({
      title: gift.title,
      description: gift.description ?? '',
      pointsCost: String(gift.pointsCost),
      giftTier: gift.giftTier,
      imageUrl: gift.imageUrl ?? '',
      sortOrder: String(gift.sortOrder),
      isActive: gift.isActive,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  };

  const onSave = async () => {
    const title = form.title.trim();
    const pointsCost = Number(form.pointsCost);
    if (!title) {
      setError('Title is required.');
      return;
    }
    if (!Number.isFinite(pointsCost) || pointsCost < 1) {
      setError('Points must be at least 1.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title,
        description: form.description.trim() || null,
        pointsCost,
        giftTier: form.giftTier,
        imageUrl: form.imageUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await updateAdminReward(editing.id, body);
      } else {
        await createAdminReward(body);
      }
      closeModal();
      await load();
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not save gift.');
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (gift: AdminReward) => {
    if (togglingId) return;
    setTogglingId(gift.id);
    setError(null);
    try {
      await toggleAdminRewardActive(gift.id);
      await load();
    } catch (e) {
      if (isApiError(e)) setError(userFacingApiMessage(e.message));
      else setError('Could not update gift status.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AdminHeader title="Gift Catalog" onBack={() => navigation.goBack()} />

      <View style={styles.toolbar}>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.92 }]}
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Add gift">
          <Text style={styles.addBtnTxt}>+ Add Gift</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Slab gifts for Worker and Contractor tiers shown in the customer app rewards catalog.
      </Text>

      <View style={styles.pills}>
        {TIERS.map(t => {
          const on = tierFilter === t;
          const label =
            t === 'all' ? 'All tiers' : t === 'WORKER' ? 'Worker' : 'Contractor';
          return (
            <Pressable
              key={t}
              onPress={() => setTierFilter(t)}
              style={[styles.pill, on && styles.pillOn]}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${label}`}>
              <Text style={[styles.pillTxt, on && styles.pillTxtOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {loading && gifts.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator color={adminUi.accentOrange} />
        </View>
      ) : null}

      <FlatList
        data={visibleGifts}
        keyExtractor={g => g.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 24 + insets.bottom },
        ]}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No gifts found</Text>
              <Text style={styles.emptySub}>
                Add rewards to the catalog or change the tier filter.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const toggling = togglingId === item.id;
          return (
            <View style={[styles.card, adminUi.shadowCard]}>
              <View style={styles.thumb}>
                <RewardImageBlock
                  imageUrl={item.imageUrl}
                  minHeight={56}
                  padded={false}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPts}>{formatPoints(item.pointsCost)} pts</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.tierBadge}>
                    {item.giftTier === 'CONTRACTOR' ? 'Contractor' : 'Worker'}
                  </Text>
                  <Text style={styles.orderTxt}>Order {item.sortOrder}</Text>
                </View>
                <Text style={[styles.statusTxt, !item.isActive && styles.statusInactive]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => openEdit(item)}
                    style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.linkBtnTxt}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onToggleActive(item).catch(() => {})}
                    disabled={togglingId != null}
                    style={({ pressed }) => [
                      styles.linkBtn,
                      pressed && togglingId == null && { opacity: 0.85 },
                      toggling && { opacity: 0.6 },
                    ]}>
                    {toggling ? (
                      <ActivityIndicator size="small" color={adminUi.labelMuted} />
                    ) : (
                      <Text style={styles.linkBtnMuted}>
                        {item.isActive ? 'Disable' : 'Enable'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: 16 + insets.bottom }]}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Gift' : 'Add Gift'}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.lbl}>Title</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={t => setForm(f => ({ ...f, title: t }))}
                placeholder="Gift title"
                placeholderTextColor={adminUi.mutedGray}
              />
              <Text style={styles.lbl}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={t => setForm(f => ({ ...f, description: t }))}
                placeholder="Optional description"
                placeholderTextColor={adminUi.mutedGray}
                multiline
              />
              <Text style={styles.lbl}>Points cost</Text>
              <TextInput
                style={styles.input}
                value={form.pointsCost}
                onChangeText={t => setForm(f => ({ ...f, pointsCost: t.replace(/\D/g, '') }))}
                keyboardType="number-pad"
                placeholder="1000"
                placeholderTextColor={adminUi.mutedGray}
              />
              <Text style={styles.lbl}>Tier</Text>
              <View style={styles.pills}>
                {(['WORKER', 'CONTRACTOR'] as const).map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setForm(f => ({ ...f, giftTier: t }))}
                    style={[styles.pill, form.giftTier === t && styles.pillOn]}>
                    <Text style={[styles.pillTxt, form.giftTier === t && styles.pillTxtOn]}>
                      {t === 'WORKER' ? 'Worker' : 'Contractor'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.lbl}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={form.imageUrl}
                onChangeText={t => setForm(f => ({ ...f, imageUrl: t }))}
                placeholder="/uploads/rewards/..."
                placeholderTextColor={adminUi.mutedGray}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.lbl}>Sort order</Text>
              <TextInput
                style={styles.input}
                value={form.sortOrder}
                onChangeText={t => setForm(f => ({ ...f, sortOrder: t.replace(/\D/g, '') }))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={adminUi.mutedGray}
              />
              <View style={styles.switchRow}>
                <Text style={styles.lbl}>Active in catalog</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={v => setForm(f => ({ ...f, isActive: v }))}
                  trackColor={{ false: '#D1D5DB', true: adminUi.accentOrange }}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={closeModal}
                disabled={saving}>
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={() => onSave().catch(() => {})}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={adminUi.white} />
                ) : (
                  <Text style={styles.saveBtnTxt}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminUi.screenBg },
  toolbar: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addBtnTxt: { color: adminUi.white, fontWeight: '800', fontSize: 14 },
  hint: {
    paddingHorizontal: 20,
    fontSize: 13,
    color: adminUi.labelMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminUi.radiusPill,
    backgroundColor: adminUi.engageBadgeBg,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  pillOn: { backgroundColor: adminUi.sectionTitle },
  pillTxt: { fontSize: 13, fontWeight: '600', color: adminUi.labelMuted },
  pillTxtOn: { color: adminUi.white },
  err: {
    paddingHorizontal: 20,
    marginBottom: 10,
    color: adminUi.pointsDebit,
    fontSize: 13,
    fontWeight: '600',
  },
  loader: { paddingVertical: 16, alignItems: 'center' },
  list: { paddingHorizontal: 20 },
  sep: { height: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: adminUi.cardBg,
    borderRadius: adminUi.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: adminUi.sectionTitle },
  cardPts: {
    fontSize: 14,
    fontWeight: '800',
    color: adminUi.accentOrange,
    marginTop: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  tierBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: adminUi.navyAlt,
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderTxt: { fontSize: 11, color: adminUi.labelMuted, fontWeight: '600' },
  statusTxt: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: adminUi.successGreen,
  },
  statusInactive: { color: adminUi.labelMuted },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  linkBtn: { paddingVertical: 2 },
  linkBtnTxt: { color: adminUi.accentOrange, fontWeight: '800', fontSize: 13 },
  linkBtnMuted: { color: adminUi.labelMuted, fontWeight: '800', fontSize: 13 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: adminUi.sectionTitle },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: adminUi.labelMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: adminUi.white,
    borderTopLeftRadius: adminUi.radiusLg,
    borderTopRightRadius: adminUi.radiusLg,
    padding: 20,
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: adminUi.sectionTitle,
    marginBottom: 14,
  },
  lbl: {
    fontSize: 12,
    fontWeight: '700',
    color: adminUi.labelMuted,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    borderRadius: adminUi.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: adminUi.sectionTitle,
    backgroundColor: adminUi.white,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminUi.borderSoft,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnTxt: { fontWeight: '800', color: adminUi.sectionTitle },
  saveBtn: {
    flex: 1,
    backgroundColor: adminUi.accentOrange,
    borderRadius: adminUi.radiusPill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnTxt: { fontWeight: '800', color: adminUi.white },
});
