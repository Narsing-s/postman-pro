import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const Converter=require('openapi-to-postmanv2');
const sdk=require('postman-collection');
const codegen=require('postman-code-generators');
const newman=require('newman');

const toCollection=(input)=>new sdk.Collection(input||{}).toJSON();

export function normalizeCollection(input){
  return toCollection(input);
}

export function importOpenApi(spec,options={}){
  return new Promise((resolve,reject)=>Converter.convert({type:'string',data:String(spec||'')},options,(error,result)=>{
    if(error)return reject(error);
    if(!result?.result)return reject(new Error(result?.reason||'OpenAPI conversion failed'));
    const collection=result.output?.find(x=>x.type==='collection')?.data;
    if(!collection)return reject(new Error('Converter returned no collection'));
    resolve(toCollection(collection));
  }));
}

export function getCodegenLanguages(){
  return typeof codegen.getLanguageList==='function'?codegen.getLanguageList():[];
}

export function generateCode(request,language,variant,options={}){
  return new Promise((resolve,reject)=>{
    if(!request?.url)return reject(new Error('A request URL is required'));
    const headers=(request.headers||[]).filter(h=>h&&h.key).map(h=>({key:String(h.key),value:String(h.value??'')}));
    const body=request.bodyType==='none'?undefined:{mode:'raw',raw:request.body||''};
    const sdkRequest=new sdk.Request({url:request.url,method:request.method||'GET',header:headers,body});
    codegen.convert(String(language||'javascript'),String(variant||'fetch'),sdkRequest,options,(error,snippet)=>error?reject(error):resolve(String(snippet||'')));
  });
}

export function runCollection(collection,{environment,iterationData=[],iterationCount=1,timeout=30000,delayRequest=0}={}){
  return new Promise((resolve,reject)=>{
    const results=[];
    const started=Date.now();
    const runner=newman.run({
      collection:toCollection(collection),
      environment:environment||undefined,
      iterationData,
      iterationCount:Math.max(1,Number(iterationCount)||1),
      timeout:Number(timeout)||30000,
      delayRequest:Math.max(0,Number(delayRequest)||0),
      reporters:[]
    });
    runner.on('request',(error,execution)=>{
      results.push({type:'request',error:error?.message||null,name:execution?.item?.name||'',status:execution?.response?.code??null,time:execution?.response?.responseTime??null});
    });
    runner.on('assertion',(error,assertion)=>{
      results.push({type:'assertion',error:error?.message||null,name:assertion?.assertion||'',passed:!error});
    });
    runner.on('done',(error,summary)=>{
      if(error)return reject(error);
      resolve({duration:Date.now()-started,summary:{run:summary?.run||null},events:results});
    });
  });
}
