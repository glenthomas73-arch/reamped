import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionStatus } from '../api/client';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const [sub, setSub] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);

  useEffect(() => {
    if (user) fetchSub();
  }, [user]);

  const fetchSub = async () => {
    setLoadingSub(true);
    try {
      const { data } = await getSubscriptionStatus();
      setSub(data);
    } catch (e) {
      // ignore
    } finally {
      setLoadingSub(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={64} color="#444" />
        <Text style={styles.signInTitle}>Sign in to ReAmped</Text>
        <Text style={styles.signInSub}>
          Get price alerts, save listings, and unlock Pro features
        </Text>
      </View>
    );
  }

  const isPro = sub?.plan === 'pro' && sub?.status === 'active';

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.email?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.planBadge, isPro && styles.planBadgePro]}>
            <Text style={styles.planText}>{isPro ? '✦ Pro' : 'Free'}</Text>
          </View>
        </View>
      </View>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        {loadingSub ? (
          <ActivityIndicator color="#e63946" />
        ) : (
          <View style={styles.subCard}>
            {isPro ? (
              <>
                <Text style={styles.subStatus}>Pro — Active</Text>
                {sub.current_period_end && (
                  <Text style={styles.subMeta}>
                    Renews {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.subStatus}>Free Plan</Text>
                <Text style={styles.subMeta}>5 watchlist saves · No price alerts</Text>
                <TouchableOpacity style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* Pro features */}
      {!isPro && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pro Features</Text>
          {[
            ['Unlimited watchlist saves', 'bookmark-outline'],
            ['Price drop alerts via email', 'notifications-outline'],
            ['Facebook Marketplace + Gumtree results', 'globe-outline'],
            ['Advanced value scoring insights', 'analytics-outline'],
          ].map(([label, icon]) => (
            <View key={label} style={styles.featureRow}>
              <Ionicons name={icon} size={18} color="#e63946" style={{ marginRight: 10 }} />
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sign out */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  signInTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  signInSub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: '#1e1e2e', borderRadius: 12, padding: 16,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#e63946', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileInfo: { marginLeft: 12 },
  email: { color: '#fff', fontSize: 15, fontWeight: '500' },
  planBadge: {
    marginTop: 4, backgroundColor: '#2a2a3e', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start',
  },
  planBadgePro: { backgroundColor: '#7c3aed' },
  planText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#888', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  subCard: { backgroundColor: '#1e1e2e', borderRadius: 10, padding: 14 },
  subStatus: { color: '#fff', fontSize: 15, fontWeight: '600' },
  subMeta: { color: '#888', fontSize: 13, marginTop: 2 },
  upgradeBtn: {
    marginTop: 12, backgroundColor: '#e63946', borderRadius: 8, padding: 10, alignItems: 'center',
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featureText: { color: '#ccc', fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: 16, borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 10, padding: 14,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
