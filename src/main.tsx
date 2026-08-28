import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Upload} from 'lucide-react';
import App from './App';
import FlowBuilder from './flow';
import ImportCenter from './ImportCenter';
import AutomationCenter from './AutomationCenter';
import './styles.css';import './FlowBuilder.css';import './product.css';import './ImportCenter.css';import './AutomationCenter.css';
function Product(){const [view,setView]=useState<'client'|'flow'|'automation'>('client');const [importOpen,setImportOpen]=useState(false);return <div className="product-shell"><nav className="product-nav"><button className={view==='client'?'active':''} onClick={()=>setView('client')}>API Client</button><button className={view==='flow'?'active':''} onClick={()=>setView('flow')}>API Flows <span className="pro-badge">PRO</span></button><button className={view==='automation'?'active':''} onClick={()=>setView('automation')}>Automation <span className="pro-badge">PRO</span></button><button className="product-import" onClick={()=>setImportOpen(true)}><Upload size={13}/> Import</button></nav><div className="product-view">{view==='client'?<App/>:view==='flow'?<FlowBuilder/>:<AutomationCenter/>}</div>{importOpen&&<ImportCenter close={()=>setImportOpen(false)}/>}</div>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Product/></React.StrictMode>);