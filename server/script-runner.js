// Sandboxed-lite script helper. Only explicit, non-network assertions are supported.
export function runAssertions(script, response) {
  const results=[];
  if (!script) return results;
  if (/pm\.response\.code/.test(script)) results.push({name:'response code',passed:response.status>=200&&response.status<300});
  if (/pm\.response\.text\(\)/.test(script)) results.push({name:'response text available',passed:typeof response.body==='string'});
  if (/pm\.response\.json\(\)/.test(script)) { try { JSON.parse(response.body); results.push({name:'response JSON',passed:true}); } catch { results.push({name:'response JSON',passed:false}); } }
  return results;
}
