const COLORS = [
  { name: '樱桃红', hex: '#D7263D', card: '#E02440', tint: '#EDE9FE', subtitle: '更容易出片的万能色', count: 9 },
  { name: '雾霾蓝', hex: '#6B8AF7', card: '#6D86EE', tint: '#E5ECFF', subtitle: '清冷感氛围拉满', count: 6 },
  { name: '奶油白', hex: '#F3E9D1', card: '#F4E7C7', tint: '#FFF8EA', subtitle: '适合做柔和干净的拼贴', count: 8 }
];

const MAX = 9;
const DAY_LIMIT = 3;
const PASS_H = 24;
const PASS_L = 0.28;
const today = new Date().toISOString().slice(0, 10);
const key = `cw:ui-v3:${today}`;

const $ = (id) => document.getElementById(id);

let state = load() || init();
let route = 'challenge'; // home|challenge|my
let challengeState = 'preselect'; // preselect|selected
let showResult = false;

function init() {
  const ch = createChallenge(0);
  return { currentId: ch.id, challenges: [ch], colorIndex: 0, collage: null };
}
function createChallenge(colorIndex) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), colorIndex, items: [] };
}
function load() { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function save() { try { localStorage.setItem(key, JSON.stringify(state)); return true; } catch { return false; } }
function cur() { return state.challenges.find(c => c.id === state.currentId); }
function activeColor() { return COLORS[cur().colorIndex] || COLORS[0]; }

function iconHome(active){return `<span class="icon">⌂</span>`}
function iconPalette(){return `<span class="icon">◍</span>`}
function iconUser(){return `<span class="icon">◡</span>`}

function renderTop(title, left='☰', right='●') {
  return `<div class="topbar"><button class="icon-btn">${left}</button><div class="top-title">${title}</div><button class="icon-btn">${right}</button></div>`;
}

function renderTabs() {
  return `<div class="tabbar">
    <button class="tab ${route==='home'?'active':''}" data-tab="home">${iconHome(route==='home')}</button>
    <button class="tab center ${route==='challenge'?'active':''}" data-tab="challenge">${iconPalette(route==='challenge')}</button>
    <button class="tab ${route==='my'?'active':''}" data-tab="my">${iconUser(route==='my')}</button>
  </div>`;
}

function viewHome() {
  const color = activeColor();
  const chips = COLORS.map((c, i) => `<button class="chip ${state.colorIndex===i?'active':''}" data-theme="${i}">${c.name}</button>`).join('') + `<button class="chip">更多</button>`;
  const list = COLORS.slice(0,2).map((c,i)=>`<div class="trend-item"><div class="trend-left"><span class="sq" style="background:${c.card}"></span><div><div class="t1">${c.name} · ${c.count} 张</div><div class="t2">${c.subtitle}</div></div></div><button class="start-btn" data-start="${i}">开始</button></div>`).join('');
  return `${renderTop('挑战')}
  <div class="content">
    <div class="chips">${chips}</div>
    <section class="hero-card" style="background:${color.tint}">
      <div class="hero-title">${color.name}挑战</div>
      <div class="hero-sub">本周推荐 · 选色板更容易出片</div>
      <div class="hero-tag">03/12-03/31</div>
      <div class="hero-block"></div>
    </section>
    <div class="sec-head"><b>流行挑战</b><span>查看全部</span></div>
    ${list}
  </div>${renderTabs()}`;
}

function viewChallenge() {
  const ch = cur();
  const color = COLORS[ch.colorIndex];
  if (challengeState === 'preselect') {
    return `<div class="content page-gap">
      <div class="headline"><div><div class="h22">挑战</div><div class="sub13">随机选一个颜色，拍同色物体完成 1-9 张色板</div></div><button class="icon-btn">i</button></div>
      <section class="swatch-card" style="background:${color.card}">
        <div class="sw-name">${color.name}</div><div class="sw-hex">${color.hex}</div>
        <div class="sw-actions"><button class="ghost-white" id="shuffle">换个颜色</button><button class="dark" id="select">选定此色</button></div>
      </section>
      <section class="empty-card">
        <div class="e1">先选定一个挑战色</div><div class="e2">选定后才会开启画板与拍照入口</div>
        <div class="hint">点「换个颜色」直到喜欢为止</div>
      </section>
    </div>${renderTabs()}`;
  }

  const cells = Array.from({length:9}, (_,i)=>{
    const item = ch.items[i];
    return `<button class="board-cell" data-pick="1">${item?`<img src="${item.data}"/>`:''}${!item&&i===ch.items.length?'<span class="plus">＋</span>':''}</button>`;
  }).join('');

  return `${renderTop('挑战进度','←','⋯')}
    <div class="content slim-top">
      <section class="progress-chip"><span class="sq40" style="background:${color.card}"></span><div class="grow"><div class="p1">${color.name}</div><div class="p2">已收集 ${ch.items.length}/9 · 继续拍同色物体</div></div><button class="continue" data-open-sheet="1">继续拍</button></section>
      <section class="board-wrap"><div class="board-tip">点击格子可替换照片，或长按删除</div><div class="board">${cells}</div></section>
      <button class="gen-btn" id="generate">生成拼接图片</button>
      <section class="mini-note"><span>不够 9 张也可以生成</span><span>推荐 6-9 张效果更好</span></section>
    </div>
    ${showResult ? viewResult() : ''}
    ${renderTabs()}`;
}

function viewResult(){
  const ch = cur(); const color = COLORS[ch.colorIndex];
  return `<div class="overlay"><div class="result-card"><div class="preview"><div class="preview-tip">长按预览图保存到相册</div>${state.collage?`<img src="${state.collage}"/>`:''}</div><div class="meta"><span>由 ${ch.items.length} 张照片拼接</span><span>自动适配横竖图</span></div><div class="row2"><button id="share" class="dark2">系统分享</button><button id="download" class="light2">下载图片</button></div><button id="closeResult" class="link-btn">关闭</button></div></div>`;
}

function viewMy(){
  return `${renderTop('我的')}<div class="content"><section class="profile"><div class="avatar"></div><div><div class="name">Owin</div><div class="muted12">本周已完成 2 个挑战</div></div><button class="edit">编辑</button></section><section class="stats"><div><b>12</b><span>照片</span></div><div><b>3</b><span>拼图</span></div><div><b>2</b><span>挑战</span></div></section></div>${renderTabs()}`;
}

function render(){
  if(route==='home') $('app').innerHTML = viewHome();
  if(route==='challenge') $('app').innerHTML = viewChallenge();
  if(route==='my') $('app').innerHTML = viewMy();
  bind();
}

function bind(){
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{route=b.dataset.tab;render();});
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{state.colorIndex=Number(b.dataset.theme);cur().colorIndex=state.colorIndex;save();render();});
  document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{state.colorIndex=Number(b.dataset.start);cur().colorIndex=state.colorIndex;route='challenge';challengeState='preselect';save();render();});

  const shuffle=$('shuffle'); if(shuffle) shuffle.onclick=()=>{const n=(cur().colorIndex+1)%COLORS.length; cur().colorIndex=n; state.colorIndex=n; save(); render();};
  const select=$('select'); if(select) select.onclick=()=>{challengeState='selected'; ensureDailyChallenge(); save(); render();};

  document.querySelectorAll('[data-open-sheet],[data-pick]').forEach(b=>b.onclick=()=>{$('photoSheet').classList.remove('hidden');});
  const gen=$('generate'); if(gen) gen.onclick=async()=>{state.collage=await makeCollage(cur()); save(); showResult=true; render();};
  const closeR=$('closeResult'); if(closeR) closeR.onclick=()=>{showResult=false; render();};

  const share=$('share'); if(share) share.onclick=shareImage;
  const dl=$('download'); if(dl) dl.onclick=downloadImage;

  $('pickCamera').onclick=()=>$('cameraInput').click();
  $('pickAlbum').onclick=()=>$('albumInput').click();
  $('closeSheet').onclick=()=>$('photoSheet').classList.add('hidden');
}

function ensureDailyChallenge(){
  const current = cur();
  const next = createChallenge(current.colorIndex);
  if(state.challenges.length < DAY_LIMIT){state.challenges.push(next); state.currentId=next.id; return;}
  const oldest=[...state.challenges].sort((a,b)=>a.createdAt-b.createdAt)[0];
  if(!confirm(`今日挑战已满3个，将覆盖最早挑战（${COLORS[oldest.colorIndex].name} ${oldest.items.length}/9），继续？`)) return;
  state.challenges=state.challenges.filter(c=>c.id!==oldest.id);
  state.challenges.push(next); state.currentId=next.id;
}

$('cameraInput').onchange = handlePick;
$('albumInput').onchange = handlePick;

async function handlePick(e){
  const file=e.target.files?.[0]; if(!file) return;
  const ch=cur();
  try{
    let data=await fileToData(file); data=await normalize(data);
    const avg=await sample(data); if(!match(avg, hex2rgb(COLORS[ch.colorIndex].hex))){ alert('颜色不够接近，请再试一张'); return; }
    if(ch.items.length<MAX){ ch.items.push({data,at:Date.now()}); if(!save()) {ch.items.pop(); alert('保存失败');} }
  }catch{ alert('图片解析失败，请换一张或截图后再试'); }
  finally{ $('photoSheet').classList.add('hidden'); e.target.value=''; render(); }
}

function fileToData(file){ return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(file);}); }
function loadImg(src){ return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;}); }
async function normalize(data){ const img=await loadImg(data); const c=$('work'),ctx=c.getContext('2d'); const max=960; const s=Math.min(1,max/Math.max(img.width,img.height)); c.width=Math.max(1,Math.round(img.width*s)); c.height=Math.max(1,Math.round(img.height*s)); ctx.drawImage(img,0,0,c.width,c.height); return c.toDataURL('image/jpeg',0.75); }
async function sample(data){ const img=await loadImg(data); const c=$('work'),ctx=c.getContext('2d',{willReadFrequently:true}); c.width=180;c.height=180;ctx.drawImage(img,0,0,180,180); const d=ctx.getImageData(40,40,100,100).data; let r=0,g=0,b=0,n=0; for(let i=0;i<d.length;i+=4){ if(d[i+3]<10) continue; r+=d[i];g+=d[i+1];b+=d[i+2];n++; } return {r:Math.round(r/n),g:Math.round(g/n),b:Math.round(b/n)}; }
function hex2rgb(hex){const n=parseInt(hex.slice(1),16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
function rgb2hsl({r,g,b}){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;}return{h,s,l};}
function match(a,b){const A=rgb2hsl(a),B=rgb2hsl(b);const dh=Math.min(Math.abs(A.h-B.h),360-Math.abs(A.h-B.h));return dh<=PASS_H&&Math.abs(A.l-B.l)<=PASS_L;}

async function makeCollage(ch){ const c=document.createElement('canvas'),ctx=c.getContext('2d'); c.width=1080;c.height=1440; ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,1080,1440); const color=COLORS[ch.colorIndex]; ctx.fillStyle=color.card;ctx.fillRect(0,0,1080,170); const cell=300,g=18,sx=72,sy=230; for(let i=0;i<9;i++){const x=sx+(i%3)*(cell+g),y=sy+Math.floor(i/3)*(cell+g); ctx.fillStyle='#e5e7eb';ctx.fillRect(x,y,cell,cell); if(ch.items[i]?.data){const im=await loadImg(ch.items[i].data); ctx.drawImage(im,x,y,cell,cell);} } return c.toDataURL('image/png'); }
async function shareImage(){ if(!state.collage) return; const file=dataURLtoFile(state.collage,'color-walk.png'); if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({title:'Color Walk',files:[file]}); } else alert('当前浏览器不支持系统分享'); }
function downloadImage(){ if(!state.collage) return; const a=document.createElement('a');a.href=state.collage;a.download='color-walk.png';a.click(); }
function dataURLtoFile(dataUrl,fileName){const [meta,b64]=dataUrl.split(',');const mime=(meta.match(/data:(.*?);base64/)||[])[1]||'image/png';const bin=atob(b64);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return new File([arr],fileName,{type:mime});}

render();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').then(r=>r.update()).catch(()=>{}); }
