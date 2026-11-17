import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const result=await build({entryPoints:[fileURLToPath(new URL('../src/analytics/tracker.ts',import.meta.url))],bundle:true,format:'iife',globalName:'Tracker',write:false,define:{'import.meta.env.VITE_GA4_MEASUREMENT_ID':'"G-QW2GMHN0GZ"'}});
function harness(storageThrows=false, propertyThrows=false){
  let now=Date.now(),fail=true;const calls=[],timers=[],intervals=[],clearedIntervals=[],docEvents={},winEvents={};
  const makeStorage=()=>{const data=new Map();return {getItem:k=>{if(storageThrows)throw Error('blocked');return data.get(k)||null;},setItem:(k,v)=>{if(storageThrows)throw Error('blocked');data.set(k,v);}};};
  const localStorage=makeStorage(),sessionStorage=makeStorage();
  const location=new URL('https://dandsironworks.com/');
  const document={referrer:'',title:'Test',hidden:false,documentElement:{scrollHeight:2000},head:{appendChild(){}},createElement:tag=>tag==='canvas'?{getContext:()=>({fillRect(){},fillText(){}}),toDataURL:()=>''}:{},addEventListener:(event,fn)=>docEvents[event]=fn};
  const window={location,setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},addEventListener:(event,fn)=>winEvents[event]=fn,innerHeight:800,scrollY:0};
  Object.defineProperty(window,'localStorage',{get(){if(propertyThrows)throw Error('storage blocked');return localStorage;}});
  Object.defineProperty(window,'sessionStorage',{get(){if(propertyThrows)throw Error('storage blocked');return sessionStorage;}});
  const history={pushState:(_state,_unused,url)=>{const next=new URL(url,location);location.href=next.href;},replaceState:(_state,_unused,url)=>{location.href=new URL(url,location).href;}};
  class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const context={window,document,history,localStorage,sessionStorage,navigator:{userAgent:'Mozilla/5.0 Chrome/140',language:'en-US',languages:['en-US'],hardwareConcurrency:4},screen:{width:1440,height:900,colorDepth:24},Date:Clock,Intl,URL,URLSearchParams,crypto:{randomUUID},setTimeout:window.setTimeout,clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval:id=>clearedIntervals.push(id),requestAnimationFrame:fn=>fn(),fetch:async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body)});return {ok:!fail};},console,FormData:class{}};
  vm.createContext(context);vm.runInContext(result.outputFiles[0].text,context);
  return {context,calls,intervals,clearedIntervals,docEvents,winEvents,window,sessionStorage,init:()=>context.Tracker.init(),settle:()=>new Promise(r=>setImmediate(r)),succeed:()=>fail=false,advance:ms=>now+=ms,navigate:path=>{history.pushState({},'',path);for(const t of timers.splice(0))if(t.delay===0)t.fn();}};
}
test('tracker retries the same event IDs and starts a new session after inactivity',async()=>{
  const h=harness();h.init();await h.settle();assert.equal(h.calls.length,1);const first=h.calls[0].body.events;assert.equal(first.filter(e=>e.type==='pageview').length,1);
  h.succeed();await h.intervals[0]();assert.deepEqual(h.calls[1].body.events.map(e=>e.id),first.map(e=>e.id));
  assert.equal(JSON.parse(h.sessionStorage.getItem('ds_pending_analytics_v2')).length,0);
  h.advance(31*60000);h.context.document.hidden=true;h.docEvents.visibilitychange();await h.settle();assert.equal(h.calls.length,2,'Leaving an expired idle tab must not invent a visit');h.context.document.hidden=false;h.navigate('/services');await h.intervals[0]();
  const next=h.calls[2].body.events;assert.ok(next.some(e=>e.type==='session_start'));assert.notEqual(next.find(e=>e.type==='session_start').sessionId,first[0].sessionId);
});
test('Google uses one automatic pageview source; admin actions stay out of tracking',async()=>{
  const h=harness();h.succeed();h.init();await h.settle();h.navigate('/contact');await h.intervals[0]();
  const entries=h.window.dataLayer.map(args=>Array.from(args));assert.equal(entries.filter(a=>a[0]==='config').length,1);assert.equal(entries.filter(a=>a[0]==='event'&&a[1]==='page_view').length,0);
  h.navigate('/admin');await h.intervals[0]();const count=h.calls.length;h.docEvents.click({});await h.intervals[0]();assert.equal(h.calls.length,count);assert.equal(h.window['ga-disable-G-QW2GMHN0GZ'],true);assert.ok(h.calls.every(c=>c.body.events.every(e=>e.page!=='/admin')));
});
test('blocked storage does not prevent collecting the initial visit',async()=>{const h=harness(true);h.init();await h.settle();assert.equal(h.calls[0].body.events.filter(e=>e.type==='pageview').length,1);});


test('blocked storage properties do not stop tracking',async()=>{
  const h=harness(false,true);h.init();await h.settle();
  assert.equal(h.calls[0].body.events.filter(e=>e.type==='pageview').length,1);
});
test('back-forward cache restores retain the reporting timer',async()=>{
  const h=harness();h.succeed();h.init();await h.settle();
  h.winEvents.beforeunload();await h.settle();
  assert.equal(h.clearedIntervals.length,0);
  h.navigate('/contact');await h.intervals[0]();
  assert.ok(h.calls.at(-1).body.events.some(e=>e.page==='/contact'&&e.data.entry));
});
