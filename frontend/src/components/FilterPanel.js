import React from 'react';

const CONDITIONS = ['mint','excellent','good','fair','poor'];
const CATEGORIES = ['guitar','bass','amp','pedal','keys','drum','recording'];
const PLATFORMS  = ['reverb','ebay','guitarcenter','sweetwater'];
const SORTS      = [
  {value:'value_score', label:'Best Value'},
  {value:'price_asc',   label:'Low to High'},
  {value:'price_desc',  label:'High to Low'},
  {value:'newest',      label:'Newest'},
];
const GRADES       = ['A','B','C','D','F'];
const HANDEDNESS   = ['right','left','ambidextrous'];
const CURRENCIES   = ['USD','GBP','EUR','CAD','AUD'];
const COUNTRIES_MFR = [
  {code:'US', label:'USA'},
  {code:'JP', label:'Japan'},
  {code:'MX', label:'Mexico'},
  {code:'KR', label:'South Korea'},
  {code:'CN', label:'China'},
  {code:'ID', label:'Indonesia'},
  {code:'CZ', label:'Czech Republic'},
  {code:'DE', label:'Germany'},
  {code:'GB', label:'UK'},
  {code:'IT', label:'Italy'},
];
const SELLER_COUNTRIES = [
  {code:'US',label:'USA'},{code:'GB',label:'UK'},{code:'CA',label:'Canada'},
  {code:'AU',label:'Australia'},{code:'DE',label:'Germany'},{code:'JP',label:'Japan'},
  {code:'FR',label:'France'},{code:'IT',label:'Italy'},
];

export default function FilterPanel({ filters, onChange }) {
  const upd = (k,v) => onChange({...filters,[k]:v});
  const tog = (k,v) => {
    const l = filters[k]?filters[k].split(',').filter(Boolean):[];
    const n = l.includes(v)?l.filter(x=>x!==v):[...l,v];
    upd(k,n.join(','));
  };
  const on = (k,v) => (filters[k]?filters[k].split(','):[]).includes(v);

  const S = {
    p:{background:'#1e293b',borderRadius:12,padding:20,border:'1px solid #334155',minWidth:220},
    h:{margin:'0 0 20px',fontSize:16,fontWeight:700,color:'#f1f5f9'},
    s:{marginBottom:20},
    l:{display:'block',fontSize:12,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:.5,marginBottom:8},
    sel:{width:'100%',background:'#0f172a',border:'1px solid #334155',borderRadius:6,color:'#f1f5f9',padding:'8px 10px',fontSize:14},
    pr:{display:'flex',alignItems:'center',gap:8},
    pi:{flex:1,background:'#0f172a',border:'1px solid #334155',borderRadius:6,color:'#f1f5f9',padding:'8px 10px',fontSize:14,width:0},
    cr:{display:'flex',flexWrap:'wrap',gap:6},
    c:{padding:'4px 10px',background:'transparent',border:'1px solid #334155',borderRadius:20,color:'#94a3b8',fontSize:12,cursor:'pointer'},
    ca:{padding:'4px 10px',background:'#f97316',border:'1px solid #f97316',borderRadius:20,color:'#fff',fontSize:12,cursor:'pointer',fontWeight:600},
    cb:{width:'100%',padding:'8px',background:'transparent',border:'1px solid #334155',borderRadius:6,color:'#64748b',fontSize:13,cursor:'pointer'},
    tog:{display:'flex',alignItems:'center',gap:10,cursor:'pointer'},
    togBox:{width:38,height:20,borderRadius:10,position:'relative',transition:'background .2s'},
    togKnob:{width:16,height:16,borderRadius:'50%',background:'#fff',position:'absolute',top:2,transition:'left .2s'},
  };

  const isOn = (k,v) => on(k,v);
  const togBtn = (k,v) => isOn(k,v)?S.ca:S.c;

  return (
    <aside style={S.p}>
      <h3 style={S.h}>Filters</h3>

      {/* Sort */}
      <div style={S.s}>
        <label style={S.l}>Sort By</label>
        <select style={S.sel} value={filters.sort||'value_score'} onChange={e=>upd('sort',e.target.value)}>
          {SORTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Price */}
      <div style={S.s}>
        <label style={S.l}>Price</label>
        <div style={S.pr}>
          <input style={S.pi} type="number" placeholder="Min" value={filters.min_price||''} onChange={e=>upd('min_price',e.target.value)} />
          <span style={{color:'#64748b'}}>–</span>
          <input style={S.pi} type="number" placeholder="Max" value={filters.max_price||''} onChange={e=>upd('max_price',e.target.value)} />
        </div>
      </div>

      {/* Year of Production */}
      <div style={S.s}>
        <label style={S.l}>Year of Production</label>
        <div style={S.pr}>
          <input style={S.pi} type="number" placeholder="From" min="1900" max="2099" value={filters.min_year||''} onChange={e=>upd('min_year',e.target.value)} />
          <span style={{color:'#64748b'}}>–</span>
          <input style={S.pi} type="number" placeholder="To"   min="1900" max="2099" value={filters.max_year||''} onChange={e=>upd('max_year',e.target.value)} />
        </div>
      </div>

      {/* Condition */}
      <div style={S.s}>
        <label style={S.l}>Condition</label>
        <div style={S.cr}>
          {CONDITIONS.map(c=><button key={c} style={togBtn('condition',c)} onClick={()=>tog('condition',c)}>{c[0].toUpperCase()+c.slice(1)}</button>)}
        </div>
      </div>

      {/* Value Grade */}
      <div style={S.s}>
        <label style={S.l}>Value Grade</label>
        <div style={S.cr}>
          {GRADES.map(g=><button key={g} style={togBtn('value_grade',g)} onClick={()=>tog('value_grade',g)}>{g}</button>)}
        </div>
      </div>

      {/* Category */}
      <div style={S.s}>
        <label style={S.l}>Category</label>
        <div style={S.cr}>
          {CATEGORIES.map(c=><button key={c} style={filters.category===c?S.ca:S.c} onClick={()=>upd('category',filters.category===c?'':c)}>{c}</button>)}
        </div>
      </div>

      {/* Country of Manufacture */}
      <div style={S.s}>
        <label style={S.l}>Country of Manufacture</label>
        <div style={S.cr}>
          {COUNTRIES_MFR.map(({code,label})=><button key={code} style={togBtn('country_of_manufacture',code)} onClick={()=>tog('country_of_manufacture',code)}>{label}</button>)}
        </div>
      </div>

      {/* Finish / Colour */}
      <div style={S.s}>
        <label style={S.l}>Finish / Colour</label>
        <input style={{...S.sel}} type="text" placeholder="e.g. Sunburst, Black, Natural…" value={filters.finish||''} onChange={e=>upd('finish',e.target.value)} />
      </div>

      {/* Handedness */}
      <div style={S.s}>
        <label style={S.l}>Handedness</label>
        <div style={S.cr}>
          {HANDEDNESS.map(h=><button key={h} style={togBtn('handedness',h)} onClick={()=>upd('handedness',filters.handedness===h?'':h)}>{h[0].toUpperCase()+h.slice(1)}</button>)}
        </div>
      </div>

      {/* Number of Strings */}
      <div style={S.s}>
        <label style={S.l}>Number of Strings</label>
        <div style={S.cr}>
          {[4,5,6,7,8,12].map(n=><button key={n} style={filters.num_strings==n?S.ca:S.c} onClick={()=>upd('num_strings',filters.num_strings==n?'':n)}>{n}</button>)}
        </div>
      </div>

      {/* Seller Location */}
      <div style={S.s}>
        <label style={S.l}>Seller Location</label>
        <div style={S.cr}>
          {SELLER_COUNTRIES.map(({code,label})=><button key={code} style={togBtn('location_country',code)} onClick={()=>tog('location_country',code)}>{label}</button>)}
        </div>
      </div>

      {/* Currency */}
      <div style={S.s}>
        <label style={S.l}>Currency</label>
        <div style={S.cr}>
          {CURRENCIES.map(c=><button key={c} style={togBtn('currency',c)} onClick={()=>upd('currency',filters.currency===c?'':c)}>{c}</button>)}
        </div>
      </div>

      {/* Seller Rating */}
      <div style={S.s}>
        <label style={S.l}>Min Seller Rating</label>
        <input style={S.sel} type="number" min="0" max="5" step="0.1" placeholder="e.g. 4.5" value={filters.min_seller_rating||''} onChange={e=>upd('min_seller_rating',e.target.value)} />
      </div>

      {/* Shipping Available */}
      <div style={{...S.s,...S.tog}} onClick={()=>upd('shipping_only',filters.shipping_only==='true'?'':'true')}>
        <div style={{...S.togBox,background:filters.shipping_only==='true'?'#f97316':'#334155'}}>
          <div style={{...S.togKnob,left:filters.shipping_only==='true'?20:2}}></div>
        </div>
        <span style={{fontSize:13,color:'#94a3b8'}}>Shipping Available Only</span>
      </div>

      {/* Platform */}
      <div style={S.s}>
        <label style={S.l}>Platform</label>
        <div style={S.cr}>
          {PLATFORMS.map(p=><button key={p} style={togBtn('platforms',p)} onClick={()=>tog('platforms',p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}
        </div>
      </div>

      <button style={S.cb} onClick={()=>onChange({})}>Clear All</button>
    </aside>
  );
}
