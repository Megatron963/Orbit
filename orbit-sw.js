// Orbit jsDelivr bootstrap. Scope is restricted to this repository directory.
importScripts('./orbit-shell.js','./vendor/scramjet/scramjet.all.js','./vendor/uv/uv.bundle.js','./uv/uv.config.js');
importScripts('./vendor/uv/uv.sw.js');
const {ScramjetServiceWorker}=$scramjetLoadWorker();
const scramjet=new ScramjetServiceWorker(),uv=new UVServiceWorker();
const base=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(u.origin!==base.origin||!u.pathname.startsWith(base.pathname))return;
 event.respondWith((async()=>{
  try{
   if(event.request.mode==='navigate'&&(u.pathname===base.pathname||u.pathname===base.pathname+'app'))return new Response(self.ORBIT_SHELL,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
   if(u.pathname.startsWith(base.pathname+'uv/service/'))return await uv.fetch(event);
   if(u.pathname.startsWith(base.pathname+'sj/service/')){await scramjet.loadConfig();return await scramjet.fetch(event)}
   return await fetch(event.request);
  }catch(error){
   const message='Orbit request failed: '+String(error?.message||error);
   for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(client.url.startsWith(base.href))client.postMessage({type:'orbit-proxy-error',message});
   return new Response(message,{status:502,headers:{'Content-Type':'text/plain'}});
  }
 })());
});
