const MAX = 9;
const DAY_LIMIT = 3;
const PASS_H = 24;
const PASS_L = 0.28;
const today = new Date().toISOString().slice(0, 10);
const key = `cw:ui-v4:${today}`;

const PRESET_THEMES = [
  { name: '樱桃红', hex: '#D7263D', subtitle: '更容易出片的万能色' },
  { name: '雾霾蓝', hex: '#6B8AF7', subtitle: '清冷感氛围拉满' },
  { name: '奶油白', hex: '#F3E9D1', subtitle: '适合做柔和干净的拼贴' }
];

const $ = (id) => document.getElementById(id);
let route = 'challenge'; // home | challenge | my
let challengeState = 'preselect';
let showResult = false;
let state = load() || init();

function init() {
  const first = createChallenge(randomTheme());
  return { currentId: first.id, challenges: [first], collage: null };
}

function randomTheme(prevHex) {
  let h = Math.floor(Math.random() * 360);
  let s = 65 + Math.floor(Math.random() * 20);
  let l = 45 + Math.floor(Math.random() * 15);

  // 避免连续两次颜色过近，提升“真随机但有明显变化”的体感
  if (prevHex) {
    const prev = rgb2hsl(hex2rgb(prevHex));
    let tries = 0;
    while (tries < 8) {
      const diff = Math.min(Math.abs(h - prev.h), 360 - Math.abs(h - prev.h));
      if (diff >= 28) break;
      h = Math.floor(Math.random() * 360);
      s = 65 + Math.floor(Math.random() * 20);
      l = 45 + Math.floor(Math.random() * 15);
      tries++;
    }
  }

  const hex = hslToHex(h, s, l);
  return { name: colorNameFromHue(h), hex, subtitle: '今日随机主题色' };
}

function colorNameFromHue(h) {
  if (h < 20 || h >= 340) return '暖红';
  if (h < 45) return '橘子色';
  if (h < 70) return '向日黄';
  if (h < 150) return '草木绿';
  if (h < 210) return '天空蓝';
  if (h < 270) return '鸢尾紫';
  return '玫瑰粉';
}

function createChallenge(theme) {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), theme, items: [] };
}

function load() { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function save() { try { localStorage.setItem(key, JSON.stringify(state)); return true; } catch { return false; } }
function cur() { return state.challenges.find(c => c.id === state.currentId); }

function render() {
  const app = $('app');
  app.innerHTML = `
    <div class="screen">
      ${route === 'home' ? viewHome() : route === 'my' ? viewMy() : viewChallenge()}
      ${showResult ? viewResultModal() : ''}
      ${viewSheet()}
      ${viewTabbar()}
    </div>
  `;
  bind();
}

function viewTop(title, left = iconCalendar(), right = '<span class="avatar-dot"></span>', rightPlain = false) {
  return `<header class="topbar">
    <button class="icon-btn">${left}</button>
    <h1>${title}</h1>
    ${rightPlain ? `<div class="plain-right">${right}</div>` : `<button class="icon-btn">${right}</button>`}
  </header>`;
}

function viewHome() {
  const ch = cur();
  const chips = PRESET_THEMES.map((t, i) => `<button class="chip" data-preset="${i}">${t.name}</button>`).join('') + `<button class="chip" id="toRandom">随机色</button>`;
  return `
    ${viewTop('挑战', iconCalendar(), '<span class="avatar-dot"></span>', true)}
    <main class="content home">
      <div class="chips">${chips}</div>
      <section class="hero" style="--hero:${ch.theme.hex}">
        <div class="hero-title">${ch.theme.name}挑战</div>
        <div class="hero-sub">本周推荐 · 选色板更容易出片</div>
      </section>
      <section class="card list">
        <div class="sec-row"><b>流行挑战</b><span>查看全部</span></div>
        ${PRESET_THEMES.map((t, i) => `<div class="trend"><div><span class="dot" style="background:${t.hex}"></span>${t.name}</div><button data-go-ch="${i}">开始</button></div>`).join('')}
      </section>
    </main>
  `;
}

function viewChallenge() {
  const ch = cur();
  if (challengeState === 'preselect') {
    return `
      ${viewTop('挑战', iconInfo(), iconSpark())}
      <main class="content challenge-pre">
        <section class="swatch" style="background:${ch.theme.hex}">
          <div class="name">${ch.theme.name}</div>
          <div class="hex">${ch.theme.hex}</div>
          <div class="actions"><button id="shuffle">换个颜色</button><button id="confirm">选定此色</button></div>
        </section>
        <section class="empty card">
          <div class="t">先选定一个挑战色</div>
          <div class="s">选定后才会开启画板与拍照入口</div>
        </section>
      </main>
    `;
  }

  return `
    ${viewTop('挑战进度', iconBack(), iconMenu())}
    <main class="content progress">
      <section class="progress-chip card">
        <span class="sq" style="background:${ch.theme.hex}"></span>
        <div class="meta"><b>${ch.theme.name}</b><span>已收集 ${ch.items.length}/9</span></div>
        <button class="small" data-open-sheet="1">继续拍</button>
      </section>
      <section class="board-wrap card">
        <div class="tip">点击格子可替换照片</div>
        <div class="board">
          ${Array.from({ length: 9 }, (_, i) => {
            const it = ch.items[i];
            return `<button class="cell" data-open-sheet="1">${it ? `<img src="${it.data}"/>` : i === ch.items.length ? '<span>＋</span>' : ''}</button>`;
          }).join('')}
        </div>
      </section>
      <button class="gen" id="gen">生成拼接图片</button>
      <div class="mini card"><b>不够9张也可以生成</b><span>推荐6-9张效果更好</span></div>
    </main>
  `;
}

function viewMy() {
  return `
    ${viewTop('我的', iconCalendar(), '<span class="avatar-dot"></span>', true)}
    <main class="content my">
      <section class="card profile"><div class="avatar"></div><div><b>Owin</b><span>本周已完成 2 个挑战</span></div></section>
      <section class="card stats"><div><b>12</b><span>照片</span></div><div><b>3</b><span>拼图</span></div><div><b>2</b><span>挑战</span></div></section>
    </main>
  `;
}

function viewTabbar() {
  return `<nav class="tabbar">
    <button class="tab ${route === 'home' ? 'active' : ''}" data-tab="home">${iconHome()}</button>
    <button class="tab center ${route === 'challenge' ? 'active' : ''}" data-tab="challenge">${iconPalette()}</button>
    <button class="tab ${route === 'my' ? 'active' : ''}" data-tab="my">${iconUser()}</button>
  </nav>`;
}

function viewSheet() {
  return `<div id="sheet" class="sheet hidden"><div class="sheet-card"><h3>选择来源</h3><button id="pickCamera">拍照</button><button id="pickAlbum">从相册选择</button><button id="closeSheet">取消</button></div></div>
  <input id="cameraInput" type="file" accept="image/*" capture="environment" hidden>
  <input id="albumInput" type="file" accept="image/*" hidden>
  <canvas id="work" hidden></canvas>`;
}

function viewResultModal() {
  return `<div class="result-mask"><div class="result card"><div class="pv">${state.collage ? `<img src="${state.collage}"/>` : ''}</div><div class="row"><button id="share">系统分享</button><button id="download">下载图片</button></div><button id="closeResult" class="ghost">关闭</button></div></div>`;
}

function bind() {
  document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => { route = el.dataset.tab; render(); });
  document.querySelectorAll('[data-preset]').forEach(el => el.onclick = () => { const p = PRESET_THEMES[+el.dataset.preset]; cur().theme = p; save(); render(); });
  document.querySelectorAll('[data-go-ch]').forEach(el => el.onclick = () => { const p = PRESET_THEMES[+el.dataset.goCh]; cur().theme = p; route = 'challenge'; challengeState = 'preselect'; save(); render(); });

  const toRandom = $('toRandom'); if (toRandom) toRandom.onclick = () => { const c = cur(); c.theme = randomTheme(c.theme?.hex); save(); render(); };
  const shuffle = $('shuffle'); if (shuffle) shuffle.onclick = () => { const c = cur(); c.theme = randomTheme(c.theme?.hex); save(); render(); };
  const confirmBtn = $('confirm'); if (confirmBtn) confirmBtn.onclick = () => { challengeState = 'selected'; ensureChallengeSlot(); save(); render(); };

  document.querySelectorAll('[data-open-sheet]').forEach(el => el.onclick = () => $('sheet').classList.remove('hidden'));
  const closeSheet = $('closeSheet'); if (closeSheet) closeSheet.onclick = () => $('sheet').classList.add('hidden');
  const pickCamera = $('pickCamera'); if (pickCamera) pickCamera.onclick = () => $('cameraInput').click();
  const pickAlbum = $('pickAlbum'); if (pickAlbum) pickAlbum.onclick = () => $('albumInput').click();
  const cameraInput = $('cameraInput'); if (cameraInput) cameraInput.onchange = handlePick;
  const albumInput = $('albumInput'); if (albumInput) albumInput.onchange = handlePick;

  const gen = $('gen'); if (gen) gen.onclick = async () => { state.collage = await makeCollage(cur()); save(); showResult = true; render(); };
  const closeResult = $('closeResult'); if (closeResult) closeResult.onclick = () => { showResult = false; render(); };
  const share = $('share'); if (share) share.onclick = shareImage;
  const download = $('download'); if (download) download.onclick = downloadImage;
}

function ensureChallengeSlot() {
  const next = createChallenge(cur().theme);
  if (state.challenges.length < DAY_LIMIT) { state.challenges.push(next); state.currentId = next.id; return; }
  const oldest = [...state.challenges].sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!confirm(`今日挑战已满3个，将覆盖最早挑战（${oldest.theme.name} ${oldest.items.length}/9），继续？`)) return;
  state.challenges = state.challenges.filter(c => c.id !== oldest.id);
  state.challenges.push(next);
  state.currentId = next.id;
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `#${[f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

async function handlePick(e) {
  const file = e.target.files?.[0]; if (!file) return;
  const ch = cur();
  try {
    let data = await fileToData(file);
    data = await normalize(data);
    const avg = await sample(data);
    if (!match(avg, hex2rgb(ch.theme.hex))) { alert('颜色不够接近，请再试一张'); return; }
    if (ch.items.length < MAX) { ch.items.push({ data, at: Date.now() }); save(); }
  } catch { alert('图片解析失败，请换一张或截图后再试'); }
  finally { $('sheet').classList.add('hidden'); e.target.value = ''; render(); }
}

function fileToData(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function normalize(data) { const img = await loadImg(data); const c = $('work'), ctx = c.getContext('2d'); const max = 960; const s = Math.min(1, max / Math.max(img.width, img.height)); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); ctx.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.75); }
async function sample(data) { const img = await loadImg(data); const c = $('work'), ctx = c.getContext('2d', { willReadFrequently: true }); c.width = 180; c.height = 180; ctx.drawImage(img, 0, 0, 180, 180); const d = ctx.getImageData(40, 40, 100, 100).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }; }
function hex2rgb(hex) { const n = parseInt(hex.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }
function rgb2hsl({ r, g, b }) { r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2; if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; } return { h, s, l }; }
function match(a, b) { const A = rgb2hsl(a), B = rgb2hsl(b); const dh = Math.min(Math.abs(A.h - B.h), 360 - Math.abs(A.h - B.h)); return dh <= PASS_H && Math.abs(A.l - B.l) <= PASS_L; }

async function makeCollage(ch) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d'); c.width = 1080; c.height = 1440;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 1080, 1440); ctx.fillStyle = ch.theme.hex; ctx.fillRect(0, 0, 1080, 170);
  const cell = 300, gap = 18, sx = 72, sy = 230;
  for (let i = 0; i < 9; i++) {
    const x = sx + (i % 3) * (cell + gap), y = sy + Math.floor(i / 3) * (cell + gap);
    ctx.fillStyle = '#e5e7eb'; ctx.fillRect(x, y, cell, cell);
    if (ch.items[i]?.data) { const im = await loadImg(ch.items[i].data); ctx.drawImage(im, x, y, cell, cell); }
  }
  return c.toDataURL('image/png');
}

async function shareImage() { if (!state.collage) return; const file = dataURLtoFile(state.collage, 'color-walk.png'); if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title: 'Color Walk', files: [file] }); else alert('当前浏览器不支持系统分享'); }
function downloadImage() { if (!state.collage) return; const a = document.createElement('a'); a.href = state.collage; a.download = 'color-walk.png'; a.click(); }
function dataURLtoFile(dataUrl, fileName) { const [meta, b64] = dataUrl.split(','); const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png'; const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new File([arr], fileName, { type: mime }); }

function iconCalendar(){return `<svg viewBox="0 0 24 24"><path d="M8 2v3M16 2v3M3.5 9.5h17M3.5 6.5h17v14h-17z"/></svg>`}
function iconInfo(){return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 10.5v5"/><circle cx="12" cy="7.8" r="1" fill="currentColor" stroke="none"/></svg>`}
function iconSpark(){return `<svg viewBox="0 0 24 24"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z"/></svg>`}
function iconBack(){return `<svg viewBox="0 0 24 24"><path d="M14.5 6.5L9 12l5.5 5.5"/></svg>`}
function iconMenu(){return `<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`}
function iconHome(){return `<svg viewBox="0 0 24 24"><path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9.5 20v-7h5v7"/></svg>`}
function iconPalette(){return `<svg viewBox="0 0 24 24"><path d="M12 3.5C7 3.5 3 7.3 3 12c0 4 3.1 7 6.8 7H11a1.8 1.8 0 0 0 1.8-1.8c0-.5-.2-.9-.5-1.2-.3-.3-.5-.8-.5-1.2A1.8 1.8 0 0 1 13.6 13H15.5c3 0 5.5-2.4 5.5-5.3 0-2.7-3.8-4.2-9-4.2z"/></svg>`}
function iconUser(){return `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M6.5 19c.9-2.2 2.9-3.5 5.5-3.5s4.6 1.3 5.5 3.5"/></svg>`}

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => {});
