/* INTERFERENCE — web desktop OS */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('itf.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('itf.' + k, JSON.stringify(v)); } catch { /* quota */ } }
};

const WALLPAPERS = [
  { id: 'signal', name: 'Signal', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2400&auto=format&fit=crop' },
  { id: 'static', name: 'Static', url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2400&auto=format&fit=crop' },
  { id: 'foliage', name: 'Foliage', url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2400&auto=format&fit=crop' },
  { id: 'carrier', name: 'Carrier', url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=2400&auto=format&fit=crop' },
  { id: 'neon', name: 'Neon Rain', url: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=2400&auto=format&fit=crop' },
  { id: 'void', name: 'Void', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2400&auto=format&fit=crop' }
];

const TRACKS = [
  { name: 'Carrier Wave', artist: 'Null Sector', dur: '3:42', freq: 174 },
  { name: 'Ghost Channel', artist: 'Null Sector', dur: '4:08', freq: 196 },
  { name: 'Dead Air', artist: 'Mirrorbox', dur: '2:57', freq: 220 },
  { name: 'Interference', artist: 'Mirrorbox', dur: '5:21', freq: 261 },
  { name: 'Lost Transmission', artist: 'Vela', dur: '3:30', freq: 293 }
];

const state = {
  booted: false,
  fx: store.get('fx', true),
  wallpaper: store.get('wallpaper', WALLPAPERS[0].id),
  pinned: store.get('pinned', ['hub', 'music', 'games', 'web', 'terminal', 'settings']),
  windows: new Map(),
  active: null,
  lastGame: store.get('lastGame', null),
  track: null,
  playing: false,
  unlockedFiles: store.get('unlockedFiles', false)
};

/* ============================== APPS ============================== */
const APPS = {
  hub:      { name: 'Hub',        icon: 'fa-clapperboard', render: renderHub },
  music:    { name: 'Waveform',   icon: 'fa-music',        render: renderMusic },
  games:    { name: 'Arcade',     icon: 'fa-gamepad',      render: renderGames },
  web:      { name: 'Relay',      icon: 'fa-globe',        render: renderBrowser },
  terminal: { name: 'Terminal',   icon: 'fa-terminal',     render: renderTerminal },
  notes:    { name: 'Notes',      icon: 'fa-note-sticky',  render: renderNotes },
  files:    { name: 'Files',      icon: 'fa-folder',       render: renderFiles },
  settings: { name: 'Config',     icon: 'fa-sliders',      render: renderSettings },
  log:      { name: 'Update Log', icon: 'fa-list-check',   render: renderLog },
  calc:     { name: 'Calc',       icon: 'fa-calculator',   render: renderCalc }
};

/* ============================== BOOT ============================== */
const BOOT_LINES = [
  '[ 0.0000] interference kernel 1.1.0-itf (build 20260928)',
  '[ 0.0121] detecting carrier ......................... OK',
  '[ 0.0348] mounting /dev/signal0 ..................... OK',
  '[ 0.0712] noise floor calibrated at -94 dBm',
  '[ 0.1190] loading module: window-manager ............ OK',
  '[ 0.1544] loading module: waveform-audio ............ OK',
  '[ 0.1903] loading module: relay-net ................. OK',
  '[ 0.2260] handshake with assistant NOISE ............ OK',
  '[ 0.2780] decrypting user profile: administrator',
  '[ 0.3311] restoring session state ................... OK',
  '[ 0.4002] interference userspace ready. handing off.'
];

let bootRunning = false;
function startBoot() {
  if (bootRunning) return;
  bootRunning = true;
  $('#boot-content').classList.add('hide');
  $('#boot-console').classList.add('on');
  $('#boot-progress').classList.add('on');
  const con = $('#boot-console');
  let i = 0;
  const step = () => {
    if (!bootRunning) return;
    if (i >= BOOT_LINES.length) { $('#boot-bar').style.width = '100%'; setTimeout(showLock, 500); return; }
    con.textContent += BOOT_LINES[i] + '\n';
    i++;
    $('#boot-bar').style.width = (i / BOOT_LINES.length * 100) + '%';
    setTimeout(step, 150 + Math.random() * 170);
  };
  step();
}

function skipBoot() { bootRunning = false; $('#boot-bar').style.width = '100%'; showLock(); }

function showLock() {
  $('#boot-layer').classList.add('gone');
  $('#lock-screen').classList.add('on');
  tickClock();
}

function unlock() {
  const lock = $('#lock-screen');
  if (!lock.classList.contains('on') || lock.classList.contains('unlocking')) return;
  lock.classList.add('unlocking');
  setTimeout(() => {
    lock.classList.remove('on', 'unlocking');
    document.body.classList.add('booted');
    state.booted = true;
    setTimeout(() => toast('System', 'Welcome to INTERFERENCE', 'Right-click the desktop for options'), 1000);
  }, 550);
}

function lockSystem() {
  document.body.classList.remove('booted');
  state.booted = false;
  closeAllMenus();
  $('#lock-screen').classList.add('on');
}

/* ============================== CLOCK ============================== */
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

function tickClock() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  $('#lock-day').textContent = DAYS[d.getDay()];
  $('#hud-day').textContent = DAYS[d.getDay()];
  $('#lock-date').textContent = `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}.`;
  $('#lock-time').textContent = `- ${hh}:${mm} -`;
  $('#dock-clock').textContent = `${hh}:${mm}`;
}
setInterval(tickClock, 1000);

/* ============================== WALLPAPER ============================== */
function applyWallpaper(id) {
  const wp = WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0];
  state.wallpaper = wp.id;
  store.set('wallpaper', wp.id);
  const css = `url("${wp.url}")`;
  $('#bg-layer').style.backgroundImage = css;
  $('#lock-bg').style.backgroundImage = css;
  $$('.wp-thumb').forEach(t => t.classList.toggle('active', t.dataset.wp === wp.id));
}

/* ============================== SNOW FX ============================== */
const canvas = $('#fx-canvas');
const ctx = canvas.getContext('2d');
let flakes = [];

function sizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const count = Math.round(innerWidth * innerHeight / 22000);
  flakes = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vy: .25 + Math.random() * .75,
    drift: (Math.random() - .5) * .35,
    r: Math.random() * 1.7 + .5,
    a: .18 + Math.random() * .45
  }));
}
addEventListener('resize', sizeCanvas);
sizeCanvas();

let frames = 0, lastFps = performance.now(), phase = 0;
function loop(now) {
  frames++;
  if (now - lastFps >= 1000) { $('#fps-val').textContent = frames; frames = 0; lastFps = now; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.fx) {
    phase += .01;
    for (const f of flakes) {
      f.y += f.vy;
      f.x += f.drift + Math.sin(phase + f.y * .01) * .25;
      if (f.y > canvas.height) { f.y = -4; f.x = Math.random() * canvas.width; }
      if (f.x < -4) f.x = canvas.width; if (f.x > canvas.width + 4) f.x = 0;
      ctx.fillStyle = `rgba(255,255,255,${f.a})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ============================== TOASTS ============================== */
function toast(head, title, sub) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="t-head"><i class="fas fa-bell"></i> ${head}</div><strong></strong>${sub ? '<small></small>' : ''}`;
  el.querySelector('strong').textContent = title;
  if (sub) el.querySelector('small').textContent = sub;
  $('#toast-container').appendChild(el);
  setTimeout(() => { el.style.transition = '.4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 4200);
}

/* ============================== WINDOWS ============================== */
const FLUSH_APPS = new Set();

function openApp(id) {
  const app = APPS[id];
  if (!app) return;
  closeAllMenus();
  if (!state.booted) unlock();

  let win = state.windows.get(id);
  if (!win) {
    win = document.createElement('section');
    win.className = 'window';
    win.innerHTML = `
      <header class="win-header">
        <div class="win-title">${app.name}</div>
        <div class="win-controls">
          <button class="win-btn btn-min" title="Minimize"></button>
          <button class="win-btn btn-close" title="Close"></button>
        </div>
      </header>
      <div class="win-body${FLUSH_APPS.has(id) ? ' flush' : ''}"></div>`;
    $('#windows-layer').appendChild(win);
    state.windows.set(id, win);
    app.render($('.win-body', win), win);
    $('.btn-min', win).onclick = () => minimizeApp(id);
    $('.btn-close', win).onclick = () => closeApp(id);
  }
  showWindow(id);
  return win;
}

function showWindow(id) {
  for (const [key, w] of state.windows) {
    if (key === id) continue;
    w.classList.remove('active');
    w.classList.add('minimized');
  }
  const win = state.windows.get(id);
  win.classList.remove('minimized');
  win.classList.add('active', 'header-visible');
  setTimeout(() => win.classList.remove('header-visible'), 1800);
  state.active = id;
  syncDock();
}

function minimizeApp(id) {
  const win = state.windows.get(id);
  if (!win) return;
  win.classList.add('minimized');
  win.classList.remove('active');
  if (state.active === id) state.active = null;
  syncDock();
}

function closeApp(id) {
  const win = state.windows.get(id);
  if (!win) return;
  win.classList.remove('active');
  win.classList.add('minimized');
  setTimeout(() => win.remove(), 300);
  state.windows.delete(id);
  if (state.active === id) state.active = null;
  syncDock();
}

/* ============================== DOCK / MENUS ============================== */
function dockButton(id) {
  const app = APPS[id];
  const b = document.createElement('button');
  b.className = 'dock-item';
  b.title = app.name;
  b.dataset.app = id;
  b.innerHTML = `<i class="fas ${app.icon}"></i>`;
  b.onclick = e => {
    e.stopPropagation();
    state.active === id ? minimizeApp(id) : openApp(id);
  };
  b.oncontextmenu = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!state.pinned.includes(id)) return;
    state.pinned = state.pinned.filter(p => p !== id);
    store.set('pinned', state.pinned);
    renderDock();
    renderMenus();
    toast('Taskbar', `Unpinned ${app.name}`);
  };
  return b;
}

function renderDock() {
  const host = $('#dock-apps');
  host.innerHTML = '';
  state.pinned.forEach(id => APPS[id] && host.appendChild(dockButton(id)));
  syncDock();
}

function syncDock() {
  $$('#dock-apps .dock-item').forEach(b => {
    b.classList.toggle('running', state.windows.has(b.dataset.app));
    b.classList.toggle('active', state.active === b.dataset.app);
  });
  const tasks = $('#dock-tasks');
  tasks.innerHTML = '';
  for (const id of state.windows.keys()) {
    if (state.pinned.includes(id)) continue;
    const b = dockButton(id);
    b.classList.add('running');
    b.classList.toggle('active', state.active === id);
    tasks.appendChild(b);
  }
}

function tile(id, cls) {
  const app = APPS[id];
  const el = document.createElement('div');
  el.className = cls;
  el.dataset.name = app.name.toLowerCase();
  el.innerHTML = `<div class="tile-icon"><i class="fas ${app.icon}"></i></div><span>${app.name}</span>`;
  el.onclick = () => { closeAllMenus(); openApp(id); };
  el.oncontextmenu = e => {
    e.preventDefault();
    if (state.pinned.includes(id)) return;
    state.pinned.push(id);
    store.set('pinned', state.pinned);
    renderDock();
    renderMenus();
    toast('Taskbar', `Pinned ${app.name}`);
  };
  return el;
}

function renderMenus() {
  const pin = $('#pinned-grid');
  pin.innerHTML = '';
  state.pinned.forEach(id => APPS[id] && pin.appendChild(tile(id, 'pinned-item')));
  const drawer = $('#drawer-grid');
  drawer.innerHTML = '';
  Object.keys(APPS).forEach(id => drawer.appendChild(tile(id, 'drawer-item')));
}

function closeAllMenus() {
  $('#start-menu').classList.remove('open');
  $('#app-drawer').classList.remove('open');
  $('#desktop-context-menu').classList.remove('open');
}

/* ============================== APP RENDERERS ============================== */
function renderHub(body) {
  const items = [
    { t: 'Signal Lost', s: 'Series · 2 seasons', i: 'fa-tower-broadcast' },
    { t: 'The Quiet Band', s: 'Film · 118 min', i: 'fa-film' },
    { t: 'Nightshift', s: 'Series · 1 season', i: 'fa-moon' },
    { t: 'Deadzone', s: 'Film · 94 min', i: 'fa-radiation' },
    { t: 'Analog Hearts', s: 'Film · 102 min', i: 'fa-heart' },
    { t: 'Static Bloom', s: 'Doc · 76 min', i: 'fa-seedling' },
    { t: 'Ghost Channel', s: 'Series · 3 seasons', i: 'fa-ghost' },
    { t: 'Off Air', s: 'Short · 22 min', i: 'fa-tv' }
  ];
  body.innerHTML = `<h3 class="section-title">Continue Watching</h3><div class="grid-cards"></div>`;
  const grid = $('.grid-cards', body);
  items.forEach(it => {
    const c = document.createElement('div');
    c.className = 'media-card';
    c.innerHTML = `<div class="thumb"><i class="fas ${it.i}"></i></div><div class="meta"><strong></strong><small></small></div>`;
    $('strong', c).textContent = it.t;
    $('small', c).textContent = it.s;
    c.onclick = () => toast('Hub', it.t, 'Stream unavailable in demo build');
    grid.appendChild(c);
  });
}

let audioCtx = null, osc = null, gainNode = null;
function renderMusic(body) {
  body.innerHTML = `
    <div class="player">
      <div class="art"><i class="fas fa-compact-disc"></i></div>
      <div>
        <div class="track-name" id="pl-name">—</div>
        <div class="track-artist" id="pl-artist">select a track</div>
      </div>
      <div class="seek"><i id="pl-seek"></i></div>
      <div class="controls">
        <i class="fas fa-backward-step" id="pl-prev"></i>
        <i class="fas fa-circle-play big" id="pl-toggle"></i>
        <i class="fas fa-forward-step" id="pl-next"></i>
      </div>
      <div class="playlist" id="pl-list"></div>
    </div>`;
  const list = $('#pl-list', body);
  TRACKS.forEach((t, idx) => {
    const r = document.createElement('div');
    r.className = 'p-row';
    r.dataset.idx = idx;
    r.innerHTML = `<i class="fas fa-music"></i><span></span><span class="dur">${t.dur}</span>`;
    r.querySelector('span').textContent = t.name;
    r.onclick = () => playTrack(idx);
    list.appendChild(r);
  });
  $('#pl-toggle', body).onclick = () => (state.playing ? stopTone() : playTrack(state.track ?? 0));
  $('#pl-next', body).onclick = () => playTrack(((state.track ?? -1) + 1) % TRACKS.length);
  $('#pl-prev', body).onclick = () => playTrack(((state.track ?? 0) - 1 + TRACKS.length) % TRACKS.length);
  if (state.track !== null) paintTrack();
}

function playTrack(idx) {
  state.track = idx;
  const t = TRACKS[idx];
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    stopTone(true);
    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = t.freq;
    gainNode.gain.value = 0.045;
    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start();
  } catch { /* audio unavailable */ }
  state.playing = true;
  paintTrack();
  $('#quick-track-name').textContent = t.name;
  toast('Waveform', t.name, t.artist);
}

function stopTone(silent) {
  try { if (osc) { osc.stop(); osc.disconnect(); } } catch { /* already stopped */ }
  osc = null;
  state.playing = false;
  if (!silent) paintTrack();
}

function paintTrack() {
  const win = state.windows.get('music');
  if (!win || state.track === null) return;
  const t = TRACKS[state.track];
  $('#pl-name', win).textContent = t.name;
  $('#pl-artist', win).textContent = t.artist;
  $('#pl-toggle', win).className = `fas ${state.playing ? 'fa-circle-pause' : 'fa-circle-play'} big`;
  $$('.p-row', win).forEach(r => r.classList.toggle('active', +r.dataset.idx === state.track));
  $('#pl-seek', win).style.width = state.playing ? '38%' : '0%';
}

function renderGames(body) {
  body.innerHTML = `
    <div class="game-wrap">
      <h3 class="section-title">Arcade · Interlock</h3>
      <div class="game-board" id="gb"></div>
      <div class="row between"><span id="g-status">You are X</span><button class="btn" id="g-reset">Reset</button></div>
    </div>`;
  const board = $('#gb', body);
  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  let cells = Array(9).fill('');
  const winnerLine = c => LINES.find(l => c[l[0]] && c[l[0]] === c[l[1]] && c[l[1]] === c[l[2]]);
  const paint = () => {
    board.innerHTML = '';
    cells.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'game-cell' + (c ? ' ' + c.toLowerCase() : '');
      d.textContent = c;
      d.onclick = () => move(i);
      board.appendChild(d);
    });
  };
  const move = i => {
    if (cells[i] || winnerLine(cells)) return;
    cells[i] = 'X'; paint();
    let l = winnerLine(cells);
    if (l || cells.every(Boolean)) return end(l && cells[l[0]]);
    const free = cells.map((c, j) => c ? null : j).filter(j => j !== null);
    cells[free[Math.floor(Math.random() * free.length)]] = 'O';
    paint();
    l = winnerLine(cells);
    if (l || cells.every(Boolean)) end(l && cells[l[0]]);
  };
  const end = w => {
    $('#g-status', body).textContent = w ? `${w} wins` : 'Draw';
    toast('Arcade', w ? `${w} wins` : 'Draw', 'Interlock');
  };
  $('#g-reset', body).onclick = () => { cells = Array(9).fill(''); $('#g-status', body).textContent = 'You are X'; paint(); };
  paint();
  state.lastGame = 'Interlock';
  store.set('lastGame', state.lastGame);
  $('#last-game-name').textContent = 'Interlock';
}

const PAGES = {
  'itf://home': '<h3 class="section-title">Relay Home</h3><p>You are browsing the internal relay network. Try <b>itf://docs</b>, <b>itf://status</b> or <b>itf://secret</b>.</p>',
  'itf://docs': '<h3 class="section-title">Docs</h3><p>INTERFERENCE is a browser-based desktop environment. Apps open fullscreen; hover the top edge to reveal the window header, hover the bottom edge to bring back the dock. Everything runs client-side with no build step.</p>',
  'itf://status': '<h3 class="section-title">Network Status</h3><p>Carrier: <b>stable</b><br>Noise floor: <b>-94 dBm</b><br>Relay nodes online: <b>12 / 12</b></p>',
  'itf://secret': '<h3 class="section-title">Classified</h3><p>Access code accepted. Encrypted files unlocked in the Files app.</p>'
};

function renderBrowser(body) {
  body.innerHTML = `
    <div class="browser-bar">
      <input class="browser-url" id="b-url" value="itf://home">
      <button class="btn primary" id="b-go">Go</button>
    </div>
    <div class="browser-view" id="b-view"></div>`;
  const go = () => {
    const url = $('#b-url', body).value.trim().toLowerCase();
    const page = PAGES[url];
    if (page) $('#b-view', body).innerHTML = page;
    else {
      $('#b-view', body).innerHTML = '<h3 class="section-title">Not found</h3><p>No relay node answered <b></b>.</p>';
      $('#b-view b', body).textContent = url;
    }
    if (url === 'itf://secret') { state.unlockedFiles = true; store.set('unlockedFiles', true); toast('Relay', 'Encrypted files unlocked'); }
  };
  $('#b-go', body).onclick = go;
  $('#b-url', body).onkeydown = e => { if (e.key === 'Enter') go(); };
  go();
}

function renderTerminal(body) {
  body.innerHTML = `<div class="term"><div id="t-out"></div>
    <div class="term-input-row"><span class="prompt">admin@interference:~$</span><input class="term-input" id="t-in" autocomplete="off"></div></div>`;
  const out = $('#t-out', body);
  const print = txt => { const d = document.createElement('div'); d.className = 'line'; d.textContent = txt; out.appendChild(d); };
  print('INTERFERENCE shell 1.1.0 — type "help"');
  const cmds = {
    help: () => print('help  whoami  apps  open <app>  wallpaper <id>  fx  clear  date  echo  neofetch'),
    whoami: () => print('administrator'),
    apps: () => print(Object.keys(APPS).join('  ')),
    date: () => print(new Date().toString()),
    clear: () => (out.innerHTML = ''),
    fx: () => { state.fx = !state.fx; store.set('fx', state.fx); print('snow fx: ' + (state.fx ? 'on' : 'off')); },
    neofetch: () => print(`    ░▒▓  INTERFERENCE\n    OS      interference 1.1.0\n    Shell   itfsh\n    WM      glasswm\n    Apps    ${Object.keys(APPS).length}\n    Res     ${innerWidth}x${innerHeight}`)
  };
  $('#t-in', body).onkeydown = e => {
    if (e.key !== 'Enter') return;
    const raw = e.target.value.trim();
    e.target.value = '';
    print('admin@interference:~$ ' + raw);
    if (raw) {
      const [cmd, ...args] = raw.split(/\s+/);
      if (cmd === 'open') { APPS[args[0]] ? openApp(args[0]) : print('no such app: ' + args[0]); }
      else if (cmd === 'echo') print(args.join(' '));
      else if (cmd === 'wallpaper') { WALLPAPERS.some(w => w.id === args[0]) ? applyWallpaper(args[0]) : print('wallpapers: ' + WALLPAPERS.map(w => w.id).join(' ')); }
      else if (cmds[cmd]) cmds[cmd]();
      else print('command not found: ' + cmd);
    }
    body.scrollTop = body.scrollHeight;
  };
  setTimeout(() => $('#t-in', body).focus(), 300);
}

function renderNotes(body) {
  body.innerHTML = `<h3 class="section-title">Notes</h3><textarea class="notes-area" id="notes" placeholder="Transmission log..."></textarea>`;
  const ta = $('#notes', body);
  ta.value = store.get('notes', '');
  ta.oninput = () => store.set('notes', ta.value);
}

function renderFiles(body) {
  const tree = {
    Home: [['readme.md', '2 KB'], ['session.log', '14 KB'], ['carrier.wav', '3.1 MB']],
    Media: [['signal-lost-s01.mkv', '1.4 GB'], ['nightshift.mp4', '820 MB'], ['cover.png', '340 KB']],
    System: [['kernel.img', '8.2 MB'], ['modules.conf', '1 KB'], ['noise.cfg', '512 B']],
    Encrypted: [['papers-01.pdf', '4 MB'], ['papers-02.pdf', '2 MB'], ['keys.gpg', '1 KB']]
  };
  body.innerHTML = `<h3 class="section-title">Files</h3><div class="files-layout"><nav class="files-side"></nav><div class="files-main"></div></div>`;
  const side = $('.files-side', body), main = $('.files-main', body);
  const open = dir => {
    $$('.f-item', side).forEach(i => i.classList.toggle('active', i.textContent.trim() === dir));
    if (dir === 'Encrypted' && !state.unlockedFiles) {
      main.innerHTML = `<div class="locked-box"><i class="fas fa-lock"></i>Locked. Find the access code on the relay network.</div>`;
      return;
    }
    main.innerHTML = '';
    tree[dir].forEach(([n, s]) => {
      const r = document.createElement('div');
      r.className = 'file-row';
      r.innerHTML = `<i class="fas fa-file"></i><span></span><span class="size">${s}</span>`;
      r.querySelector('span').textContent = n;
      r.onclick = () => toast('Files', n, dir);
      main.appendChild(r);
    });
  };
  Object.keys(tree).forEach(dir => {
    const i = document.createElement('div');
    i.className = 'f-item';
    i.textContent = dir;
    i.onclick = () => open(dir);
    side.appendChild(i);
  });
  open('Home');
}

function renderSettings(body) {
  body.innerHTML = `
    <h3 class="section-title">Wallpaper Protocols</h3>
    <div class="wp-grid" id="wp-grid"></div>
    <h3 class="section-title">System</h3>
    <div class="setting-row">
      <div><strong>Snow FX</strong><br><small>Animated particle field</small></div>
      <label class="switch"><input type="checkbox" id="s-fx"><span class="slider"></span></label>
    </div>
    <div class="setting-row">
      <div><strong>Reset workspace</strong><br><small>Clears pins, notes, wallpaper</small></div>
      <button class="btn" id="s-reset">Reset</button>
    </div>
    <h3 class="section-title">About</h3>
    <p class="sub-note">INTERFERENCE 1.1.0 — a browser-based desktop environment.<br>
    Vanilla HTML/CSS/JS, no build step, state saved locally.<br>
    Hover the top edge of a window for its header, the bottom edge for the dock.</p>`;
  const grid = $('#wp-grid', body);
  WALLPAPERS.forEach(w => {
    const d = document.createElement('div');
    d.className = 'wp-thumb' + (w.id === state.wallpaper ? ' active' : '');
    d.dataset.wp = w.id;
    d.title = w.name;
    d.style.backgroundImage = `url("${w.url}")`;
    d.onclick = () => { applyWallpaper(w.id); toast('Config', w.name, 'Wallpaper applied'); };
    grid.appendChild(d);
  });
  const fx = $('#s-fx', body);
  fx.checked = state.fx;
  fx.onchange = () => { state.fx = fx.checked; store.set('fx', state.fx); };
  $('#s-reset', body).onclick = () => {
    Object.keys(localStorage).filter(k => k.startsWith('itf.')).forEach(k => localStorage.removeItem(k));
    toast('Config', 'Workspace reset', 'Reloading...');
    setTimeout(() => location.reload(), 900);
  };
}

function renderLog(body) {
  const entries = [
    { v: '1.1.0', d: 'Current', items: ['Fullscreen window model with auto-hiding header', 'Edge triggers for dock and window chrome', 'Monochrome system theme'] },
    { v: '1.0.4', d: 'Previous', items: ['Relay browser with internal itf:// pages', 'Terminal gained neofetch and wallpaper commands', 'Snow FX toggle'] },
    { v: '1.0.2', d: 'Legacy', items: ['Boot sequence console output', 'Lock screen clock and wallpaper sync', 'Encrypted files vault behind access code'] }
  ];
  body.innerHTML = '<h3 class="section-title">Update Log</h3>' + entries.map(e => `
    <div class="log-entry">
      <small>${e.d}</small>
      <h4>Version ${e.v}</h4>
      <ul>${e.items.map(i => `<li>${i}</li>`).join('')}</ul>
    </div>`).join('');
}

function renderCalc(body) {
  body.innerHTML = `<div class="calc-wrap"><h3 class="section-title">Calc</h3>
    <input class="calc-disp" id="c-disp" value="0" readonly>
    <div class="calc-pad" id="c-pad"></div></div>`;
  const disp = $('#c-disp', body);
  const pad = $('#c-pad', body);
  let buf = '';
  ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C'].forEach(k => {
    const b = document.createElement('button');
    b.className = 'btn' + (k === '=' ? ' primary' : '');
    b.textContent = k;
    if (k === 'C') b.style.gridColumn = 'span 4';
    b.onclick = () => {
      if (k === 'C') { buf = ''; disp.value = '0'; return; }
      if (k === '=') {
        try { disp.value = String(Function(`"use strict";return (${buf || 0})`)()); buf = disp.value; }
        catch { disp.value = 'ERR'; buf = ''; }
        return;
      }
      buf += k;
      disp.value = buf;
    };
    pad.appendChild(b);
  });
}

/* ============================== ASSISTANT ============================== */
function assistantSay(text, who) {
  const m = document.createElement('div');
  m.className = 'msg ' + who;
  m.textContent = text;
  $('#assistant-log').appendChild(m);
  $('#assistant-log').scrollTop = 1e6;
}

function assistantReply(q) {
  const s = q.toLowerCase();
  if (/wallpaper|background/.test(s)) { openApp('settings'); return 'Opened Config — wallpapers are at the top.'; }
  if (/music|song|play/.test(s)) { openApp('music'); return 'Waveform is up. Pick a track from the playlist.'; }
  if (/game|arcade/.test(s)) { openApp('games'); return 'Launching Interlock. You play X.'; }
  if (/file|paper|secret|code/.test(s)) return 'Encrypted files unlock from the Relay browser. Try visiting itf://secret.';
  if (/terminal|command/.test(s)) { openApp('terminal'); return 'Terminal open — type "help" for commands.'; }
  if (/time|date/.test(s)) return new Date().toLocaleString();
  if (/who|what are you|name/.test(s)) return 'I am NOISE, the local assistant for INTERFERENCE. Everything I do runs in your browser.';
  return 'I only handle local system tasks: apps, wallpaper, music, files and time.';
}

function closeAssistant() { $('#assistant-window').classList.remove('open'); $('#assistant-backdrop').classList.remove('open'); }
function openAssistant() {
  $('#assistant-window').classList.add('open');
  $('#assistant-backdrop').classList.add('open');
  if (!$('#assistant-log').children.length) assistantSay('NOISE online. Ask me to open apps, change the wallpaper or play music.', 'bot');
  $('#assistant-text').focus();
}

/* ============================== EVENTS ============================== */
$('#boot-btn').onclick = startBoot;
$('#lock-screen').onclick = unlock;

let lastEnter = 0;
addEventListener('keydown', e => {
  if (e.key === 'Enter' && !state.booted) {
    const now = Date.now();
    if (now - lastEnter < 600) skipBoot();
    lastEnter = now;
  }
  if (e.key === 'Escape') closeAllMenus();
  if (e.key === 'l' && e.ctrlKey && state.booted) { e.preventDefault(); lockSystem(); }
  if (e.key === '`' && state.booted && !/input|textarea/i.test(document.activeElement.tagName)) {
    e.preventDefault();
    $('#assistant-window').classList.contains('open') ? closeAssistant() : openAssistant();
  }
});

/* edge triggers: top reveals the active window header, bottom reveals the dock */
$('#top-trigger').onmouseenter = () => {
  const win = state.active && state.windows.get(state.active);
  if (win) win.classList.add('header-visible');
};
$('#windows-layer').addEventListener('mousemove', e => {
  const win = state.active && state.windows.get(state.active);
  if (win) win.classList.toggle('header-visible', e.clientY < 60);
});
$('#bottom-trigger').onmouseenter = () => $('#dock-container').classList.remove('dock-hidden');
$('#windows-layer').addEventListener('mouseenter', () => {
  if (state.active) $('#dock-container').classList.add('dock-hidden');
});
$('#dock-container').onmouseenter = () => $('#dock-container').classList.remove('dock-hidden');

$('#start-btn').onclick = e => {
  e.stopPropagation();
  const m = $('#start-menu');
  const open = m.classList.contains('open');
  closeAllMenus();
  if (!open) { m.classList.add('open'); $('#start-search-input').focus(); }
};
$('#drawer-btn').onclick = e => {
  e.stopPropagation();
  const d = $('#app-drawer');
  const open = d.classList.contains('open');
  closeAllMenus();
  if (!open) { d.classList.add('open'); $('#drawer-search').value = ''; filterTiles('#drawer-grid', ''); $('#drawer-search').focus(); }
};
$('#app-drawer').onclick = e => { if (e.target.id === 'app-drawer') closeAllMenus(); };
$('#start-menu').onclick = e => e.stopPropagation();
$('#power-btn').onclick = () => location.reload();

function filterTiles(sel, q) {
  $$(`${sel} > div`).forEach(t => { t.style.display = t.dataset.name.includes(q.toLowerCase()) ? '' : 'none'; });
}
$('#drawer-search').oninput = e => filterTiles('#drawer-grid', e.target.value);
$('#start-search-input').oninput = e => {
  const v = e.target.value.toLowerCase();
  filterTiles('#pinned-grid', v);
  if (v.includes('secret') || v.includes('interference')) {
    state.unlockedFiles = true;
    store.set('unlockedFiles', true);
    toast('Security', 'Encrypted files unlocked', 'Open the Files app');
    e.target.value = '';
    filterTiles('#pinned-grid', '');
  }
};

$('#desktop-area').addEventListener('contextmenu', e => {
  if (e.target.closest('.window, #dock-container, .os-menu, #app-drawer, #right-sidebar, #assistant-window')) return;
  if (!state.booted) return;
  e.preventDefault();
  const m = $('#desktop-context-menu');
  m.classList.add('open');
  m.style.left = Math.min(e.clientX, innerWidth - 240) + 'px';
  m.style.top = Math.min(e.clientY, innerHeight - 280) + 'px';
});
addEventListener('click', () => closeAllMenus());

$$('#desktop-context-menu .ctx-item').forEach(item => {
  item.onclick = () => {
    const a = item.dataset.ctx;
    closeAllMenus();
    if (a === 'wallpaper' || a === 'settings') openApp('settings');
    if (a === 'fx') { state.fx = !state.fx; store.set('fx', state.fx); toast('Display', 'Snow FX ' + (state.fx ? 'enabled' : 'disabled')); }
    if (a === 'lock') lockSystem();
    if (a === 'reload') location.reload();
  };
});

$$('.sidebar__card').forEach(card => {
  card.onclick = () => {
    const a = card.dataset.action;
    if (a === 'last-played') openApp('games');
    if (a === 'quick-play') { openApp('music'); playTrack(state.track ?? 0); }
    if (a === 'update-log') openApp('log');
  };
});

$('#assistant-close').onclick = closeAssistant;
$('#assistant-backdrop').onclick = closeAssistant;
$('#assistant-form').onsubmit = e => {
  e.preventDefault();
  const v = $('#assistant-text').value.trim();
  if (!v) return;
  assistantSay(v, 'user');
  $('#assistant-text').value = '';
  setTimeout(() => assistantSay(assistantReply(v), 'bot'), 420);
};

setInterval(() => {
  if (!state.booted) return;
  $('#m-cpu').style.width = (14 + Math.random() * 42).toFixed(0) + '%';
  $('#m-mem').style.width = (38 + Math.random() * 26).toFixed(0) + '%';
  $('#m-net').style.width = (8 + Math.random() * 60).toFixed(0) + '%';
}, 1800);

/* ============================== INIT ============================== */
applyWallpaper(state.wallpaper);
renderDock();
renderMenus();
tickClock();
if (state.lastGame) $('#last-game-name').textContent = state.lastGame;
