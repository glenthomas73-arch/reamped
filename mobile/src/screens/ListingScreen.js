import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addToWatchlist } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SCORE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };
const SCORE_LABELS = {
  A: 'Exceptional value — well below market',
  B: 'Good value — slightly below market',
  C: 'Fair — near market price',
  D: 'Above market — shop around',
  F: 'Overpriced significantly',
};

export default function ListingScreen({ route, navigation }) {
  const { listing } = route.params;
  const { user } = useAuth();
  const [watchlisted, setWatchlisted] = useState(false);
  const [saving, setSaving] = useState(false);

  const scoreColor = SCORE_COLORS[listing.value_grade] || '#888';
  const scoreLabel = SCORE_LABELS[listing.value_grade] || 'No score available';

  const handleWatchlist = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save listings.');
      return;
    }
    setSaving(true);
    try {
      await addToWatchlist(listing.id);
      setWatchlisted(true);
      Alert.alert('Saved!', 'Listing added to your watchlist.');
    } catch (e) {
      if (e.response?.status === 403) {
        Alert.alert('Pro required', 'Upgrade to Pro to save more than 5 listings.');
      } else {
        Alert.alert('Error', 'Could not save listing. Try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openListing = () => {
    if (listing.url) Linking.openURL(listing.url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      {listing.image_url ? (
        <Image source={{ uri: listing.image_url }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Ionicons name="musical-notes-outline" size={64} color="#444" />
        </View>
      )}

      <View style={styles.body}>
        {/* Title & platform */}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.platform}>{listing.platform} · {listing.condition || 'Used'}</Text>

        {/* Price & score */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>${listing.price?.toFixed(2)}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
            <Text style={styles.scoreGrade}>{listing.value_grade || '?'}</Text>
          </View>
        </View>
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>{scoreLabel}</Text>

        {/* Market stats */}
        {listing.avg_price && (
          <View style={styles.statsBox}>
            <Stat label="Avg Market Price" value={`$${listing.avg_price?.toFixed(2)}`} />
            <Stat label="Price Delta" value={`${listing.price_delta_pct > 0 ? '+' : ''}${listing.price_delta_pct?.toFixed(1)}%`} />
            {listing.days_listed !== undefined && (
              <Stat label="Listed" value={`${listing.days_listed}d ago`} />
            )}
          </View>
        )}

        {/* Description */}
        {listing.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        {/* Actions */}
        <TouchableOpacity style={styles.viewBtn} onPress={openListing}>
          <Ionicons name="open-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.viewBtnText}>View on {listing.platform}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.watchBtn, watchlisted && styles.watchBtnSaved]}
          onPress={handleWatchlist}
          disabled={saving || watchlisted}
        >
          <Ionicons
            name={watchlisted ? 'bookmark' : 'bookmark-outline'}
            size={18} color={watchlisted ? '#fff' : '#e63946'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.watchBtnText, watchlisted && { color: '#fff' }]}>
            {watchlisted ? 'Saved to Watchlist' : 'Save to Watchlist'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  hero: { width: '100%', height: 260 },
  heroPlaceholder: { backgroundColor: '#1e1e2e', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', lineHeight: 24 },
  platform: { color: '#888', fontSize: 13, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  price: { color: '#e63946', fontSize: 28, fontWeight: '800' },
  scoreBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  scoreGrade: { color: '#fff', fontSize: 20, fontWeight: '800' },
  scoreLabel: { marginTop: 4, fontSize: 13 },
  statsBox: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    backgroundColor: '#1e1e2e', borderRadius: 10, padding: 12, marginTop: 16,
  },
  stat: { flex: 1, minWidth: 90 },
  statLabel: { color: '#888', fontSize: 11, marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  section: { marginTop: 16 },
  sectionTitle: { color: '#aaa', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  description: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e63946', borderRadius: 10, padding: 14, marginTop: 24,
  },
  viewBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  watchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e63946', borderRadius: 10, padding: 14, marginTop: 10,
  },
  watchBtnSaved: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  watchBtnText: { color: '#e63946', fontSize: 15, fontWeight: '600' },
});
