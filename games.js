(() => {
  const el=id=>document.getElementById(id), origin='https://stocks.netmarket.gr';
  let games=[],limit=60,loaded=false,favourites=[];
  try { favourites=JSON.parse(localStorage.getItem('orbit-game-favourites')||'[]');if(!Array.isArray(favourites))favourites=[]; } catch{}
  function target(game){
    const raw=game.url,url=new URL(raw,origin);
    if(!['http:','https:'].includes(url.protocol))throw Error('Unsupported game link');
    return url.href;
  }
  function render(){
    const query=el('gamesearch').value.trim().toLowerCase(),filter=el('gamefilter').value;
    const visible=games.filter(g=>(g.name+' '+(g.altNames||[]).toString()).toLowerCase().includes(query)&&(filter==='all'||(filter==='favorites'?favourites.includes(g.url):(g.category||'browser')===filter)));
    el('gamecount').textContent=visible.length+' games · Truffled catalogue';el('gamegrid').replaceChildren();
    for(const g of visible.slice(0,limit)){
      let url;try{url=target(g)}catch{continue}
      const card=document.createElement('article');card.className='game-card';
      const art=document.createElement('div');art.className='game-art';art.textContent=g.name.slice(0,2).toUpperCase();
      if(g.thumbnail){const img=document.createElement('img');img.alt='';img.loading='lazy';img.src=new URL(g.thumbnail,origin).href;img.onload=()=>{art.firstChild?.nodeType===3&&art.firstChild.remove()};img.onerror=()=>img.remove();art.append(img)}
      const info=document.createElement('div');info.className='game-info';const title=document.createElement('h3');title.textContent=g.name;
      const actions=document.createElement('div');actions.className='game-actions';
      const play=document.createElement('a');play.className='game-play';play.textContent='Play';play.setAttribute('aria-label','Play '+g.name);play.href=url;play.target='_blank';play.rel='noopener noreferrer';
      const fav=document.createElement('button');fav.textContent=favourites.includes(g.url)?'★':'☆';fav.setAttribute('aria-label','Favourite '+g.name);fav.setAttribute('aria-pressed',String(favourites.includes(g.url)));fav.onclick=()=>{favourites=favourites.includes(g.url)?favourites.filter(v=>v!==g.url):[...favourites,g.url];try{localStorage.setItem('orbit-game-favourites',JSON.stringify(favourites))}catch{}render()};
      const direct=document.createElement('button');direct.textContent='Orbit';direct.setAttribute('aria-label','Play '+g.name+' through Orbit');direct.onclick=()=>{newOrbitTab();load(url)};
      actions.append(play,fav,direct);info.append(title,actions);card.append(art,info);el('gamegrid').append(card);
    }
    el('gamesmore').hidden=visible.length<=limit;
  }
  el('gamesbtn').onclick=async()=>{
    home();el('home').hidden=true;el('notice').hidden=true;el('panel').hidden=true;el('gamelibrary').hidden=false;el('gamesearch').focus();
    if(!loaded){try{const response=await fetch('/gh/Megatron963/Orbit@main/games-catalog.json');if(!response.ok)throw Error();const data=await response.json();games=data.games.map((g,i)=>({...g,orbitId:i}));loaded=true;render()}catch{el('gamecount').textContent='Catalogue could not load. Close and reopen Games to retry.'}}else render();
  };
  el('closegames').onclick=home;
  for(const id of ['gamesearch','gamefilter'])el(id).addEventListener('input',()=>{limit=60;render()});
  el('gamesmore').onclick=()=>{limit+=60;render()};
  let show=false;try{show=localStorage.getItem('orbit-show-relay')==='true'}catch{}
  el('showrelay').checked=show;el('relaycontrols').hidden=!show;
  el('showrelay').onchange=e=>{el('relaycontrols').hidden=!e.target.checked;try{localStorage.setItem('orbit-show-relay',String(e.target.checked))}catch{}};
  el('testcurrent').onclick=async()=>{const b=el('testcurrent');b.disabled=true;el('wispstatus').textContent='Testing saved connection and loading a page…';try{const result=await OrbitScramjet.checkBrowsing(prefs.wisp,prefs.transport||'libcurl',prefs.proxy);el('wispstatus').textContent='Connection works: test page returned HTTP '+result.status+'. Individual websites may still reject it.'}catch(e){el('wispstatus').textContent=e.message+' Try Repair proxy setup or the alternative transport.'}finally{b.disabled=false}};
  el('copydiagnostics').onclick=async()=>{const report=JSON.stringify({version:17,origin:location.origin,browser:navigator.userAgent,engine:prefs.proxy,transport:prefs.transport,features:OrbitScramjet.diagnostics(),error:el('wispstatus').textContent},null,2);try{await navigator.clipboard.writeText(report);toast('Error report copied. Paste it into this chat.')}catch{el('wispstatus').textContent=report}};
  navigator.serviceWorker?.addEventListener('message',event=>{if(event.data?.type==='orbit-proxy-error'){el('wispstatus').textContent=String(event.data.message);el('panel').hidden=false;toast('Page failed. The error report is in Customize.')}});
  el('repairproxy').onclick=async()=>{const b=el('repairproxy');b.disabled=true;try{if(!navigator.serviceWorker)throw Error('Service workers are unavailable in this browser.');const registrations=await navigator.serviceWorker.getRegistrations();for(const r of registrations){const u=new URL(r.scope);if(u.origin===location.origin&&['/gh/Megatron963/Orbit@main/sj/','/gh/Megatron963/Orbit@main/uv/'].includes(u.pathname))await r.unregister()}location.reload()}catch(e){el('wispstatus').textContent=e.message;b.disabled=false}};
})();
