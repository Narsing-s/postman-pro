import {RequestModel,Collection} from './types';
const K='postman-pro.requests',C='postman-pro.collections',E='postman-pro.env',H='postman-pro.history';
export function loadRequests():RequestModel[]{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return[]}}
export function saveRequests(v:RequestModel[]){localStorage.setItem(K,JSON.stringify(v))}
export function loadCollections():Collection[]{try{return JSON.parse(localStorage.getItem(C)||'[]')}catch{return[]}}
export function saveCollections(v:Collection[]){localStorage.setItem(C,JSON.stringify(v))}
export function migrateWorkspace(){
  const requests=loadRequests();
  let collections=loadCollections();
  if(!collections.length){
    const id=uid();
    collections=[{id,name:'My API Collection',requestIds:requests.map(r=>r.id),createdAt:Date.now()}];
  }
  const first=collections[0];
  const known=new Set(collections.flatMap(c=>c.requestIds||[]));
  const orphan=requests.filter(r=>!r.collectionId||!collections.some(c=>c.id===r.collectionId));
  if(orphan.length&&first){
    const ids=new Set(first.requestIds||[]);
    orphan.forEach(r=>{r.collectionId=first.id;r.folderPath=r.folderPath||[];ids.add(r.id)});
    first.requestIds=Array.from(ids);
  }
  const repaired=requests.map(r=>({...r,folderPath:r.folderPath||[]}));
  if(!known.size||orphan.length||collections.some(c=>!Array.isArray(c.requestIds))){
    saveRequests(repaired);
    saveCollections(collections.map(c=>({...c,requestIds:Array.isArray(c.requestIds)?c.requestIds:[]})));
  }
  return {requests:repaired,collections};
}
export function loadEnv():Record<string,string>{try{return JSON.parse(localStorage.getItem(E)||'{}')}catch{return{}}}
export function saveEnv(v:Record<string,string>){localStorage.setItem(E,JSON.stringify(v))}
export function loadHistory():RequestModel[]{try{return JSON.parse(localStorage.getItem(H)||'[]')}catch{return[]}}
export function saveHistory(v:RequestModel[]){localStorage.setItem(H,JSON.stringify(v.slice(0,30)))}
export const uid=()=>crypto.randomUUID();
