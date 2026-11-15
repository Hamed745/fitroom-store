const I=({d,fill,c=''}:{d:string;fill?:boolean;c?:string})=><svg className={`h-4 w-4 ${c}`} viewBox="0 0 24 24" fill={fill?'currentColor':'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d}/></svg>;
export const Heart=({on}:{on?:boolean})=><I fill={on} c={on?'text-accent':''} d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>;
export const Hanger=()=><I d="M12 8a2.5 2.5 0 1 0-2.5-2.5M12 8v2.5l8.5 6a1.2 1.2 0 0 1-.7 2.2H4.2a1.2 1.2 0 0 1-.7-2.2l8.5-6"/>;
export const Bag=()=><I d="M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0"/>;
export const Search=()=><I d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3"/>;
export const Plus=()=><I d="M12 5v14M5 12h14"/>;
export const Close=()=><I d="M6 6l12 12M18 6L6 18"/>;
