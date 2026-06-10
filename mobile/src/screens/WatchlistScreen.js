import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getWatchlist, removeFromWatchlist } from '../api/client';
import { useAuth } from '../context/AuthContext';

const SCORE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };

export default function WatchlistScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWatchlist = async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const { data } = await getWatchlist();
      setItems(data.watchlist || []);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('Upgrade to Pro to access your full watchlist.');
      } else {
        setError('Could not load watchlist.');
      }
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => { fetchWatchlist(); }, [user])
  );

  const handleRemove = (id) => {
    Alert.alert('Remove listing?', 'Remove this from your watchlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await removeFromWatchlist(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
          } catch {
            Alert.alert('Error', 'Could not remove listing.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={48} color="#444" />
        <Text style={styles.emptyTitle}>Sign in to view your watchlist</Text>
        <Text style={styles.emptySubtitle}>Save listings and get price alerts</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const scoreColor = SCORE_COLORS[item.value_grade] || '#888';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Listing', { listing: item })}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="musical-notes-outline" size={22} color="#555" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
          <View style={styles.meta}>
            <Text style={styles.platform}>{item.platform}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreText}>{item.value_grade || '?'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchWatchlist(true)}
            tintColor="#e63946"
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="bookmark-outline" size={48} color="#444" />
            <Text style={styles.emptyTitle}>No saved listings yet</Text>
            <Text style={styles.emptySubtitle}>Search for gear and save your favorites</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: '#ccc', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtitle: { color: '#666', fontSize: 13, marginTop: 4, textAlign: 'center' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#2d2000', padding: 12, margin: 12, borderRadius: 8,
  },
  errorText: { color: '#fbbf24', fontSize: 13, flex: 1 },
  card: {
    flexDirection: 'row', marginHorizontal: 12, marginBottom: 10,
    backgroundColor: '#1e1e2e', borderRadius: 10, overflow: 'hidden',
    alignItems: 'center',
  },
  thumb: { width: 80, height: 80 },
  thumbPlaceholder: { backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 10 },
  title: { color: '#fff', fontSize: 13, lineHeight: 17 },
  price: { color: '#e63946', fontSize: 15, fontWeight: '700', marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  platform: { color: '#888', fontSize: 11 },
  scoreBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  scoreText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  removeBtn: { padding: 14 },
});
