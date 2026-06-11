import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SearchHero from '../components/SearchHero';
import FilterPanel from '../components/FilterPanel';
import ListingCard from '../components/ListingCard';

const API = process.env.REACT_APP_API_URL || 'https://reamped-production.up.railway.app';

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
      const page=parseInt(f.page)||1;
      const limit=24;
      const totalPages=Math.max(1,Math.ceil(total/limit));

  return (
          <div style={{minHeight:'100vh',background:'#0f172a'}}>
{!has && <SearchHero onSearch={doSearch} />}
{has && (
            <div style={{background:'#1e293b',padding:'16px 24px',borderBottom:'1px solid #334155',position:'sticky',top:60,zIndex:50}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'flex',gap:16,alignItems:'center'}}>
            <input
              style={{flex:1,background:'#0f172a',border:'1px solid #334155',borderRadius:8,color:'#f1f5f9',fontSize:16,padding:'10px 16px',outline:'none'}}
              value={f.q}
              onChange={e=>setF(x=>({...x,q:e.target.value,page:'1'}))}
                                onKeyDown={e=>e.key==='Enter'&&doSearch(f.q)}
                                placeholder="Search gear..."
            />
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
{isLoading && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
{[1,2,3,4,5,6].map(i=>(
                      <div key={i} style={{height:280,background:'#1e293b',borderRadius:12,border:'1px solid #334155',animation:'pulse 1.5s ease-in-out infinite'}}/>
                ))}
</div>
            )}
{isError && <p style={{color:'#ef4444',padding:32}}>Error: {error?.message}</p>}
{!isLoading&&!isError&&listings.length===0 && (
                  <div style={{textAlign:'center',padding:'80px 24px'}}>
                <div style={{fontSize:48,marginBottom:16}}>&#127926;</div>
                <p style={{color:'#94a3b8',fontSize:16}}>No results for "{f.q}"</p>
                <p style={{color:'#64748b',fontSize:14,marginTop:8}}>Try different keywords or adjust your filters.</p>
    </div>
            )}
{!isLoading&&listings.length>0 && (
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
{listings.map(l=><ListingCard key={`${l.platform}-${l.id}`} listing={l}/>)}
    </div>
{totalPages > 1 && (
                      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:32,paddingBottom:8}}>
                    <button
                      style={{...btnStyle, opacity: page<=1?0.4:1}}
                                                disabled={page<=1}
                      onClick={()=>setF(x=>({...x,page:String(page-1)}))}
                    >&#8592; Prev</button>
                    <div style={{display:'flex',gap:4}}>
{Array.from({length:Math.min(7,totalPages)},(_,i)=>{
                            let p;
                            if(totalPages<=7) p=i+1;
                            else if(page<=4) p=i+1;
                            else if(page>=totalPages-3) p=totalPages-6+i;
                            else p=page-3+i;
                            return (
                                                          <button
                                key={p}
                                style={{...pageBtn, background:p===page?'#f97316':'transparent', color:p===page?'#fff':'#94a3b8', borderColor:p===page?'#f97316':'#334155'}}
                                        onClick={()=>setF(x=>({...x,page:String(p)}))}
                          >{p}</button>
                        );
})}
    </div>
                    <button
                      style={{...btnStyle, opacity: page>=totalPages?0.4:1}}
                                                disabled={page>=totalPages}
                      onClick={()=>setF(x=>({...x,page:String(page+1)}))}
                    >Next &#8594;</button>
                          </div>
                )}
</>
            )}
</div>
    </div>
      )}
</div>
  );
}

const btnStyle = {
      padding:'8px 16px',
      background:'transparent',
      border:'1px solid #334155',
      borderRadius:8,
      color:'#94a3b8',
      fontSize:14,
      cursor:'pointer',
      fontWeight:500,
};

const pageBtn = {
      width:36,
      height:36,
      border:'1px solid',
      borderRadius:6,
      fontSize:13,
      cursor:'pointer',
      fontWeight:600,
};
