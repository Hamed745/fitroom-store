'use client';
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import raw from '@/data/products.json';
export type Slot='top'|'outer'|'bottom'|'shoes'|'hat';
export type Product={id:string;name:string;price:number;oldPrice?:number;category:string;rating:number;layer:Slot;image:string;date:string;new:boolean};
export const products=raw as Product[];
export const SLOTS:Slot[]=['top','outer','bottom','shoes','hat'];
const extra:Record<string,Product>={};
export const byId=(id:string)=>(products.find(p=>p.id===id)||extra[id])!;
const C=createContext<any>(null);
export const useStore=()=>useContext(C);
export function Provider({children}:{children:ReactNode}){
 const [cart,setCart]=useState<Record<string,number>>({}),[wish,setWish]=useState<string[]>([]),
 [outfit,setOutfit]=useState<Partial<Record<Slot,string>>>({}),[panel,setPanel]=useState(false),
 [cartOpen,setCartOpen]=useState(false),[q,setQ]=useState(''),[view,setView]=useState('all');
 useEffect(()=>{try{setCart(JSON.parse(localStorage.cart||'{}'));setWish(JSON.parse(localStorage.wish||'[]'))}catch{}},[]);
 useEffect(()=>{try{localStorage.cart=JSON.stringify(cart);localStorage.wish=JSON.stringify(wish)}catch{}},[cart,wish]);
 const add=(id:string,n=1)=>{setCart(c=>({...c,[id]:(c[id]||0)+n}));setCartOpen(true)};
 const qty=(id:string,n:number)=>setCart(c=>{const x={...c};if(n<=0)delete x[id];else x[id]=n;return x});
 const heart=(id:string)=>setWish(w=>w.includes(id)?w.filter(i=>i!==id):[...w,id]);
 const tryOn=(id:string)=>{const p=byId(id);setOutfit(o=>({...o,[p.layer]:id}));setPanel(true)};
 const drop=(s:Slot)=>setOutfit(o=>{const x={...o};delete x[s];return x});
 const addOutfit=()=>{setCart(c=>{const x={...c};Object.values(outfit).forEach(id=>{if(id!.startsWith('custom-'))return;x[id!]=(x[id!]||0)+1});return x});setCartOpen(true)};
 const addCustom=(name:string,layer:Slot,image:string)=>{const id='custom-'+Date.now();extra[id]={id,name,price:0,category:'Mine',rating:0,layer,image,date:'',new:false};tryOn(id)};
 const count=Object.values(cart).reduce((a,b)=>a+b,0);
 const total=Object.entries(cart).reduce((a,[id,n])=>a+byId(id).price*n,0);
 return <C.Provider value={{cart,wish,outfit,panel,setPanel,cartOpen,setCartOpen,q,setQ,view,setView,add,qty,heart,tryOn,drop,reset:()=>setOutfit({}),addOutfit,addCustom,count,total}}>{children}</C.Provider>;
}
