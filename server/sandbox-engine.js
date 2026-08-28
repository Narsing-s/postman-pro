import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Sandbox=require('postman-sandbox');

export function executeSandbox(script,{variables={},globals={},environment={},collectionVariables={},iterationData={},request={},response={}}={}){
  return new Promise((resolve,reject)=>{
    Sandbox.createContext((error,context)=>{
      if(error)return reject(error);
      const done=(err,result)=>err?reject(err):resolve(result||{});
      try {
        context.execute(String(script||''),{
          pm:{
            info:{eventName:'postman-pro'},
            variables,
            globals,
            environment,
            collectionVariables,
            iterationData,
            request,
            response
          }
        },{},done);
      } catch(err){reject(err)}
    });
  });
}
