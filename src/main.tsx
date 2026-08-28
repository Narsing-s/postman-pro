import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import FlowBuilder from './flow';
import './styles.css';
import './FlowBuilder.css';
import './product.css';

function Product(){const [view,setView]=useState<'client'|'flow'>('client');return <div className="product-shell"><nav className="product-nav"><button className={view==='client'?'active':''} onClick={()=>setView('client')}>API Client</button><button className={view==='flow'?'active':''} onClick={()=>setView('flow')}>API Flows <span className="pro-badge">PRO</span></button></nav><div className="product-view">{view==='client'?<App/>:<FlowBuilder/>}</div></div>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Product/></React.StrictMode>);