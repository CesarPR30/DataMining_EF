/* ============================================================
   APP: navegación, vistas, autograder y simulacro
   ============================================================ */
(function () {
  'use strict';
  const E = window.ENG, D = window.DM;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const topicName = (id) => (D.topics.find(t => t.id === id) || {}).short || id;

  /* ---------- almacenamiento local seguro ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('dmfinal:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dmfinal:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
  };
  const stats = store.get('stats', {});
  function addStat(gid, perfect) { const s = stats[gid] || { t: 0, p: 0 }; s.t++; if (perfect) s.p++; stats[gid] = s; store.set('stats', stats); }

  const genIds = Object.keys(E.G);
  const gensOf = (topic) => genIds.filter(g => E.G[g].topic === topic);
  const newSeed = () => Math.floor(Math.random() * 1e9);

  /* ============================================================
     Renderizador de problemas con autograder
     ============================================================ */
  let uidc = 0;
  function renderProblem(problem, opts = {}) {
    const uid = 'pb' + (++uidc);
    const root = h(`<div class="problem" id="${uid}"></div>`);
    root.appendChild(h(`<div class="statement">${problem.statement}</div>`));
    const inTable = new Set();
    const form = h(`<form class="answers" novalidate></form>`);
    const inputHTML = (f) => `<input id="${uid}-${f.id}" data-f="${f.id}" class="ans-in${f.type === 'text' ? ' ans-text' : ''}" type="text" inputmode="${f.type === 'text' ? 'text' : 'decimal'}" autocomplete="off" spellcheck="false" aria-label="${E.esc(f.label)}"><span class="ans-mark" data-m="${f.id}"></span>`;
    if (problem.table) {
      const t = problem.table;
      t.rows.forEach(r => r.ids.forEach(i => inTable.add(i)));
      const fmap = Object.fromEntries(problem.fields.map(f => [f.id, f]));
      form.appendChild(h(`<div class="tbl-wrap"><table class="mtx ans-table"><thead><tr>${t.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr><th>${r.label}</th>${r.ids.map(i => `<td><div class="cellin">${inputHTML(fmap[i])}</div></td>`).join('')}</tr>`).join('')}</tbody></table></div>`));
    }
    const rest = problem.fields.filter(f => !inTable.has(f.id));
    if (rest.length) form.appendChild(h(`<div class="ans-grid">${rest.map(f => `<label class="ans-row${f.type === 'text' ? ' wide' : ''}" for="${uid}-${f.id}"><span class="ans-lbl">${f.label}</span><span class="ans-box">${inputHTML(f)}</span></label>`).join('')}</div>`));
    const bar = h(`<div class="pb-actions">
        <button type="submit" class="btn primary">Calificar</button>
        <button type="button" class="btn" data-act="sol">Ver solución</button>
        ${opts.onNew ? '<button type="button" class="btn ghost" data-act="new">Nuevo ejercicio</button>' : ''}
        <span class="pb-score" aria-live="polite"></span>
      </div>`);
    form.appendChild(bar);
    if (!opts.hideInputs) root.appendChild(form);
    const sol = h(`<div class="solution" hidden><div class="sol-head">Solución paso a paso</div>${problem.solution}</div>`);
    root.appendChild(sol);

    let graded = null;
    function grade() {
      let ok = 0;
      problem.fields.forEach(f => {
        const inp = $(`#${uid}-${f.id}`, root); const mk = $(`[data-m="${f.id}"]`, root);
        const good = E.gradeField(f, inp.value);
        inp.classList.toggle('is-ok', good); inp.classList.toggle('is-bad', !good);
        mk.textContent = good ? '✓' : '✗'; mk.className = 'ans-mark ' + (good ? 'ok' : 'bad');
        if (good) ok++;
      });
      graded = { ok, total: problem.fields.length };
      $('.pb-score', root).innerHTML = `<b>${ok}/${problem.fields.length}</b> correctas${ok === problem.fields.length ? ' · ¡perfecto!' : ''}`;
      if (opts.onGrade) opts.onGrade(graded);
      return graded;
    }
    function reveal() {
      sol.hidden = false;
      problem.fields.forEach(f => {
        const mk = $(`[data-m="${f.id}"]`, root);
        const ans = f.type === 'text' ? f.answer : E.fmt(f.answer, 4);
        if (!mk.querySelector('.expect')) mk.insertAdjacentHTML('beforeend', `<span class="expect">${E.esc(ans)}</span>`);
      });
      if (opts.onReveal) opts.onReveal();
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); if (!opts.lockGrade) grade(); });
    bar.addEventListener('click', (e) => {
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'sol') { if (!graded && !opts.noAutoGrade) grade(); reveal(); }
      if (a.dataset.act === 'new' && opts.onNew) opts.onNew();
    });
    if (opts.showSolution) { sol.hidden = false; }
    root._grade = grade; root._reveal = reveal; root._graded = () => graded;
    return root;
  }

  /* ============================================================
     VISTA: Inicio (análisis del examen)
     ============================================================ */
  function viewInicio(el) {
    const cov = [
      ['Clustering a escala (BFR)', 'Parte 1', 'Caso de estudio (2 pts)', 'Caso: diseño / pseudocódigo', 'clu'],
      ['Recomendación: FC, contenido, evaluación', 'Sem. 9', 'Práctico (2 pts): FC ítem-ítem coseno', 'Práctico: FC (coseno/Pearson), TF-IDF, MAE/RMSE', 'rec'],
      ['Recomendación: factores latentes', 'Sem. 10', '—', 'Práctico corto: predicción con sesgos, paso de SGD · Caso', 'rec'],
      ['PageRank, teletransporte, block-stripe', 'Sem. 11', '—', 'Práctico muy probable: power iteration, β, block-stripe · Caso de escala', 'pr'],
      ['Betweenness, Girvan-Newman, modularidad', 'Sem. 12', 'Práctico (3 pts): Brandes desde A y G', 'Práctico: betweenness, Q', 'com'],
      ['Espectral, LPA, Louvain, Leiden', 'Sem. 13', 'Práctico (3 pts): agregación Louvain', 'Práctico: ΔQ, agregación, LPA, Laplaciana', 'com'],
      ['Encodings, grafos k-NN, node2vec', 'Sem. 14', 'Caso (2 pts): grafo k-NN', 'Práctico: caminata p/q, pares skip-gram, k-NN · Caso', 'rep'],
      ['GNN: mensaje + agregación', 'Sem. 15', 'Caso (2 pts): accidentes viales', 'Práctico: una capa a mano, softmax · Caso de diseño', 'gnn'],
    ];
    el.innerHTML = `
    <section class="hero">
      <div class="hero-in">
        <p class="eyebrow">Data Mining · Examen Final</p>
        <h1>Estudia el final con el formato real del examen</h1>
        <p class="lead">Analicé el examen 2026-1 y las 10 clases (semanas 9 a 15). La web cubre teoría, cómo resolver cada tipo de ejercicio, práctica con corrección automática y un simulacro con las respuestas ocultas.</p>
        <div class="hero-cta">
          <a class="btn primary" href="#simulacro">Hacer el simulacro 2026-1</a>
          <a class="btn" href="#practica">Practicar ejercicios</a>
        </div>
      </div>
      <div class="hero-card" aria-label="Estructura del examen">
        <div class="hc-row"><span class="hc-k">Casos de estudio</span><span class="hc-v">3 × 2 pts = 6</span></div>
        <div class="hc-bar"><span style="width:43%"></span></div>
        <div class="hc-row"><span class="hc-k">Ejercicios prácticos</span><span class="hc-v">2 + 3 + 3 = 8</span></div>
        <div class="hc-bar alt"><span style="width:57%"></span></div>
        <p class="hc-note">14 puntos en el documento. Sin internet ni celular; solo PC del laboratorio y formulario de ayuda. "Si no sabe, deje en blanco".</p>
      </div>
    </section>

    <section class="block">
      <h2>Cómo es el examen</h2>
      <div class="cards3">
        <article class="card"><h3>Casos de estudio · 6 pts</h3><p>Tres preguntas abiertas de 2 pts. Piden <b>explicar un algoritmo</b> (BFR con pseudocódigo), <b>transformar una representación</b> (vectores → grafo k-NN) o <b>diseñar una solución completa</b> (accidentes viales: pipeline, algoritmos y escalabilidad a millones de nodos).</p><p class="muted small">Siempre aparece "¿por qué es eficiente / cómo escala?".</p></article>
        <article class="card"><h3>Ejercicios prácticos · 8 pts</h3><p>Tres cálculos a mano mostrando el procedimiento: <b>FC ítem-ítem con coseno</b> (2 pts), <b>edge betweenness con Brandes</b> desde dos fuentes + aristas puente (3 pts) y <b>agregación de Louvain</b> en dos niveles (3 pts).</p><p class="muted small">Piden tablas intermedias: árbol BFS, crédito, aporte por fuente.</p></article>
        <article class="card"><h3>Qué puede venir</h3><p>"Puede venir cualquier tema". Los prácticos salen de algoritmos que se hacen a mano en clase: PageRank (power iteration, β, block-stripe), modularidad, ΔQ, LPA, espectral, node2vec, capa GNN, SGD. Todos están en <a href="#practica">Práctica</a>.</p></article>
      </div>
    </section>

    <section class="block">
      <h2>Mapa de temas</h2>
      <div class="tbl-wrap"><table class="mtx cov"><thead><tr><th>Tema</th><th>Clase</th><th>En 2026-1</th><th>Qué puede preguntarse</th><th></th></tr></thead><tbody>
      ${cov.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2] === '—' ? '<span class="muted">no salió</span>' : `<span class="pill hit">${r[2]}</span>`}</td><td>${r[3]}</td><td><a href="#teoria" data-topic="${r[4]}" class="lnk">Teoría →</a></td></tr>`).join('')}
      </tbody></table></div>
    </section>

    <section class="block">
      <h2>Plan de estudio sugerido</h2>
      <ol class="plan">
        <li><b>Simulacro 2026-1 en frío</b> (120 min) para medir tu punto de partida.</li>
        <li><b>Teoría</b> de cada tema y su autoevaluación. Prioriza Comunidades y PageRank: concentran los algoritmos a mano.</li>
        <li><b>Cómo resolver:</b> lee la receta y el ejemplo resuelto de cada tipo de ejercicio.</li>
        <li><b>Práctica</b> hasta sacar 100% dos veces seguidas en cada tipo. Los números cambian en cada intento.</li>
        <li><b>Casos de estudio:</b> escribe respuestas con la estructura de 6 bloques y autocorrígete con la rúbrica.</li>
        <li><b>Examen generado</b> (casos y ejercicios nuevos) el día anterior.</li>
      </ol>
      <div id="progress-box"></div>
    </section>`;
    const pb = $('#progress-box', el);
    const total = genIds.length, done = genIds.filter(g => stats[g] && stats[g].p > 0).length;
    pb.innerHTML = `<div class="progress"><div class="pr-top"><span>Tipos de ejercicio resueltos al 100% al menos una vez</span><b>${done} / ${total}</b></div><div class="hc-bar"><span style="width:${(done / total) * 100}%"></span></div></div>`;
    $$('[data-topic]', el).forEach(a => a.addEventListener('click', () => { store.set('topic:teoria', a.dataset.topic); }));
  }

  /* ============================================================
     Sidebar de temas
     ============================================================ */
  function topicLayout(el, key, list, render) {
    let cur = store.get('topic:' + key, list[0].id);
    if (!list.find(t => t.id === cur)) cur = list[0].id;
    el.innerHTML = `<div class="split"><nav class="side" aria-label="Temas"><p class="side-h">Temas</p>${list.map(t => `<button class="side-btn" data-t="${t.id}"><span>${t.short}</span><small>${t.clases}</small></button>`).join('')}</nav><div class="main-col" id="col-${key}"></div></div>`;
    const col = $('#col-' + key, el);
    const sel = (id) => { cur = id; store.set('topic:' + key, id); $$('.side-btn', el).forEach(b => b.classList.toggle('on', b.dataset.t === id)); render(col, id); };
    $$('.side-btn', el).forEach(b => b.addEventListener('click', () => { sel(b.dataset.t); col.scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
    sel(cur);
  }

  /* ============================================================
     VISTA: Teoría
     ============================================================ */
  function viewTeoria(el) {
    topicLayout(el, 'teoria', D.topics, (col, id) => {
      col.innerHTML = `<article class="prose">${D.theory[id]}</article>`;
      const qz = D.quizzes[id];
      if (qz) col.appendChild(renderQuiz(qz, id));
      const gens = gensOf(id);
      if (gens.length) col.appendChild(h(`<div class="next-box"><b>Siguiente paso:</b> ver cómo se resuelven los ejercicios de este tema. <a class="btn small" href="#resolver" data-goto="${id}">Cómo resolver →</a> <a class="btn small ghost" href="#practica" data-goto-p="${id}">Practicar →</a></div>`));
      $$('[data-goto]', col).forEach(a => a.addEventListener('click', () => store.set('topic:resolver', a.dataset.goto)));
      $$('[data-goto-p]', col).forEach(a => a.addEventListener('click', () => store.set('practica:filter', a.dataset.gotoP)));
    });
  }
  function renderQuiz(qz, id) {
    const box = h(`<section class="quiz"><h3>Autoevaluación</h3><p class="muted small">Elige una opción; se corrige al instante.</p></section>`);
    let right = 0, answered = 0;
    const sc = h('<p class="quiz-score" aria-live="polite"></p>');
    qz.forEach((q, i) => {
      const it = h(`<div class="qz-item"><p class="qz-q"><b>${i + 1}.</b> ${q.q}</p><div class="qz-opts">${q.o.map((o, j) => `<button type="button" class="qz-opt" data-j="${j}">${o}</button>`).join('')}</div><p class="qz-exp" hidden></p></div>`);
      it.addEventListener('click', (e) => {
        const b = e.target.closest('.qz-opt'); if (!b || it.dataset.done) return;
        it.dataset.done = 1; answered++;
        const j = +b.dataset.j; const ok = j === q.a; if (ok) right++;
        $$('.qz-opt', it).forEach((x, k) => { x.disabled = true; if (k === q.a) x.classList.add('ok'); else if (k === j) x.classList.add('bad'); });
        const ex = $('.qz-exp', it); ex.hidden = false; ex.innerHTML = (ok ? '<b class="okc">Correcto.</b> ' : '<b class="badc">Incorrecto.</b> ') + q.e;
        sc.textContent = `${right}/${answered} correctas de ${qz.length}`;
      });
      box.appendChild(it);
    });
    box.appendChild(sc);
    return box;
  }

  /* ============================================================
     VISTA: Cómo resolver
     ============================================================ */
  function viewResolver(el) {
    const list = D.topics.filter(t => gensOf(t.id).length);
    topicLayout(el, 'resolver', list.concat([{ id: 'dis', short: 'Casos de estudio', clases: 'Respuestas modelo' }]), (col, id) => {
      if (id === 'dis') { renderCasesGuide(col); return; }
      col.innerHTML = `<header class="col-h"><h2>${D.topics.find(t => t.id === id).name}</h2><p class="muted">Receta, trampas frecuentes y un ejemplo resuelto para cada tipo de ejercicio. "Otro ejemplo" genera números nuevos.</p></header>`;
      const toc = h(`<div class="toc">${gensOf(id).map(g => `<a href="#resolver" data-scroll="rx-${g}" class="chip">${E.G[g].title}</a>`).join('')}</div>`);
      col.appendChild(toc);
      toc.addEventListener('click', (e) => { const a = e.target.closest('[data-scroll]'); if (!a) return; e.preventDefault(); document.getElementById(a.dataset.scroll).scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      gensOf(id).forEach((g, k) => {
        const rc = D.recipes[g] || { steps: [], traps: [] };
        const sec = h(`<section class="rx" id="rx-${g}"><div class="rx-h"><h3>${E.G[g].title}</h3>${E.G[g].tag ? `<span class="pill hit">${E.G[g].tag}</span>` : ''}</div>
          <div class="rx-grid"><div><p class="rx-k">Receta</p><ol class="rx-steps">${rc.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>
          ${rc.traps.length ? `<div><p class="rx-k">Trampas frecuentes</p><ul class="rx-traps">${rc.traps.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}</div>
          <div class="rx-ex"><div class="rx-exh"><p class="rx-k">Ejemplo resuelto</p><button class="btn small" data-again>Otro ejemplo</button></div><div class="rx-body"></div></div></section>`);
        const body = $('.rx-body', sec);
        const show = (seed) => { const p = E.G[g].gen(E.makeRng(seed)); body.innerHTML = ''; body.appendChild(renderExample(p)); };
        show(1000 + k * 37 + g.length);
        $('[data-again]', sec).addEventListener('click', () => show(newSeed()));
        col.appendChild(sec);
      });
    });
  }
  function renderExample(p) {
    const wrap = h(`<div class="example"><div class="statement">${p.statement}</div><div class="ex-ans"><p class="rx-k">Respuestas</p><div class="ex-chips">${p.fields.map(f => `<span class="ex-chip"><span>${f.label}</span><b>${E.esc(f.type === 'text' ? f.answer : E.fmt(f.answer, 4))}</b></span>`).join('')}</div></div><div class="solution"><div class="sol-head">Solución paso a paso</div>${p.solution}</div></div>`);
    return wrap;
  }
  function renderCasesGuide(col) {
    col.innerHTML = `<article class="prose">${D.theory.dis}</article><h2 class="sec-gap">Banco de casos con respuesta modelo</h2><p class="muted">Intenta responder antes de abrir la respuesta. En el simulacro puedes escribir y autocorregirte con la rúbrica.</p>`;
    D.cases.forEach(c => {
      col.appendChild(h(`<details class="case-d"><summary><span class="pill">${topicName(c.topic)}</span> ${c.title}${c.exam ? ' <span class="pill hit">2026-1</span>' : ''}</summary><div class="case-body"><p class="case-prompt">${c.prompt}</p><div class="model">${c.answer}</div><p class="rx-k">Rúbrica (2 pts)</p><ul class="rubric-list">${c.rubric.map(r => `<li>${r[0]} <span class="muted">(${r[1]})</span></li>`).join('')}</ul></div></details>`));
    });
  }

  /* ============================================================
     VISTA: Práctica
     ============================================================ */
  function viewPractica(el) {
    let filter = store.get('practica:filter', 'all');
    const tps = D.topics.filter(t => gensOf(t.id).length);
    el.innerHTML = `<header class="col-h wide"><h2>Práctica con autograder</h2><p class="muted">Elige un tipo de ejercicio. Los datos cambian en cada intento. Acepta decimales con punto o coma y fracciones (2/5). Tolerancia ≈ redondeo a 2 decimales.</p></header>
      <div class="chips" role="tablist">${[{ id: 'all', short: 'Todos' }].concat(tps).map(t => `<button class="chip" data-f="${t.id}">${t.short}</button>`).join('')}</div>
      <div class="pgrid" id="pgrid"></div><div id="pwork"></div>`;
    const grid = $('#pgrid', el), work = $('#pwork', el);
    const draw = () => {
      $$('.chip', el).forEach(c => c.classList.toggle('on', c.dataset.f === filter));
      const ids = genIds.filter(g => filter === 'all' || E.G[g].topic === filter);
      grid.innerHTML = ids.map(g => { const s = stats[g]; return `<button class="pcard" data-g="${g}"><span class="pc-top"><span class="pill">${topicName(E.G[g].topic)}</span>${E.G[g].tag ? '<span class="pill hit">examen</span>' : ''}</span><span class="pc-t">${E.G[g].title}</span><span class="pc-s">${s ? `${s.p}/${s.t} perfectos` : 'sin intentos'}</span></button>`; }).join('');
    };
    draw();
    $('.chips', el).addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (!c) return; filter = c.dataset.f; store.set('practica:filter', filter); draw(); });
    grid.addEventListener('click', (e) => { const c = e.target.closest('.pcard'); if (!c) return; openPractice(c.dataset.g); });
    function openPractice(g) {
      $$('.pcard', grid).forEach(c => c.classList.toggle('on', c.dataset.g === g));
      const run = () => {
        const seed = newSeed(); const p = E.G[g].gen(E.makeRng(seed));
        work.innerHTML = `<section class="pwork"><div class="pw-h"><div><p class="eyebrow">${topicName(E.G[g].topic)}</p><h3>${E.G[g].title}</h3></div><a class="lnk" href="#resolver" data-r="${E.G[g].topic}">Ver receta →</a></div></section>`;
        const sec = $('.pwork', work);
        $('[data-r]', sec).addEventListener('click', () => store.set('topic:resolver', E.G[g].topic));
        let counted = false;
        const node = renderProblem(p, { onNew: run, onGrade: (r) => { if (!counted) { counted = true; addStat(g, r.ok === r.total); } } });
        sec.appendChild(node);
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const first = $('input', node); if (first) setTimeout(() => first.focus({ preventScroll: true }), 300);
      };
      run();
    }
  }

  /* ============================================================
     VISTA: Simulacro
     ============================================================ */
  let timerId = null;
  function viewSimulacro(el) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    el.innerHTML = `<header class="col-h wide"><h2>Simulacro de examen</h2><p class="muted">Las respuestas están ocultas. Responde todo y pulsa <b>Entregar</b>: los prácticos se corrigen solos; en los casos escribes tu respuesta y te autocorriges con la rúbrica.</p></header>
      <div class="sim-pick">
        <button class="sim-opt" data-m="real"><span class="pill hit">Original</span><b>Examen Final 2026-1</b><span>Las 6 preguntas reales: 3 casos (BFR, grafo k-NN, accidentes) y 3 prácticos (FC coseno, Brandes, Louvain).</span></button>
        <button class="sim-opt" data-m="gen"><span class="pill">Nuevo</span><b>Examen generado</b><span>Mismo formato con 3 casos del banco y 3 prácticos con datos nuevos (FC · comunidades/PageRank · grafos/GNN).</span></button>
      </div><div id="simbox"></div>`;
    $$('.sim-opt', el).forEach(b => b.addEventListener('click', () => startExam(b.dataset.m, $('#simbox', el))));
  }
  function bfrFigure() {
    return `<svg class="graph" viewBox="0 0 520 220" role="img" aria-label="DS, CS y RS en BFR">
      <ellipse cx="250" cy="165" rx="105" ry="32" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/><text x="250" y="170" text-anchor="middle" class="g-tag">cluster (DS) + centroide</text>
      <ellipse cx="240" cy="45" rx="30" ry="24" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1.5"/><ellipse cx="80" cy="85" rx="18" ry="30" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1.5"/><ellipse cx="430" cy="95" rx="34" ry="20" fill="var(--amber-soft)" stroke="var(--amber)" stroke-width="1.5"/>
      <text x="240" y="98" text-anchor="middle" class="g-tag">mini-clusters (CS)</text>
      <circle cx="70" cy="20" r="4" fill="var(--ink)"/><circle cx="410" cy="22" r="4" fill="var(--ink)"/><circle cx="110" cy="150" r="4" fill="var(--ink)"/><circle cx="470" cy="190" r="4" fill="var(--ink)"/>
      <text x="440" y="40" class="g-tag">puntos aislados (RS)</text></svg>`;
  }
  function startExam(mode, box) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    const qs = [];
    let title, seedInfo = '';
    if (mode === 'real') {
      title = D.exam2026.title;
      D.exam2026.questions.forEach(q => {
        if (q.kind === 'case') qs.push({ kind: 'case', pts: q.pts, c: D.cases.find(c => c.id === q.ref), extra: q.extra });
        else {
          const built = q.build ? q.build() : { fields: q.fields };
          qs.push({ kind: 'prac', pts: q.pts, title: q.title, p: { statement: q.statement(), fields: built.fields, table: built.table, solution: q.solution() } });
        }
      });
    } else {
      const seed = newSeed(); const rng = E.makeRng(seed); seedInfo = ` · semilla ${seed}`;
      title = 'Examen generado';
      const pool = rng.shuffle(D.cases.filter(c => !c.exam)).slice(0, 2).concat(rng.shuffle(D.cases.filter(c => c.exam)).slice(0, 1));
      rng.shuffle(pool).forEach(c => qs.push({ kind: 'case', pts: 2, c }));
      const g1 = rng.pick(['cf_item_cos', 'cf_user_pearson', 'cf_item_pearson']);
      const g2 = rng.pick(['bet_two', 'pr_teleport', 'pr_blockstripe', 'modularity', 'louvain_dq', 'spectral']);
      const g3 = rng.pick(['louvain_agg', 'gnn_layer', 'node2vec', 'lpa', 'pr_power', 'bet_source']);
      [[g1, 2], [g2, 3], [g3, 3]].forEach(([g, pts]) => qs.push({ kind: 'prac', pts, title: E.G[g].title, p: E.G[g].gen(E.makeRng(rng.int(1, 1e9))) }));
    }
    const totalPts = qs.reduce((s, q) => s + q.pts, 0);
    box.innerHTML = `<section class="exam"><div class="exam-bar"><div><p class="eyebrow">Simulacro${seedInfo}</p><h3>${title}</h3></div><div class="timer" aria-live="off"><span id="tmr">120:00</span><small>restantes</small></div></div>
      <div class="exam-rules"><b>Indicaciones:</b> sin celular ni páginas externas; resuelve en papel y escribe los resultados. Si no sabes, déjalo en blanco.</div><div class="exam-qs"></div>
      <div class="exam-submit"><button class="btn primary" id="submitExam">Entregar examen</button><span class="muted small">Al entregar se corrigen los prácticos y se muestran las respuestas modelo de los casos.</span></div><div id="examResult"></div></section>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const list = $('.exam-qs', box);
    let secPart = 0;
    qs.forEach((q, i) => {
      if (q.kind === 'case' && secPart === 0) { list.appendChild(h('<h3 class="exam-part">Casos de estudio (6)</h3>')); secPart = 1; }
      if (q.kind === 'prac' && secPart <= 1) { list.appendChild(h('<h3 class="exam-part">Ejercicios prácticos (8)</h3>')); secPart = 2; }
      const qel = h(`<article class="eq" data-i="${i}"><div class="eq-h"><span class="eq-n">Pregunta ${i + 1}</span><span class="pill">${q.pts} pts</span>${q.kind === 'prac' ? `<span class="muted small">${q.title}</span>` : `<span class="muted small">${q.c.title}</span>`}</div></article>`);
      if (q.kind === 'case') {
        const key = 'draft:' + (mode === 'real' ? 'real:' : 'gen:') + q.c.id;
        qel.appendChild(h(`<div class="statement"><p>${q.c.prompt}</p>${q.extra === 'bfrfig' ? bfrFigure() : ''}</div>`));
        const ta = h(`<textarea class="case-ta" rows="9" id="ta-${mode}-${q.c.id}" placeholder="Escribe tu respuesta: representación, pipeline, algoritmos, justificación y escalabilidad…"></textarea>`);
        ta.value = store.get(key, ''); ta.addEventListener('input', () => store.set(key, ta.value));
        qel.appendChild(ta);
        const rev = h(`<div class="case-rev" hidden><div class="sol-head">Respuesta modelo</div><div class="model">${q.c.answer}</div><div class="rubric"><p class="rx-k">Autocorrección con rúbrica</p>${q.c.rubric.map((r, k) => `<label class="rb"><input type="checkbox" data-w="${r[1]}" id="rb-${mode}-${q.c.id}-${k}"> <span>${r[0]}</span> <b>${r[1]}</b></label>`).join('')}<p class="rb-score">Puntaje: <b>0</b> / ${q.pts}</p></div></div>`);
        qel.appendChild(rev);
        q.score = 0;
        rev.addEventListener('change', () => { q.score = $$('input[type=checkbox]', rev).filter(x => x.checked).reduce((s, x) => s + +x.dataset.w, 0); $('.rb-score b', rev).textContent = E.fmt(q.score, 2); updateResult(); });
        q.reveal = () => { rev.hidden = false; };
      } else {
        const node = renderProblem(q.p, { lockGrade: true, onGrade: () => updateResult() });
        $('.pb-actions', node).hidden = true; // en examen, se entrega al final
        qel.appendChild(node);
        q.node = node;
        q.reveal = () => { const r = node._grade(); node._reveal(); q.score = q.pts * r.ok / r.total; };
      }
      list.appendChild(qel);
    });
    let left = (mode === 'real' ? D.exam2026.minutes : 120) * 60;
    const tm = $('#tmr', box);
    timerId = setInterval(() => { left--; if (left <= 0) { clearInterval(timerId); timerId = null; tm.textContent = '00:00'; tm.parentElement.classList.add('late'); return; } tm.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`; if (left < 600) tm.parentElement.classList.add('late'); }, 1000);
    let submitted = false;
    function updateResult() {
      if (!submitted) return;
      const got = qs.reduce((s, q) => s + (q.score || 0), 0);
      const prac = qs.filter(q => q.kind === 'prac'), cas = qs.filter(q => q.kind === 'case');
      $('#examResult', box).innerHTML = `<div class="result"><div class="res-big"><span>${E.fmt(got, 2)}</span><small>/ ${totalPts}</small></div><div class="res-rows">
        <div><span>Prácticos (automático)</span><b>${E.fmt(prac.reduce((s, q) => s + (q.score || 0), 0), 2)} / ${prac.reduce((s, q) => s + q.pts, 0)}</b></div>
        <div><span>Casos (tu autocorrección)</span><b>${E.fmt(cas.reduce((s, q) => s + (q.score || 0), 0), 2)} / ${cas.reduce((s, q) => s + q.pts, 0)}</b></div>
        <p class="muted small">Marca en cada caso los puntos de la rúbrica que cubriste para completar tu nota. Equivalente sobre 20: <b>${E.fmt(got / totalPts * 20, 1)}</b>.</p></div></div>`;
    }
    $('#submitExam', box).addEventListener('click', () => {
      if (submitted) return; submitted = true;
      if (timerId) { clearInterval(timerId); timerId = null; }
      qs.forEach(q => q.reveal());
      $('#submitExam', box).disabled = true; $('#submitExam', box).textContent = 'Entregado';
      updateResult();
      $('#examResult', box).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ============================================================
     Router por hash
     ============================================================ */
  const views = { inicio: viewInicio, teoria: viewTeoria, resolver: viewResolver, practica: viewPractica, simulacro: viewSimulacro };
  function route() {
    let v = (location.hash || '#inicio').slice(1);
    if (!views[v]) v = 'inicio';
    if (timerId && v !== 'simulacro') { clearInterval(timerId); timerId = null; }
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === v));
    const main = $('#view');
    main.innerHTML = '';
    views[v](main);
    window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') route();
})();
