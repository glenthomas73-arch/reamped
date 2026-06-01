import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchHero from '../components/SearchHero';
import FilterPanel from '../components/FilterPanel';
import ListingCard from '../components/ListingCard';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function search(p) {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(p).filter(([,v])=>v!==''&&v!=null)));
    const r = await fetch(`${API}/api/search?${qs}`);
    if (!r.ok) throw new Error('Search failed');
    return r.json();
}

export default function SearchPage() {
    const [sp, setSP] = useSearchParams();
    const [f, setF] = useState({
          q: sp.get('q')||'', sort: sp.get('sort')||'value_score',
          condition: sp.get('condition')||'', category: sp.get('category')||'',
          platforms: sp.get('platforms')||'', min_price: sp.get('min_price')||'',
          max_price: sp.get('max_price')||'', page: sp.get('page')||'1',
    });
    const {data,isLoading,isError,error} = useQuery({
          queryKey: ['search',f], queryFn: ()=>search(f), keepPreviousData: true,
    });
    useEffect(()=>{
          const params={};
          Object.entries(f).forEach(([k,v])=>{if(v)params[k]=v;});
          setSP(params,{replace:true});
    },[f,setSP]);
    const doSearch=(q)=>setF(x=>({...x,q,page:'1'}));
    const listings=data?.listings||[];
    const total=data?.total||0;
    const has=!!f.q;

  return (
        <div style={{minHeight:'100vh',background:'#0f172a'}}>
{!has && <SearchHero onSearch={doSearch} />}
{has && (
          <div style={{background:'#1e293b',padding:'16px 24px',borderBottom:'1px solid #334155'}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'flex',gap:16,alignItems:'center'}}>
            <input style={{flex:1,background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:16,padding:'10px 16px',outline:'none'}}
              value={f.q} onChange={e=>setF(x=>({...x,q:e.target.value,page:'1'}))}
                              onKeyDown={e=>e.key==='Enter'&&doSearch(f.q)} placeholder="Search gear..." />
                            <span style={{color:'#64748b',fontSize:14,whiteSpace:'nowrap'}}>
{isLoading ? 'Searching...' : `${total.toLocaleString()} results`}
</span>
  </div>
  </div>
      )}
{has && (
          <div style={{maxWidth:1200,margin:'0 auto',padding:24,display:'flex',gap:24,alignItems:'flex-start'}}>
          <FilterPanel filters={f} onChange={nf=>setF({...nf,q:f.q,page:'1'})} />
          <div style={{flex:1,minWidth:0}}>
{isLoading && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
{[1,2,3,4,5,6].map(i=><div key={i} style={{height:280,background:'#1e293b',borderRadius:12,border:'1px solid #334155'}}/>)}
  </div>}
{isError && <p style={{color:'#ef4444',padding:32}}>Error: {error?.message}</p>}
{!isLoading&&!isError&&listings.length===0 && <p style={{color:'#f1f5f9',padding:32,textAlign:'center'}}>No results for "{f.q}"</p>}
{!isLoading&&listings.length>0 && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
{listings.map(l=><ListingCard key={`${l.platform}-${l.id}`} listing={l}/>)}
  </div>
            )}
</div>
              </div>
      )}
</div>
  );
}
