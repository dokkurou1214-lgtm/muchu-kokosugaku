(function () {
  'use strict';

  const KEY = 'muchu_math_sq_v1';
  const QUESTIONS = window.MATH_QUESTIONS;
  const BY_ID = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
  const INTERVALS = [1, 3, 7, 14, 30, 60];
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const $ = sel => document.querySelector(sel);

  let data = loadData();
  let setup = {unit: 'SQ', level: 'basic', count: 5};
  let session = null;
  let storageWarned = false;

  function blankData() { return {version: 1, problems: {}, totalAnswers: 0}; }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function plusDays(days) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function safeNumber(n, min, max) {
    return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max ? n : min;
  }
  function isDay(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [y,m,d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(y,m-1,d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m-1 && dt.getUTCDate() === d;
  }
  function sanitize(raw) {
    if (!raw || raw.version !== 1 || !raw.problems || typeof raw.problems !== 'object' || Array.isArray(raw.problems)) {
      throw new Error('対応していない記録形式です');
    }
    const clean = blankData();
    for (const [id, item] of Object.entries(raw.problems)) {
      if (!BY_ID[id] || !item || typeof item !== 'object') continue;
      const attempts = safeNumber(item.attempts, 0, 1000000);
      if (!attempts) continue;
      clean.problems[id] = {
        attempts,
        correctCount: safeNumber(item.correctCount, 0, attempts),
        level: safeNumber(item.level, 0, 6),
        lastCorrect: item.lastCorrect === true,
        lastDate: isDay(item.lastDate) ? item.lastDate : today(),
        due: isDay(item.due) ? item.due : today()
      };
    }
    clean.totalAnswers = Object.values(clean.problems).reduce((sum,p) => sum + p.attempts,0);
    return clean;
  }
  function loadData() {
    try {
      const saved = localStorage.getItem(KEY);
      return saved ? sanitize(JSON.parse(saved)) : blankData();
    } catch (_) { return blankData(); }
  }
  function saveData() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (_) {
      if (!storageWarned) {
        notify('ブラウザの保存が利用できません。このページを閉じると記録が消える可能性があります。');
        storageWarned = true;
      }
    }
  }
  function notify(message) {
    const box = $('#notice');
    box.textContent = message; box.hidden = false;
  }
  function clearNotice() {
    $('#notice').hidden = true;
    $('#notice').textContent = '';
  }
  function dueProblems() {
    return QUESTIONS.filter(q => data.problems[q.id] && data.problems[q.id].due <= today());
  }
  function weakProblems() {
    return QUESTIONS.filter(q => data.problems[q.id] && !data.problems[q.id].lastCorrect);
  }
  function masteredCount() {
    return Object.values(data.problems).filter(p => p.level >= 5).length;
  }
  function stageName(p) {
    if (!p) return '未挑戦';
    if (!p.lastCorrect || p.level === 0) return '見直し';
    if (p.level >= 5) return '定着';
    if (p.level >= 3) return '伸びている';
    return '練習中';
  }
  function syncCounters() {
    const attempted = Object.keys(data.problems).length;
    const growing = Object.values(data.problems).filter(p => p.level >= 3).length;
    const nDue = dueProblems().length;
    $('#stat-attempted').innerHTML = `${attempted} <small>/ ${QUESTIONS.length}</small>`;
    $('#stat-mastered').innerHTML = `${masteredCount()} <small>問</small>`;
    $('#stat-due').innerHTML = `${nDue} <small>問</small>`;
    $('#review-due').textContent = nDue;
    $('#review-weak').textContent = weakProblems().length;
    $('#records-tried').textContent = attempted;
    $('#records-answers').textContent = data.totalAnswers;
    $('#records-growing').textContent = growing;
    $('#records-mastered').textContent = masteredCount();
  }
  function view(name) {
    clearNotice();
    $$('.view').forEach(x => { x.hidden = x.id !== `view-${name}`; });
    $$('.header-links button').forEach(x => x.classList.toggle('nav-active', x.dataset.route === name));
    if (name === 'learn') renderLearn();
    if (name === 'practice') renderPracticeHeading();
    if (name === 'review') renderReview();
    if (name === 'records') renderRecords();
    if (name === 'practice' && !session) showSetup();
    syncCounters();
    window.scrollTo({top: 0, behavior: 'instant'});
    if (history.replaceState) {
      try { history.replaceState(null, '', `#${name}`); } catch (_) {}
    }
  }
  $$('[data-route]').forEach(x => x.addEventListener('click', e => {
    e.preventDefault();
    if (session && !confirm('進行中の演習を終了して移動しますか？（回答済みの記録は保存されています）')) return;
    session = null;
    view(x.dataset.route);
  }));

  function renderLearn() {
    $('#lesson-sq').hidden = setup.unit !== 'SQ';
    $('#lesson-ex').hidden = setup.unit !== 'EX';
    $('#lesson-di').hidden = setup.unit !== 'DI';
    const lessons = {
      SQ: ['平方完成で頂点を求める', '中学で学んだ展開を、逆向きに使う技術です。'],
      EX: ['2次関数の最大・最小を求める', '頂点と定義域を確認して、最大値と最小値を求めます。'],
      DI: ['判別式とx軸との共有点', 'D = b² − 4ac を使って、共有点の個数と文字mの条件を求めます。']
    };
    [$('#learn-heading').textContent, $('#learn-intro').textContent] = lessons[setup.unit];
    chooseSetup('data-lesson', setup.unit);
  }
  function renderPracticeHeading() {
    const labels = {
      SQ: ['平方完成の問題演習', '基本（係数 ±1）', '基本＋標準'],
      EX: ['最大・最小の問題演習', '基本（定義域なし）', '基本＋標準（定義域あり）'],
      DI: ['判別式の問題演習', '基本（共有点の個数）', '基本＋標準（文字mの条件）']
    };
    [$('#practice-heading').textContent, $('#option-level-basic').textContent, $('#option-level-all').textContent] = labels[setup.unit];
    chooseSetup('data-unit', setup.unit);
  }
  function switchUnit(unit) {
    if (!['SQ','EX','DI'].includes(unit)) return;
    setup.unit = unit;
    setup.level = 'basic';
    chooseSetup('data-level', setup.level);
    renderPracticeHeading();
    renderLearn();
  }
  $$('[data-unit]').forEach(btn => btn.addEventListener('click', () => switchUnit(btn.dataset.unit)));
  $$('[data-lesson]').forEach(btn => btn.addEventListener('click', () => switchUnit(btn.dataset.lesson)));
  $$('[data-unit-open]').forEach(btn => btn.addEventListener('click', () => {
    const action = btn.dataset.unitOpen;
    switchUnit(action.endsWith('-di') ? 'DI' : 'EX');
    view(action.startsWith('learn-') ? 'learn' : 'practice');
  }));

  function chooseSetup(attr, value) {
    $$(`[${attr}]`).forEach(btn => {
      const selected = btn.getAttribute(attr) === String(value);
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
  }
  $$('[data-level]').forEach(btn => btn.addEventListener('click', () => {
    setup.level = btn.dataset.level;
    chooseSetup('data-level', setup.level);
  }));
  $$('[data-count]').forEach(btn => btn.addEventListener('click', () => {
    setup.count = Number(btn.dataset.count);
    chooseSetup('data-count', setup.count);
  }));

  function showSetup() {
    $('#practice-setup').hidden = false;
    $('#question-panel').hidden = true;
    $('#session-end').hidden = true;
  }
  function pickPractice() {
    const pool = QUESTIONS.filter(q => (q.unitId || 'SQ') === setup.unit && (setup.level === 'all' || q.level === 'basic'));
    const t = today();
    const sorted = pool.slice().sort((qa, qb) => {
      const pa = data.problems[qa.id], pb = data.problems[qb.id];
      const rank = p => !p ? 1 : p.due <= t ? 0 : p.level < 3 ? 2 : 3;
      return rank(pa) - rank(pb) || (pa?.attempts ?? 0) - (pb?.attempts ?? 0) || qa.id.localeCompare(qb.id);
    });
    if (setup.level === 'basic') return sorted.slice(0, setup.count);
    const nStandard = Math.floor(setup.count / 2);
    const basics = sorted.filter(q => q.level === 'basic').slice(0, setup.count - nStandard);
    const standards = sorted.filter(q => q.level === 'standard').slice(0, nStandard);
    const chosen = [];
    for (let i=0; i<Math.max(basics.length,standards.length); i++) {
      if (basics[i]) chosen.push(basics[i]);
      if (standards[i]) chosen.push(standards[i]);
    }
    return chosen;
  }
  function startSession(problems, kind) {
    if (!problems.length) {
      notify('対象の問題はまだありません。通常演習から進めてください。');
      return;
    }
    session = {ids: problems.map(p => p.id), index: 0, correct: 0, newCount: 0, kind, lastAnswered: false};
    view('practice');
    if (kind !== 'practice') $('#practice-heading').textContent = '復習演習（全単元）';
    $('#practice-setup').hidden = true;
    $('#session-end').hidden = true;
    $('#question-panel').hidden = false;
    renderQuestion();
  }
  $('#start-practice').addEventListener('click', () => startSession(pickPractice(), 'practice'));
  $('#start-from-lesson').addEventListener('click', () => {
    switchUnit('SQ');
    setup.level = 'basic'; setup.count = 5;
    chooseSetup('data-level', 'basic');
    chooseSetup('data-count', 5);
    startSession(pickPractice(), 'practice');
  });
  $('#start-extrema-from-lesson').addEventListener('click', () => {
    switchUnit('EX');
    setup.level = 'basic'; setup.count = 5;
    chooseSetup('data-level', 'basic');
    chooseSetup('data-count', 5);
    startSession(pickPractice(), 'practice');
  });
  $('#start-discriminant-from-lesson').addEventListener('click', () => {
    switchUnit('DI');
    setup.level = 'basic'; setup.count = 5;
    chooseSetup('data-level', 'basic');
    chooseSetup('data-count', 5);
    startSession(pickPractice(), 'practice');
  });
  function currentQ() { return BY_ID[session.ids[session.index]]; }
  function renderQuestion() {
    const q = currentQ();
    session.lastAnswered = false;
    $('#question-position').textContent = `${session.index + 1} / ${session.ids.length}`;
    $('#question-level').textContent = q.level === 'basic' ? '基本' : '標準';
    $('#session-progress').style.width = `${100 * session.index / session.ids.length}%`;
    $('#question-prompt').textContent = q.prompt;
    $('#question-topic').textContent = {SQ:'次の2次関数の頂点を答えましょう。', EX:'2次関数の最大値・最小値を求めましょう。', DI:'判別式を使って考えましょう。'}[q.unitId || 'SQ'];
    $('#answer-options').hidden = false;
    $('#explanation').hidden = true;
    $('#next-question').hidden = true;
    const container = $('#answer-options');
    container.replaceChildren();
    const letters = ['A','B','C','D'];
    q.options.forEach((answer, idx) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'answer-option';
      b.textContent = `${letters[idx]}. ${answer}`;
      b.addEventListener('click', () => answerQuestion(idx));
      container.append(b);
    });
    $('#question-prompt').focus({preventScroll: true});
  }
  function answerQuestion(idx) {
    if (!session || session.lastAnswered) return;
    const q = currentQ();
    session.lastAnswered = true;
    const correct = idx === q.answer;
    const prev = data.problems[q.id];
    if (!prev) session.newCount++;
    if (correct) session.correct++;
    const newLevel = correct ? Math.min((prev?.level || 0) + 1, 6) : 0;
    const dueIn = correct ? INTERVALS[newLevel - 1] : 1;
    data.problems[q.id] = {
      attempts: (prev?.attempts || 0) + 1,
      correctCount: (prev?.correctCount || 0) + (correct ? 1 : 0),
      level: newLevel,
      lastCorrect: correct,
      lastDate: today(),
      due: plusDays(dueIn)
    };
    data.totalAnswers++;
    saveData();
    syncCounters();
    $('#answer-options').hidden = true;
    const solution = $('#explanation');
    solution.replaceChildren();
    const title = document.createElement('h3');
    title.textContent = `正しい答え：${['A','B','C','D'][q.answer]}. ${q.options[q.answer]}`;
    solution.append(title);
    const sub = document.createElement('p'); sub.textContent = '手順を確かめよう'; sub.className = 'solution-sub'; solution.append(sub);
    const list = document.createElement('ol');
    q.steps.forEach(s => {const li = document.createElement('li'); li.textContent = s; list.append(li);});
    solution.append(list);
    const tip = document.createElement('p'); tip.textContent = q.tip; tip.className = 'solution-tip'; solution.append(tip);
    solution.hidden = false;
    const next = $('#next-question');
    next.hidden = false;
    next.textContent = session.index + 1 === session.ids.length ? '結果を見る →' : '次の問題へ →';
    next.scrollIntoView({block: 'nearest', behavior: 'smooth'});
    solution.focus({preventScroll: true});
  }
  $('#next-question').addEventListener('click', () => {
    if (!session || !session.lastAnswered) return;
    session.index++;
    if (session.index < session.ids.length) renderQuestion();
    else finishSession();
  });
  $('#leave-session').addEventListener('click', () => {
    if (!confirm('演習を終了しますか？（回答済みの記録は保存されています）')) return;
    session = null; showSetup();
  });
  function finishSession() {
    const score = session.correct;
    const total = session.ids.length;
    const newCount = session.newCount;
    $('#question-panel').hidden = true;
    const panel = $('#session-end');
    panel.hidden = false;
    panel.replaceChildren();
    const p = document.createElement('p'); p.className = 'eyebrow'; p.textContent = 'SESSION COMPLETE'; panel.append(p);
    const h = document.createElement('h2'); h.textContent = '今回の演習が完了しました'; panel.append(h);
    const big = document.createElement('div'); big.className = 'end-score'; big.textContent = `${score} / ${total} 問正答`; panel.append(big);
    const desc = document.createElement('p'); desc.textContent = `今回、新たに挑戦した問題は${newCount}問。結果に合わせて次の復習日を設定しました。`; panel.append(desc);
    const row = document.createElement('div'); row.className = 'hero-actions';
    const one = document.createElement('button'); one.type = 'button'; one.className = 'btn btn-primary'; one.textContent = '続けて演習する →';
    one.addEventListener('click', () => {session = null; showSetup(); window.scrollTo({top:0,behavior:'instant'});});
    const two = document.createElement('button'); two.type = 'button'; two.className = 'btn btn-outline'; two.textContent = '学習記録を見る';
    two.addEventListener('click', () => {session = null; view('records');});
    row.append(one,two); panel.append(row);
    session = null;
    $('#session-progress').style.width = '100%';
    panel.scrollIntoView({block:'start', behavior:'smooth'});
    syncCounters();
  }

  function renderReview() {
    const due = dueProblems(), weak = weakProblems();
    const rows = [...new Set([...due, ...weak].map(q => q.id))].map(id => BY_ID[id]);
    const list = $('#review-list'); list.replaceChildren();
    $('#review-message').textContent = !rows.length ? '復習対象はまだありません。通常演習をすると、復習の予定が作られます。' : `復習候補 ${rows.length}問。日付は端末のローカル日時で判定します。`;
    if (!rows.length) {
      const p = document.createElement('p'); p.className = 'empty-list'; p.textContent = 'まずは基本5問に挑戦してみましょう。'; list.append(p);
      return;
    }
    rows.slice(0,100).forEach(q => {
      const p = data.problems[q.id]; const line = document.createElement('div'); line.className = 'review-row';
      const left = document.createElement('div'); const title = document.createElement('strong'); title.textContent = q.unit + ' · ' + q.id + ' · ' + q.expression;
      const sub = document.createElement('span'); sub.textContent = `${stageName(p)} · 次回 ${p.due}`; left.append(title,sub);
      const flag = document.createElement('span'); flag.className = 'review-tag'; flag.textContent = p.due <= today() ? '今日の復習' : '見直し';
      line.append(left,flag); list.append(line);
    });
  }
  $('#start-review-due').addEventListener('click', () => startSession(dueProblems().slice(0,10), 'review'));
  $('#start-review-weak').addEventListener('click', () => startSession(weakProblems().slice(0,10), 'weak'));

  function renderRecords() {
    const values = Object.values(data.problems);
    const categories = [
      ['未挑戦', QUESTIONS.length - values.length],
      ['見直し', values.filter(p => !p.lastCorrect || p.level === 0).length],
      ['練習中', values.filter(p => p.lastCorrect && p.level > 0 && p.level < 3).length],
      ['伸びている', values.filter(p => p.lastCorrect && p.level >= 3 && p.level < 5).length],
      ['定着', values.filter(p => p.lastCorrect && p.level >= 5).length]
    ];
    const root = $('#stage-visual'); root.replaceChildren();
    categories.forEach(([title, value]) => {
      const row = document.createElement('div'); row.className = 'stage-row';
      const label = document.createElement('span'); label.textContent = title;
      const track = document.createElement('div'); track.className = 'stage-bar';
      const fill = document.createElement('span'); fill.style.width = `${value / QUESTIONS.length * 100}%`; track.append(fill);
      const count = document.createElement('strong'); count.textContent = `${value}問`;
      row.append(label,track,count); root.append(row);
    });
  }
  $('#export-records').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = `muchu-math-records-${today()}.json`;
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    notify('学習記録をJSON形式で書き出しました。');
  });
  $('#import-records').addEventListener('change', async e => {
    const input = e.target; const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (file.size > 2000000) { notify('ファイルが大きすぎます（上限2MB）。'); return; }
    let imported;
    try { imported = sanitize(JSON.parse(await file.text())); }
    catch (err) {notify(`読み込みに失敗しました：${err.message}`); return;}
    if (!confirm(`記録${Object.keys(imported.problems).length}問分を読み込みます。今ある学習記録は上書きされます。続けますか？`)) return;
    data = imported; saveData(); syncCounters(); renderRecords();
    notify('学習記録を読み込みました。');
  });
  $('#clear-records').addEventListener('click', () => {
    if (!confirm('このブラウザの高校数学の学習記録をすべて削除します。元に戻せません。続けますか？')) return;
    data = blankData(); saveData(); syncCounters(); renderRecords();
    notify('学習記録を削除しました。');
  });

  const initial = window.location.hash.slice(1);
  view(['home','learn','practice','review','records'].includes(initial) ? initial : 'home');
})();
