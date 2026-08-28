import {RequestModel,ResponseModel} from './types';
export type Runtime={vars:Record<string,string>;results:TestResult[]}; export type TestResult={name:string;passed:boolean};

async function readProxy(out:Response):Promise<any>{
 const text=await out.text();
 const contentType=out.headers.get('content-type')||'';
 let data:any;
 if(contentType.includes('application/json')){try{data=text?JSON.parse(text):null}catch{data=text}} else {try{data=text?JSON.parse(text):text}catch{data=text}}
 if(!out.ok){const message=typeof data==='object'&&data?data.error||data.message:`Proxy request failed (${out.status})`:String(data||`Proxy request failed (${out.status})`);throw new Error(message)}
 return data;
}
export const resolveVars=(s:string,vars:Record<string,string>)=>s.replace(/\{\{([^}]+)\}\}/g,(_,k)=>vars[k.trim()]??`{{${k}}}`);
export async function executeRequest(r:RequestModel,vars:Record<string,string>):Promise<ResponseModel>{const started=performance.now();const url=resolveVars(r.url,vars);const headers:Record<string,string>={};r.headers.filter(x=>x.enabled&&x.key).forEach(x=>headers[resolveVars(x.key,vars)]=resolveVars(x.value,vars));let body=r.bodyType==='none'?undefined:resolveVars(r.body,vars);if(r.bodyType==='json'&&!Object.keys(headers).some(k=>k.toLowerCase()==='content-type'))headers['Content-Type']='application/json';const out=await fetch('/proxy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,method:r.method,headers,body})});const d=await readProxy(out);const responseHeaders:Record<string,string>={};out.headers.forEach((v,k)=>responseHeaders[k]=v);const proxyHeaders=d?.headers||responseHeaders;const responseBody=typeof d?.body==='string'?d.body:d?.body===undefined?(typeof d==='string'?d:JSON.stringify(d??'')):JSON.stringify(d.body);return {status:Number(d?.status??out.status),statusText:String(d?.statusText??out.statusText||''),headers:proxyHeaders,body:responseBody,time:Math.round(performance.now()-started)};}
export function captureJson(response:ResponseModel,path:string,vars:Record<string,string>){try{const obj=JSON.parse(response.body);const value=path.split('.').filter(Boolean).reduce((a,k)=>a?.[k],obj);return value===undefined?vars:{...vars,[path.split('.').pop()!]:String(typeof value==='object'?JSON.stringify(value):value)}}catch{return vars}}
export function runBasicTests(response:ResponseModel):TestResult[]{return [{name:'Status is 2xx',passed:response.status>=200&&response.status<300},{name:'Response received',passed:!!response.body}]}
