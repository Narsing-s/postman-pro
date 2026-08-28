// Sandboxed-lite script helper. It intentionally supports a small safe subset instead of arbitrary server-side JavaScript.
export function runAssertions(script, response) {
  const results=[];
  if (!script) return results;
  if (/pm\.response\.code/.test(script)) results.push({name:'response code',passed:response.status>=200&&response.status<300});
  if (/pm\.response\.text\(\)/.test(script)) results.push({name:'response text available',passed:typeof response.body==='string'});
  if (/pm\.response\.json\(\)/.test(script)) { try { JSON.parse(response.body); results.push({name:'response JSON',passed:true}); } catch { results.push({name:'response JSON',passed:false}); } }
  return results;
}

export function runFlowScript(script, vars={}) {
  const out={...vars};
  if(!script) return out;
  const set=/pm\.variables\.set\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]*)['\"]\s*\)/g;
  let m;
  while((m=set.exec(script))) out[m[1]]=m[2];
  const env=/pm\.environment\.set\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]*)['\"]\s*\)/g;
  while((m=env.exec(script))) out[m[1]]=m[2];
  return out;
}
