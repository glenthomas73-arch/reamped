// ReAmped Normalizers — map platform-specific values to unified schema

const CONDITION_MAP = {
    // Reverb conditions
    'mint': 'mint', 'excellent': 'excellent', 'excellent plus': 'excellent',
    'very good plus': 'excellent', 'very good': 'good', 'good': 'good',
    'good plus': 'good', 'fair': 'fair', 'poor': 'poor', 'brand new': 'new', 'new': 'new',
    // eBay condition IDs
    '1000': 'new', '1500': 'new', '2500': 'excellent', '3000': 'excellent',
    '4000': 'good', '5000': 'good', '6000': 'fair', '7000': 'poor',
};

const CATEGORY_MAP = {
    'electric-guitars': 'guitar', 'acoustic-guitars': 'acoustic-guitar',
    'bass-guitars': 'bass', 'guitar-amplifiers': 'amp', 'effects-and-pedals': 'pedal',
    'keyboards-and-synths': 'keys', 'drums-and-percussion': 'drum',
    'recording-equipment': 'recording', '33034': 'guitar', '33035': 'bass',
    '33036': 'amp', '38071': 'pedal', '16220': 'keys', '12061': 'drum',
};

function normalizeCondition(raw) {
    if (!raw) return null;
    return CONDITION_MAP[String(raw).toLowerCase().trim()] || 'good';
}

function normalizeCategory(raw) {
    if (!raw) return null;
    return CATEGORY_MAP[String(raw).toLowerCase().trim()] || String(raw).toLowerCase();
}

function cleanText(text, max = 500) {
    return text ? text.replace(/\s+/g, ' ').trim().substring(0, max) : null;
}

function parsePrice(raw) {
    if (typeof raw === 'number') return raw;
    if (!raw) return null;
    const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
}

module.exports = { normalizeCondition, normalizeCategory, cleanText, parsePrice };
