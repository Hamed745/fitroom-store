'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useStore,byId} from '@/lib/store';
import {site} from '@/data/site';
const F=({l,...r}:any)=><label className="block text-sm"><span className="mb-1 block text-white/60">{l}</span><input required {...r} className="w-full rounded-xl bg-white/10 px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"/></label>;
export default function Checkout(){
 const s=useStore(),[done,setDone]=useState(false),rows=Object.entries(s.cart as Record<string,number>);
 if(done)return <main className="grid min-h-[60vh] place-items-center text-center"><div><h1 className="text-3xl font-bold">Order placed</h1><p className="mt-2 text-white/60">This is a demo. Connect a payment provider to take real orders.</p><Link href="/" className="btn mt-6 inline-block">Back to shop</Link></div></main>;
 return <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_340px]">
  <form onSubmit={e=>{e.preventDefault();/* TODO: create a Stripe/PayPal checkout session here, then redirect */setDone(true)}} className="space-y-4">
   <h1 className="text-2xl font-bold">Checkout</h1><h2 className="font-semibold">Contact</h2>
   <F l="Email" type="email"/><F l="Phone" type="tel"/><h2 className="pt-2 font-semibold">Shipping address</h2>
   <F l="Full name"/><F l="Address"/><div className="grid grid-cols-2 gap-3"><F l="City"/><F l="Postal code"/></div><F l="Country"/>
   <h2 className="pt-2 font-semibold">Payment</h2><p className="rounded-xl bg-white/5 p-3 text-sm text-white/50">Payment placeholder: connect your provider here.</p>
   <button disabled={!rows.length} className="btn w-full disabled:opacity-40">Place order</button></form>
  <aside className="h-fit rounded-3xl bg-card p-5"><h2 className="mb-3 font-semibold">Order summary</h2>
   {rows.map(([id,n])=><div key={id} className="flex justify-between py-1 text-sm"><span>{byId(id).name} × {n}</span><span>{site.currency}{byId(id).price*n}</span></div>)}
   <div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total</span><span>{site.currency}{s.total}</span></div></aside></main>;
}
