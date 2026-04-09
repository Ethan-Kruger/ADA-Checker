document.addEventListener('DOMContentLoaded', () => {
  // ... existing settings.js code ...

 // History: initial render
  renderHistory();

  // History: update when a new check is added (from checker.js)
  window.addEventListener('ada-check-history-updated', () => {
    renderHistory();
  });

  // History: clear button
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear all saved accessibility checks?')) return;
      saveHistory([]);
      renderHistory();
    });
  }
});
// ===== Check history storage (shared with checker.js) =====
const SETTINGS_HISTORY_KEY = 'ada-check-history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(SETTINGS_HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Failed to load history', e);
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(SETTINGS_HISTORY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save history', e);
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = loadHistory();

  if (!history.length) {
    container.innerHTML = '<p class="history-empty">No checks recorded yet. Run an accessibility check to see your history here.</p>';
    return;
  }
  function openHistoryEntry(id) {
    const history = loadHistory();
    consts entry = history.find(e => e.id === id);
    if (!entry || !entry.html){
      alert('This history item does not have stored HTML yet. Run a new check to save full details.');
      return;
    }
    const checkerPanel = document.getElementById('panel-checker');
    if(checkerPanel){
      checkerPanel.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
    const htmlInput = document.getElementById('html-input');
    const resultsList = document.getElementById('results-list');
    const scoreE1 = document.getElementById('checker-score');
    if (!htmlInput || resultsList){
      alert('Checker UI is not available on this page.');
      return;
    }
    htmlInput.value = entry.html;

    if (typeof window.checkAccessibility !== 'function'){
      alert('Checker script not loaded.');
      return;
    }
    const result = window.checkAccessibility(entry.html);
    const violations = (result && result.violations) || [];
    if (scoreE1){
      if (typeof result.score === 'number'){
        scoreE1.hidden = false;
        scoreE1.textContent = `Score: ${Math.round(result.score)}/100`;
      }else{
        scoreE1.hidden = true;
      }
    }
    if (typeof window.renderResults === 'function'){
      window.renderResults(violations, resultsList);
    }else{
      resultsList.innerHTML = '';
      violations.forEach(v => { const li = document.createElement('li');
                               li.textContent = `${v.severity || 'info'} - ${v.message || 'Issue'}`;
                               resultList.appendChild(li);
                              });
    }
  }
  
    

  const list = document.createElement('ul');
  list.className = 'history-list';

  history.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const date = new Date(entry.timestamp || Date.now());
    const dateStr = date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = entry.title || 'Manual HTML check';

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';

    const scorePart = (typeof entry.score === 'number')
      ? `Score: ${entry.score}/100`
      : 'Score: N/A';

    const s = entry.summary || {};
    const detailsPart = `Issues: ${s.total || 0} (C:${s.critical || 0} S:${s.serious || 0} M:${s.moderate || 0} m:${s.minor || 0})`;

    meta.textContent = `${scorePart} • ${detailsPart} • ${dateStr}`;

    li.appendChild(title);
    li.appendChild(meta);
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `View results for ${title.textContent}`);
    li.addEventListener('click', () =>  openHistoryEntry(entery.id));
    li.addEventListener('keypress', (ev) => {
      if (ev.key === 'enter' || ev.key === ' '){
        ev.preventDefault();
        openHistoryEntry(entry.id);
      }
    });
    list.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(list);
}
(function () {
  'use strict';

  // ─── Sidebar position → CSS custom property ──────────────────────────────
  // Panels are position:fixed and should start right where the sidebar ends.
  var sidebar = document.querySelector('.settings-sidebar');

  function syncSidebarRight() {
    if (!sidebar) return;
    var r = sidebar.getBoundingClientRect();
    document.documentElement.style.setProperty('--sidebar-right', r.right + 'px');
  }
  const HISTORY_KEY = 'ada-check-history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Failed to load history', e);
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Failed to save history', e);
  }
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const history = loadHistory();

  if (!history.length) {
    container.innerHTML = '<p class="history-empty">No checks recorded yet. Run an accessibility check to see your history here.</p>';
    return;
  }

  const list = document.createElement('ul');
  list.className = 'history-list';

  history.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const title = document.createElement('div');
    title.className = 'history-item-title';
    title.textContent = entry.title || 'Manual HTML check';

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';

    const scorePart = (typeof entry.score === 'number')
      ? `Score: ${entry.score}/100`
      : 'Score: N/A';

    const counts = entry.summary || {};
    const detailsPart = `Issues: ${counts.total || 0} (C:${counts.critical || 0} S:${counts.serious || 0} M:${counts.moderate || 0} m:${counts.minor || 0})`;

    meta.textContent = `${scorePart} • ${detailsPart} • ${dateStr}`;

    li.appendChild(title);
    li.appendChild(meta);

    list.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(list);
}

  syncSidebarRight();
  window.addEventListener('resize', syncSidebarRight);

  // ─── Create and inject backdrop ──────────────────────────────────────────
  var backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.id = 'panel-backdrop';
  document.body.appendChild(backdrop);

  // ─── Element references ───────────────────────────────────────────────────
  var panels   = Array.from(document.querySelectorAll('.settings-panel'));
  var navItems = Array.from(document.querySelectorAll('.settings-nav-item'));

  // ─── Inject close buttons into each panel header ─────────────────────────
  var closeSVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line>' +
    '<line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  panels.forEach(function (panel) {
    var heading = panel.querySelector('.panel-title');
    if (!heading) return;

    var header = document.createElement('div');
    header.className = 'panel-header';
    heading.parentNode.insertBefore(header, heading);
    header.appendChild(heading);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'panel-close-btn';
    closeBtn.setAttribute('aria-label', 'Close panel');
    closeBtn.innerHTML = closeSVG;
    header.appendChild(closeBtn);

    closeBtn.addEventListener('click', function () {
      closePanel(panel.id.replace('panel-', ''));
    });
  });

  // ─── Inject placeholder in the content area ──────────────────────────────
  var contentArea = document.querySelector('.settings-content');
  if (contentArea) {
    var placeholder = document.createElement('div');
    placeholder.className = 'settings-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML =
      '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' +
      '</svg>' +
      '<p>Select a section from the left</p>';
    contentArea.insertBefore(placeholder, contentArea.firstChild);
  }

  // ─── Open / close panel ───────────────────────────────────────────────────
  var activePanel = null;

  function openPanel(panelId) {
    syncSidebarRight(); // refresh position before opening
    var panel = document.getElementById('panel-' + panelId);
    if (!panel) return;

    if (activePanel && activePanel !== panel) {
      activePanel.classList.remove('active');
      activePanel.removeAttribute('role');
      activePanel.removeAttribute('aria-modal');
    }

    panel.classList.add('active');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    backdrop.classList.add('visible');
    activePanel = panel;

    navItems.forEach(function (btn) {
      var on = btn.dataset.panel === panelId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-expanded', String(on));
    });

    // Focus the close button
    var closeBtn = panel.querySelector('.panel-close-btn');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
  }

  function closePanel(returnToPanelId) {
    panels.forEach(function (p) {
      p.classList.remove('active');
      p.removeAttribute('role');
      p.removeAttribute('aria-modal');
    });
    backdrop.classList.remove('visible');
    navItems.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Return focus to the triggering nav button
    if (returnToPanelId) {
      var navBtn = document.querySelector('[data-panel="' + returnToPanelId + '"]');
      if (navBtn) navBtn.focus();
    }

    activePanel = null;
  }

  // ─── Nav button clicks ────────────────────────────────────────────────────
  navItems.forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var panelId = btn.dataset.panel;
      if (btn.classList.contains('active')) {
        closePanel(panelId);
      } else {
        openPanel(panelId);
      }
    });
  });

  // ─── Backdrop click closes panel ──────────────────────────────────────────
  backdrop.addEventListener('click', function () {
    if (activePanel) {
      closePanel(activePanel.id.replace('panel-', ''));
    }
  });

  // ─── Escape key closes panel ──────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePanel) {
      closePanel(activePanel.id.replace('panel-', ''));
    }
  });

  // ─── Theme ────────────────────────────────────────────────────────────────
  var themeButtons = Array.from(document.querySelectorAll('.theme-option'));
  var savedTheme   = localStorage.getItem('ada-theme') || 'dark';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ada-theme', theme);
    themeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.theme === theme));
    });
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyTheme(btn.dataset.theme); });
  });
  applyTheme(savedTheme);

  // ─── WCAG level ───────────────────────────────────────────────────────────
  var wcagButtons = Array.from(document.querySelectorAll('.wcag-option'));
  var savedWcag   = localStorage.getItem('ada-wcag') || 'AA';

  function applyWcag(level) {
    localStorage.setItem('ada-wcag', level);
    wcagButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.wcag === level));
    });
  }

  wcagButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyWcag(btn.dataset.wcag); });
  });
  applyWcag(savedWcag);

  // ─── Font size ────────────────────────────────────────────────────────────
  var sizeButtons = Array.from(document.querySelectorAll('.font-size-option'));
  var sizePreview = document.getElementById('font-size-preview');
  var savedSize   = localStorage.getItem('ada-font-size') || 'medium';
  var sizeMap     = { small: '0.875rem', medium: '1rem', large: '1.125rem', xlarge: '1.25rem' };

  function applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('ada-font-size', size);
    sizeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.size === size));
    });
    if (sizePreview) {
      sizePreview.style.fontSize = sizeMap[size] || '1rem';
    }
  }

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFontSize(btn.dataset.size); });
  });
  applyFontSize(savedSize);

  // ─── Font type ────────────────────────────────────────────────────────────
  var fontButtons = Array.from(document.querySelectorAll('.font-type-option'));
  var savedFont   = localStorage.getItem('ada-font') || 'system';

  function applyFont(font) {
    document.documentElement.setAttribute('data-font', font);
    localStorage.setItem('ada-font', font);
    fontButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.font === font));
    });
  }

  fontButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFont(btn.dataset.font); });
  });
  applyFont(savedFont);

  // ─── Profile ──────────────────────────────────────────────────────────────
  var profileName   = document.getElementById('profile-name');
  var profileEmail  = document.getElementById('profile-email');
  var saveProfileBtn = document.getElementById('save-profile-btn');

  if (profileName)  profileName.value  = localStorage.getItem('ada-profile-name')  || '';
  if (profileEmail) profileEmail.value = localStorage.getItem('ada-profile-email') || '';

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', function () {
      if (profileName)  localStorage.setItem('ada-profile-name',  profileName.value);
      if (profileEmail) localStorage.setItem('ada-profile-email', profileEmail.value);
      saveProfileBtn.textContent = 'Saved!';
      setTimeout(function () { saveProfileBtn.textContent = 'Save Profile'; }, 2000);
    });
  }

  // ─── History ──────────────────────────────────────────────────────────────
  var historyList    = document.getElementById('history-list');
  var clearHistoryBtn = document.getElementById('clear-history-btn');

  function renderHistory() {
    if (!historyList) return;
    var history = JSON.parse(localStorage.getItem('ada-history') || '[]');
    if (history.length === 0) {
      historyList.innerHTML =
        '<p class="history-empty">No checks recorded yet. Run an accessibility check to see your history here.</p>';
      return;
    }
    var html = '';
    history.slice().reverse().forEach(function (entry) {
      html +=
        '<div class="history-entry">' +
          '<div>' +
            '<div class="history-score">' + entry.score + '/100</div>' +
            '<div class="history-meta">' + entry.violations +
              ' violation' + (entry.violations !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<div class="history-meta">' + entry.date + '</div>' +
        '</div>';
    });
    historyList.innerHTML = html;
  }

  renderHistory();

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function () {
      localStorage.removeItem('ada-history');
      renderHistory();
    });
  }

}());
