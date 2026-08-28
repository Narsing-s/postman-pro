import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Runtime=require('postman-runtime');
const sdk=require('postman-collection');

export function runRuntime(collection,options={}){
  return new Promise((resolve,reject)=>{
    const runner=new Runtime.Runner();
    const events=[];
    const normalized=new sdk.Collection(collection||{}).toJSON();
    const opts={
      iterationCount:Math.max(1,Number(options.iterationCount)||1),
      data:Array.isArray(options.iterationData)?options.iterationData:[],
      timeout:{request:Number(options.requestTimeout)||30000,script:Number(options.scriptTimeout)||5000},
      delay:{item:Number(options.delayRequest)||0},
      environment:options.environment||undefined,
      globals:options.globals||undefined,
      bail:{failure:false}
    };
    runner.run(normalized,opts,(error,summary)=>{
      if(error)return reject(error);
      resolve({summary,events});
    }).on('request',(error,args)=>events.push({type:'request',error:error?.message||null,name:args?.item?.name||'',status:args?.response?.code??null,time:args?.response?.responseTime??null}))
      .on('assertion',(error,args)=>events.push({type:'assertion',error:error?.message||null,name:args?.assertion||'',passed:!error}))
      .on('console',(data)=>events.push({type:'console',data}));
  });
}

export function executeSingleRequest(request,options={}){
  const collection={info:{name:'Postman Pro Single Request'},item:[{name:request?.name||'Request',request:{method:request?.method||'GET',url:request?.url||'',header:(request?.headers||[]).map(h=>({key:h.key,value:h.value})),body:request?.bodyType&&request.bodyType!=='none'?{mode:'raw',raw:request.body||''}:undefined}}]};
  return runRuntime(collection,{...options,iterationCount:1});
}
