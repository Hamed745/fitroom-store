import {NextResponse} from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import products from '@/data/products.json';
export const maxDuration=120;
// Only reveal whether a key exists, never the secret itself.
export async function GET(){
 return NextResponse.json({configured:Boolean(process.env.IMAGE_API_KEY),model:process.env.IMAGE_MODEL||'gpt-image-2.5-flare'},{headers:{'Cache-Control':'no-store'}});
}
const mime:Record<string,string>={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const LAYERS=['top','outer','bottom','shoes','hat'];
type Part={name:string;layer:string;type:string;buf:Buffer};
export async function POST(req:Request){
 const {ids,custom={}}=await req.json() as {ids:string[];custom:Record<string,{name:string;layer:string;image:string}>};
 const key=process.env.IMAGE_API_KEY;
 const model=process.env.IMAGE_MODEL||'gpt-image-2.5-flare';
 const quality=process.env.IMAGE_QUALITY||'medium';
 if(!Array.isArray(ids)||!ids.length||ids.length>5||ids.some(id=>typeof id!=='string'))return NextResponse.json({message:'Please select 1–5 valid clothing items.'},{status:400});
 if(!key)return NextResponse.json({message:'AI is not connected yet. Add IMAGE_API_KEY to .env.local on your own computer, then restart the server.'},{status:503});
 try{
  const parts:Part[]=[];
  for(const id of ids){
   if(id.startsWith('custom-')){ // a piece uploaded by the shopper
    const c=custom[id],m=/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(c?.image||'');
    if(!m||!LAYERS.includes(c?.layer)||m[2].length>14e6)return NextResponse.json({message:'Invalid uploaded garment image.'},{status:400});
    parts.push({name:String(c.name).slice(0,60),layer:c.layer,type:m[1],buf:Buffer.from(m[2],'base64')});
   }else{
    const p=products.find(x=>x.id===id);if(!p)return NextResponse.json({message:'Unknown product.'},{status:400});
    const type=mime[path.extname(p.image)];if(!type)return NextResponse.json({message:'Product photo must be PNG, JPG or WEBP.'},{status:400}); // needs png/jpg/webp
    parts.push({name:p.name,layer:p.layer,type,buf:await fs.readFile(path.join(process.cwd(),'public',p.image))});
   }
  }
  const h=crypto.createHash('sha1');h.update('neutral-mannequin-v2').update(model).update(quality);parts.forEach(p=>h.update(p.name+p.layer).update(p.buf));
  const file=path.join(process.cwd(),'.cache',h.digest('hex')+'.png');
  try{return NextResponse.json({image:'data:image/png;base64,'+(await fs.readFile(file)).toString('base64')})}catch{}
  const form=new FormData();
  form.append('model',model);
  form.append('size','1024x1536');form.append('quality',quality);form.append('output_format','png');
  form.append('prompt',`Image 1 is a neutral blank display mannequin on a beige studio background, with no clothing selected yet. Use this reference for body shape and framing. Dress the mannequin ONLY in the following selected products, without inventing any unselected garment. ${parts.map((p,i)=>`Image ${i+2} is a clothing item: ${p.name} (${p.layer})`).join('. ')}. Create ONE photorealistic full-body e-commerce studio photograph of the mannequin wearing ALL of these items at once, naturally fitted to the body, with realistic fabric folds, stitching, shadows and proportions. Layering: a jacket or other outer layer is worn OVER the top, with the top visible underneath; trousers cover the legs; shoes on the feet; a hat on the head. Match each item's color, graphics and design exactly. Keep the mannequin pose, camera framing, warm beige studio background and soft lighting. No text, no extra items.`);
  form.append('image[]',new Blob([new Uint8Array(await fs.readFile(path.join(process.cwd(),'public/mannequin.png')))],{type:'image/png'}),'mannequin.png');
  parts.forEach((p,i)=>form.append('image[]',new Blob([new Uint8Array(p.buf)],{type:p.type}),`item${i}.${p.type.split('/')[1]}`));
  const apiResponse=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form});
  const j=await apiResponse.json();
  const b64=j.data?.[0]?.b64_json;
  if(!apiResponse.ok||!b64){
   // No authentication headers or key are logged; only the service error.
   console.error('[tryon] image API status:',apiResponse.status,'error:',JSON.stringify(j.error||j));
   const status=apiResponse.status;
   const message=status===401?'API key rejected. Check IMAGE_API_KEY in .env.local and restart the server.':
    status===403?'The API project is not permitted to use this image model. Check model access or verification in your API dashboard.':
    status===429?'Image API rate limit or credit limit reached. Check your API usage and billing settings.':
    status===400?'The image API rejected the request. Check the terminal error for invalid image or model settings.':
    status>=500?'The image API is temporarily unavailable. Please retry later.':
    'AI image generation failed. Check the server terminal for more detail.';
   return NextResponse.json({message},{status:502});
  }
  await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,Buffer.from(b64,'base64'));
  return NextResponse.json({image:'data:image/png;base64,'+b64});
 }catch(e){console.error('[tryon]',e);return NextResponse.json({message:'AI fitting is temporarily unavailable. See the server terminal for details.'},{status:502})}
}
