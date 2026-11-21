import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
test('unavailable production content returns retryable 503, never stale product/service HTML', async () => {
  const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  const env={...process.env,NODE_ENV:'production',PORT:String(port),ADMIN_PASSWORD:'isolated-seo-test',ADMIN_SESSION_SECRET:'isolated-seo-test-session-secret'};delete env.DATABASE_URL;
  const child=spawn(process.execPath,['dist/index.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env,windowsHide:true,stdio:'ignore'});
  try {
    let ready=false;for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/healthz`)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
    assert.ok(ready,'isolated server starts');
    for(const route of ['/','/services','/services/forged-railings','/pre-made','/shop','/pre-made/iron-rocket-stove','/shop/dinner-bell','/sitemap.xml']){
      const response=await fetch(`http://127.0.0.1:${port}${route}`);assert.equal(response.status,503,route);assert.equal(response.headers.get('retry-after'),'300',route);
      assert.ok(!(await response.text()).includes('application/ld+json'),'must not advertise stale schema');
    }
  } finally {child.kill();await new Promise(r=>child.once('exit',r));}
});
