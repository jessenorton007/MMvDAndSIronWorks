import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

test('analytics counts, privacy, retries, and durable writes', async t => {
  const root = fileURLToPath(new URL('../../../work/analytics-tests/', import.meta.url));
  await mkdir(root, { recursive:true }); const dir=await mkdtemp(path.join(root,'run-'));
  const probe=createServer(); await new Promise(r=>probe.listen(0,'127.0.0.1',r)); const port=probe.address().port; await new Promise(r=>probe.close(r));
  const env={...process.env,NODE_ENV:'development',PORT:String(port),ADMIN_PASSWORD:'analytics-test',ADMIN_SESSION_SECRET:randomUUID(),IRONWORKS_DATA_DIR:dir,IRONWORKS_ANALYTICS_FILE:path.join(dir,'analytics.json'),IRONWORKS_APP_STORAGE:'false'};delete env.DATABASE_URL;
  let child,logs='',cookie='';
  async function start(){child=spawn(process.execPath,['dist/index.mjs'],{cwd:fileURLToPath(new URL('..',import.meta.url)),env,windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);for(let i=0;i<100;i++){try{if((await fetch(`http://127.0.0.1:${port}/api/healthz`)).ok)return;}catch{}if(child.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,100));}throw Error(logs);}
  async function stop(){if(child&&child.exitCode===null){child.kill();await new Promise(r=>child.once('exit',r));}}
  async function api(url,body,auth=false){const r=await fetch(`http://127.0.0.1:${port}/api${url}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,data:await r.json(),headers:r.headers};}
  const now=Date.now();
  const event=(visitor,session,type='pageview',data={entry:true},ts=now-60000,page='/')=>({id:randomUUID(),visitorId:visitor,sessionId:session,type,data,ts,page});
  const dashboard=()=>api('/analytics/dashboard?range=7d',undefined,true);
  try{
    await start();const login=await api('/admin/login',{password:env.ADMIN_PASSWORD});cookie=login.headers.get('set-cookie').split(';')[0];
    await t.test('private analytics require admin authentication',async()=>{
      for(const url of ['/analytics/dashboard','/analytics/visitors','/analytics/visitors/v1/events'])assert.equal((await api(url)).status,401);
      assert.equal((await api('/admin/content/private-analytics-state')).status,400);
    });
    const events=[event('v1','s1','session_start',{device:'mobile',referrer:'google.com'}),event('v1','s1'),event('v1','s2'),event('v2','s-old','pageview',{entry:true},now-10*86400000),event('v2','s3'),event('v1','s2','click',{href:'/pre-made/fire-pit',text:'View fire pit'}),event('v1','s2','form_submit',{form:'contact'}),event('v1','s2','scroll_depth',{depth:25}),event('v1','s2','scroll_depth',{depth:100})];
    await t.test('repeat sessions do not inflate visitor counts; missing metrics populated',async()=>{
      assert.equal((await api('/analytics/event',{events})).data.ingested,events.length);
      const d=(await dashboard()).data;assert.equal(d.totalVisitors,2);assert.equal(d.totalSessions,3);assert.equal(d.newVisitors,1);assert.equal(d.returningVisitors,1);assert.equal(d.totalPageviews,3);assert.equal(d.productClicks,1);assert.equal(d.totalClicks,1);assert.equal(d.leadSubmits,1);assert.equal(d.avgScrollDepth,100);assert.equal(d.report.timezone,'America/Denver');assert.ok(d.topReferrers.some(r=>r.referrer==='google.com'));
    });
    await t.test('retries are deduplicated and admin events ignored',async()=>{
      assert.equal((await api('/analytics/event',{events})).data.ingested,0);
      assert.equal((await api('/analytics/event',{events:[event('admin','adminsession','pageview',{entry:true},now,'/admin'),{...event('bad','bad'),data:null},event('__proto__','bad')]})).data.ingested,0);
      assert.equal((await dashboard()).data.totalPageviews,3);
    });
    await t.test('concurrent batches persist before acknowledgment and survive immediate restart',async()=>{
      await Promise.all(Array.from({length:8},(_,i)=>api('/analytics/event',{events:[event('parallel','parallel-'+i)]})));
      const disk=JSON.parse(await readFile(env.IRONWORKS_ANALYTICS_FILE,'utf8'));assert.equal(disk.events.length,17);
      await stop();await start(); const d=(await dashboard()).data;assert.equal(d.totalPageviews,11);assert.equal(d.totalVisitors,3);assert.equal(d.totalSessions,11);
    });
    await t.test('new session activity in an older session still counts',async()=>{
      await api('/analytics/event',{events:[event('v2','s-old')]});const d=(await dashboard()).data;assert.equal(d.totalSessions,12);assert.equal(d.totalVisitors,3);
    });
    await t.test('calendar date ranges honor Mountain DST and inclusive end dates',async()=>{
      const d=(await api('/analytics/dashboard?from=2026-11-01&to=2026-11-01',undefined,true)).data;
      assert.equal(d.report.from,'2026-11-01T06:00:00.000Z');assert.equal(d.report.to,'2026-11-02T06:59:59.999Z');
    });
    await t.test('storage corruption returns an error instead of silently resetting counts',async()=>{
      const {writeFile}=await import('node:fs/promises');await writeFile(env.IRONWORKS_ANALYTICS_FILE,'not json');assert.equal((await dashboard()).status,503);
    });
  }finally{await stop();assert.ok(dir.startsWith(root));await rm(dir,{recursive:true,force:true});}
});
