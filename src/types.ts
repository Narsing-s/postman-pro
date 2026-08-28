export type KV={key:string;value:string;enabled:boolean};
export type RequestModel={id:string;name:string;method:string;url:string;params:KV[];headers:KV[];body:string;bodyType:'none'|'json'|'text';authType:'none'|'bearer'|'basic'|'apikey'|'oauth2';authValue:string;createdAt:number};
export type ResponseModel={status:number;statusText:string;headers:Record<string,string>;body:string;time:number};
