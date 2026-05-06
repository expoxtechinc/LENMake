/* ===== HOLY BIBLE PWA — STANDALONE VERSION ===== */

const state = {
  tab: 'home',
  booksView: 'list',
  currentBook: null,
  currentChapter: null,
  studySection: 'goodnews',
  fontSize: 18,
  theme: 'dark',
  data: { bible: null, goodnews: null, stories: null, apocalypse: null, mysteries: null },
  searchQuery: '',
  installPrompt: null,
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

async function loadData() {
  const fetchJSON = async (name) => {
    try {
      const res = await fetch(name);
      if (!res.ok) throw new Error(res.status);
      return res.json();
    } catch (e) { console.warn('Failed to load ' + name, e); return null; }
  };
  const [bible, goodnews, stories, apocalypse, mysteries] = await Promise.all([
    fetchJSON('bible.json'), fetchJSON('goodnews.json'), fetchJSON('stories.json'),
    fetchJSON('apocalypse.json'), fetchJSON('mysteries.json'),
  ]);
  state.data = { bible, goodnews, stories, apocalypse, mysteries };
}

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
  $('daily-verse-text').textContent = '\u201c' + verse.text + '\u201d';
  $('daily-verse-ref').textContent = '\u2014 ' + verse.ref;
}

function navigateTab(tab) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  state.tab = tab;
  var page = $('page-' + tab);
  if (page) page.classList.add('active');
  var navBtn = document.querySelector('.nav-btn[data-tab="' + tab + '"]');
  if (navBtn) navBtn.classList.add('active');
  updateBackButton();
  if (tab === 'books') renderBooksList();
  if (tab === 'study') renderStudy(state.studySection);
  if (tab === 'search') $('search-input').focus();
}

function updateBackButton() {
  var showBack = state.tab === 'books' && state.booksView !== 'list';
  $('btn-back').classList.toggle('hidden', !showBack);
  var titleEl = $('header-title');
  if (state.tab === 'books' && state.booksView === 'chapters') {
    titleEl.innerHTML = '<span class="header-cross">\u271D</span><span>' + escapeHtml(state.currentBook) + '</span>';
  } else if (state.tab === 'books' && state.booksView === 'reader') {
    titleEl.innerHTML = '<span class="header-cross">\u271D</span><span>' + escapeHtml(state.currentBook) + ' ' + state.currentChapter + '</span>';
  } else {
    titleEl.innerHTML = '<span class="header-cross">\u271D</span><span>Holy Bible</span>';
  }
}

function goBack() {
  if (state.tab === 'books') {
    if (state.booksView === 'reader') showBooksView('chapters');
    else if (state.booksView === 'chapters') showBooksView('list');
  }
}

function showBooksView(view) {
  state.booksView = view;
  $('books-list').classList.toggle('hidden', view !== 'list');
  $('chapters-view').classList.toggle('hidden', view !== 'chapters');
  $('reader-view').classList.toggle('hidden', view !== 'reader');
  updateBackButton();
  var views = { list: 'books-list', chapters: 'chapters-view', reader: 'reader-view' };
  var el = $(views[view]);
  if (el) el.scrollTop = 0;
}

function renderBooksList() {
  var meta = state.data.bible && state.data.bible._meta && state.data.bible._meta.books;
  if (!meta) return;
  var otContainer = $('ot-books');
  var ntContainer = $('nt-books');
  otContainer.innerHTML = '';
  ntContainer.innerHTML = '';
  var booksArr = Object.entries(meta).sort(function(a,b){ return a[1].order - b[1].order; });
  var ot = booksArr.filter(function(e){ return e[1].testament === 'OT'; });
  var nt = booksArr.filter(function(e){ return e[1].testament === 'NT'; });
  function makeBookBtn(name, m, idx) {
    var btn = document.createElement('button');
    btn.className = 'book-btn';
    btn.innerHTML = '<span class="book-btn-num">' + (idx+1) + '</span><span><div class="book-btn-name">' + escapeHtml(name) + '</div><div class="book-btn-chapters">' + m.chapters + ' ch.</div></span>';
    btn.addEventListener('click', function(){ openBook(name); });
    return btn;
  }
  ot.forEach(function(e,i){ otContainer.appendChild(makeBookBtn(e[0], e[1], i)); });
  nt.forEach(function(e,i){ ntContainer.appendChild(makeBookBtn(e[0], e[1], i)); });
}

function openBook(bookName) {
  state.currentBook = bookName;
  var meta = state.data.bible && state.data.bible._meta && state.data.bible._meta.books && state.data.bible._meta.books[bookName];
  var chapters = (meta && meta.chapters) || 50;
  var bookData = (state.data.bible && state.data.bible[bookName]) || {};
  $('chapter-list-title').textContent = bookName;
  var grid = $('chapter-grid');
  grid.innerHTML = '';
  for (var i = 1; i <= chapters; i++) {
    (function(num) {
      var btn = document.createElement('button');
      btn.className = 'chapter-btn';
      if (bookData[String(num)]) btn.classList.add('has-data');
      btn.textContent = num;
      btn.addEventListener('click', function(){ openChapter(bookName, num); });
      grid.appendChild(btn);
    })(i);
  }
  showBooksView('chapters');
}

function openChapter(bookName, chapterNum) {
  state.currentBook = bookName;
  state.currentChapter = chapterNum;
  var bookData = state.data.bible && state.data.bible[bookName];
  var chapterData = bookData && bookData[String(chapterNum)];
  var meta = state.data.bible && state.data.bible._meta && state.data.bible._meta.books && state.data.bible._meta.books[bookName];
  var totalChapters = (meta && meta.chapters) || 1;
  $('reader-header').innerHTML = '<h2>' + escapeHtml(bookName) + '</h2><p>Chapter ' + chapterNum + '</p>';
  var container = $('verse-container');
  container.innerHTML = '';
  if (!chapterData || Object.keys(chapterData).length === 0) {
    container.innerHTML = '<div class="no-data-msg"><div class="nd-icon">📖</div><p><strong>' + escapeHtml(bookName) + ' ' + chapterNum + '</strong><br>Full verse content coming soon.<br>This app supports the complete Bible — ready for full data import!</p></div>';
  } else {
    var verses = Object.entries(chapterData).sort(function(a,b){ return Number(a[0]) - Number(b[0]); });
    verses.forEach(function(v, idx) {
      var row = document.createElement('div');
      row.className = 'verse-row';
      row.style.animationDelay = (idx * 0.03) + 's';
      row.innerHTML = '<span class="verse-num">' + v[0] + '</span><span class="verse-text">' + escapeHtml(v[1]) + '</span>';
      container.appendChild(row);
    });
  }
  var prevBtn = $('prev-chapter');
  var nextBtn = $('next-chapter');
  prevBtn.disabled = chapterNum <= 1;
  nextBtn.disabled = chapterNum >= totalChapters;
  prevBtn.onclick = function(){ openChapter(bookName, chapterNum - 1); };
  nextBtn.onclick = function(){ openChapter(bookName, chapterNum + 1); };
  showBooksView('reader');
}

var searchTimeout = null;
function setupSearch() {
  var input = $('search-input');
  input.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    var q = input.value.trim();
    if (!q) { $('search-results').innerHTML = renderSearchEmpty(); return; }
    searchTimeout = setTimeout(function(){ performSearch(q); }, 300);
  });
  $('search-results').innerHTML = renderSearchEmpty();
}

function renderSearchEmpty() {
  return '<div class="search-empty"><div class="se-icon">🔍</div><p>Type a word or phrase to search all Bible verses</p></div>';
}

function performSearch(query) {
  var bible = state.data.bible;
  if (!bible) return;
  var results = [];
  var q = query.toLowerCase();
  var books = Object.entries(bible);
  for (var bi = 0; bi < books.length; bi++) {
    if (books[bi][0] === '_meta') continue;
    var chapters = Object.entries(books[bi][1]);
    for (var ci = 0; ci < chapters.length; ci++) {
      var verses = Object.entries(chapters[ci][1]);
      for (var vi = 0; vi < verses.length; vi++) {
        if (verses[vi][1].toLowerCase().indexOf(q) !== -1) {
          results.push({ book: books[bi][0], chapter: chapters[ci][0], verse: verses[vi][0], text: verses[vi][1] });
          if (results.length >= 200) break;
        }
      }
      if (results.length >= 200) break;
    }
    if (results.length >= 200) break;
  }
  var container = $('search-results');
  if (results.length === 0) {
    container.innerHTML = '<div class="search-empty"><div class="se-icon">📭</div><p>No results found for &ldquo;<strong>' + escapeHtml(query) + '</strong>&rdquo;</p></div>';
    return;
  }
  var limited = results.length >= 200;
  var html = '<div class="search-count">' + results.length + (limited ? '+' : '') + ' result' + (results.length !== 1 ? 's' : '') + ' for &ldquo;' + escapeHtml(query) + '&rdquo;</div>';
  results.forEach(function(r) {
    html += '<div class="search-result-card" data-book="' + escapeHtml(r.book) + '" data-chapter="' + r.chapter + '"><div class="src-ref">' + escapeHtml(r.book) + ' ' + r.chapter + ':' + r.verse + '</div><div class="src-text">' + highlightText(r.text, query) + '</div></div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('.search-result-card').forEach(function(card) {
    card.addEventListener('click', function() {
      navigateTab('books');
      setTimeout(function(){ openChapter(card.dataset.book, parseInt(card.dataset.chapter)); }, 100);
    });
  });
}

function renderStudy(section) {
  state.studySection = section;
  $$('.study-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.study === section); });
  var container = $('study-content');
  var data = state.data[section];
  if (!data) { container.innerHTML = '<div class="no-data-msg"><div class="nd-icon">\u23f3</div><p>Loading content\u2026</p></div>'; return; }
  var icons = { goodnews: '🕊️', stories: '📜', apocalypse: '🔥', mysteries: '🌌' };
  var html = '<div class="study-banner"><div class="study-banner-icon">' + (icons[section] || '📖') + '</div><div class="study-banner-title">' + escapeHtml(data.title) + '</div><div class="study-banner-desc">' + escapeHtml(data.subtitle || data.intro || '') + '</div></div>';
  (data.items || []).forEach(function(item) {
    html += '<div class="study-card"><div class="study-card-header"><div class="study-card-category">' + (item.icon || '') + ' ' + escapeHtml(item.category) + '</div><div class="study-card-title">' + escapeHtml(item.title) + '</div></div><div class="study-card-body"><div class="study-card-excerpt">' + escapeHtml(item.content) + '</div>' + (item.verse ? '<span class="study-card-ref">' + escapeHtml(item.verse) + '</span>' : '') + (item.reference ? '<span class="study-card-ref">' + escapeHtml(item.reference) + '</span>' : '') + (item.key_verse ? '<div style="margin-top:10px;font-style:italic;font-size:13px;color:var(--accent)">\u201c' + escapeHtml(item.key_verse) + '\u201d</div>' : '') + '</div></div>';
  });
  container.innerHTML = html;
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  var isDark = theme === 'dark';
  $('icon-sun').classList.toggle('hidden', isDark);
  $('icon-moon').classList.toggle('hidden', !isDark);
  $('toggle-theme-switch').classList.toggle('active', isDark);
  $('toggle-theme-switch').setAttribute('aria-checked', isDark);
  var m = document.getElementById('meta-theme-color');
  if (m) m.content = isDark ? '#1a1040' : '#f8f4ec';
  localStorage.setItem('bible-theme', theme);
}

function applyFontSize(size) {
  state.fontSize = size;
  document.documentElement.style.setProperty('--font-size-verse', size + 'px');
  $('font-size-val').textContent = size + 'px';
  localStorage.setItem('bible-fontsize', size);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('service-worker.js').catch(function(e){ console.warn('SW failed:', e); });
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    state.installPrompt = e;
  });
  $('btn-install').addEventListener('click', function() {
    if (!state.installPrompt) { showToast('Open in Chrome or Safari to install'); return; }
    state.installPrompt.prompt();
    state.installPrompt.userChoice.then(function(r){ if (r.outcome === 'accepted') showToast('Holy Bible installed!'); state.installPrompt = null; });
  });
}

function wireEvents() {
  $$('.nav-btn').forEach(function(btn){ btn.addEventListener('click', function(){ navigateTab(btn.dataset.tab); }); });
  $('btn-back').addEventListener('click', goBack);
  $('btn-theme').addEventListener('click', function(){ applyTheme(state.theme === 'dark' ? 'light' : 'dark'); });
  $('toggle-theme-switch').addEventListener('click', function(){ applyTheme(state.theme === 'dark' ? 'light' : 'dark'); });
  $('font-decrease').addEventListener('click', function(){ if (state.fontSize > 12) applyFontSize(state.fontSize - 2); });
  $('font-increase').addEventListener('click', function(){ if (state.fontSize < 28) applyFontSize(state.fontSize + 2); });
  $$('.study-tab').forEach(function(tab){ tab.addEventListener('click', function(){ renderStudy(tab.dataset.study); }); });
  $$('.quick-card').forEach(function(card){
    card.addEventListener('click', function(){
      var book = card.dataset.book; var chapter = parseInt(card.dataset.chapter);
      if (book && chapter) { navigateTab('books'); setTimeout(function(){ openChapter(book, chapter); }, 50); }
    });
  });
  $$('.explore-card').forEach(function(card){
    card.addEventListener('click', function(){
      if (card.dataset.tab) { navigateTab(card.dataset.tab); }
      else if (card.dataset.study) { navigateTab('study'); setTimeout(function(){ renderStudy(card.dataset.study); }, 50); }
    });
  });
  setupInstallPrompt();
  window.addEventListener('offline', function(){ showToast('\uD83D\uDCF5 You are offline — reading cached content'); });
  window.addEventListener('online', function(){ showToast('\u2705 Back online'); });
}

async function init() {
  var savedTheme = localStorage.getItem('bible-theme') || 'dark';
  var savedFontSize = parseInt(localStorage.getItem('bible-fontsize') || '18');
  applyTheme(savedTheme);
  applyFontSize(savedFontSize);
  wireEvents();
  setupSearch();
  await loadData();
  setDailyVerse();
  renderStudy('goodnews');
  registerServiceWorker();
  var splash = $('splash');
  var app = $('app');
  splash.classList.add('fade-out');
  app.classList.remove('hidden');
  setTimeout(function(){ splash.remove(); }, 700);
}

document.addEventListener('DOMContentLoaded', init);
