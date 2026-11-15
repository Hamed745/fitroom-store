'use client';
import {useEffect,useRef,useState} from 'react';
import {useStore,SLOTS,byId,Slot} from '@/lib/store';
import {Close} from './Icons';
const cache=new Map<string,string>();
const names:Record<Slot,string>={top:'Top / T-shirt',outer:'Jacket / outerwear',bottom:'Trousers',shoes:'Shoes',hat:'Hat'};
export default function FittingRoom(){
 const s=useStore(),[image,setImage]=useState<string|null>(null),[renderedKey,setRenderedKey]=useState(''),[loading,setLoading]=useState(false),[zoom,setZoom]=useState(false),[slot,setSlot]=useState<Slot>('top'),[notice,setNotice]=useState(''),[error,setError]=useState(false),[aiReady,setAiReady]=useState<boolean|null>(null),[retry,setRetry]=useState(0),[paused,setPaused]=useState(false),[engineMessage,setEngineMessage]=useState('Checking local AI service...');
 const latestKey=useRef('');
 const ids=SLOTS.map(k=>s.outfit[k]).filter(Boolean) as string[],key=SLOTS.map(k=>s.outfit[k]||'-').join('|');
 const hasItems=ids.length>0,current=renderedKey===key&&!!image;
 // A newly selected garment updates the fitting room without requiring any Generate button.
 // The delay groups fast successive selections into one request. Cache hits are instant.
 useEffect(()=>{
  latestKey.current=key;
  setError(false);setNotice('');
  if(!hasItems){setImage(null);setRenderedKey('');setLoading(false);return}
  const cached=cache.get(key);
  if(cached){setImage(cached);setRenderedKey(key);setLoading(false);return}
  setImage(null);setRenderedKey('');
  if(aiReady===false){setLoading(false);setError(true);setNotice(engineMessage);return}
  if(paused){setLoading(false);setError(true);setNotice('Automatic previews are paused after a local service error. Check the Python server and use Retry.');return}
  if(aiReady===null){setLoading(false);return}
  const controller=new AbortController();
  setLoading(true);
  const timer=setTimeout(async()=>{
   try{
    const res=await fetch('/api/tryon',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({ids,custom:Object.fromEntries(ids.filter(i=>i.startsWith('custom-')).map(i=>[i,{name:byId(i).name,layer:byId(i).layer,image:byId(i).image}]))})});
    const d=await res.json();
    if(!res.ok||!d.image){if(d.paused)setPaused(true);throw new Error(d.message||'Image generation failed.')}
    cache.set(key,d.image);
    if(latestKey.current===key){setImage(d.image);setRenderedKey(key);setNotice(Array.isArray(d.warnings)&&d.warnings.length?d.warnings.join(' '):'Your selected clothing preview is ready.')}
   }catch(e){
    if(controller.signal.aborted||latestKey.current!==key)return;
    setError(true);setNotice(e instanceof Error?e.message:'Image generation unavailable.');
   }finally{if(!controller.signal.aborted&&latestKey.current===key)setLoading(false)}
  },850);
  return()=>{clearTimeout(timer);controller.abort()};
 },[key,aiReady,retry,paused,engineMessage]);
 async function checkService(){
  try {
   const r=await fetch('/api/tryon',{cache:'no-store'});
   const d=await r.json();
   setEngineMessage(d.message||'Start the local AI Python service.');
   setAiReady(Boolean(d.configured));
  } catch {setAiReady(false);setEngineMessage('Cannot reach the local try-on service. Check that both servers are running.')}
 }
 useEffect(()=>{void checkService()},[]);
 function upload(f?:File){
  if(!f)return;
  if(!['image/png','image/jpeg','image/webp'].includes(f.type)){setNotice('Please choose a PNG, JPG or WEBP image.');setError(true);return}
  if(f.size>10*1024*1024){setNotice('Image exceeds 10 MB.');setError(true);return}
  const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{
   const scale=Math.min(1,1024/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d')!.drawImage(im,0,0,c.width,c.height);
   s.addCustom(f.name.replace(/\.[^.]+$/,''),slot,c.toDataURL('image/jpeg',.87));setNotice('Piece added. Your outfit will update automatically.');setError(false)
  };im.onerror=()=>{setNotice('Cannot read this picture.');setError(true)};im.src=reader.result as string};reader.readAsDataURL(f)
 }
 if(!s.panel)return null;
 return <aside aria-label="Fitting room" className="fixed inset-0 z-50 overflow-y-auto bg-[#121019] p-4 shadow-2xl lg:sticky lg:top-24 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:rounded-[24px] lg:border lg:border-violet-400/30 lg:bg-[#17131f] lg:p-4 lg:shadow-[0_10px_70px_rgba(63,26,122,.13)]">
  <div className="mb-3 flex items-start justify-between gap-3"><div><div className="mb-1 text-[10px] font-semibold uppercase tracking-[.20em] text-violet-300">YOUR STYLE STUDIO</div><h2 className="text-xl font-extrabold">Fitting room</h2><p className="mt-1 text-xs text-white/50">Build your look, layer by layer.</p></div><button className="chip" aria-label="Close fitting room" onClick={()=>s.setPanel(false)}><Close/></button></div>
  <div className="relative mx-auto max-w-[350px] overflow-hidden rounded-[17px] border border-white/10 bg-[#dedcde]">
   <img src={current?image!:'/mannequin-photo.jpg'} alt={current?'AI generated outfit with your selected clothing':'Neutral mannequin without selected clothes'} className="aspect-[.65] w-full object-cover object-top"/>
   {!current&&<span className="absolute left-3 top-3 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-zinc-800">{hasItems?'PREPARING YOUR SELECTED OUTFIT':'BLANK MANNEQUIN — CHOOSE CLOTHES'}</span>}
   {loading&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-[3px]" role="status"><span className="h-9 w-9 animate-spin rounded-full border-4 border-violet-300/30 border-t-violet-400"/><span className="text-sm font-semibold">Automatically dressing your mannequin...</span><span className="text-xs text-white/70">This can take a moment</span></div>}
   <button aria-label="Expand mannequin image" onClick={()=>setZoom(true)} className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/65 px-3 py-2 text-xs font-semibold">⛶ Zoom</button>
  </div>
  <p className="mt-2 text-center text-[11px] leading-4 text-white/45">Select any clothing item: the mannequin updates automatically. AI images are previews, not sizing guarantees.</p>
  <p className={`mt-3 rounded-xl border p-2 text-xs ${aiReady===true?'border-emerald-400/25 bg-emerald-500/10 text-emerald-100':aiReady===false?'border-amber-400/25 bg-amber-500/10 text-amber-100':'border-white/10 bg-white/5 text-white/65'}`}>{aiReady===true?'✓ Local open-weight image editor dependencies detected. All five clothing slots are supported by the experimental backend. Select clothes to test the model; loading and generation are not yet verified. No paid image API is used.' :aiReady===false?engineMessage:'Checking the free local AI service…'}</p>
  {aiReady===false&&<button onClick={()=>void checkService()} className="pill mt-2 w-full text-xs">↻ Check local AI connection</button>}
  {loading&&<p role="status" className="mt-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-center text-xs text-violet-200">Generating your outfit automatically…</p>}
  {error&&hasItems&&aiReady&&<button onClick={()=>{setPaused(false);setRetry(n=>n+1)}} className="pill mt-2 w-full text-xs">↻ Retry automatic preview</button>}
  {error&&<p role="alert" className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-200">{notice}</p>}
  {!error&&notice&&<p role="status" className="mt-2 text-xs text-violet-200">{notice}</p>}
  <div className="mt-4 flex items-center justify-between"><h3 className="text-sm font-bold">Your picks</h3><span className="text-xs text-white/45">{ids.length} / 5 pieces</span></div>
  <div className="mt-2 flex flex-wrap gap-2">{hasItems?SLOTS.map(sl=>s.outfit[sl]&&<div key={sl} className="relative h-[66px] w-[56px] overflow-visible rounded-xl border border-white/10 bg-[#292630]"><img src={byId(s.outfit[sl]).image} alt={byId(s.outfit[sl]).name} className="h-full w-full rounded-xl object-cover"/><button onClick={()=>s.drop(sl)} aria-label={`Remove ${byId(s.outfit[sl]).name}`} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-xs">×</button></div>):<p className="rounded-xl border border-dashed border-white/20 p-3 text-xs text-white/50">Tap “Try on” on a product to add it to your outfit.</p>}</div>
  <div className="mt-4 rounded-2xl border border-dashed border-violet-400/30 bg-violet-950/10 p-3"><h3 className="text-sm font-bold">+ Add your own clothing</h3><p className="mb-3 mt-1 text-[11px] text-white/45">Upload one clear garment photo on a plain background.</p>
   <label htmlFor="piece-type" className="mb-1 block text-[11px] text-white/60">Clothing type</label><select id="piece-type" value={slot} onChange={e=>setSlot(e.target.value as Slot)} className="mb-2 w-full rounded-xl border border-white/10 bg-[#26222e] px-3 py-2 text-xs">{SLOTS.map(k=><option key={k} value={k}>{names[k]}</option>)}</select>
   <label className="flex cursor-pointer items-center justify-center rounded-xl border border-violet-400/50 bg-violet-500/15 px-3 py-2.5 text-xs font-semibold text-violet-200 hover:bg-violet-500/25">↑ Upload a garment photo<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label>
  </div>
  <button disabled={!hasItems} onClick={s.addOutfit} className="btn mt-3 w-full disabled:opacity-40">Add selected products to cart</button>
  <button disabled={!hasItems} onClick={s.reset} className="pill mt-2 w-full disabled:opacity-40">↻ Start over</button>
  {zoom&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={()=>setZoom(false)} role="dialog" aria-modal="true" aria-label="Expanded fitting-room image"><button className="absolute right-5 top-5 text-3xl" aria-label="Close zoom">×</button><img src={current?image!:'/mannequin-photo.jpg'} alt="Large mannequin preview" className="max-h-[90vh] max-w-full rounded-2xl object-contain"/></div>}
 </aside>
}
