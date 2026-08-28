import { useState } from 'react';
import { ArrowDown, ArrowRight, CheckCircle2, CirclePlay, GitBranch, Plus, Trash2, X } from 'lucide-react';

type Node={id:string;name:string;method:string;path:string;status?:'idle'|'running'|'success'|'error'};
const initial:Node[]=[
 {id:'login',name:'Authenticate',method:'POST',path:'/auth/login',status:'success'},
 {id:'customer',name:'Get Customer',method:'GET',path:'/customers/{{customerId}}',status:'idle'},
 {id:'account',name:'Get Balance',method:'GET',path:'/accounts/{{accountId}}/balance',status:'idle'},
 {id:'validate',name:'Validate Balance',method:'TEST',path:'balance > 0',status:'idle'}
];
export default function FlowBuilder(){
 const [nodes,setNodes]=useState(initial); const [running,setRunning]=useState(false); const [selected,setSelected]=useState('login');
 const run=async()=>{setRunning(true);for(let i=0;i<nodes.length;i++){await new Promise(r=>setTimeout(r,420));setNodes(n=>n.map((x,j)=>j===i?{...x,status:'success'}:x))}setRunning(false)};
 const add=()=>setNodes(n=>[...n,{id:crypto.randomUUID(),name:'New Step',method:'GET',path:'/api/resource',status:'idle'}]);
 return <section className="flow-builder"><div className="flow-head"><div><div className="eyebrow">POSTMAN PRO EXCLUSIVE</div><h2>API Flow Builder</h2><p>Chain requests, pass variables between steps and run the whole API journey.</p></div><div className="flow-actions"><button onClick={add}><Plus size={15}/>Step</button><button className="primary" onClick={run} disabled={running}><CirclePlay size={15}/>{running?'Running flow':'Run flow'}</button></div></div><div className="flow-canvas">{nodes.map((n,i)=><div className="flow-column" key={n.id}><button className={'flow-node '+(selected===n.id?'selected':'')} onClick={()=>setSelected(n.id)}><div className="flow-node-top"><span className={'flow-method '+n.method.toLowerCase()}>{n.method}</span>{n.status==='success'?<CheckCircle2 size={15}/>:n.status==='error'?<X size={15}/>:<GitBranch size={15}/>}</div><strong>{n.name}</strong><code>{n.path}</code><span className="flow-hint">{i===0?'Produces token':i===nodes.length-1?'Assertion':'Passes variables →'}</span></button>{i<nodes.length-1&&<div className="flow-connector"><ArrowDown size={15}/><span>then</span></div>}</div>)}</div><div className="flow-footer"><span>{nodes.length} steps</span><span>Sequential execution</span><span>Variable chaining enabled</span></div></section>
}