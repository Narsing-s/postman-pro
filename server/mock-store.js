const mocks=new Map();
export function createMock(id,config){mocks.set(id,{status:Number(config.status||200),headers:config.headers||{},body:config.body??''});return id}
export function getMock(id){return mocks.get(id)}
