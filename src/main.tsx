import React,{useEffect,useState} from 'react';
import {Upload} from 'lucide-react';
import {createRoot} from 'react-dom/client';
import App from './App';
import FlowBuilder from './flow';
import ImportCenter from './ImportCenter';
import AutomationCenter from './AutomationCenter';
import DeveloperCenter from './DeveloperCenter';
import PlatformProCenter from './PlatformProCenter';
import {migrateWorkspace} from './storage';
import './styles.css';import './FlowBuilder.css';import './product.css';import './ImportCenter.css';import './DeveloperCenter.css';import './PlatformCenter.css';

migrateWorkspace();

function Product(){const [view,setView]=useState<'client'|'flow'|'automation'|'tools'|'platform'>('client');const [importOpen,setImportOpen]=useState(false);const [importFile,setImportFile]=useState<File|null>(null);
useEffect(()=>{const onChange=(e:Event)=>{const input=e.target as HTMLInputElement;if(!input||input.type!=='file')return;const f=input.files?.[0];if(f){setImportFile(f);setImportOpen(true);input.value=''}};document.addEventListener('change',onChange,true);return()=>document.removeEventListener('change',onChange,true)},[]);
return <div className="product-shell"><nav className="product-nav"><button className={view==='client'?'active':''} onClick={()=>setView('client')}>API Client</button><button className={view==='flow'?'active':''} onClick={()=>setView('flow')}>API Flows <span className="pro-badge">PRO</span></button><button className={view==='automation'?'active':''} onClick={()=>setView('automation')}>Automation <span className="pro-badge">PRO</span></button><button className={view==='tools'?'active':''} onClick={()=>setView('tools')}>Developer Tools <span className="pro-badge">PRO</span></button><button className={view==='platform'?'active':''} onClick={()=>setView('platform')}>Platform Engine <span className="pro-badge">PRO</span></button><button type="button" className="product-import" onClick={()=>{setImportFile(null);setImportOpen(true)}}><Upload size={13}/> Import</button></nav><div className="product-view">{view==='client'?<App/>:view==='flow'?<FlowBuilder/>:view==='automation'?<AutomationCenter/>:view==='tools'?<DeveloperCenter/>:<PlatformProCenter/>}</div>{importOpen&&<ImportCenter file={importFile} close={()=>{setImportOpen(false);setImportFile(null)}}/>}</div>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Product/></React.StrictMode>);
