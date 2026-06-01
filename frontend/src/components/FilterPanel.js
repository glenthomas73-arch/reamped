import React from 'react';

const CONDITIONS = ['mint','excellent','good','fair','poor'];
const CATEGORIES = ['guitar','bass','amp','pedal','keys','drum','recording'];
const PLATFORMS = ['reverb','ebay','guitarcenter','sweetwater'];
const SORTS = [{value:'value_score',label:'Best Value'},{value:'price_asc',label:'Low to High'},{value:'price_desc',label:'High to Low'},{value:'newest',label:'Newest'}];

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
  };

  return (
        <aside style={S.p}>
      <h3 style={S.h}>Filters</h3>
        <div style={S.s}><label style={S.l}>Sort By</label>
          <select style={S.sel} value={filters.sort||'value_score'} onChange={e=>upd('sort',e.target.value)}>
{SORTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
  </div>
      <div style={S.s}><label style={S.l}>Price</label>
        <div style={S.pr}>
          <input style={S.pi} type="number" placeholder="Min" value={filters.min_price||''} onChange={e=>upd('min_price',e.target.value)} />
          <span style={{color:'#64748b'}}>-</span>
          <input style={S.pi} type="number" placeholder="Max" value={filters.max_price||''} onChange={e=>upd('max_price',e.target.value)} />
  </div>
  </div>
      <div style={S.s}><label style={S.l}>Condition</label><div style={S.cr}>
{CONDITIONS.map(c=><button key={c} style={on('condition',c)?S.ca:S.c} onClick={()=>tog('condition',c)}>{c[0].toUpperCase()+c.slice(1)}</button>)}
  </div></div>
        <div style={S.s}><label style={S.l}>Category</label><div style={S.cr}>
{CATEGORIES.map(c=><button key={c} style={filters.category===c?S.ca:S.c} onClick={()=>upd('category',filters.category===c?'':c)}>{c}</button>)}
                </div></div>
                      <div style={S.s}><label style={S.l}>Platform</label><div style={S.cr}>
                {PLATFORMS.map(p=><button key={p} style={on('platforms',p)?S.ca:S.c} onClick={()=>tog('platforms',p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}
  </div></div>
        <button style={S.cb} onClick={()=>onChange({})}>Clear All</button>
  </aside>
  );
}
