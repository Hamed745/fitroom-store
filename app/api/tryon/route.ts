import {NextResponse} from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import products from '@/data/products.json';

export const runtime='nodejs';
export const maxDuration=300;

// Cloudflare Workers AI: FLUX.2 Klein 4B image editor.
// References MUST be named input_image_0..3 (not image[]).
// Each input image must be smaller than 512x512; products are 412x412,
// and custom uploads are resized client-side to <=480px.
const AVAILABLE_MODELS=[
 '@cf/black-forest-labs/flux-2-klein-4b',
 '@cf/black-forest-labs/flux-2-klein-9b',
] as const;
const requestedModel=process.env.CLOUDFLARE_AI_MODEL;
const MODEL=AVAILABLE_MODELS.includes(requestedModel as typeof AVAILABLE_MODELS[number])
 ? requestedModel! : AVAILABLE_MODELS[0];
const LAYERS=['bottom','top','outer','shoes','hat'] as const;
type Layer=typeof LAYERS[number];
type Part={id:string;name:string;layer:Layer;image:Buffer;mime:string};
type Custom={name:string;layer:string;image:string};
const catalog=products as Array<{id:string;name:string;layer:string;image:string}>;

function status(){
 const configured=Boolean(process.env.CLOUDFLARE_ACCOUNT_ID&&process.env.CLOUDFLARE_API_TOKEN);
 return {configured,provider:'cloudflare-workers-ai',model:MODEL,
  message:configured?'Cloudflare credentials are configured (not yet validated). Model '+MODEL+' generates experimental images, not verified copies of products.':
   'Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to .env.local and restart Next.js.'};
}

export async function GET(){
 return NextResponse.json(status(),{headers:{'Cache-Control':'no-store'}});
}

function decodeOutput(payload:any):{image:string;bytes:Buffer}{
 const source=payload?.result?.image??payload?.image??payload?.result?.output?.image;
 if(typeof source!=='string'||!source)return {image:'',bytes:Buffer.alloc(0)};
 const b64=source.replace(/^data:image\/(?:png|jpeg|webp);base64,/,'');
 if(!/^[a-zA-Z0-9+/=\r\n]+$/.test(b64))return {image:'',bytes:Buffer.alloc(0)};
 const bytes=Buffer.from(b64,'base64');
 const mime=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':
  bytes[0]===255&&bytes[1]===216?'image/jpeg':
  bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':'';
 return {image:mime?'data:'+mime+';base64,'+b64:'',bytes};
}

async function renderPass(accountId:string,token:string,input:Buffer,baseMime:string,parts:Part[],already:Part[]):Promise<{image:string;bytes:Buffer}>{
 if(parts.length>3)throw new Error('Internal: maximum three garments per edit pass.');
 const form=new FormData();
 const baseDescription=already.length?
  'Image 0 is the same mannequin with previously selected garments. EDIT ONLY the garment(s) requested in the reference photos. Preserve the visible earlier garment colors and details without redesigning them.':
  'Image 0 is the BLANK white featureless studio mannequin. DO NOT invent other garments or graphic designs. Preserve the exact pose, silhouette, background and framing.';
 const references=parts.map((p,i)=>'Image '+(i+1)+' is the EXACT '+p.layer+' product named '+JSON.stringify(p.name)+'.').join(' ');
 const previous=already.length?'Previously fitted garments (preserve): '+already.map(p=>p.layer+' '+JSON.stringify(p.name)).join('; ')+'.':'';
 const prompt=baseDescription+' '+references+' '+previous+
  ' This is a clothing PRODUCT TRANSFER task, not fashion design or outfit inspiration. Dress the SAME mannequin in ONLY the exact reference products. '+
  ' The actual product photos define fabric color, silhouette and placement. If there is uncertainty, use a simple unbranded clothing construction rather than invent a graphic or logo. '+
  ' Transfer the precise garment COLOR, SHAPE, PRINT, LOGO, TRIM and texture; do not substitute unrelated clothing. '+
  ' Outer jacket goes OVER the shirt, shirt visible underneath. Bottoms cover legs, shoes on feet, hats on head. '+
  ' Keep all earlier items unchanged. Do not invent extra accessories, text, brands, facial features or hair. '+
  ' Preserve a full-body commercial studio composition. NEVER substitute grey patterned clothing for black or navy reference items.';
 form.append('prompt',prompt);
 form.append('width','768');form.append('height','1024');
 form.append('input_image_0',new Blob([new Uint8Array(input)],{type:baseMime}),'base.'+(baseMime==='image/png'?'png':'jpg'));
 for(let i=0;i<parts.length;i++){
  const p=parts[i];
  form.append('input_image_'+(i+1),new Blob([new Uint8Array(p.image)],{type:p.mime}),
   'garment-'+(i+1)+'.'+(p.mime==='image/webp'?'webp':p.mime==='image/jpeg'?'jpg':'png'));
 }
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId)+'/ai/run/'+MODEL,{
  method:'POST',headers:{Authorization:'Bearer '+token},body:form,
  signal:AbortSignal.timeout(180000)
 });
 const body:any=await response.json().catch(()=>null);
 if(!response.ok||body?.success===false){
  const explanation=body?.errors?.[0]?.message||body?.result?.message||'Cloudflare image editing request failed.';
  console.error('[fitroom-cloudflare] status:',response.status,'error:',String(explanation).slice(0,600));
  const friendly=response.status===429?'Cloudflare daily limit or request rate was reached. Wait until quota resets.':
   response.status===401||response.status===403?'Cloudflare credentials or Workers AI permissions were rejected.':
   response.status===400?'Cloudflare rejected the image references or their sizes; check server console.':
   String(explanation).slice(0,260);
  throw new Error(friendly);
 }
 const decoded=decodeOutput(body);
 if(!decoded.image||!decoded.bytes.length)throw new Error('Cloudflare did not return a valid image. Check model response format.');
 return decoded;
}

export async function POST(request:Request){
 const cfg=status();
 if(!cfg.configured)return NextResponse.json({message:cfg.message},{status:503});
 try{
  if(Number(request.headers.get('content-length')||0)>18_000_000)
   return NextResponse.json({message:'Image upload is too large.'},{status:413});
  const body=await request.json() as {ids?:unknown;custom?:Record<string,Custom>};
  const ids=body?.ids;
  if(!Array.isArray(ids)||ids.length<1||ids.length>5||ids.some(x=>typeof x!=='string'||x.length>120)||new Set(ids).size!==ids.length)
   return NextResponse.json({message:'Select between one and five clothing pieces.'},{status:400});
  const parts:Part[]=[];
  for(const id of ids as string[]){
   if(id.startsWith('custom-')){
    const item=body.custom?.[id];
    const match=/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(item?.image||'');
    if(!item||!LAYERS.includes(item.layer as Layer)||!match||match[2].length>14_000_000)
     return NextResponse.json({message:'Invalid uploaded clothing image.'},{status:400});
    const image=Buffer.from(match[2],'base64');
    if(image.length>10_000_000)return NextResponse.json({message:'Uploaded clothing image exceeds 10 MB.'},{status:413});
    parts.push({id,name:String(item.name||'My garment').slice(0,70),layer:item.layer as Layer,image,mime:match[1]});
   }else{
    const product=catalog.find(p=>p.id===id);
    if(!product||!LAYERS.includes(product.layer as Layer))return NextResponse.json({message:'Unknown product selected.'},{status:400});
    const ext=path.extname(product.image).toLowerCase();
    const mime=ext==='.png'?'image/png':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.webp'?'image/webp':'';
    if(!mime)return NextResponse.json({message:'Unsupported product picture format.'},{status:400});
    const image=await fs.readFile(path.join(process.cwd(),'public',product.image.replace(/^\//,'')));
    parts.push({id,name:product.name,layer:product.layer as Layer,image,mime});
   }
  }
  if(new Set(parts.map(p=>p.layer)).size!==parts.length)return NextResponse.json({message:'Only one item per clothing layer is allowed.'},{status:400});
  parts.sort((a,b)=>LAYERS.indexOf(a.layer)-LAYERS.indexOf(b.layer));

  const mannequin=await fs.readFile(path.join(process.cwd(),'public','mannequin-photo.jpg'));
  const hash=crypto.createHash('sha256').update('cloudflare-flux2-product-accuracy-trial-v4').update(MODEL).update(mannequin);
  parts.forEach(p=>hash.update(p.id+p.name+p.layer).update(p.image));
  const cacheFile=path.join(process.cwd(),'.cache','flux-'+hash.digest('hex')+'.png');
  try{
   const prev=await fs.readFile(cacheFile);
   const img=decodeOutput({image:prev.toString('base64')});
   if(img.image)return NextResponse.json({image:img.image,model:MODEL,source:'cache',verified:false});
  }catch{}

  let current=mannequin,baseMime='image/jpeg',encoded='';
  let already:Part[]=[];
  for(let start=0;start<parts.length;start+=3){
   const group=parts.slice(start,start+3);
   const result=await renderPass(process.env.CLOUDFLARE_ACCOUNT_ID!,process.env.CLOUDFLARE_API_TOKEN!,current,baseMime,group,already);
   current=result.bytes;
   encoded=result.image;
   baseMime=encoded.startsWith('data:image/jpeg')?'image/jpeg':encoded.startsWith('data:image/webp')?'image/webp':'image/png';
   already=already.concat(group);
  }
  // Cache all successful outputs but do not claim exact product fidelity.
  await fs.mkdir(path.dirname(cacheFile),{recursive:true});
  await fs.writeFile(cacheFile,current);
  return NextResponse.json({image:encoded,model:MODEL,verified:false,source:'cloudflare',
   message:'Experimental image only — garment details have not been verified. Compare all pieces with product thumbnails.'});
 }catch(error){
  const msg=error instanceof Error?error.message:'Image edit failed.';
  console.error('[fitroom-cloudflare] request failed:',msg.slice(0,350));
  return NextResponse.json({message:msg},{status:502});
 }
}