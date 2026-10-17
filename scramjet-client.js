(() => {
  let controller, connection, frame, transportUrl = '', generation=0; const checked=new Map(), frames=new Map(),initializations=new Map(),scripts=new Map(); let activeTab=1;
  const signal=(phase,detail={})=>window.dispatchEvent(new CustomEvent('orbit-proxy',{detail:{phase,...detail}}));
  function validate(raw) {
    let u;
    try { u = new URL(raw.trim()); } catch { throw Error('Enter a complete wss:// server address.'); }
    if (u.protocol !== 'wss:' || u.username || u.password || u.hash) throw Error('Use a secure wss:// address without a username, password, or fragment.');
    return u.href;
  }
  function deadline(promise, message, ms=15000) {
    let timer;
    return Promise.race([promise,new Promise((_, reject) => {timer=setTimeout(()=>reject(Error(message)),ms)})]).finally(()=>clearTimeout(timer));
  }
  function script(src) {
    if(!scripts.has(src))scripts.set(src,new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=src;element.onload=resolve;element.onerror=()=>{element.remove();scripts.delete(src);reject(Error('Could not load proxy assets. Check your connection and reload.'))};document.head.append(element)}));
    return scripts.get(src);
  }
  async function setup(engine) {
    if(!isSecureContext||!navigator.serviceWorker)throw Error('This proxy requires HTTPS and service workers.');
    if(!window.SharedWorker)throw Error('This browser lacks SharedWorker support required by both proxy engines.');
    await script('/gh/Megatron963/Orbit@main/vendor/baremux/index.js');
    if(!connection)connection=new BareMux.BareMuxConnection('/gh/Megatron963/Orbit@main/vendor/baremux/worker.js?v=17');
    let worker,scope;
    if(engine==='ultraviolet'){
      await script('/gh/Megatron963/Orbit@main/vendor/uv/uv.bundle.js');await script('/gh/Megatron963/Orbit@main/uv/uv.config.js');
      worker='/gh/Megatron963/Orbit@main/orbit-sw.js';scope="/gh/Megatron963/Orbit@main/";
    }else{
      await script('/gh/Megatron963/Orbit@main/vendor/scramjet/scramjet.all.js');
      const {ScramjetController}=$scramjetLoadController();
      controller=new ScramjetController({prefix:'/gh/Megatron963/Orbit@main/sj/service/',files:{wasm:'/gh/Megatron963/Orbit@main/vendor/scramjet/scramjet.wasm.wasm',all:'/gh/Megatron963/Orbit@main/vendor/scramjet/scramjet.all.js',sync:'/gh/Megatron963/Orbit@main/vendor/scramjet/scramjet.sync.js'}});
      await controller.init();worker='/gh/Megatron963/Orbit@main/orbit-sw.js';scope="/gh/Megatron963/Orbit@main/";
    }
    const registration=await navigator.serviceWorker.register(worker,{scope,updateViaCache:'none'});
    if(registration.active?.state!=='activated'){const sw=registration.installing||registration.waiting||registration.active;if(!sw)throw Error('Service worker did not install.');await new Promise((resolve,reject)=>{const check=()=>{if(sw.state==='activated')resolve();if(sw.state==='redundant')reject(Error('Service worker installation failed.'))};sw.addEventListener('statechange',check);check()})}
  }
  function init(engine='scramjet'){
    if(!initializations.has(engine))initializations.set(engine,deadline(setup(engine),'Proxy setup timed out. Reload Orbit and try again.',45000).catch(e=>{initializations.delete(engine);throw e}));
    return initializations.get(engine);
  }
  function resetFrames(){generation++;for(const f of frames.values())f.frame.remove();frames.clear();frame=null;}
  function ultravioletFrame(element,tabId){
    element.addEventListener('load',()=>{try{const href=element.contentWindow.location.href,prefix=location.origin+__uv$config.prefix;if(href.startsWith(prefix)){signal('urlchange',{url:__uv$config.decodeUrl(href.slice(prefix.length)),tabId});if(activeTab===tabId)signal('ready')}}catch{}});
    return {frame:element,go:url=>{element.src=__uv$config.prefix+__uv$config.encodeUrl(url)},back:()=>element.contentWindow.history.back(),forward:()=>element.contentWindow.history.forward(),reload:()=>element.contentWindow.location.reload()};
  }
  async function navigate(url,wisp,transport='libcurl',engine='scramjet'){
    const ticket=++generation,tabId=activeTab;wisp=validate(wisp);signal('connecting');
    if(!checked.has(wisp)||Date.now()-checked.get(wisp)>30000){
      try{await test(wisp)}catch(error){
        const publicRelays=['wss://wisp.mercurywork.shop/','wss://anura.pro/wisp/'];
        if(!publicRelays.includes(wisp))throw error;
        const alternate=publicRelays.find(url=>url!==wisp);
        try{await test(alternate);wisp=alternate;signal('relayFallback',{wisp})}
        catch{throw Error('Neither public relay could establish a WebSocket connection from this browser. The relay may be unavailable, reject this mirror origin, or be blocked by this network. Copy the error report in Customize.');}
      }
      checked.set(wisp,Date.now());
    }
    if(ticket!==generation)return;
    signal('initializing');await init(engine);if(ticket!==generation)return;
    const key=transport+'|'+wisp;
    if(transportUrl!==key){
      try { await checkBrowsing(wisp,transport,engine); }
      catch(first) {
        const alternate=transport==='epoxy'?'libcurl':'epoxy';
        signal('initializing');
        try { await checkBrowsing(wisp,alternate,engine);signal('transportFallback',{transport:alternate}); }
        catch(second){transportUrl='';throw Error('Both connection transports failed. '+String(second.message||second)+' Open Customize → Copy error report.');}
      }
    }
    if(ticket!==generation)return;
    if(!frame){const element=document.createElement('iframe');element.id='sjview-'+tabId;element.title=engine==='ultraviolet'?'Ultraviolet browser':'Scramjet browser';element.allow='fullscreen; gamepad';document.getElementById('viewer').append(element);frame=engine==='ultraviolet'?ultravioletFrame(element,tabId):controller.createFrame(element);frames.set(tabId,frame);if(engine!=='ultraviolet'){frame.addEventListener('urlchange',e=>signal('urlchange',{url:String(e.url),tabId}));frame.addEventListener('contextInit',()=>{if(activeTab===tabId)signal('ready')});}}
    document.getElementById('view').style.display='none';frame.frame.style.display='block';signal('loading');frame.go(url);
  }
  function hide(){generation++;if(frame){frame.frame.src='about:blank';frame.frame.style.display='none'}document.getElementById('view').style.display='block';signal('idle')}
  function selectTab(id){generation++;if(frame)frame.frame.style.display='none';activeTab=id;frame=frames.get(id);if(frame){frame.frame.style.display='block';document.getElementById('view').style.display='none'}return !!frame}
  function closeTab(id){const f=frames.get(id);if(f)f.frame.remove();frames.delete(id);if(activeTab===id){generation++;frame=null}}
  function back(){if(frame)frame.back()}
  function forward(){if(frame)frame.forward()}
  function reload(){if(frame){signal('loading');frame.reload()}}
  function test(raw){const url=validate(raw),started=Date.now();return new Promise((resolve,reject)=>{let ws;let done=false;const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);if(ws){ws.onopen=ws.onerror=ws.onmessage=ws.onclose=null;ws.close()}error?reject(Error(error)):resolve({latency:Date.now()-started})};const timer=setTimeout(()=>finish('No Wisp handshake received within 10 seconds.'),10000);try{ws=new WebSocket(url);ws.binaryType='arraybuffer';ws.onmessage=e=>{const b=e.data instanceof ArrayBuffer?new Uint8Array(e.data):null;if(b&&b.length>=9&&b[0]===3&&b.slice(1,5).every(x=>x===0))finish()};ws.onerror=()=>finish('WebSocket connection failed from '+location.host+'. The relay may be unavailable, reject this mirror origin, or be blocked by this network.');ws.onclose=()=>finish('Server closed before sending the Wisp handshake.')}catch{finish('Unable to connect to that WebSocket address.')}})}

  function diagnostics(){return {secure:isSecureContext,serviceWorker:!!navigator.serviceWorker,sharedWorker:typeof SharedWorker!=='undefined',wasm:typeof WebAssembly!=='undefined',isolated:!!window.crossOriginIsolated}}
  async function checkBrowsing(raw,transport='libcurl',engine='scramjet'){
    const wisp=validate(raw);await test(wisp);await init(engine);
    const path=transport==='epoxy'?'/gh/Megatron963/Orbit@main/vendor/epoxy/index.mjs':'/gh/Megatron963/Orbit@main/vendor/libcurl/index.mjs';
    await deadline(connection.setTransport(path,[transport==='epoxy'?{wisp}:{websocket:wisp}]),'Transport initialization failed or timed out. Try the other transport.',25000);
    transportUrl='';
    const client=new BareMux.BareClient('/gh/Megatron963/Orbit@main/vendor/baremux/worker.js?v=17');
    const response=await deadline(client.fetch('https://example.com/'),'The relay connected but could not fetch a test page.',20000);
    if(!response.ok)throw Error('Relay test page returned HTTP '+response.status+'. Try another relay.');
    await response.text();transportUrl=transport+'|'+wisp;return {status:response.status};
  }
  window.OrbitScramjet={resetFrames,diagnostics,checkBrowsing,validate,navigate,hide,test,back,forward,reload,selectTab,closeTab};
})();
