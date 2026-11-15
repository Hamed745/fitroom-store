'use client';
import {useRef,useState} from 'react';
import {useStore,products,Product} from '@/lib/store';
import {site} from '@/data/site';
import {Heart,Hanger,Plus} from './Icons';
const cats=Array.from(new Set(products.map(p=>p.category)));
function ProductCard({p}:{p:Product}){
 const s=useStore(),imgRef=useRef<HTMLImageElement>(null),liked=s.wish.includes(p.id),selected=Object.values(s.outfit).includes(p.id);
 return <article className={`product-card group relative min-w-0 overflow-hidden rounded-[22px] border bg-[#15141c] transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 ${selected?'border-violet-500/70 shadow-[0_0_25px_rgba(139,92,246,.15)]':'border-white/[.075]'}`}>
  <div className="relative overflow-hidden bg-[#202026]">
   <img ref={imgRef} src={p.image} alt={p.name} loading="lazy" className="aspect-[1/1.02] w-full object-cover transition-transform duration-500 group-hover:scale-[1.055]"/>
   {p.oldPrice&&<span className="absolute bottom-3 left-3 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold tracking-wide">SALE</span>}
   <button onClick={()=>s.heart(p.id)} aria-label={`Toggle wishlist for ${p.name}`} className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#111015]/75 backdrop-blur hover:bg-violet-600"><Heart on={liked}/></button>
   <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white/90">★ {p.rating.toFixed(1)}</span>
   {selected&&<span className="absolute bottom-3 right-3 rounded-full bg-violet-600/90 px-3 py-1 text-xs font-semibold">In your look ✓</span>}
  </div>
  <div className="px-3 pb-3 pt-3 sm:px-4"><div className="mb-1 text-[10px] uppercase tracking-[.13em] text-violet-300/80">{p.category}</div><h3 className="truncate text-[15px] font-semibold">{p.name}</h3>
   <div className="mb-3 mt-1 flex items-center gap-2"><strong className="text-[17px]">{site.currency}{p.price}</strong>{p.oldPrice&&<s className="text-xs text-white/40">{site.currency}{p.oldPrice}</s>}</div>
   <div className="grid grid-cols-2 gap-2"><button onClick={()=>s.tryOn(p.id)} className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition ${selected?'border-violet-400 bg-violet-500/15':'border-white/20 bg-white/[.035] hover:border-violet-400'}`}><Hanger/> <span>{selected?'Selected':'Try on'}</span></button>
    <button onClick={()=>s.add(p.id)} className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-700 to-violet-500 py-2.5 text-xs font-semibold transition hover:brightness-125"><Plus/><span>Add to cart</span></button></div>
  </div>
 </article>
}
export default function Shop(){
 const s=useStore(),[cat,setCat]=useState(''),[max,setMax]=useState(200),[sale,setSale]=useState(false),[wo,setWo]=useState(false),[sort,setSort]=useState('newest');
 const list=products.filter(p=>(!cat||p.category===cat)&&p.price<=max&&(!sale&&s.view!=='sale'||p.oldPrice)&&(!wo||s.wish.includes(p.id))&&(s.view!=='new'||p.new)&&p.name.toLowerCase().includes(s.q.toLowerCase())).sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='rating'?b.rating-a.rating:b.date.localeCompare(a.date));
 return <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[174px_minmax(0,1fr)] xl:grid-cols-[196px_minmax(0,1fr)]">
  <aside className="rounded-[22px] border border-white/10 bg-[#14121d] p-4 text-sm lg:sticky lg:top-24">
   <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4"><h2 className="font-bold">☷ &nbsp;Filters</h2><button onClick={()=>{setCat('');setMax(200);setSale(false);setWo(false)}} className="text-xs text-violet-300 hover:text-white">Clear all</button></div>
   <div><h3 className="mb-3 text-xs font-semibold text-white/80">Categories</h3><div className="space-y-1">{[['','All products',products.length] as const,...cats.map(c=>[c,c,products.filter(p=>p.category===c).length] as const)].map(([v,l,n])=><button key={l} onClick={()=>setCat(v)} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition ${cat===v?'bg-violet-600/20 text-violet-200':'text-white/65 hover:bg-white/5 hover:text-white'}`}><span>{l}</span><span>{n}</span></button>)}</div></div>
   <div className="my-5 border-t border-white/10 pt-5"><label htmlFor="price" className="mb-3 flex justify-between text-xs font-semibold">Max price <span>{site.currency}{max}</span></label><input id="price" type="range" min="20" max="200" value={max} onChange={e=>setMax(+e.target.value)} className="w-full accent-violet-500"/><div className="flex justify-between text-[10px] text-white/40"><span>$20</span><span>$200</span></div></div>
   <div className="space-y-3 border-t border-white/10 pt-5"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={sale} onChange={e=>setSale(e.target.checked)} className="accent-violet-500"/>On sale only</label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={wo} onChange={e=>setWo(e.target.checked)} className="accent-violet-500"/>Wishlist only</label></div>
  </aside>
  <section className="min-w-0"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold sm:text-2xl">{s.view==='sale'?'Sale':'New arrivals'} <span className="ml-1 text-sm font-normal text-white/40">{list.length} products</span></h2></div>
   <select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort" className="max-w-[150px] rounded-xl border border-white/15 bg-[#211f27] px-3 py-2 text-xs text-white"><option value="newest">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></div>
   {list.length?<div className={`grid grid-cols-2 gap-3 sm:gap-4 ${s.panel?'xl:grid-cols-2 2xl:grid-cols-3':'xl:grid-cols-3 2xl:grid-cols-4'}`}>{list.map(p=><ProductCard key={p.id} p={p}/>)}</div>:<p className="rounded-2xl border border-white/10 p-14 text-center text-white/60">No products match these filters.</p>}
  </section>
 </div>
}
