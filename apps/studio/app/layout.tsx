import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'NX Alive — Character Studio',description:'Small shapes. Big personality. Create simple, expressive animated mascots and bring them into your product.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
