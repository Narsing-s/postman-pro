import {RequestModel,Collection} from './types';
const K='postman-pro.requests',C='postman-pro.collections',E='postman-pro.env',H='postman-pro.history';
export function loadRequests():RequestModel[]{try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return[]}}
export function saveRequests(v:RequestModel[]){localStorage.setItem(K,JSON.stringify(v))}
export function loadCollections():Collection[]{try{return JSON.parse(localStorage.getItem(C)||'[]')}catch{return[]}}
export function saveCollections(v:Collection[]){localStorage.setItem(C,JSON.stringify(v))}
export function loadEnv():Record<string,string>{try{return JSON.parse(localStorage.getItem(E)||'{}')}catch{return{}}}
export function saveEnv(v:Record<string,string>){localStorage.setItem(E,JSON.stringify(v))}
export function loadHistory():RequestModel[]{try{return JSON.parse(localStorage.getItem(H)||'[]')}catch{return[]}}
export function saveHistory(v:RequestModel[]){localStorage.setItem(H,JSON.stringify(v.slice(0,30)))}
export const uid=()=>crypto.randomUUID();
