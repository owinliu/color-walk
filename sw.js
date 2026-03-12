const CACHE='color-walk-v10';
const CORE=['./','./index.html','./manifest.json'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  // HTML 走网络优先，避免发布后仍拿到旧页面逻辑
  if(req.mode==='navigate' || (req.headers.get('accept')||'').includes('text/html')){
    event.respondWith(fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put('./index.html',copy));
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  // 其他静态资源缓存优先 + 回源更新
  event.respondWith(caches.match(req).then(hit=>{
    const network=fetch(req).then(res=>{
      if(url.origin===self.location.origin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }).catch(()=>hit);
    return hit||network;
  }));
});