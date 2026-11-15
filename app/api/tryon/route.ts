import {NextResponse} from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import products from '@/data/products.json';

// This endpoint now uses a LOCAL open-source FASHN VTON service.
// It never contacts OpenAI or reads IMAGE_API_KEY.
export const runtime='nodejs';
export const maxDuration=300;
const SERVICE='http://127.0.0.1:8765';
const VALID_LAYERS=['top','outer','bottom','shoes','hat'];
const SUPPORTED_LAYERS=['top','outer','bottom'];
const mime:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
type Item={name:string;layer:string;image:Buffer;type:string};
type CustomItem={name:string;layer:string;image:string};

async function status(){
 try {
  const response=await fetch(SERVICE+'/health',{cache:'no-store',signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw Error('Local VTON health check failed.');
  const info=await response.json();
  return {configured:info.ready===true,provider:'fashn-vton-1.5-local',message:String(info.message||'Local AI service is connected.')};
 } catch {
  return {configured:false,provider:'fashn-vton-1.5-local',message:'The free local AI service is not running. Start vton-service with Python (see LOCAL_VTON_SETUP.md).'};
 }
}

export async function GET(){
 return NextResponse.json(await status(),{headers:{'Cache-Control':'no-store'}});
}

export async function POST(req:Request){
 try {
  if(Number(req.headers.get('content-length')||0)>17_000_000)
   return NextResponse.json({message:'Uploaded garments exceed the request size limit.'},{status:413});
  const body=await req.json();
  const ids:unknown=body?.ids;
  const custom:Record<string,CustomItem>=body?.custom||{};
  if(!Array.isArray(ids)||ids.length<1||ids.length>5||ids.some(id=>typeof id!=='string'||id.length>160)||new Set(ids).size!==ids.length)
   return NextResponse.json({message:'Select 1–5 valid clothing items.'},{status:400});
  const parts:Item[]=[];
  for(const id of ids as string[]){
   if(id.startsWith('custom-')){
    const c=custom[id],match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(c?.image||'');
    if(!c||!VALID_LAYERS.includes(c.layer)||!match||match[2].length>14_000_000)
     return NextResponse.json({message:'One uploaded garment is invalid.'},{status:400});
    const image=Buffer.from(match[2],'base64');
    if(image.length>10_000_000)return NextResponse.json({message:'An uploaded garment is too large.'},{status:413});
    parts.push({name:String(c.name).slice(0,70),layer:c.layer,type:match[1],image});
   } else {
    const p=products.find(item=>item.id===id);
    if(!p||!VALID_LAYERS.includes(p.layer))
     return NextResponse.json({message:'Unknown product.'},{status:400});
    const ext=path.extname(p.image).toLowerCase(),type=mime[ext];
    if(!type)return NextResponse.json({message:'Only JPG, PNG or WEBP product photos are supported.'},{status:400});
    // Product paths are from our trusted product catalog, never from user input.
    const image=await fs.readFile(path.join(process.cwd(),'public',p.image.replace(/^\//,'')));
    parts.push({name:p.name,layer:p.layer,type,image});
   }
  }
  if(new Set(parts.map(p=>p.layer)).size!==parts.length)
   return NextResponse.json({message:'Only one item per clothing slot is supported.'},{status:400});

  const supported=parts.filter(p=>SUPPORTED_LAYERS.includes(p.layer));
  const extras=parts.filter(p=>!SUPPORTED_LAYERS.includes(p.layer));
  if(!supported.length)
   return NextResponse.json({message:'This open-source model currently supports tops, jackets and trousers. Shoes and hats are not yet supported.'},{status:422});

  const mannequin=await fs.readFile(path.join(process.cwd(),'public','mannequin-photo.jpg'));
  const hasher=crypto.createHash('sha256').update('fashn-vton-local-v1').update(mannequin);
  for(const p of parts)hasher.update(p.layer).update(p.name).update(p.image);
  const cacheFile=path.join(process.cwd(),'.cache','vton-'+hasher.digest('hex')+'.png');
  const warnings=extras.length?['Hats and shoes are saved to Your picks but cannot yet be rendered by this open-source model.']:[];
  try{
   const cached=await fs.readFile(cacheFile);
   return NextResponse.json({image:'data:image/png;base64,'+cached.toString('base64'),warnings});
  }catch{}

  const check=await status();
  if(!check.configured)return NextResponse.json({message:check.message},{status:503});

  let response:Response;
  try{
   response=await fetch(SERVICE+'/tryon',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    signal:AbortSignal.timeout(240_000),
    body:JSON.stringify({
     mannequin:mannequin.toString('base64'),
     garments:supported.map(p=>({layer:p.layer,image:p.image.toString('base64')}))
    })
   });
  }catch(err){
   console.error('[local-vton] connection:',err instanceof Error?err.message:String(err));
   return NextResponse.json({message:'Local FASHN VTON stopped responding. Check its Python terminal or GPU memory.'},{status:503});
  }
  const data=await response.json().catch(()=>({}));
  if(!response.ok||typeof data.image!=='string'){
   const message=String(data?.detail||data?.message||'Local model failed to generate the outfit.');
   console.error('[local-vton] inference status:',response.status,message);
   return NextResponse.json({message},{status:502});
  }
  const match=/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(data.image);
  if(!match)return NextResponse.json({message:'The local model returned an invalid image.'},{status:502});
  const output=Buffer.from(match[1],'base64');
  await fs.mkdir(path.dirname(cacheFile),{recursive:true});
  await fs.writeFile(cacheFile,output);
  return NextResponse.json({image:data.image,warnings});
 }catch(err){
  console.error('[local-vton]',err instanceof Error?err.message:String(err));
  return NextResponse.json({message:'Local try-on failed. Check the Next.js and Python terminals.'},{status:502});
 }
}
