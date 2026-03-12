const TOKENS = {
  colors: [
    { name: '樱桃红', hex: '#D7263D' },
    { name: '柑橘橙', hex: '#F57C00' },
    { name: '向日葵黄', hex: '#F4C430' },
    { name: '抹茶绿', hex: '#63A375' },
    { name: '湖水青', hex: '#2A9D8F' }
  ]
};

const MAX_PHOTOS = 9;
const DAY_LIMIT = 3;
const PASS_HUE = 24;
const PASS_LIGHT = 0.28;

const today = new Date().toISOString().slice(0, 10);
const storeKey = `cw:spec-v2:${today}`;
const $ = (id) => document.getElementById(id);

let route = 'Home';
let challengeState = 'preselect'; // preselect | selected
let state = loadState() || initState();
let generatingTimer = null;

function initState() {
  const first = createChallenge();
  return {
    date: today,
    currentId: first.id,
    challenges: [first],
    selectedThemeHex: first.target.hex,
    collageDataUrl: null,
    generating: false
  };
}

function createChallenge(hex) {
  const target = TOKENS.colors.find(c => c.hex === hex) || TOKENS.colors[Math.floor(Math.random() * TOKENS.colors.length)];
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now(), target, items: [] };
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(storeKey));
    if (!raw || !Array.isArray(raw.challenges) || !raw.challenges.length) return null;
    return raw;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function currentChallenge() {
  return state.challenges.find(c => c.id === state.currentId);
}

function tabBar(active) {
  return `<nav class="tabbar">
    <button class="tab ${active === 'Home' ? 'active' : ''}" data-go="Home">Home</button>
    <button class="tab center ${active === 'Challenge' ? 'active' : ''}" data-go="Challenge">Challenge</button>
    <button class="tab ${active === 'My' ? 'active' : ''}" data-go="My">My</button>
  </nav>`;
}

function NavBar(title, sub = '') {
  return `<div class="nav"><div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div></div>`;
}

function HeroCard() {
  const theme = TOKENS.colors.find(c => c.hex === state.selectedThemeHex) || TOKENS.colors[0];
  return `<section class="hero">
    <div class="hero-title">Color Walk</div>
    <div class="muted">今日主题灵感：${theme.name} ${theme.hex}</div>
    <div style="margin-top:10px"><button class="btn primary" data-go="Challenge">开始挑战</button></div>
  </section>`;
}

function ThemeChips() {
  return `<div class="chips">${TOKENS.colors.map(c => `<button class="chip ${state.selectedThemeHex === c.hex ? 'active' : ''}" data-theme="${c.hex}">${c.name}</button>`).join('')}</div>`;
}

function SwatchCard(ch) {
  return `<section class="swatch" style="background:${ch.target.hex}">
    <div class="hex">${ch.target.hex}</div>
    <div class="name">${ch.target.name}</div>
  </section>`;
}

function Board(ch) {
  return `<div class="board">${Array.from({ length: 9 }, (_, i) => {
    const item = ch.items[i];
    return item ? `<div class="cell"><img src="${item.data}"/></div>` : `<div class="cell">空位 ${i + 1}</div>`;
  }).join('')}</div>`;
}

function HomeView() {
  const trending = TOKENS.colors.slice(0, 3).map(c => `<div class="trending-item"><div><span class="dot" style="background:${c.hex}"></span>${c.name}</div><button class="btn" data-pick-theme="${c.hex}">进入</button></div>`).join('');
  return `${NavBar('挑战', 'Home · sPwyl')}
    <section class="card">
      <div class="title">主题色</div>
      ${ThemeChips()}
    </section>
    <section class="card">${HeroCard()}</section>
    <section class="card">
      <div class="title">Trending</div>
      ${trending}
    </section>
    ${tabBar('Home')}`;
}

function ChallengeView() {
  const ch = currentChallenge();
  return `${NavBar('挑战', 'Challenge · ZJZ7v')}
    <section class="card">
      ${SwatchCard(ch)}
      <div class="row" style="margin-top:10px">
        <button class="btn" id="rerollColor">换个颜色</button>
        <button class="btn primary" id="selectColor">选定此色</button>
      </div>
      <div class="muted" style="margin-top:8px">状态：${challengeState === 'preselect' ? 'Preselect' : 'Selected'}</div>
    </section>
    ${tabBar('Challenge')}`;
}

function ChallengeProgressView() {
  const ch = currentChallenge();
  return `${NavBar('挑战进度', 'ChallengeProgress · Bz4PQ')}
    <section class="card">
      <div class="row"><div class="title">${ch.target.name}</div><div class="muted">${ch.items.length}/${MAX_PHOTOS}</div></div>
      ${Board(ch)}
      <div class="row" style="margin-top:10px;flex-wrap:wrap;justify-content:flex-start">
        <button class="btn" id="openPhotoSheet">开始拍摄/相册</button>
        <button class="btn" id="clearCurrent">清空当前挑战</button>
        <button class="btn primary" id="generateCollage" ${ch.items.length < MAX_PHOTOS ? 'disabled' : ''}>生成拼图</button>
      </div>
    </section>
    ${tabBar('Challenge')}`;
}

function CollageGeneratingView() {
  return `${NavBar('正在拼接', 'CollageGenerating · uHhG7')}
    <section class="card"><div class="title">生成中...</div><div class="muted">请稍候，按钮已置灰</div></section>`;
}

function CollageResultView() {
  return `${NavBar('拼接结果', 'CollageResult · u4F87')}
    <section class="card">
      ${state.collageDataUrl ? `<img src="${state.collageDataUrl}" style="width:100%;border-radius:14px"/>` : '<div class="muted">暂无结果</div>'}
      <div class="row" style="margin-top:10px;justify-content:flex-start;flex-wrap:wrap">
        <button class="btn primary" id="shareImage">系统分享</button>
        <button class="btn" id="downloadImage">下载图片</button>
      </div>
    </section>`;
}

function MyView() {
  const list = state.challenges.map(c => `<div class="trending-item"><div><span class="dot" style="background:${c.target.hex}"></span>${c.target.name} · ${c.items.length}/9</div><button class="btn" data-switch-id="${c.id}">继续</button></div>`).join('');
  return `${NavBar('我的', 'My · XGO8b')}
    <section class="card"><div class="title">我的调色板 / 历史</div>${list || '<div class="muted">暂无</div>'}</section>
    ${tabBar('My')}`;
}

function render() {
  const app = $('app');
  if (route === 'Home') app.innerHTML = HomeView();
  if (route === 'Challenge') app.innerHTML = ChallengeView();
  if (route === 'ChallengeProgress') app.innerHTML = ChallengeProgressView();
  if (route === 'CollageGenerating') app.innerHTML = CollageGeneratingView();
  if (route === 'CollageResult') app.innerHTML = CollageResultView();
  if (route === 'My') app.innerHTML = MyView();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
    route = el.dataset.go;
    if (route === 'Challenge') challengeState = 'preselect';
    render();
  });

  document.querySelectorAll('[data-theme]').forEach(el => el.onclick = () => {
    state.selectedThemeHex = el.dataset.theme;
    saveState();
    render();
  });

  document.querySelectorAll('[data-pick-theme]').forEach(el => el.onclick = () => {
    state.selectedThemeHex = el.dataset.pickTheme;
    const ch = currentChallenge();
    ch.target = TOKENS.colors.find(c => c.hex === state.selectedThemeHex) || ch.target;
    saveState();
    route = 'Challenge';
    render();
  });

  const reroll = $('rerollColor');
  if (reroll) reroll.onclick = () => {
    const ch = currentChallenge();
    ch.target = TOKENS.colors[Math.floor(Math.random() * TOKENS.colors.length)];
    state.selectedThemeHex = ch.target.hex;
    saveState();
    render();
  };

  const selectColor = $('selectColor');
  if (selectColor) selectColor.onclick = () => {
    challengeState = 'selected';
    upsertChallengeByRule();
    route = 'ChallengeProgress';
    saveState();
    render();
  };

  const openSheet = $('openPhotoSheet');
  if (openSheet) openSheet.onclick = () => $('photoSheet').classList.remove('hidden');

  const clearCurrent = $('clearCurrent');
  if (clearCurrent) clearCurrent.onclick = () => {
    if (!confirm('清空当前挑战已上传图片？')) return;
    currentChallenge().items = [];
    saveState();
    render();
  };

  const gen = $('generateCollage');
  if (gen) gen.onclick = async () => {
    route = 'CollageGenerating';
    render();
    clearTimeout(generatingTimer);
    generatingTimer = setTimeout(async () => {
      state.collageDataUrl = await makeCollage(currentChallenge());
      saveState();
      route = 'CollageResult';
      render();
    }, 1000);
  };

  const share = $('shareImage');
  if (share) share.onclick = shareResult;

  const dl = $('downloadImage');
  if (dl) dl.onclick = downloadResult;

  document.querySelectorAll('[data-switch-id]').forEach(el => el.onclick = () => {
    state.currentId = el.dataset.switchId;
    route = 'ChallengeProgress';
    saveState();
    render();
  });

  $('pickCamera').onclick = () => $('cameraInput').click();
  $('pickAlbum').onclick = () => $('albumInput').click();
  $('closeSheet').onclick = () => $('photoSheet').classList.add('hidden');
}

function upsertChallengeByRule() {
  const cur = currentChallenge();
  // create/replace according to daily max=3
  const newCh = createChallenge(cur.target.hex);
  if (state.challenges.length < DAY_LIMIT) {
    state.challenges.push(newCh);
    state.currentId = newCh.id;
    return;
  }
  const oldest = [...state.challenges].sort((a, b) => a.createdAt - b.createdAt)[0];
  const ok = confirm(`今日挑战已满3个，将覆盖最早挑战（${oldest.target.name} ${oldest.items.length}/9），继续？`);
  if (!ok) return;
  state.challenges = state.challenges.filter(c => c.id !== oldest.id);
  state.challenges.push(newCh);
  state.currentId = newCh.id;
}

$('cameraInput').onchange = (e) => handlePick(e);
$('albumInput').onchange = (e) => handlePick(e);

async function handlePick(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const ch = currentChallenge();
  if (ch.items.length >= MAX_PHOTOS) return;

  try {
    let data = await fileToData(file);
    data = await normalizeImage(data);
    const avg = await sampleColor(data);
    const pass = isMatch(avg, hexToRgb(ch.target.hex));
    if (!pass) {
      alert('颜色不够接近，请再试一张');
      return;
    }

    ch.items.push({ data, at: Date.now() });
    if (!saveState()) {
      ch.items.pop();
      alert('保存失败，请清理存储后重试');
      return;
    }

    if (route === 'ChallengeProgress') render();
  } catch {
    alert('图片解析失败，请换一张或截图后再试');
  } finally {
    $('photoSheet').classList.add('hidden');
    e.target.value = '';
  }
}

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function normalizeImage(dataUrl) {
  const img = await loadImage(dataUrl);
  const c = $('work');
  const ctx = c.getContext('2d');
  const max = 960;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  c.width = Math.max(1, Math.round(img.width * scale));
  c.height = Math.max(1, Math.round(img.height * scale));
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.75);
}

async function sampleColor(dataUrl) {
  const img = await loadImage(dataUrl);
  const c = $('work');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  c.width = 180; c.height = 180;
  ctx.drawImage(img, 0, 0, 180, 180);
  const d = ctx.getImageData(40, 40, 100, 100).data;
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 10) continue;
    r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function isMatch(a, b) {
  const A = rgbToHsl(a), B = rgbToHsl(b);
  const dh = Math.min(Math.abs(A.h - B.h), 360 - Math.abs(A.h - B.h));
  return dh <= PASS_HUE && Math.abs(A.l - B.l) <= PASS_LIGHT;
}

async function makeCollage(ch) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1440;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F8FAFC'; ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = ch.target.hex; ctx.fillRect(0, 0, 1080, 170);
  const cell = 300, gap = 18, sx = 72, sy = 230;
  for (let i = 0; i < 9; i++) {
    const x = sx + (i % 3) * (cell + gap), y = sy + Math.floor(i / 3) * (cell + gap);
    ctx.fillStyle = '#E5E7EB'; ctx.fillRect(x, y, cell, cell);
    if (ch.items[i]?.data) {
      const im = await loadImage(ch.items[i].data);
      ctx.drawImage(im, x, y, cell, cell);
    }
  }
  return c.toDataURL('image/png');
}

async function shareResult() {
  if (!state.collageDataUrl) return;
  const file = dataUrlToFile(state.collageDataUrl, 'color-walk.png');
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Color Walk' });
  } else {
    alert('当前浏览器不支持系统分享');
  }
}

function downloadResult() {
  if (!state.collageDataUrl) return;
  const a = document.createElement('a');
  a.href = state.collageDataUrl;
  a.download = 'color-walk.png';
  a.click();
}

function dataUrlToFile(dataUrl, fileName) {
  const [meta, b64] = dataUrl.split(',');
  const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], fileName, { type: mime });
}

render();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => {});
}
