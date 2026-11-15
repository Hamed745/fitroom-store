'use client';
import Hero from '@/components/Hero';
import Shop from '@/components/Shop';
import FittingRoom from '@/components/FittingRoom';
import {useStore} from '@/lib/store';
import {Hanger} from '@/components/Icons';
export default function Home(){
 const s=useStore();
 return <main className="mx-auto max-w-[1740px] px-4 pb-24 pt-5 sm:px-6">
  <Hero/>
  <div id="shop" className={`grid items-start gap-4 lg:gap-5 ${s.panel?'lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]':''}`}><FittingRoom/><Shop/></div>
  {!s.panel&&<button onClick={()=>s.setPanel(true)} className="btn fixed bottom-5 right-5 z-30 flex items-center gap-2"><Hanger/>Open fitting room</button>}
 </main>;
}
