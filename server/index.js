import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runAssertions,runFlowScript} from './script-runner.js';
import {createMock,getMock} from './mock-store.js';
import {normalizeCollection,importOpenApi,getCodegenLanguages,generateCode,runCollection} from './postman-platform.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express();
app.use(express.json({limit:'10mb'}));

app.get('/health',(req,res)=>res.json({ok:true,name:'postman-pro',version:'0.2.0',engine:'postman-compatible'}));

app.post('/proxy',async(req,res)=>{try{const {url,method='GET',headers={},body}=req.body||{};if(!url)return res.status(400).json({error:'URL is required'});const started=Date.now();const response=await fetch(url,{method,headers,body:['GET','HEAD'].includes(method)?undefined:body,redirect:'follow',signal:AbortSignal.timeout(30000)});const text=await response.text();const outHeaders={};response.headers.forEach((v,k)=>outHeaders[k]=v);res.json({status:response.status,statusText:response.statusText,headers:outHeaders,body:text,time:Date.now()-started});}catch(e){res.status(502).json({error:e?.message||'Proxy request failed'})}});

app.post('/oauth/token',async(req,res)=>{try{const {tokenUrl,clientId,clientSecret,scope}=req.body||{};if(!tokenUrl||!clientId||!clientSecret)return res.status(400).json({error:'tokenUrl, clientId and clientSecret are required'});const form=new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret,...(scope?{scope}: {})});const r=await fetch(tokenUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form,signal:AbortSignal.timeout(30000)});res.status(r.status).json({status:r.status,body:await r.text()})}catch(e){res.status(502).json({error:e?.message||'OAuth request failed'})}});

app.post('/assert',async(req,res)=>{const {script,response}=req.body||{};res.json({results:runAssertions(script,response||{})})});
app.post('/script',async(req,res)=>{try{const {script,vars}=req.body||{};res.json(runFlowScript(script,vars||{}))}catch(e){res.status(400).json({error:e?.message||'Script failed'})}});

app.post('/mock',async(req,res)=>{const {id='default',status=200,headers={},body=''}=req.body||{};createMock(id,{status,headers,body});res.json({id,url:'/mock/'+encodeURIComponent(id)})});
app.get('/mock/:id',async(req,res)=>{const m=getMock(req.params.id);if(!m)return res.status(404).json({error:'Mock not found'});res.status(m.status).set(m.headers).send(m.body)});

// Postman-compatible platform services. These wrap official open-source Postman projects instead of reimplementing their formats.
app.get('/api/platform/codegen/languages',(req,res)=>{try{res.json({languages:getCodegenLanguages()})}catch(e){res.status(500).json({error:e?.message||'Unable to list code generators'})}});
app.post('/api/platform/collection/normalize',(req,res)=>{try{res.json({collection:normalizeCollection(req.body?.collection)})}catch(e){res.status(400).json({error:e?.message||'Invalid collection'})}});
app.post('/api/platform/openapi/import',async(req,res)=>{try{const {spec,options={}}=req.body||{};if(!spec)return res.status(400).json({error:'OpenAPI JSON/YAML is required'});res.json({collection:await importOpenApi(spec,options)})}catch(e){res.status(400).json({error:e?.message||'OpenAPI import failed'})}});
app.post('/api/platform/codegen',async(req,res)=>{try{const {request,language='javascript',variant='fetch',options={}}=req.body||{};res.json({language,variant,code:await generateCode(request,language,variant,options)})}catch(e){res.status(400).json({error:e?.message||'Code generation failed'})}});
app.post('/api/platform/runner',async(req,res)=>{try{const {collection,environment,iterationData,iterationCount,timeout,delayRequest}=req.body||{};if(!collection)return res.status(400).json({error:'Collection is required'});res.json(await runCollection(collection,{environment,iterationData,iterationCount,timeout,delayRequest}))}catch(e){res.status(400).json({error:e?.message||'Collection run failed'})}});

app.use(express.static(path.join(__dirname,'../dist')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../dist/index.html')));
const port=process.env.PORT||8787;
app.listen(port,()=>console.log('Postman Pro server listening on '+port));
