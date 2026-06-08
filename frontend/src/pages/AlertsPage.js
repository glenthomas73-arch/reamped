import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CONDITIONS = ['mint', 'excellent', 'good', 'fair', 'poor'];
const PLATFORMS = ['reverb', 'ebay', 'guitarcenter', 'sweetwater'];

async function fetchAlerts(token) {
    const res = await fetch(`${API}/api/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
}

async function createAlert(token, body) {
    const res = await fetch(`${API}/api/alerts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
    });
    if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to create alert');
    }
    return res.json();
}

async function deleteAlert(token, id) {
    const res = await fetch(`${API}/api/alerts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete alert');
}

function AlertRow({ alert, onDelete }) {
    const platforms = alert.platforms?.join(', ') || 'all';
    return (
          <div style={styles.alertRow}>
      <div style={styles.alertInfo}>
        <div style={styles.alertQuery}>
    {alert.search_query || `${alert.brand || ''} ${alert.model || ''}`.trim() || 'Any gear'}
</div>
        <div style={styles.alertMeta}>
{alert.max_price && <span style={styles.tag}>Under ${alert.max_price}</span>}
{alert.condition_min && <span style={styles.tag}>{alert.condition_min}+</span>}
          <span style={styles.tag}>{platforms}</span>
{alert.last_triggered && (
              <span style={styles.tagMuted}>
              Last triggered: {new Date(alert.last_triggered).toLocaleDateString()}
 </span>
           )}
</div>
  </div>
      <button style={styles.deleteBtn} onClick={() => onDelete(alert.id)} title="Delete alert">
          &#128465;
</button>
  </div>
  );
}

export default function AlertsPage() {
    const { user, token, isPro } = useAuth();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
          search_query: '', brand: '', model: '',
          max_price: '', condition_min: '',
          platforms: ['reverb', 'ebay'],
    });
    const [formError, setFormError] = useState('');

  const { data: alerts = [], isLoading, isError } = useQuery({
        queryKey: ['alerts'],
        queryFn: () => fetchAlerts(token),
        enabled: !!token && isPro,
  });

  const createMutation = useMutation({
        mutationFn: (body) => createAlert(token, body),
        onSuccess: () => {
                qc.invalidateQueries(['alerts']);
                setShowForm(false);
                setForm({ search_query: '', brand: '', model: '', max_price: '', condition_min: '', platforms: ['reverb', 'ebay'] });
                setFormError('');
        },
        onError: (err) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
        mutationFn: (id) => deleteAlert(token, id),
        onSuccess: () => qc.invalidateQueries(['alerts']),
  });

  const togglePlatform = (p) => {
        setForm(f => ({
                ...f,
                platforms: f.platforms.includes(p)
                  ? f.platforms.filter(x => x !== p)
                          : [...f.platforms, p],
        }));
  };

  if (!user) {
        return (
                <div style={styles.gate}>
                  <div style={styles.gateCard}>
                    <div style={styles.gateIcon}>&#128276;</div>
              <h2 style={styles.gateTitle}>Price Alerts</h2>
              <p style={styles.gateText}>Sign in to create price alerts and get notified when deals appear.</p>
              <button style={styles.gateBtn} onClick={() => navigate('/pricing')}>Sign In / Sign Up</button>
          </div>
          </div>
        );
  }

  if (!isPro) {
        return (
                <div style={styles.gate}>
                  <div style={styles.gateCard}>
                    <div style={styles.gateIcon}>&#128276;</div>
              <h2 style={styles.gateTitle}>Price Alerts — Pro Feature</h2>
              <p style={styles.gateText}>Upgrade to Pro to create price alerts and get notified the moment a deal matches your criteria.</p>
              <button style={styles.gateBtn} onClick={() => navigate('/pricing')}>Upgrade to Pro</button>
          </div>
          </div>
        );
  }

  const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.search_query && !form.brand && !form.model) {
                setFormError('Please enter a search query, brand, or model.');
                return;
        }
        const body = {};
        if (form.search_query) body.search_query = form.search_query;
        if (form.brand) body.brand = form.brand;
        if (form.model) body.model = form.model;
        if (form.max_price) body.max_price = parseFloat(form.max_price);
        if (form.condition_min) body.condition_min = form.condition_min;
        body.platforms = form.platforms.length ? form.platforms : ['reverb', 'ebay'];
        createMutation.mutate(body);
  };

  return (
        <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.pageHeader}>
          <div>
                <h1 style={styles.pageTitle}>&#128276; Price Alerts</h1>
              <p style={styles.pageSubtitle}>
  {alerts.length > 0 ? `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}` : 'No alerts yet'}
</p>
  </div>
          <button style={styles.newBtn} onClick={() => setShowForm(s => !s)}>
{showForm ? 'Cancel' : '+ New Alert'}
</button>
  </div>

{showForm && (
            <form style={styles.form} onSubmit={handleSubmit}>
              <h3 style={styles.formTitle}>Create New Alert</h3>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Search Query</label>
                <input style={styles.input} placeholder="e.g. Fender Stratocaster" value={form.search_query}
                  onChange={e => setForm(f => ({ ...f, search_query: e.target.value }))} />
                    </div>
              <div style={styles.field}>
                <label style={styles.label}>Brand (optional)</label>
                <input style={styles.input} placeholder="e.g. Fender" value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                    </div>
              <div style={styles.field}>
                <label style={styles.label}>Model (optional)</label>
                <input style={styles.input} placeholder="e.g. Stratocaster" value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                    </div>
              <div style={styles.field}>
                <label style={styles.label}>Max Price ($)</label>
                <input style={styles.input} type="number" placeholder="e.g. 500" value={form.max_price}
                  onChange={e => setForm(f => ({ ...f, max_price: e.target.value }))} />
                    </div>
                    </div>
            <div style={styles.field}>
              <label style={styles.label}>Minimum Condition</label>
              <div style={styles.chips}>
                  {CONDITIONS.map(c => (
                                      <button key={c} type="button"
                                                      style={form.condition_min === c ? styles.chipActive : styles.chip}
                    onClick={() => setForm(f => ({ ...f, condition_min: f.condition_min === c ? '' : c }))}>
{c.charAt(0).toUpperCase() + c.slice(1)}
</button>
                ))}
                  </div>
                  </div>
            <div style={styles.field}>
              <label style={styles.label}>Platforms</label>
              <div style={styles.chips}>
                {PLATFORMS.map(p => (
                                    <button key={p} type="button"
                                                   style={form.platforms.includes(p) ? styles.chipActive : styles.chip}
                    onClick={() => togglePlatform(p)}>
{p.charAt(0).toUpperCase() + p.slice(1)}
</button>
                ))}
                  </div>
                  </div>
{formError && <p style={styles.error}>{formError}</p>}
             <button type="submit" style={styles.submitBtn} disabled={createMutation.isPending}>
{createMutation.isPending ? 'Creating...' : 'Create Alert'}
</button>
  </form>
        )}

{isLoading && <p style={styles.loading}>Loading alerts...</p>}
 {isError && <p style={styles.error}>Failed to load alerts.</p>}

  {!isLoading && alerts.length === 0 && !showForm && (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>&#128276;</div>
               <h3 style={styles.emptyTitle}>No alerts yet</h3>
               <p style={styles.emptyText}>Create your first price alert and we'll notify you when a matching deal appears.</p>
                <button style={styles.gateBtn} onClick={() => setShowForm(true)}>Create Your First Alert</button>
    </div>
           )}

  {!isLoading && alerts.length > 0 && (
              <div style={styles.alertList}>
  {alerts.map(a => (
                  <AlertRow key={a.id} alert={a} onDelete={(id) => deleteMutation.mutate(id)} />
             ))}
</div>
        )}
</div>
          </div>
  );
}

const styles = {
    page: { background: '#0f172a', minHeight: '100vh', padding: '40px 24px' },
    container: { maxWidth: 800, margin: '0 auto' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
    pageTitle: { fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px' },
    pageSubtitle: { color: '#64748b', fontSize: 15 },
    newBtn: { padding: '10px 20px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    form: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 28, marginBottom: 32 },
    formTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: '0 0 20px' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 },
    field: { marginBottom: 16 },
    label: { display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: { width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 6, color: '#f1f5f9', padding: '9px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: { padding: '5px 12px', background: 'transparent', border: '1px solid #334155', borderRadius: 16, color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
    chipActive: { padding: '5px 12px', background: '#f97316', border: '1px solid #f97316', borderRadius: 16, color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 },
    error: { color: '#ef4444', fontSize: 13, margin: '8px 0' },
    submitBtn: { padding: '11px 28px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
    alertList: { display: 'flex', flexDirection: 'column', gap: 12 },
    alertRow: { background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
    alertInfo: { flex: 1, minWidth: 0 },
    alertQuery: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 },
    alertMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    tag: { fontSize: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '2px 8px', color: '#94a3b8' },
    tagMuted: { fontSize: 12, color: '#475569' },
    deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b', flexShrink: 0, padding: 4 },
    loading: { color: '#94a3b8', padding: 40, textAlign: 'center' },
    empty: { textAlign: 'center', padding: '80px 24px' },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px' },
    emptyText: { color: '#64748b', fontSize: 15, margin: '0 0 24px' },
    gate: { background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    gateCard: { background: '#1e293b', borderRadius: 16, padding: 48, maxWidth: 400, textAlign: 'center', border: '1px solid #334155' },
    gateIcon: { fontSize: 48, marginBottom: 16 },
    gateTitle: { fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: '0 0 12px' },
    gateText: { color: '#94a3b8', fontSize: 15, margin: '0 0 24px', lineHeight: 1.5 },
    gateBtn: { padding: '12px 28px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
