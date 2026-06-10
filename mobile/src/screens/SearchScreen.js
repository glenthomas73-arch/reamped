import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { searchListings } from '../api/client';

const PLATFORMS = ['All', 'Reverb', 'eBay', 'Guitar Center', 'Sweetwater', 'Facebook', 'Gumtree'];
const SCORE_COLORS = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const doSearch = useCallback(async (q = query, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = { q, page: p, limit: 20 };
      if (platform !== 'All') params.platform = platform.toLowerCase().replace(' ', '');
      const { data } = await searchListings(params);
      if (p === 1) {
        setResults(data.listings || []);
      } else {
        setResults((prev) => [...prev, ...(data.listings || [])]);
      }
      setHasMore((data.listings || []).length === 20);
      setPage(p);
    } catch (e) {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, platform]);

  const loadMore = () => {
    if (!loading && hasMore) doSearch(query, page + 1);
  };

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
            <Ionicons name="musical-notes-outline" size={24} color="#555" />
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search gear..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => doSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Platform filter chips */}
      <FlatList
        horizontal
        data={PLATFORMS}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, platform === item && styles.chipActive]}
            onPress={() => setPlatform(item)}
          >
            <Text style={[styles.chipText, platform === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loading ? <ActivityIndicator color="#e63946" style={{ margin: 16 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>Search for used gear</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8 },
  input: {
    flex: 1, backgroundColor: '#1e1e2e', color: '#fff',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#e63946', borderRadius: 8,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  chips: { paddingHorizontal: 12, paddingBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#1e1e2e', marginRight: 8,
  },
  chipActive: { backgroundColor: '#e63946' },
  chipText: { color: '#aaa', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    flexDirection: 'row', marginHorizontal: 12, marginBottom: 10,
    backgroundColor: '#1e1e2e', borderRadius: 10, overflow: 'hidden',
  },
  thumb: { width: 90, height: 90 },
  thumbPlaceholder: { backgroundColor: '#2a2a3e', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 14, lineHeight: 18 },
  price: { color: '#e63946', fontSize: 16, fontWeight: '700', marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  platform: { color: '#888', fontSize: 12 },
  scoreBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  error: { color: '#ef4444', textAlign: 'center', margin: 12 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#555', marginTop: 12, fontSize: 15 },
});
