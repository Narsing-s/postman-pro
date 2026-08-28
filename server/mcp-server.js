import {createMcpExpressApp} from '@modelcontextprotocol/express';
import {toNodeHandler} from '@modelcontextprotocol/node';
import {createMcpHandler,McpServer} from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {generateCode,getCodegenLanguages,importOpenApi,normalizeCollection,runCollection} from './postman-platform.js';

const handler=createMcpHandler(()=>{
  const server=new McpServer({name:'postman-pro-mcp',version:'0.2.0'});

  server.registerTool('list_capabilities',{description:'List the API platform capabilities available in Postman Pro.'},async()=>({content:[{type:'text',text:JSON.stringify({name:'Postman Pro',features:['collections','OpenAPI import','collection normalization','collection runner','client code generation','API flows','mock server','GraphQL','WebSocket','MCP'],codegenLanguages:getCodegenLanguages()},null,2)}]}));

  server.registerTool('normalize_collection',{description:'Validate and normalize a Postman collection using the Postman Collection SDK.',inputSchema:z.object({collection:z.any()})},async({collection})=>({content:[{type:'text',text:JSON.stringify(normalizeCollection(collection),null,2)}]}));

  server.registerTool('import_openapi',{description:'Convert an OpenAPI or Swagger definition into a Postman collection.',inputSchema:z.object({spec:z.string(),options:z.record(z.string(),z.any()).optional()})},async({spec,options})=>({content:[{type:'text',text:JSON.stringify(await importOpenApi(spec,options||{}),null,2)}]}));

  server.registerTool('generate_client_code',{description:'Generate production client code from an API request. Use a language and generator variant supported by Postman Code Generators.',inputSchema:z.object({request:z.any(),language:z.string().default('javascript'),variant:z.string().default('fetch'),options:z.record(z.string(),z.any()).optional()})},async({request,language,variant,options})=>({content:[{type:'text',text:await generateCode(request,language,variant,options||{})}]}));

  server.registerTool('run_collection',{description:'Run a Postman collection with Newman and return execution events and summary.',inputSchema:z.object({collection:z.any(),environment:z.any().optional(),iterationData:z.array(z.any()).optional(),iterationCount:z.number().optional(),timeout:z.number().optional(),delayRequest:z.number().optional()})},async(args)=>({content:[{type:'text',text:JSON.stringify(await runCollection(args.collection,args),null,2)}]}));

  server.registerTool('execute_request',{description:'Execute one HTTP request through the Postman Pro proxy. This is intentionally separate from collection execution so AI agents can test a single request.',inputSchema:z.object({url:z.string().url(),method:z.string().default('GET'),headers:z.record(z.string(),z.string()).optional(),body:z.string().optional()})},async({url,method,headers,body})=>{const started=Date.now();try{const response=await fetch(url,{method,headers:headers||{},body:['GET','HEAD'].includes(method.toUpperCase())?undefined:body,redirect:'follow',signal:AbortSignal.timeout(30000)});const text=await response.text();return{content:[{type:'text',text:JSON.stringify({status:response.status,statusText:response.statusText,headers:Object.fromEntries(response.headers.entries()),body:text,time:Date.now()-started},null,2)}]}}catch(error){return{isError:true,content:[{type:'text',text:String(error?.message||error)}]}}});

  server.registerResource('instructions','postman://instructions',{description:'Postman Pro agent instructions and recommended API workflow.',mimeType:'text/plain'},async()=>({contents:[{uri:'postman://instructions',mimeType:'text/plain',text:'Postman Pro MCP instructions:\n1. Discover or normalize a collection before modifying it.\n2. Use import_openapi for OpenAPI/Swagger definitions.\n3. Use generate_client_code for client snippets.\n4. Use execute_request for a single live request.\n5. Use run_collection for repeatable collection tests.\n6. Never expose secrets in generated output or logs.\n7. Prefer explicit environment variables over hard-coded credentials.'}]}));

  return server;
});

const app=createMcpExpressApp({host:'127.0.0.1'});
const node=toNodeHandler(handler);
app.all('/mcp',(req,res)=>void node(req,res,req.body));

const port=Number(process.env.MCP_PORT||8788);
app.listen(port,'127.0.0.1',()=>console.log(`Postman Pro MCP server listening on http://127.0.0.1:${port}/mcp`));
