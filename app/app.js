/* Vice City Trophy Guide — checklist tracker.
   Loads app/data/trophies.json, renders the 55 trophies, and saves
   progress in localStorage. No network requests besides the local data
   file; no third-party code. */
(function () {
  'use strict';

  var STORAGE_KEY = 'gta6-trophy-progress-v1';
  var DATA_URL = 'data/trophies.json';
  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var KIND_LABELS = {
    story: 'Story',
    missable: 'Missable',
    collectibles: 'Collectibles',
    activities: 'Activities',
    online: 'Online'
  };

  var trophies = [];
  var earned = new Set();
  var state = {
    filter: 'all',
    query: '',
    sort: 'official',
    spoiler: false,
    earnedOnly: false,
    unearnedOnly: false
  };

  var listEl = document.getElementById('trophyList');
  var metaEl = document.getElementById('listMeta');
  var emptyEl = document.getElementById('emptyState');
  var progressTextEl = document.getElementById('progressText');
  var progressPctEl = document.getElementById('progressPct');
  var progressFillEl = document.getElementById('progressFill');
  var filterNoteEl = document.getElementById('filterNote');
  var ioStatusEl = document.getElementById('ioStatus');

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (Array.isArray(saved.earned)) {
        saved.earned.forEach(function (id) { earned.add(Number(id)); });
      }
      if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
    } catch (err) {
      /* Corrupt saved progress is ignored; the checklist still works. */
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        earned: Array.from(earned).sort(function (a, b) { return a - b; }),
        spoiler: state.spoiler,
        savedAt: new Date().toISOString()
      }));
    } catch (err) {
      setStatus('Could not save progress in this browser.');
    }
  }

  function setStatus(text) {
    ioStatusEl.textContent = text;
    if (text) {
      window.setTimeout(function () { ioStatusEl.textContent = ''; }, 4000);
    }
  }

  function applyUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var filter = params.get('filter');
    if (filter && KIND_LABELS[filter] || filter === 'all') state.filter = filter;
    if (params.get('spoiler') === '1') state.spoiler = true;
    var sort = params.get('sort');
    if (sort === 'grade' || sort === 'name' || sort === 'official') state.sort = sort;
  }

  function isSpoilerHidden(trophy) {
    return state.spoiler && trophy.kind === 'story' && !earned.has(trophy.id);
  }

  function visibleTrophies() {
    var query = state.query.trim().toLowerCase();
    var list = trophies.filter(function (t) {
      if (state.filter === 'missable' && !t.missable) return false;
      if (state.filter === 'online') return false;
      if (state.filter !== 'all' && state.filter !== 'missable' && t.kind !== state.filter) return false;
      if (state.earnedOnly && !earned.has(t.id)) return false;
      if (state.unearnedOnly && earned.has(t.id)) return false;
      if (query) {
        var hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
        if (hay.indexOf(query) === -1) return false;
      }
      return true;
    });
    if (state.sort === 'grade') {
      list.sort(function (a, b) {
        return (GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]) || (a.id - b.id);
      });
    } else if (state.sort === 'name') {
      list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else {
      list.sort(function (a, b) { return a.id - b.id; });
    }
    return list;
  }

  function renderProgress() {
    var total = trophies.length;
    var done = earned.size;
    var pct = total ? Math.round((done / total) * 100) : 0;
    progressTextEl.textContent = done + ' of ' + total + ' earned';
    progressPctEl.textContent = pct + '%';
    progressFillEl.style.width = pct + '%';
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var kind = el.getAttribute('data-count');
      var n = kind === 'all' ? total
        : kind === 'missable' ? trophies.filter(function (t) { return t.missable; }).length
        : kind === 'online' ? 0
        : trophies.filter(function (t) { return t.kind === kind; }).length;
      var got = kind === 'all' ? done
        : kind === 'missable' ? trophies.filter(function (t) { return t.missable && earned.has(t.id); }).length
        : kind === 'online' ? 0
        : trophies.filter(function (t) { return t.kind === kind && earned.has(t.id); }).length;
      el.textContent = got + '/' + n;
    });
    document.querySelectorAll('[data-stage]').forEach(function (el) {
      var stage = el.getAttribute('data-stage');
      var ids;
      if (stage === 'story') ids = trophies.filter(function (t) { return t.kind === 'story' && t.id !== 1; }).map(function (t) { return t.id; });
      else if (stage === 'strands') ids = [22, 23, 24, 25, 26, 27, 29];
      else if (stage === 'activities') ids = trophies.filter(function (t) { return t.kind === 'activities'; }).map(function (t) { return t.id; });
      else ids = trophies.filter(function (t) { return t.kind === 'collectibles'; }).map(function (t) { return t.id; });
      var got = ids.filter(function (id) { return earned.has(id); }).length;
      el.textContent = 'Progress: ' + got + ' of ' + ids.length + ' in this stage';
    });
  }

  function renderList() {
    var list = visibleTrophies();
    metaEl.textContent = 'Showing ' + list.length + ' of ' + trophies.length + ' trophies · ' +
      earned.size + ' earned';
    emptyEl.hidden = list.length !== 0;
    if (state.filter === 'online') {
      filterNoteEl.hidden = false;
      filterNoteEl.textContent = 'The official list holds no online trophies: all 55 are earned in single-player, so this filter is empty by design.';
    } else if (state.filter === 'missable') {
      filterNoteEl.hidden = false;
      filterNoteEl.textContent = 'Only 1 trophy is flagged missable — Positive Mental Attitude (Chapter 1). Every other trophy can be earned after the story.';
    } else {
      filterNoteEl.hidden = true;
    }
    listEl.innerHTML = '';
    list.forEach(function (t) {
      var li = document.createElement('li');
      li.className = 'trophy' + (earned.has(t.id) ? ' earned' : '');
      li.dataset.id = t.id;
      var hidden = isSpoilerHidden(t);
      var name = hidden ? 'Hidden story trophy' : t.name;
      var desc = hidden ? 'Hidden until earned — spoiler-free mode is on.' : t.description;
      var tags = '<span class="tag grade-' + esc(t.grade) + '">' + esc(gradeLabel(t.grade)) + '</span>' +
        '<span class="tag">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>' +
        (t.missable ? '<span class="tag missable">Missable</span>' : '') +
        (t.count ? '<span class="tag">Count: ' + esc(t.count) + '</span>' : '') +
        (earned.has(t.id) ? '<span class="tag earned-tag">Earned ✓</span>' : '');
      var sources = (t.sources || []).map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>';
      }).join(' · ');
      li.innerHTML =
        '<div class="trophy-head">' +
          '<input type="checkbox" class="trophy-check" aria-label="Mark ' + esc(name) + ' as earned"' + (earned.has(t.id) ? ' checked' : '') + '>' +
          '<div class="trophy-main">' +
            '<h3 class="trophy-name">' + esc(name) + '</h3>' +
            '<p class="trophy-desc">' + esc(desc) + '</p>' +
            '<p class="tags">' + tags + '</p>' +
            '<button type="button" class="guide-toggle" aria-expanded="false">Show guide</button>' +
            '<div class="guide" hidden>' +
              (hidden
                ? '<h4>Guide</h4><p class="spoiler-mask">Guide hidden — earn this story trophy (or turn spoiler-free mode off) to read it.</p>'
                : '<h4>Guide</h4><p>' + esc(t.guide) + '</p>' +
                  '<p class="sources"><strong>Sources:</strong> ' + sources + '</p>') +
            '</div>' +
          '</div>' +
        '</div>';
      li.querySelector('.trophy-check').addEventListener('change', function (ev) {
        if (ev.target.checked) earned.add(t.id); else earned.delete(t.id);
        save();
        renderAll();
      });
      var toggle = li.querySelector('.guide-toggle');
      var guide = li.querySelector('.guide');
      toggle.addEventListener('click', function () {
        var open = guide.hidden;
        guide.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Hide guide' : 'Show guide';
      });
      listEl.appendChild(li);
    });
  }

  function renderAll() {
    renderProgress();
    renderList();
  }

  function exportProgress() {
    var payload = {
      game: 'Grand Theft Auto VI',
      guide: 'Vice City Trophy Guide',
      exportedAt: new Date().toISOString(),
      earned: Array.from(earned).sort(function (a, b) { return a - b; }),
      spoiler: state.spoiler
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    setStatus('Progress exported: ' + earned.size + ' trophies.');
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var valid = new Set(trophies.map(function (t) { return t.id; }));
        var next = new Set();
        ids.forEach(function (id) {
          var n = Number(id);
          if (valid.has(n)) next.add(n);
        });
        earned = next;
        if (typeof data.spoiler === 'boolean') {
          state.spoiler = data.spoiler;
          document.getElementById('spoilerToggle').checked = state.spoiler;
        }
        save();
        renderAll();
        setStatus('Progress imported: ' + earned.size + ' trophies.');
      } catch (err) {
        setStatus('That file is not a progress export from this guide.');
      }
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    if (!window.confirm('Reset all progress? This clears every ticked trophy.')) return;
    earned = new Set();
    save();
    renderAll();
    setStatus('Progress reset.');
  }

  function bindControls() {
    document.getElementById('filters').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-filter]');
      if (!btn) return;
      state.filter = btn.getAttribute('data-filter');
      document.querySelectorAll('#filters .chip').forEach(function (c) {
        c.classList.toggle('active', c === btn);
      });
      renderList();
    });
    document.getElementById('searchBox').addEventListener('input', function (ev) {
      state.query = ev.target.value;
      renderList();
    });
    document.getElementById('sortBox').addEventListener('change', function (ev) {
      state.sort = ev.target.value;
      renderList();
    });
    document.getElementById('spoilerToggle').addEventListener('change', function (ev) {
      state.spoiler = ev.target.checked;
      save();
      renderList();
    });
    document.getElementById('earnedOnlyToggle').addEventListener('change', function (ev) {
      state.earnedOnly = ev.target.checked;
      if (state.earnedOnly) {
        state.unearnedOnly = false;
        document.getElementById('unearnedOnlyToggle').checked = false;
      }
      renderList();
    });
    document.getElementById('unearnedOnlyToggle').addEventListener('change', function (ev) {
      state.unearnedOnly = ev.target.checked;
      if (state.unearnedOnly) {
        state.earnedOnly = false;
        document.getElementById('earnedOnlyToggle').checked = false;
      }
      renderList();
    });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) importProgress(ev.target.files[0]);
      ev.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', resetProgress);
  }

  function init() {
    loadSaved();
    applyUrlParams();
    document.getElementById('spoilerToggle').checked = state.spoiler;
    document.getElementById('sortBox').value = state.sort;
    document.querySelectorAll('#filters .chip').forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-filter') === state.filter);
    });
    bindControls();
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('trophies.json not found');
        return res.json();
      })
      .then(function (data) {
        trophies = Array.isArray(data) ? data : data.trophies;
        trophies = trophies.filter(function (t) { return t && t.name && t.guide; });
        renderAll();
        window.__shotReady = true;
      })
      .catch(function () {
        metaEl.textContent = 'Could not load the trophy list. Check that app/data/trophies.json is present.';
        window.__shotReady = true;
      });
  }

  init();
})();
