// NOTE: bump CACHE when releasing to force a clean asset set.
const CACHE = "color-walk-v11";
const CORE = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json"];

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

  const accept = (req.headers.get("accept") || "");
  const isHTML = req.mode === "navigate" || accept.includes("text/html");
  const isSameOrigin = url.origin === self.location.origin;
  const isAppAsset =
    isSameOrigin &&
    (url.pathname.endsWith("/app.js") ||
      url.pathname.endsWith("/styles.css") ||
      url.pathname.endsWith("/manifest.json"));

  // HTML / 核心脚本 / 样式：网络优先，避免发布后混用旧逻辑
  if (isHTML || isAppAsset) {
    event.respondWith(
      fetch(req, { cache: "no-store" })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => {
            // 统一以请求本身作为 key（含路径），避免路径变化导致取错资源
            c.put(req, copy);
          });
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  // 其他静态资源缓存优先 + 回源更新
  event.respondWith(caches.match(req).then(hit=>{
    const network=fetch(req).then(res=>{
      if(isSameOrigin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return res;
    }).catch(()=>hit);
    return hit||network;
  }));
});
