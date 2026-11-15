'use client';
import Link from 'next/link';
import {useStore,byId} from '@/lib/store';
import {site} from '@/data/site';
import {Close} from './Icons';
export default function CartDrawer(){
 const s=useStore(),rows=Object.entries(s.cart as Record<string,number>);
 return <><div onClick={()=>s.setCartOpen(false)} className={`fixed inset-0 z-[70] bg-black/60 transition ${s.cartOpen?'opacity-100':'pointer-events-none opacity-0'}`}/>
  <aside aria-label="Cart" className={`fixed right-0 top-0 z-[71] flex h-full w-full max-w-sm flex-col bg-card p-5 shadow-2xl transition-transform duration-300 ${s.cartOpen?'translate-x-0':'translate-x-full'}`}>
   <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Cart</h2><button className="chip" aria-label="Close cart" onClick={()=>s.setCartOpen(false)}><Close/></button></div>
   <div className="mt-4 flex-1 space-y-3 overflow-y-auto">{rows.length?rows.map(([id,n])=>{const p=byId(id);return <div key={id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-2"><img src={p.image} alt="" className="h-14 w-14 object-contain"/><div className="flex-1 text-sm"><div className="font-semibold">{p.name}</div><div className="text-white/50">{site.currency}{p.price}</div></div>
    <div className="flex items-center gap-2 text-sm"><button className="chip h-7 w-7" aria-label="Decrease" onClick={()=>s.qty(id,n-1)}>−</button>{n}<button className="chip h-7 w-7" aria-label="Increase" onClick={()=>s.qty(id,n+1)}>+</button></div></div>}):<p className="pt-10 text-center text-white/50">Your cart is empty. Add a piece from the shop.</p>}</div>
   <div className="mt-4 flex justify-between text-lg font-bold"><span>Total</span><span>{site.currency}{s.total}</span></div>
   <Link href="/checkout" onClick={()=>s.setCartOpen(false)} className={`btn mt-3 text-center ${rows.length?'':'pointer-events-none opacity-40'}`}>Check out</Link>
  </aside></>;
}
