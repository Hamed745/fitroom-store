import {site} from '@/data/site';
import {byId} from '@/lib/store';
export default function Hero(){
 return <section className="relative mx-auto mb-6 max-w-[1650px] overflow-hidden rounded-[26px] border border-violet-500/20 bg-[radial-gradient(ellipse_at_90%_20%,rgba(110,42,240,.50),transparent_50%),linear-gradient(110deg,#161122,#211039_70%,#2d0b67)] px-6 py-8 sm:px-10 lg:py-10">
  <div className="relative z-10 max-w-[680px]"><p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-violet-300">THE NEW COLLECTION · VIRTUAL FITTING</p><h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl xl:text-5xl">Wear what you <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">discover.</span></h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Build a complete look, try each item on a virtual mannequin, and shop with confidence.</p><a href="#shop" className="btn mt-5 inline-flex items-center">Explore the collection →</a></div>
  <div className="pointer-events-none absolute -bottom-8 right-2 hidden items-end gap-0 opacity-90 lg:flex"><img src={byId('dad-cap').image} alt="" className="h-28 w-28 rotate-[-12deg] rounded-2xl object-cover shadow-2xl"/><img src={byId('hoodie').image} alt="" className="h-44 w-44 rounded-2xl object-cover shadow-2xl"/><img src={byId('white-sneakers').image} alt="" className="h-32 w-32 rotate-6 rounded-2xl object-cover shadow-2xl"/></div>
 </section>
}
