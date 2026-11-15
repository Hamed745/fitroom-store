import './globals.css';
import {site} from '@/data/site';
import {Provider} from '@/lib/store';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
export const metadata={title:`${site.brand} — clothing store`,description:site.hero.sub};
export default function Root({children}:{children:React.ReactNode}){
 return <html lang="en"><body style={{'--accent':site.accent} as React.CSSProperties}><Provider><Header/>{children}<CartDrawer/></Provider></body></html>;
}
