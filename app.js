/* ===== HOLY BIBLE PWA — MAIN APPLICATION ===== */

/* ---------- STATE ---------- */
const state = {
  tab: 'home',
  booksView: 'list',       // 'list' | 'chapters' | 'reader'
  currentBook: null,
  currentChapter: null,
  studySection: 'goodnews',
  fontSize: 18,
  theme: 'dark',
  data: {
    bible: null,
    goodnews: null,
    stories: null,
    apocalypse: null,
    mysteries: null,
  },
  searchQuery: '',
  history: [],
  installPrompt: null,
};

/* ---------- DOM CACHE ---------- */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- HELPERS ---------- */
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

/* ---------- DATA LOADING ---------- */
async function loadData() {
  const base = './';

  const fetchJSON = async (name) => {
    try {
      const url = base.endsWith('/') ? `${base}${name}` : `${base}/${name}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    } catch (e) {
      console.warn(`Failed to load ${name}:`, e);
      return null;
    }
  };

  const [bible, goodnews, stories, apocalypse, mysteries] = await Promise.all([
    fetchJSON('bible.json'),
    fetchJSON('goodnews.json'),
    fetchJSON('stories.json'),
    fetchJSON('apocalypse.json'),
    fetchJSON('mysteries.json'),
  ]);

  state.data = { bible, goodnews, stories, apocalypse, mysteries };
}

/* ---------- DAILY VERSE ---------- */
const DAILY_VERSES = [
  { text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ref: 'John 3:16' },
  { text: 'The LORD is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.', ref: 'Proverbs 3:5-6' },
  { text: 'I can do all things through Christ which strengtheneth me.', ref: 'Philippians 4:13' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.', ref: 'Joshua 1:9' },
  { text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', ref: 'Romans 8:28' },
  { text: 'They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', ref: 'Isaiah 40:31' },
  { text: 'For I know the plans I have for you, saith the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11' },
  { text: 'Thy word is a lamp unto my feet, and a light unto my path.', ref: 'Psalm 119:105' },
  { text: 'In the beginning was the Word, and the Word was with God, and the Word was God.', ref: 'John 1:1' },
  { text: 'God is our refuge and strength, a very present help in trouble.', ref: 'Psalm 46:1' },
  { text: 'The peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.', ref: 'Philippians 4:7' },
  { text: 'Blessed are the pure in heart: for they shall see God.', ref: 'Matthew 5:8' },
  { text: 'If God be for us, who can be against us?', ref: 'Romans 8:31' },
  { text: 'Surely I come quickly. Amen. Even so, come, Lord Jesus.', ref: 'Revelation 22:20' },
];

function setDailyVerse() {
  const day = Math.floor(Date.now() / 86400000);
  const verse = DAILY_VERSES[day % DAILY_VERSES.length];
  $('daily-verse-text').textContent = `"${verse.text}"`;
  $('daily-verse-ref').textContent = `— ${verse.ref}`;
}

/* ---------- NAVIGATION ---------- */
function navigateTab(tab) {
  $$('.page').forEach((p) => p.classList.remove('active'));
  $$('.nav-btn').forEach((b) => b.classList.remove('active'));

  state.tab = tab;
  const page = $(`page-${tab}`);
  if (page) page.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Update back button
  updateBackButton();

  // Render tab-specific content
  if (tab === 'books') renderBooksList();
  if (tab === 'study') renderStudy(state.studySection);
  if (tab === 'search') $('search-input').focus();
}

function updateBackButton() {
  const showBack =
    (state.tab === 'books' && state.booksView !== 'list');
  $('btn-back').classList.toggle('hidden', !showBack);

  // Update header title
  const titleEl = $('header-title');
  if (state.tab === 'books' && state.booksView === 'chapters') {
    titleEl.innerHTML = `<span class="header-cross">✝</span><span>${state.currentBook}</span>`;
  } else if (state.tab === 'books' && state.booksView === 'reader') {
    titleEl.innerHTML = `<span class="header-cross">✝</span><span>${state.currentBook} ${state.currentChapter}</span>`;
  } else {
    titleEl.innerHTML = `<span class="header-cross">✝</span><span>Holy Bible</span>`;
  }
}

function goBack() {
  if (state.tab === 'books') {
    if (state.booksView === 'reader') {
      showBooksView('chapters');
    } else if (state.booksView === 'chapters') {
      showBooksView('list');
    }
  }
}

function showBooksView(view) {
  state.booksView = view;
  $('books-list').classList.toggle('hidden', view !== 'list');
  $('chapters-view').classList.toggle('hidden', view !== 'chapters');
  $('reader-view').classList.toggle('hidden', view !== 'reader');
  updateBackButton();

  // Scroll to top
  const views = { list: 'books-list', chapters: 'chapters-view', reader: 'reader-view' };
  const el = $(views[view]);
  if (el) el.scrollTop = 0;
}

/* ---------- BOOKS LIST ---------- */
function renderBooksList() {
  const meta = state.data.bible?._meta?.books;
  if (!meta) return;

  const otContainer = $('ot-books');
  const ntContainer = $('nt-books');
  otContainer.innerHTML = '';
  ntContainer.innerHTML = '';

  const booksArr = Object.entries(meta).sort((a, b) => a[1].order - b[1].order);
  const ot = booksArr.filter(([, m]) => m.testament === 'OT');
  const nt = booksArr.filter(([, m]) => m.testament === 'NT');

  function makeBookBtn(name, meta, idx) {
    const btn = document.createElement('button');
    btn.className = 'book-btn';
    btn.innerHTML = `
      <span class="book-btn-num">${idx + 1}</span>
      <span>
        <div class="book-btn-name">${name}</div>
        <div class="book-btn-chapters">${meta.chapters} ch.</div>
      </span>
    `;
    btn.addEventListener('click', () => openBook(name));
    return btn;
  }

  ot.forEach(([name, m], i) => otContainer.appendChild(makeBookBtn(name, m, i)));
  nt.forEach(([name, m], i) => ntContainer.appendChild(makeBookBtn(name, m, i)));
}

function openBook(bookName) {
  state.currentBook = bookName;
  const meta = state.data.bible?._meta?.books?.[bookName];
  const chapters = meta?.chapters || 50;
  const bookData = state.data.bible?.[bookName] || {};

  $('chapter-list-title').textContent = bookName;

  const grid = $('chapter-grid');
  grid.innerHTML = '';

  for (let i = 1; i <= chapters; i++) {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn';
    if (bookData[String(i)]) btn.classList.add('has-data');
    btn.textContent = i;
    btn.addEventListener('click', () => openChapter(bookName, i));
    grid.appendChild(btn);
  }

  showBooksView('chapters');
}

function openChapter(bookName, chapterNum) {
  state.currentBook = bookName;
  state.currentChapter = chapterNum;

  const bookData = state.data.bible?.[bookName];
  const chapterData = bookData?.[String(chapterNum)];
  const meta = state.data.bible?._meta?.books?.[bookName];
  const totalChapters = meta?.chapters || 1;

  // Reader header
  $('reader-header').innerHTML = `
    <h2>${bookName}</h2>
    <p>Chapter ${chapterNum}</p>
  `;

  // Verses
  const container = $('verse-container');
  container.innerHTML = '';

  if (!chapterData || Object.keys(chapterData).length === 0) {
    container.innerHTML = `
      <div class="no-data-msg">
        <div class="nd-icon">📖</div>
        <p><strong>${bookName} ${chapterNum}</strong><br>Full verse content coming soon.<br>This app is structured to support the complete Bible — just waiting for data import!</p>
      </div>
    `;
  } else {
    const verses = Object.entries(chapterData).sort((a, b) => Number(a[0]) - Number(b[0]));
    verses.forEach(([num, text], idx) => {
      const row = document.createElement('div');
      row.className = 'verse-row';
      row.style.animationDelay = `${idx * 0.03}s`;
      row.innerHTML = `
        <span class="verse-num">${num}</span>
        <span class="verse-text">${escapeHtml(text)}</span>
      `;
      container.appendChild(row);
    });
  }

  // Navigation buttons
  const prevBtn = $('prev-chapter');
  const nextBtn = $('next-chapter');
  prevBtn.disabled = chapterNum <= 1;
  nextBtn.disabled = chapterNum >= totalChapters;

  prevBtn.onclick = () => openChapter(bookName, chapterNum - 1);
  nextBtn.onclick = () => openChapter(bookName, chapterNum + 1);

  showBooksView('reader');
}

/* ---------- SEARCH ---------- */
let searchTimeout = null;

function setupSearch() {
  const input = $('search-input');
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (!q) {
      $('search-results').innerHTML = renderSearchEmpty();
      return;
    }
    searchTimeout = setTimeout(() => performSearch(q), 300);
  });
  $('search-results').innerHTML = renderSearchEmpty();
}

function renderSearchEmpty() {
  return `<div class="search-empty"><div class="se-icon">🔍</div><p>Type a word or phrase to search all Bible verses</p></div>`;
}

function performSearch(query) {
  const bible = state.data.bible;
  if (!bible) return;

  const results = [];
  const q = query.toLowerCase();

  for (const [book, chapters] of Object.entries(bible)) {
    if (book === '_meta') continue;
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verses)) {
        if (text.toLowerCase().includes(q)) {
          results.push({ book, chapter, verse, text });
          if (results.length >= 200) break;
        }
      }
      if (results.length >= 200) break;
    }
    if (results.length >= 200) break;
  }

  const container = $('search-results');

  if (results.length === 0) {
    container.innerHTML = `<div class="search-empty"><div class="se-icon">📭</div><p>No results found for "<strong>${escapeHtml(query)}</strong>"</p></div>`;
    return;
  }

  const limited = results.length >= 200;
  let html = `<div class="search-count">${results.length}${limited ? '+' : ''} result${results.length !== 1 ? 's' : ''} for "${escapeHtml(query)}"</div>`;

  results.forEach((r) => {
    html += `
      <div class="search-result-card" data-book="${r.book}" data-chapter="${r.chapter}">
        <div class="src-ref">${r.book} ${r.chapter}:${r.verse}</div>
        <div class="src-text">${highlightText(r.text, query)}</div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Click to open chapter
  container.querySelectorAll('.search-result-card').forEach((card) => {
    card.addEventListener('click', () => {
      const book = card.dataset.book;
      const chapter = parseInt(card.dataset.chapter);
      navigateTab('books');
      setTimeout(() => openChapter(book, chapter), 100);
    });
  });
}

/* ---------- STUDY ---------- */
function renderStudy(section) {
  state.studySection = section;

  $$('.study-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.study === section);
  });

  const container = $('study-content');
  const data = state.data[section];

  if (!data) {
    container.innerHTML = `<div class="no-data-msg"><div class="nd-icon">⏳</div><p>Loading content…</p></div>`;
    return;
  }

  let html = `
    <div class="study-banner">
      <div class="study-banner-icon">${getSectionIcon(section)}</div>
      <div class="study-banner-title">${data.title}</div>
      <div class="study-banner-desc">${data.subtitle || data.intro || ''}</div>
    </div>
  `;

  const items = data.items || [];
  items.forEach((item) => {
    html += `
      <div class="study-card">
        <div class="study-card-header">
          <div class="study-card-category">${item.icon || ''} ${item.category}</div>
          <div class="study-card-title">${escapeHtml(item.title)}</div>
        </div>
        <div class="study-card-body">
          <div class="study-card-excerpt">${escapeHtml(item.content)}</div>
          ${item.verse ? `<span class="study-card-ref">${escapeHtml(item.verse)}</span>` : ''}
          ${item.reference ? `<span class="study-card-ref">${escapeHtml(item.reference)}</span>` : ''}
          ${item.key_verse ? `<div style="margin-top:10px;font-style:italic;font-size:13px;color:var(--accent);">"${escapeHtml(item.key_verse)}"</div>` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function getSectionIcon(section) {
  const icons = { goodnews: '🕊️', stories: '📜', apocalypse: '🔥', mysteries: '🌌' };
  return icons[section] || '📖';
}

/* ---------- THEME ---------- */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  const isDark = theme === 'dark';
  $('icon-sun').classList.toggle('hidden', isDark);
  $('icon-moon').classList.toggle('hidden', !isDark);

  const switchEl = $('toggle-theme-switch');
  switchEl.classList.toggle('active', isDark);
  switchEl.setAttribute('aria-checked', isDark);

  // Update meta theme-color
  const metaTheme = document.getElementById('meta-theme-color');
  if (metaTheme) {
    metaTheme.content = isDark ? '#1a1040' : '#f8f4ec';
  }

  localStorage.setItem('bible-theme', theme);
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

/* ---------- FONT SIZE ---------- */
function applyFontSize(size) {
  state.fontSize = size;
  document.documentElement.style.setProperty('--font-size-verse', `${size}px`);
  $('font-size-val').textContent = `${size}px`;
  localStorage.setItem('bible-fontsize', size);
}

/* ---------- PWA: SERVICE WORKER & INSTALL ---------- */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const base = './';
    const swUrl = `${base}service-worker.js`.replace('//', '/');
    const reg = await navigator.serviceWorker.register(swUrl);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.statechange === 'installed' && navigator.serviceWorker.controller) {
          showToast('App updated! Refresh for the latest version.');
        }
      });
    });
  } catch (e) {
    console.warn('Service worker registration failed:', e);
  }
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    $('btn-install').style.display = 'block';
  });

  $('btn-install').addEventListener('click', async () => {
    if (!state.installPrompt) {
      showToast('Open this page in Chrome/Safari to install');
      return;
    }
    state.installPrompt.prompt();
    const { outcome } = await state.installPrompt.userChoice;
    if (outcome === 'accepted') showToast('Holy Bible installed!');
    state.installPrompt = null;
  });
}

/* ---------- QUICK CARD & EXPLORE CLICKS ---------- */
function setupHomeActions() {
  $$('.quick-card').forEach((card) => {
    card.addEventListener('click', () => {
      const book = card.dataset.book;
      const chapter = parseInt(card.dataset.chapter);
      if (book && chapter) {
        navigateTab('books');
        setTimeout(() => openChapter(book, chapter), 50);
      }
    });
  });

  $$('.explore-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (card.dataset.tab) {
        navigateTab(card.dataset.tab);
      } else if (card.dataset.study) {
        navigateTab('study');
        setTimeout(() => renderStudy(card.dataset.study), 50);
      }
    });
  });
}

/* ---------- EVENT WIRING ---------- */
function wireEvents() {
  // Bottom nav
  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => navigateTab(btn.dataset.tab));
  });

  // Back button
  $('btn-back').addEventListener('click', goBack);

  // Theme buttons
  $('btn-theme').addEventListener('click', toggleTheme);
  $('toggle-theme-switch').addEventListener('click', toggleTheme);

  // Font size
  $('font-decrease').addEventListener('click', () => {
    if (state.fontSize > 12) applyFontSize(state.fontSize - 2);
  });
  $('font-increase').addEventListener('click', () => {
    if (state.fontSize < 28) applyFontSize(state.fontSize + 2);
  });

  // Study tabs
  $$('.study-tab').forEach((tab) => {
    tab.addEventListener('click', () => renderStudy(tab.dataset.study));
  });

  // Home explore/quick cards
  setupHomeActions();

  // Install
  setupInstallPrompt();
}

/* ---------- OFFLINE DETECTION ---------- */
function setupOfflineDetection() {
  window.addEventListener('offline', () => showToast('📵 You are offline — reading cached content'));
  window.addEventListener('online', () => showToast('✅ Back online'));
}

/* ---------- URL PARAMS ---------- */
function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const book = params.get('book');
  const chapter = params.get('chapter');

  if (tab) navigateTab(tab);
  if (book && chapter) {
    navigateTab('books');
    setTimeout(() => openChapter(book, parseInt(chapter)), 200);
  }
}

/* ---------- INIT ---------- */
async function init() {
  // Load saved preferences
  const savedTheme = localStorage.getItem('bible-theme') || 'dark';
  const savedFontSize = parseInt(localStorage.getItem('bible-fontsize') || '18');

  applyTheme(savedTheme);
  applyFontSize(savedFontSize);

  // Wire all events
  wireEvents();
  setupSearch();
  setupOfflineDetection();

  // Load all data
  await loadData();

  // Set daily verse & render home
  setDailyVerse();

  // Register service worker
  registerServiceWorker();

  // Handle URL params
  handleUrlParams();

  // Initial study render
  renderStudy('goodnews');

  // Hide splash, show app
  const splash = $('splash');
  const app = $('app');

  splash.classList.add('fade-out');
  app.classList.remove('hidden');

  setTimeout(() => splash.remove(), 700);
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
