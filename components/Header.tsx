'use client';
import Link from 'next/link';
import {useStore} from '@/lib/store';
import {site} from '@/data/site';
import {Heart,Bag,Search} from './Icons';
export default function Header(){
 const s=useStore();
 const go=(v:string,top=false)=>()=>{s.setView(v);document.getElementById(top?'top':'shop')?.scrollIntoView()};
 const nav:[string,string,boolean][]=[['Home','all',true],['Shop','all',false],['New Arrivals','new',false],['Sale','sale',false]];
 return <header id="top" className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
  <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
   <nav className="hidden gap-5 text-sm text-white/70 lg:flex">{nav.map(([l,v,t])=><Link key={l} href="/" onClick={go(v,t)} className="transition hover:text-white">{l}</Link>)}</nav>
   <Link href="/" className="col-start-2 text-lg font-extrabold tracking-[.2em]">{site.brand}</Link>
   <div className="flex items-center justify-end gap-2">
    <label className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm sm:flex"><Search/><input value={s.q} onChange={e=>s.setQ(e.target.value)} placeholder="Search" aria-label="Search products" className="w-28 bg-transparent outline-none placeholder:text-white/40"/></label>
    <button className="chip relative" aria-label="Wishlist" onClick={()=>{document.getElementById('shop')?.scrollIntoView()}}><Heart on={s.wish.length>0}/></button>
    <button className="chip relative" aria-label="Cart" onClick={()=>s.setCartOpen(true)}><Bag/>{s.count>0&&<span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold">{s.count}</span>}</button>
   </div>
  </div>
  <nav className="flex gap-4 overflow-x-auto px-4 pb-2 text-sm text-white/70 lg:hidden">{nav.map(([l,v,t])=><Link key={l} href="/" onClick={go(v,t)} className="whitespace-nowrap">{l}</Link>)}</nav>
 </header>;
}
