import {createRequire} from 'node:module';
import yaml from 'js-yaml';
import {randomUUID} from 'node:crypto';

const require=createRequire(import.meta.url);
const RamlConverter=require('raml1-to-postman');
const GraphqlConverter=require('graphql-to-postman');
const CurlConverter=require('curl-to-postmanv2');
const WsdlConverter=require('@postman/wsdl-to-postman');

const callbackConvert=(converter,data,options={})=>new Promise((resolve,reject)=>{
  converter.convert({type:'string',data:String(data||'')},options,(err,result)=>{
    if(err)return reject(err);
    if(!result?.result)return reject(new Error(result?.reason||'Conversion failed'));
    const collection=result.output?.find(x=>x.type==='collection')?.data;
    if(!collection)return reject(new Error('Converter returned no collection'));
    resolve(collection);
  });
});

export async function importRaml(spec,options={}){return callbackConvert(RamlConverter,spec,options)}
export async function importGraphql(spec,options={}){return callbackConvert(GraphqlConverter,spec,options)}
export async function importCurl(curl){
  return new Promise((resolve,reject)=>CurlConverter.convert(String(curl||''),(err,result)=>{
    if(err)return reject(err);
    const collection=result?.output?.find(x=>x.type==='collection')?.data;
    if(collection)return resolve(collection);
    if(result?.result===false)return reject(new Error(result.reason||'cURL conversion failed'));
    resolve(result?.data||result);
  }));
}
export async function importWsdl(spec,options={}){return callbackConvert(WsdlConverter,spec,options)}

export function parseSpec(text){
  const raw=String(text||'');
  try{return JSON.parse(raw)}catch{}
  try{return yaml.load(raw)}catch{return null}
}

export function exportCollection(collection){
  const c=collection||{};
  return JSON.stringify({
    info:{
      name:c.info?.name||'Postman Pro Collection',
      description:c.info?.description||'',
      schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable:c.variable||[],
    auth:c.auth,
    event:c.event||[],
    item:c.item||[]
  },null,2);
}

function harRequestToItem(entry){
  const r=entry.request||{};
  const headers=(r.headers||[]).map(h=>({key:String(h.name||''),value:String(h.value??'')})).filter(h=>h.key);
  const u=String(r.url||'');
  const body=r.postData?.text;
  return {name:r.comment||`${r.method||'GET'} ${u}`,request:{method:r.method||'GET',header:headers,url:u,...(body?{body:{mode:'raw',raw:body}}:{})},response:entry.response?[{name:'HAR response',originalRequest:{method:r.method||'GET',header:headers,url:u},status:entry.response.statusText||String(entry.response.status||''),code:entry.response.status||0,header:entry.response.headers||[],body:entry.response.content?.text||''}]:[]};
}
export function importHar(text){
  const har=typeof text==='string'?JSON.parse(text):text;
  if(!har?.log?.entries)return {info:{name:'Imported HAR'},item:[]};
  return {info:{name:har.log.creator?.name||'Imported HAR',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},item:har.log.entries.map(harRequestToItem)};
}

export function collectionToHar(collection){
  const entries=[];
  const walk=(items=[])=>items.forEach(item=>{
    if(item.item)return walk(item.item);
    const r=item.request||{};
    const url=typeof r.url==='string'?r.url:(r.url?.raw||'');
    entries.push({startedDateTime:new Date().toISOString(),time:0,request:{method:r.method||'GET',url,headers:(r.header||[]).map(h=>({name:h.key,value:h.value})),queryString:(r.url?.query||[]).map(q=>({name:q.key,value:q.value})),postData:r.body?.raw?{mimeType:'application/json',text:r.body.raw}:undefined},response:{status:0,statusText:'',headers:[],content:{size:0,mimeType:'',text:''}},cache:{},timings:{send:0,wait:0,receive:0}});
  });
  walk(collection?.item||[]);
  return {log:{version:'1.2',creator:{name:'Postman Pro',version:'0.3.0'},entries}};
}

export function validateCollection(collection){
  const errors=[];
  if(!collection||typeof collection!=='object')errors.push('Collection must be an object');
  if(!collection?.info?.name)errors.push('info.name is required');
  if(!Array.isArray(collection?.item))errors.push('item must be an array');
  const visit=(items,path='root')=>items.forEach((item,i)=>{
    const p=`${path}.${i}`;
    if(!item?.name)errors.push(`${p}.name is required`);
    if(item?.request){
      if(!item.request.method)errors.push(`${p}.request.method is required`);
      const raw=typeof item.request.url==='string'?item.request.url:item.request.url?.raw;
      if(!raw)errors.push(`${p}.request.url is required`);
    }
    if(Array.isArray(item?.item))visit(item.item,p+'.item');
  });
  if(Array.isArray(collection?.item))visit(collection.item);
  return {valid:errors.length===0,errors};
}

export function makeWorkspaceExport({collections=[],environments=[],globals=[],metadata={}}={}){
  return {format:'postman-pro-workspace',version:1,id:randomUUID(),exportedAt:new Date().toISOString(),metadata,collections,environments,globals};
}
