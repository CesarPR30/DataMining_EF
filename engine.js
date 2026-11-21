/* ============================================================
   ENGINE: utilidades numéricas, dibujo de grafos, generadores
   de ejercicios con solución paso a paso y autograder.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- RNG con semilla ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    const r = mulberry32(seed);
    r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    r.chance = (p) => r() < p;
    r.dec = (a, b, d = 1) => { const f = Math.pow(10, d); return Math.round((a + r() * (b - a)) * f) / f; };
    return r;
  }

  /* ---------- Formato y parseo ---------- */
  function round(x, d = 4) { const f = Math.pow(10, d); return Math.round((x + Number.EPSILON) * f) / f; }
  function fmt(x, d = 4) {
    if (typeof x !== 'number' || !isFinite(x)) return String(x);
    let v = round(x, d);
    if (Object.is(v, -0)) v = 0;
    return String(v);
  }
  function parseNum(s) {
    if (s == null) return NaN;
    s = String(s).trim().replace(/\s+/g, '');
    if (!s) return NaN;
    if (/^-?\d+(?:[.,]\d+)?\/-?\d+(?:[.,]\d+)?$/.test(s)) {
      const [a, b] = s.replace(/,/g, '.').split('/');
      return parseFloat(a) / parseFloat(b);
    }
    s = s.replace(',', '.');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  function normTokens(s) {
    return String(s || '').toUpperCase().replace(/[–—]/g, '-').split(/[^A-Z0-9ÁÉÍÓÚÑ\-]+|(?<![A-Z0-9])-|-(?![A-Z0-9])/).filter(Boolean);
  }
  function normEdge(tok) {
    const p = tok.split('-').filter(Boolean);
    if (p.length !== 2) return tok;
    return p.sort(cmpLabel).join('-');
  }
  function gradeField(f, input) {
    if (f.type === 'text') {
      const mode = f.mode || 'exact';
      let a, b;
      if (mode === 'seq') {
        a = String(input || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).join('-');
        b = String(f.answer).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).join('-');
      } else if (mode === 'set') {
        a = String(input || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).sort(cmpLabel).join(',');
        b = String(f.answer).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).sort(cmpLabel).join(',');
      } else if (mode === 'edges') {
        const toks = (str) => String(str || '').toUpperCase().replace(/[–—]/g, '-').split(/[^A-Z0-9-]+/).filter(t => /^[A-Z0-9]+-[A-Z0-9]+$/.test(t)).map(normEdge).sort().join(',');
        a = toks(input); b = toks(f.answer);
      } else {
        const n = (x) => String(x || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        a = n(input); b = n(f.answer);
        if (f.alts) return f.alts.map(n).concat([b]).includes(a);
      }
      return a !== '' && a === b;
    }
    const x = parseNum(input);
    if (isNaN(x)) return false;
    const tol = f.tol != null ? f.tol : Math.max(0.006, 0.01 * Math.abs(f.answer));
    return Math.abs(x - f.answer) <= tol + 1e-12;
  }

  /* ---------- Helpers HTML ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function table(headers, rows, opts = {}) {
    let h = '<div class="tbl-wrap"><table class="mtx' + (opts.cls ? ' ' + opts.cls : '') + '">';
    if (headers) h += '<thead><tr>' + headers.map(x => '<th>' + x + '</th>').join('') + '</tr></thead>';
    h += '<tbody>' + rows.map(r => '<tr>' + r.map((c, i) => (i === 0 && opts.rowHead !== false ? '<th>' + c + '</th>' : '<td>' + c + '</td>')).join('') + '</tr>').join('') + '</tbody></table></div>';
    return h;
  }
  const vec = (v, d = 3) => '[' + v.map(x => fmt(x, d)).join(', ') + ']';
  const step = (n, title, body) => `<div class="sol-step"><div class="sol-n">${n}</div><div class="sol-b"><div class="sol-t">${title}</div>${body}</div></div>`;
  const fx = (s) => `<div class="fx">${s}</div>`;

  function cmpLabel(a, b) {
    const na = Number(a), nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  }
  const edgeKey = (u, v) => [u, v].sort(cmpLabel).join('-');

  /* ---------- SVG de grafos ---------- */
  const COMM = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  function drawGraph(g, opts = {}) {
    const W = opts.w || 520, H = opts.h || 300, pad = 30;
    const xs = g.nodes.map(n => n.x), ys = g.nodes.map(n => n.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const sx = (x) => pad + (maxX === minX ? 0.5 : (x - minX) / (maxX - minX)) * (W - 2 * pad);
    const sy = (y) => pad + (maxY === minY ? 0.5 : (y - minY) / (maxY - minY)) * (H - 2 * pad);
    const pos = {}; g.nodes.forEach(n => pos[n.id] = [sx(n.x), sy(n.y)]);
    const R = opts.r || 15;
    let s = `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="grafo">`;
    if (g.directed) s += `<defs><marker id="arr${opts.uid || ''}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--ink)"/></marker></defs>`;
    // self loops
    if (g.loops) {
      for (const id in g.loops) {
        const [x, y] = pos[id];
        s += `<path d="M ${x - 8} ${y - R + 2} C ${x - 34} ${y - 60}, ${x + 34} ${y - 60}, ${x + 8} ${y - R + 2}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
        s += `<text x="${x}" y="${y - 50}" class="g-w" text-anchor="middle">${g.loops[id]}</text>`;
      }
    }
    for (const e of g.edges) {
      const [x1, y1] = pos[e.u], [x2, y2] = pos[e.v];
      const hl = e.hl ? ' g-hl' : '';
      if (g.directed) {
        const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const bend = 18;
        const mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
        // trim start/end
        const a1x = x1 + ux * R, a1y = y1 + uy * R;
        const ex = x2 - ux * (R + 2), ey = y2 - uy * (R + 2);
        s += `<path d="M ${a1x} ${a1y} Q ${mx} ${my} ${ex} ${ey}" fill="none" stroke="var(--ink)" stroke-width="1.6" marker-end="url(#arr${opts.uid || ''})" class="${hl}"/>`;
      } else {
        s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--ink)" stroke-width="${e.w && opts.weighted ? 1.4 + Math.min(4, e.w * 0.5) : 1.7}" class="${hl}"/>`;
        if (e.label != null) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          s += `<rect x="${mx - 11}" y="${my - 9}" width="22" height="16" rx="4" fill="var(--surface)" stroke="var(--line)"/><text x="${mx}" y="${my + 3.5}" class="g-w" text-anchor="middle">${e.label}</text>`;
        }
      }
    }
    for (const n of g.nodes) {
      const [x, y] = pos[n.id];
      const fill = n.comm != null ? COMM[n.comm % COMM.length] : 'var(--surface)';
      const tc = n.comm != null ? 'g-lbl-inv' : 'g-lbl';
      s += `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}" stroke="var(--ink)" stroke-width="1.6"/>`;
      s += `<text x="${x}" y="${y + 4.5}" text-anchor="middle" class="${tc}">${esc(n.id)}</text>`;
      if (n.tag) s += `<text x="${x}" y="${y + R + 14}" text-anchor="middle" class="g-tag">${esc(n.tag)}</text>`;
    }
    return s + '</svg>';
  }

  /* ---------- Grafos: utilidades ---------- */
  function adjOf(g) {
    const a = {}; g.nodes.forEach(n => a[n.id] = []);
    g.edges.forEach(e => { a[e.u].push(e.v); if (!g.directed) a[e.v].push(e.u); });
    for (const k in a) a[k].sort(cmpLabel);
    return a;
  }
  function connected(g) {
    const a = adjOf({ nodes: g.nodes, edges: g.edges, directed: false });
    const ids = g.nodes.map(n => n.id); const seen = new Set([ids[0]]); const st = [ids[0]];
    while (st.length) { const u = st.pop(); for (const v of a[u]) if (!seen.has(v)) { seen.add(v); st.push(v); } }
    return seen.size === ids.length;
  }
  function cloneG(g) { return { nodes: g.nodes.map(n => ({ ...n })), edges: g.edges.map(e => ({ ...e })), directed: g.directed }; }

  /* Plantillas de grafos no dirigidos (posiciones a mano) */
  const T = {
    exam: { n: { A: [8, 12], C: [38, 12], E: [72, 12], B: [8, 52], D: [38, 52], F: [72, 52], G: [96, 32] }, e: 'AB AC BC BD CD CE CF EF EG FG', x: ['DF'] },
    six: { n: { A: [8, 10], B: [8, 52], C: [34, 31], D: [62, 31], E: [90, 10], F: [90, 52] }, e: 'AB AC BC CD DE DF EF', x: ['CE', 'BD'] },
    tri2: { n: { A: [8, 12], B: [8, 52], C: [30, 32], D: [56, 32], E: [78, 12], F: [78, 52], G: [98, 32] }, e: 'AB AC BC CD DE DF EF EG FG', x: ['BD'] },
    sq2: { n: { A: [6, 10], B: [32, 10], C: [6, 52], D: [32, 52], E: [66, 10], F: [94, 10], G: [66, 52], H: [94, 52] }, e: 'AB AC BD CD AD BE EF EG FH GH', x: ['BC', 'DG', 'FG'] },
    house: { n: { A: [30, 6], B: [10, 28], C: [50, 28], D: [10, 54], E: [50, 54], F: [76, 28], G: [98, 40] }, e: 'AB AC BC BD CE DE CF FG', x: ['EF', 'EG'] },
    kite: { n: { A: [10, 30], B: [32, 8], C: [32, 52], D: [55, 30], E: [78, 30], F: [98, 10], G: [98, 52] }, e: 'AB AC BC BD CD DE EF EG FG', x: ['AD'] },
  };
  function fromTemplate(key, rng, vary = true) {
    const t = T[key];
    const nodes = Object.entries(t.n).map(([id, [x, y]]) => ({ id, x, y }));
    let pairs = t.e.split(' ');
    if (vary && rng) {
      for (const x of t.x || []) if (rng.chance(0.35)) pairs.push(x);
      if (rng.chance(0.35)) {
        const cand = rng.shuffle(pairs);
        for (const c of cand) {
          const test = pairs.filter(p => p !== c);
          if (connected({ nodes, edges: test.map(p => ({ u: p[0], v: p[1] })) })) { pairs = test; break; }
        }
      }
    }
    return { nodes, edges: pairs.map(p => ({ u: p[0], v: p[1] })), directed: false, key };
  }
  function randomTemplateGraph(rng, keys) { return fromTemplate(rng.pick(keys || Object.keys(T)), rng, true); }

  /* ---------- Brandes (BFS + propagación de crédito) ---------- */
  function brandes(g, s) {
    const adj = adjOf(g);
    const dist = { [s]: 0 }, sig = { [s]: 1 }, parents = { [s]: [] }, order = [s];
    const q = [s];
    while (q.length) {
      const u = q.shift();
      for (const w of adj[u]) {
        if (dist[w] == null) { dist[w] = dist[u] + 1; sig[w] = 0; parents[w] = []; q.push(w); order.push(w); }
        if (dist[w] === dist[u] + 1) { sig[w] += sig[u]; parents[w].push(u); }
      }
    }
    const credit = {}; order.forEach(v => credit[v] = 1);
    const eb = {}; g.edges.forEach(e => eb[edgeKey(e.u, e.v)] = 0);
    const flows = [];
    for (let i = order.length - 1; i > 0; i--) {
      const w = order[i];
      for (const u of parents[w]) {
        const c = credit[w] * sig[u] / sig[w];
        eb[edgeKey(u, w)] = c; credit[u] += c;
        flows.push({ u, w, c, cw: credit[w], su: sig[u], sw: sig[w] });
      }
    }
    return { dist, sig, parents, order, credit, eb, flows };
  }
  function brandesHTML(g, s, res) {
    const maxL = Math.max(...Object.values(res.dist));
    let lv = '';
    for (let L = 0; L <= maxL; L++) {
      const ns = res.order.filter(v => res.dist[v] === L);
      lv += `<tr><th>Nivel ${L}</th><td>${ns.map(v => `<b>${v}</b> <span class="muted">(σ=${res.sig[v]}${res.parents[v].length ? ', padres: ' + res.parents[v].join(',') : ''})</span>`).join(' &nbsp; ')}</td></tr>`;
    }
    const bfs = `<div class="tbl-wrap"><table class="mtx"><tbody>${lv}</tbody></table></div>`;
    const fl = res.flows.map(f => `<tr><td>${f.w} → ${f.u}</td><td>${fmt(f.cw, 3)} × ${f.su}/${f.sw}</td><td><b>${fmt(f.c, 3)}</b></td></tr>`).join('');
    const cr = res.order.slice().reverse().map(v => `${v}: ${fmt(res.credit[v], 3)}`).join(' · ');
    return { bfs, flow: `<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Arista (hijo→padre)</th><th>crédito(hijo) × σ(padre)/σ(hijo)</th><th>Aporte</th></tr></thead><tbody>${fl}</tbody></table></div><p class="muted small">Crédito final de cada nodo (1 + suma de lo que recibe de sus hijos): ${cr}</p>` };
  }

  /* ---------- PageRank ---------- */
  function buildM(nodes, adj) {
    const N = nodes.length, idx = {}; nodes.forEach((n, i) => idx[n] = i);
    const M = Array.from({ length: N }, () => Array(N).fill(0));
    nodes.forEach((i) => { const d = adj[i].length; adj[i].forEach(j => { M[idx[j]][idx[i]] = 1 / d; }); });
    return M;
  }
  const matVec = (M, r) => M.map(row => row.reduce((s, x, j) => s + x * r[j], 0));
  function fracStr(x) {
    for (let d = 1; d <= 12; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? String(n) : `${n}/${d}`; }
    return fmt(x, 3);
  }
  function randomDigraph(rng, N, { allowDead = false, strong = true } = {}) {
    const ids = ['A', 'B', 'C', 'D', 'E'].slice(0, N);
    const P = N === 3 ? [[50, 5], [10, 55], [90, 55]] : N === 4 ? [[10, 10], [90, 10], [10, 60], [90, 60]] : [[50, 4], [8, 30], [92, 30], [25, 64], [75, 64]];
    for (let tries = 0; tries < 500; tries++) {
      const adj = {};
      ids.forEach(i => {
        const others = ids.filter(x => x !== i);
        let d = rng.int(1, Math.min(2, others.length));
        if (N >= 4 && rng.chance(0.15)) d = 3;
        adj[i] = rng.shuffle(others).slice(0, d).sort();
      });
      if (allowDead) { const v = rng.pick(ids); adj[v] = []; }
      if (strong && !allowDead) {
        let ok = true;
        for (const s of ids) { const seen = new Set([s]), st = [s]; while (st.length) { const u = st.pop(); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); st.push(v); } } if (seen.size < N) { ok = false; break; } }
        if (!ok) continue;
      }
      const nodes = ids.map((id, k) => ({ id, x: P[k][0], y: P[k][1] }));
      const edges = []; ids.forEach(i => adj[i].forEach(j => edges.push({ u: i, v: j })));
      return { g: { nodes, edges, directed: true }, adj, ids };
    }
  }
  function mTable(ids, M) { return table([''].concat(ids.map(i => 'desde ' + i)), ids.map((j, r) => ['a ' + j].concat(M[r].map(fracStr)))); }

  /* ---------- Álgebra: autovalores (Jacobi) ---------- */
  function jacobiEigen(A) {
    const n = A.length; const a = A.map(r => r.slice()); const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
      if (off < 1e-18) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-14) continue;
        const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const vals = a.map((r, i) => r[i]);
    const idx = vals.map((v, i) => i).sort((i, j) => vals[i] - vals[j]);
    return { vals: idx.map(i => vals[i]), vecs: idx.map(i => V.map(r => r[i])) };
  }

  /* ---------- Similitudes ---------- */
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const norm = (a) => Math.sqrt(dot(a, a));
  const cosine = (a, b) => { const d = norm(a) * norm(b); return d ? dot(a, b) / d : 0; };
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  function pearsonPDF(x, y) { // media sobre TODAS las calificaciones del vector, suma sobre comunes
    const vx = x.filter(v => v != null), vy = y.filter(v => v != null);
    const mx = mean(vx), my = mean(vy);
    let num = 0, dx = 0, dy = 0; const common = [];
    x.forEach((xv, i) => { if (xv != null && y[i] != null) { common.push(i); num += (xv - mx) * (y[i] - my); dx += (xv - mx) ** 2; dy += (y[i] - my) ** 2; } });
    const s = dx && dy ? num / Math.sqrt(dx * dy) : 0;
    return { s, mx, my, num, dx, dy, common };
  }
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));

  /* ============================================================
     GENERADORES
     Cada uno devuelve { statement, fields, table?, solution }
     ============================================================ */
  const G = {};
  const NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank'];
  const MOVIES = ['Avatar', 'Titanic', 'Matrix', 'Piratas', 'Inception', 'Up', 'Coco', 'Joker'];
  const cell = (v) => (v == null ? '<span class="muted">–</span>' : v);

  /* ----- 1. FC ítem-ítem con coseno (estilo examen) ----- */
  G.cf_item_cos = {
    topic: 'rec', title: 'FC ítem-ítem con coseno', tag: 'Examen 2026-1',
    gen(rng) {
      for (let t = 0; t < 400; t++) {
        const nU = rng.pick([3, 3, 4]); const users = NAMES.slice(0, nU); const items = rng.shuffle(MOVIES).slice(0, 4);
        const R = items.map(() => users.map(() => rng.int(1, 5)));
        const tu = nU - 1, ti = 3; R[ti][tu] = null;
        const miss = rng.int(0, 2); R[miss][tu] = null; // el usuario objetivo no calificó un ítem
        for (let u = 0; u < nU - 1; u++) if (rng.chance(0.4)) { const i = rng.int(0, 2); R[i][u] = null; }
        const rated = [0, 1, 2].filter(i => R[i][tu] != null);
        if (rated.length < 2) continue;
        if (R[ti].filter(v => v != null).length < 2) continue;
        const z = (row) => row.map(v => (v == null ? 0 : v));
        const sims = rated.map(i => cosine(z(R[ti]), z(R[i])));
        if (sims.some(s => s <= 0.05)) continue;
        const num = rated.reduce((s, i, k) => s + sims[k] * R[i][tu], 0), den = sims.reduce((a, b) => a + b, 0);
        const pred = num / den;
        const tgt = items[ti], who = users[tu];
        const statement = `<p>La tabla muestra calificaciones (1 a 5). Prediga la calificación que <b>${who}</b> daría a <b>${tgt}</b> con <b>Filtrado Colaborativo basado en Ítems</b> y similitud del <b>coseno</b>.</p>
          ${table(['Película'].concat(users), items.map((it, i) => [it].concat(R[i].map((v, u) => (i === ti && u === tu ? '<b>¿?</b>' : cell(v))))))}
          <p class="conv">Convención: los vacíos valen 0 en los vectores de ítem (cada ítem es un vector sobre todos los usuarios). Sin normalización, sin sesgos ni Top-K: use <b>todas</b> las películas calificadas por ${who}.</p>`;
        const fields = rated.map((i, k) => ({ id: 's' + i, label: `sim(${tgt}, ${items[i]})`, answer: sims[k] }));
        fields.push({ id: 'pred', label: `r̂(${who}, ${tgt})`, answer: pred, tol: 0.03 });
        const vt = z(R[ti]);
        let sol = step(1, 'Vectores de ítem (vacío = 0)', `<p>${items.map((it, i) => `${it} = ${vec(z(R[i]), 0)}`).join('<br>')}</p><p class="muted small">El ítem objetivo tiene 0 en la celda desconocida.</p>`);
        sol += step(2, 'Similitud del coseno con cada película calificada por ' + who, rated.map((i, k) => { const v = z(R[i]); return fx(`cos(${tgt}, ${items[i]}) = ${dot(vt, v)} / (√${dot(vt, vt)} · √${dot(v, v)}) = ${dot(vt, v)} / ${fmt(norm(vt) * norm(v), 4)} = <b>${fmt(sims[k], 4)}</b>`); }).join(''));
        sol += step(3, 'Promedio ponderado por la similitud', fx(`r̂ = Σ s·r / Σ s = (${rated.map((i, k) => `${fmt(sims[k], 4)}·${R[i][tu]}`).join(' + ')}) / (${sims.map(s => fmt(s, 4)).join(' + ')}) = ${fmt(num, 4)} / ${fmt(den, 4)} = <b>${fmt(pred, 3)}</b>`));
        return { statement, fields, solution: sol };
      }
    }
  };

  /* ----- 2. FC usuario-usuario con Pearson, k=2 ----- */
  function cfPearson(rng, mode) {
    for (let t = 0; t < 800; t++) {
      const nR = 4, nC = 5;
      const rows = mode === 'user' ? ['Ana', 'Beto', 'Carla', 'Diego'] : ['I1', 'I2', 'I3', 'I4'];
      const cols = mode === 'user' ? ['I1', 'I2', 'I3', 'I4', 'I5'] : ['U1', 'U2', 'U3', 'U4', 'U5'];
      const R = rows.map(() => cols.map(() => rng.int(1, 5)));
      const tr = 0, tc = mode === 'user' ? 3 : 4; R[tr][tc] = null;
      for (let r = 1; r < nR; r++) if (rng.chance(0.6)) { let c = rng.int(0, nC - 1); R[r][c] = null; }
      const res = rows.map((_, r) => (r === tr ? null : pearsonPDF(R[tr], R[r])));
      const cand = [1, 2, 3].filter(r => R[r][tc] != null && res[r].s > 0 && res[r].common.length >= 2).sort((a, b) => res[b].s - res[a].s);
      if (cand.length < 2) continue;
      if (cand.length >= 3 && Math.abs(res[cand[1]].s - res[cand[2]].s) < 0.03) continue;
      const allS = [1, 2, 3].map(r => res[r].s);
      if (allS.some(s => !isFinite(s))) continue;
      const nb = cand.slice(0, 2);
      const num = nb.reduce((s, r) => s + res[r].s * R[r][tc], 0), den = nb.reduce((s, r) => s + res[r].s, 0);
      const pred = num / den;
      const excluded = [1, 2, 3].filter(r => !nb.includes(r));
      const tName = rows[tr], iName = cols[tc];
      const what = mode === 'user' ? `la calificación de <b>${tName}</b> para <b>${iName}</b> (FC usuario-usuario)` : `la calificación de <b>${iName}</b> para el ítem <b>${tName}</b> (FC ítem-ítem; filas = ítems)`;
      const statement = `<p>Prediga ${what} usando correlación de <b>Pearson</b> y <b>k = 2</b> vecinos.</p>
        ${table([''].concat(cols), rows.map((rn, r) => [rn].concat(R[r].map((v, c) => (r === tr && c === tc ? '<b>?</b>' : cell(v))))))}
        <p class="conv">Convención (hoja de ejercicios del curso): la media de cada ${mode === 'user' ? 'usuario' : 'ítem'} usa <b>todas</b> sus calificaciones; la suma de Pearson solo recorre los elementos en común. Predicción = promedio ponderado por similitud con los 2 vecinos más similares (similitud positiva) que sí calificaron el elemento.</p>`;
      const fields = [{ id: 'm0', label: `media(${tName})`, answer: res[1].mx }];
      [1, 2, 3].forEach(r => fields.push({ id: 's' + r, label: `sim(${tName}, ${rows[r]})`, answer: res[r].s, tol: 0.02 }));
      fields.push({ id: 'pred', label: `predicción`, answer: pred, tol: 0.04 });
      let sol = step(1, 'Medias (con todas las calificaciones de cada fila)', `<p>${rows.map((rn, r) => { const v = R[r].filter(x => x != null); return `${rn}: (${v.join('+')})/${v.length} = <b>${fmt(mean(v), 3)}</b>`; }).join('<br>')}</p>`);
      sol += step(2, 'Pearson contra ' + tName + ' (solo elementos en común)', [1, 2, 3].map(r => {
        const p = res[r]; const terms = p.common.map(i => `(${R[tr][i]}−${fmt(p.mx, 2)})(${R[r][i]}−${fmt(p.my, 2)})`).join(' + ');
        return `<p><b>${rows[r]}</b> · comunes: ${p.common.map(i => cols[i]).join(', ')}<br><span class="mono small">num = ${terms} = ${fmt(p.num, 3)}</span><br><span class="mono small">den = √(${fmt(p.dx, 3)} · ${fmt(p.dy, 3)}) = ${fmt(Math.sqrt(p.dx * p.dy), 3)}</span> → sim = <b>${fmt(p.s, 3)}</b></p>`;
      }).join(''));
      sol += step(3, 'Elegir k = 2 vecinos', `<p>Candidatos con similitud &gt; 0 que calificaron ${mode === 'user' ? iName : 'el ítem'}: ${cand.map(r => `${rows[r]} (${fmt(res[r].s, 3)})`).join(', ')}. Vecinos: <b>${nb.map(r => rows[r]).join(' y ')}</b>.${excluded.length ? ` Quedan fuera: ${excluded.map(r => `${rows[r]} (${R[r][tc] == null ? 'no calificó' : 'similitud ' + fmt(res[r].s, 3) + (res[r].s <= 0 ? ' ≤ 0' : ', no está entre los 2 mejores')})`).join('; ')}.` : ''}</p>`);
      sol += step(4, 'Promedio ponderado', fx(`r̂ = (${nb.map(r => `${fmt(res[r].s, 3)}·${R[r][tc]}`).join(' + ')}) / (${nb.map(r => fmt(res[r].s, 3)).join(' + ')}) = <b>${fmt(pred, 3)}</b>`));
      return { statement, fields, solution: sol };
    }
  }
  G.cf_user_pearson = { topic: 'rec', title: 'FC usuario-usuario con Pearson (k=2)', gen: (rng) => cfPearson(rng, 'user') };
  G.cf_item_pearson = { topic: 'rec', title: 'FC ítem-ítem con Pearson (k=2)', gen: (rng) => cfPearson(rng, 'item') };

  /* ----- 3. Basado en contenido ----- */
  G.content_cos = {
    topic: 'rec', title: 'Recomendación basada en contenido',
    gen(rng) {
      const feats = ['Acción', 'Drama', 'Ciencia ficción'];
      const it = rng.shuffle(MOVIES).slice(0, 3);
      const v = [0, 1, 2].map(() => feats.map(() => rng.dec(0.1, 1, 1)));
      const prof = feats.map((_, k) => (v[0][k] + v[1][k]) / 2);
      const c = cosine(prof, v[2]);
      const statement = `<p>Un usuario calificó con 5 estrellas <b>${it[0]}</b> y <b>${it[1]}</b>. El perfil del usuario es el promedio de los perfiles de esos ítems. Calcule el perfil y la similitud coseno con el ítem nuevo <b>${it[2]}</b>.</p>
        ${table(['Ítem'].concat(feats), it.map((n, i) => [n].concat(v[i])))}`;
      const fields = feats.map((f, k) => ({ id: 'p' + k, label: `perfil[${f}]`, answer: prof[k] }));
      fields.push({ id: 'cos', label: `cos(perfil, ${it[2]})`, answer: c, tol: 0.01 });
      let sol = step(1, 'Perfil de usuario = promedio', `<p>${feats.map((f, k) => `${f}: (${v[0][k]} + ${v[1][k]})/2 = <b>${fmt(prof[k], 3)}</b>`).join('<br>')}</p>`);
      sol += step(2, 'Coseno', fx(`cos = ${fmt(dot(prof, v[2]), 4)} / (${fmt(norm(prof), 4)} · ${fmt(norm(v[2]), 4)}) = <b>${fmt(c, 3)}</b>`) + `<p class="muted small">Producto punto: ${feats.map((_, k) => `${fmt(prof[k], 3)}·${v[2][k]}`).join(' + ')}.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 4. TF-IDF ----- */
  G.tfidf = {
    topic: 'rec', title: 'TF-IDF',
    gen(rng) {
      const terms = ['gato', 'perro', 'árbol', 'casa'];
      for (let t = 0; t < 100; t++) {
        const N = 4; const F = Array.from({ length: N }, () => terms.map(() => (rng.chance(0.35) ? 0 : rng.int(1, 6))));
        if (F.some(r => r.every(x => x === 0))) continue;
        const d = rng.int(0, N - 1); const ti = rng.int(0, 3);
        if (F[d][ti] === 0) continue;
        const ni = F.filter(r => r[ti] > 0).length; if (ni === N) continue;
        const mx = Math.max(...F[d]);
        const tf = F[d][ti] / mx, idf = Math.log2(N / ni);
        const statement = `<p>Matriz de frecuencias de términos (filas = documentos). Calcule TF, IDF y TF-IDF del término <b>"${terms[ti]}"</b> en el documento <b>D${d + 1}</b>.</p>
          ${table(['Doc'].concat(terms), F.map((r, i) => ['D' + (i + 1)].concat(r)))}
          <p class="conv">TF(i,j) = f<sub>ij</sub> / max<sub>k</sub> f<sub>kj</sub> &nbsp;·&nbsp; IDF(i) = log<sub>2</sub>(N / n<sub>i</sub>) (convención MMDS).</p>`;
        const fields = [{ id: 'tf', label: 'TF', answer: tf }, { id: 'idf', label: 'IDF', answer: idf }, { id: 'w', label: 'TF-IDF', answer: tf * idf }];
        let sol = step(1, 'TF', fx(`TF = ${F[d][ti]} / max(${F[d].join(', ')}) = ${F[d][ti]}/${mx} = <b>${fmt(tf, 4)}</b>`));
        sol += step(2, 'IDF', fx(`n = ${ni} documentos contienen "${terms[ti]}" → IDF = log₂(${N}/${ni}) = <b>${fmt(idf, 4)}</b>`));
        sol += step(3, 'TF-IDF', fx(`${fmt(tf, 4)} × ${fmt(idf, 4)} = <b>${fmt(tf * idf, 4)}</b>`));
        return { statement, fields, solution: sol };
      }
    }
  };

  /* ----- 5. Baseline (efectos globales) ----- */
  G.baseline = {
    topic: 'rec', title: 'Predicción baseline μ + bₓ + bᵢ',
    gen(rng) {
      const users = ['Ana', 'Bob', 'Carol'], items = ['I1', 'I2', 'I3', 'I4'];
      const R = users.map(() => items.map(() => (rng.chance(0.25) ? null : rng.int(1, 5))));
      R[0][0] = null; R[1][0] = R[1][0] || rng.int(1, 5); R[2][0] = R[2][0] || rng.int(1, 5);
      for (let u = 0; u < 3; u++) if (R[u].filter(x => x != null).length < 2) R[u][rng.int(1, 3)] = rng.int(1, 5);
      const all = R.flat().filter(x => x != null);
      const mu = mean(all), ux = mean(R[0].filter(x => x != null)), ii = mean(R.map(r => r[0]).filter(x => x != null));
      const bx = ux - mu, bi = ii - mu, b = mu + bx + bi;
      const statement = `<p>Calcule la predicción base (baseline) de <b>Ana</b> para <b>I1</b>.</p>${table([''].concat(items), users.map((u, k) => [u].concat(R[k].map((v, j) => (k === 0 && j === 0 ? '<b>?</b>' : cell(v))))))}
        <p class="conv">b<sub>xi</sub> = μ + b<sub>x</sub> + b<sub>i</sub>; μ = media global de las calificaciones conocidas; b<sub>x</sub> = media(usuario) − μ; b<sub>i</sub> = media(ítem) − μ.</p>`;
      const fields = [{ id: 'mu', label: 'μ', answer: mu }, { id: 'bx', label: 'b(Ana)', answer: bx }, { id: 'bi', label: 'b(I1)', answer: bi }, { id: 'b', label: 'b(Ana, I1)', answer: b, tol: 0.02 }];
      let sol = step(1, 'Media global', fx(`μ = (${all.join('+')}) / ${all.length} = <b>${fmt(mu, 3)}</b>`));
      sol += step(2, 'Sesgos', fx(`media(Ana) = ${fmt(ux, 3)} → b<sub>Ana</sub> = ${fmt(ux, 3)} − ${fmt(mu, 3)} = <b>${fmt(bx, 3)}</b>`) + fx(`media(I1) = ${fmt(ii, 3)} → b<sub>I1</sub> = ${fmt(ii, 3)} − ${fmt(mu, 3)} = <b>${fmt(bi, 3)}</b>`));
      sol += step(3, 'Baseline', fx(`b = ${fmt(mu, 3)} + (${fmt(bx, 3)}) + (${fmt(bi, 3)}) = <b>${fmt(b, 3)}</b>`) + '<p class="muted small">Simplifica a media(usuario) + media(ítem) − μ.</p>');
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 6. MAE y RMSE ----- */
  G.mae_rmse = {
    topic: 'rec', title: 'Evaluación: MAE y RMSE',
    gen(rng) {
      const n = 5; const real = Array.from({ length: n }, () => rng.int(1, 5));
      const pa = real.map(r => Math.min(5, Math.max(1, round(r + rng.dec(-1.5, 1.5, 1), 1))));
      const pb = real.map(r => Math.min(5, Math.max(1, round(r + rng.dec(-1.2, 1.2, 1), 1))));
      const mae = (p) => mean(p.map((x, i) => Math.abs(x - real[i])));
      const rmse = (p) => Math.sqrt(mean(p.map((x, i) => (x - real[i]) ** 2)));
      const statement = `<p>Se ocultaron ${n} calificaciones y se predijeron con dos métodos. Calcule MAE y RMSE de cada uno.</p>${table(['Caso', 'Real', 'Método A', 'Método B'], real.map((r, i) => [i + 1, r, pa[i], pb[i]]))}`;
      const better = rmse(pa) < rmse(pb) ? 'A' : 'B';
      const fields = [{ id: 'ma', label: 'MAE A', answer: mae(pa) }, { id: 'ra', label: 'RMSE A', answer: rmse(pa) }, { id: 'mb', label: 'MAE B', answer: mae(pb) }, { id: 'rb', label: 'RMSE B', answer: rmse(pb) }, { id: 'best', label: 'Mejor según RMSE (A/B)', type: 'text', answer: better }];
      const row = (p, nm) => step(nm === 'A' ? 1 : 2, 'Método ' + nm, `<p class="mono small">|e| = ${p.map((x, i) => fmt(Math.abs(x - real[i]), 2)).join(', ')} → MAE = ${fmt(p.reduce((s, x, i) => s + Math.abs(x - real[i]), 0), 3)}/${n} = <b>${fmt(mae(p), 3)}</b></p><p class="mono small">e² = ${p.map((x, i) => fmt((x - real[i]) ** 2, 2)).join(', ')} → RMSE = √(${fmt(p.reduce((s, x, i) => s + (x - real[i]) ** 2, 0), 3)}/${n}) = <b>${fmt(rmse(p), 3)}</b></p>`);
      const sol = row(pa, 'A') + row(pb, 'B') + step(3, 'Conclusión', `<p>Menor RMSE: <b>${better}</b>. RMSE ≥ MAE siempre, porque eleva al cuadrado y penaliza más los errores grandes.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 7. Factores latentes: predicción ----- */
  G.latent_pred = {
    topic: 'rec', title: 'Factores latentes: predicción con sesgos',
    gen(rng) {
      const items = ['Inception', 'El Diario', 'Vengadores'];
      const Q = items.map(() => [rng.dec(-1.5, 1.5, 1), rng.dec(-1.5, 1.5, 1)]);
      const p = [rng.dec(-1.2, 1.2, 1), rng.dec(-1.2, 1.2, 1)];
      const mu = rng.pick([3.5, 3.6, 3.7]), bx = rng.dec(-0.5, 0.5, 1), bi = items.map(() => rng.dec(-0.6, 0.6, 1));
      const preds = items.map((_, i) => mu + bx + bi[i] + dot(Q[i], p));
      const best = items[preds.indexOf(Math.max(...preds))];
      const statement = `<p>Modelo r̂<sub>xi</sub> = μ + b<sub>x</sub> + b<sub>i</sub> + q<sub>i</sub>·p<sub>x</sub>, con k = 2. μ = ${mu}, usuario Alicia con b<sub>x</sub> = ${bx} y p<sub>Alicia</sub> = ${vec(p, 2)}.</p>
        ${table(['Ítem', 'Factor 1', 'Factor 2', 'b_i'], items.map((n, i) => [n, Q[i][0], Q[i][1], bi[i]]))}<p>Calcule la predicción para cada película y diga cuál recomendar.</p>`;
      const fields = items.map((n, i) => ({ id: 'r' + i, label: `r̂(Alicia, ${n})`, answer: preds[i] }));
      fields.push({ id: 'best', label: 'Película a recomendar', type: 'text', answer: best, alts: [best.split(' ').pop()] });
      const sol = step(1, 'Producto punto + sesgos', items.map((n, i) => fx(`${n}: ${mu} + (${bx}) + (${bi[i]}) + (${Q[i][0]}·${p[0]} + ${Q[i][1]}·${p[1]}) = ${mu} + (${bx}) + (${bi[i]}) + ${fmt(dot(Q[i], p), 3)} = <b>${fmt(preds[i], 3)}</b>`)).join('')) + step(2, 'Recomendar', `<p>Mayor predicción: <b>${best}</b>.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 8. Un paso de SGD ----- */
  G.sgd_step = {
    topic: 'rec', title: 'Un paso de SGD (factores latentes)',
    gen(rng) {
      const q = [rng.dec(-1, 1.5, 1), rng.dec(-1, 1.5, 1)], p = [rng.dec(-1, 1.5, 1), rng.dec(-1, 1.5, 1)];
      const r = rng.int(1, 5), eta = rng.pick([0.1, 0.05, 0.2]), lam = rng.pick([0.1, 0.02, 0.05]);
      const pred = dot(q, p), e = r - pred;
      const qn = q.map((qi, k) => qi + eta * (e * p[k] - lam * qi));
      const pn = p.map((pk, k) => pk + eta * (e * q[k] - lam * pk));
      const statement = `<p>Para el rating conocido r<sub>xi</sub> = ${r}, con q<sub>i</sub> = ${vec(q, 2)}, p<sub>x</sub> = ${vec(p, 2)}, η = ${eta} y λ = ${lam}, aplique un paso de descenso de gradiente estocástico.</p>
        <p class="conv">e = r − q·p; &nbsp; q ← q + η(e·p − λq); &nbsp; p ← p + η(e·q<sub>viejo</sub> − λp). Use los valores <b>antiguos</b> en ambas actualizaciones.</p>`;
      const fields = [{ id: 'e', label: 'error e', answer: e }, { id: 'q0', label: 'q nuevo [0]', answer: qn[0] }, { id: 'q1', label: 'q nuevo [1]', answer: qn[1] }, { id: 'p0', label: 'p nuevo [0]', answer: pn[0] }, { id: 'p1', label: 'p nuevo [1]', answer: pn[1] }];
      let sol = step(1, 'Error residual', fx(`q·p = ${q[0]}·${p[0]} + ${q[1]}·${p[1]} = ${fmt(pred, 4)} → e = ${r} − ${fmt(pred, 4)} = <b>${fmt(e, 4)}</b>`));
      sol += step(2, 'Actualizar q', [0, 1].map(k => fx(`q[${k}] = ${q[k]} + ${eta}(${fmt(e, 4)}·${p[k]} − ${lam}·${q[k]}) = <b>${fmt(qn[k], 4)}</b>`)).join(''));
      sol += step(3, 'Actualizar p (con q antiguo)', [0, 1].map(k => fx(`p[${k}] = ${p[k]} + ${eta}(${fmt(e, 4)}·${q[k]} − ${lam}·${p[k]}) = <b>${fmt(pn[k], 4)}</b>`)).join(''));
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 9. PageRank: power iteration sin teletransporte ----- */
  G.pr_power = {
    topic: 'pr', title: 'Power iteration (sin teletransporte)',
    gen(rng) {
      const N = rng.pick([3, 4]); const { g, adj, ids } = randomDigraph(rng, N);
      const M = buildM(ids, adj); let r0 = ids.map(() => 1 / N); const r1 = matVec(M, r0), r2 = matVec(M, r1);
      const statement = `<p>Sobre el grafo dirigido, construya la matriz estocástica M y calcule dos iteraciones de power iteration, r<sup>(t+1)</sup> = M·r<sup>(t)</sup>, partiendo de r<sup>(0)</sup> = [1/${N}, …].</p>${drawGraph(g, { uid: 'p' + rng.int(0, 1e6), h: 240 })}`;
      const fields = [];
      ids.forEach((id, k) => fields.push({ id: 'a' + id, label: `r⁽¹⁾(${id})`, answer: r1[k] }));
      ids.forEach((id, k) => fields.push({ id: 'b' + id, label: `r⁽²⁾(${id})`, answer: r2[k] }));
      let sol = step(1, 'Matriz M (columna i reparte 1/dᵢ a cada destino)', `<p class="small">${ids.map(i => `${i} → ${adj[i].join(', ')} (d=${adj[i].length})`).join(' · ')}</p>` + mTable(ids, M));
      sol += step(2, 'Iteración 1', ids.map((j, k) => fx(`r⁽¹⁾(${j}) = ${ids.map((i, c) => (M[k][c] ? `${fracStr(M[k][c])}·${fracStr(r0[c])}` : null)).filter(Boolean).join(' + ') || '0'} = <b>${fracStr(r1[k])}</b> ≈ ${fmt(r1[k], 4)}`)).join(''));
      sol += step(3, 'Iteración 2', ids.map((j, k) => fx(`r⁽²⁾(${j}) = ${ids.map((i, c) => (M[k][c] ? `${fracStr(M[k][c])}·${fmt(r1[c], 4)}` : null)).filter(Boolean).join(' + ') || '0'} = <b>${fmt(r2[k], 4)}</b>`)).join('') + `<p class="muted small">Comprobación: la suma de r sigue siendo 1 (no hay dead ends).</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 10. PageRank con teletransporte ----- */
  G.pr_teleport = {
    topic: 'pr', title: 'PageRank con teletransporte (Google Matrix)',
    gen(rng) {
      const N = rng.pick([3, 4]); const { g, adj, ids } = randomDigraph(rng, N, { strong: false });
      const beta = rng.pick([0.8, 0.85]); const M = buildM(ids, adj); const tel = (1 - beta) / N;
      const r0 = ids.map(() => 1 / N); const r1 = matVec(M, r0).map(x => beta * x + tel); const r2 = matVec(M, r1).map(x => beta * x + tel);
      const statement = `<p>Calcule dos iteraciones de PageRank con teletransporte, r<sup>(t+1)</sup> = β·M·r<sup>(t)</sup> + (1−β)/N, con <b>β = ${beta}</b> y r<sup>(0)</sup> uniforme.</p>${drawGraph(g, { uid: 't' + rng.int(0, 1e6), h: 240 })}`;
      const fields = [{ id: 'tel', label: '(1−β)/N', answer: tel, tol: 0.0006 }];
      ids.forEach((id, k) => fields.push({ id: 'a' + id, label: `r⁽¹⁾(${id})`, answer: r1[k], tol: 0.003 }));
      ids.forEach((id, k) => fields.push({ id: 'b' + id, label: `r⁽²⁾(${id})`, answer: r2[k], tol: 0.004 }));
      const Ag = M.map(row => row.map(x => beta * x + tel));
      let sol = step(1, 'Matriz M', mTable(ids, M));
      sol += step(2, 'Google Matrix A = βM + (1−β)/N (opcional, equivalente)', table([''].concat(ids), ids.map((j, r) => [j].concat(Ag[r].map(x => fmt(x, 4))))));
      sol += step(3, 'Iteración 1', ids.map((j, k) => fx(`r⁽¹⁾(${j}) = ${beta}·(${ids.map((i, c) => (M[k][c] ? `${fracStr(M[k][c])}·${fmt(r0[c], 4)}` : null)).filter(Boolean).join(' + ') || '0'}) + ${fmt(tel, 4)} = <b>${fmt(r1[k], 4)}</b>`)).join(''));
      sol += step(4, 'Iteración 2', ids.map((j, k) => fx(`r⁽²⁾(${j}) = ${beta}·(${ids.map((i, c) => (M[k][c] ? `${fracStr(M[k][c])}·${fmt(r1[c], 4)}` : null)).filter(Boolean).join(' + ') || '0'}) + ${fmt(tel, 4)} = <b>${fmt(r2[k], 4)}</b>`)).join(''));
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 11. Block-stripe ----- */
  G.pr_blockstripe = {
    topic: 'pr', title: 'PageRank Block-Stripe (una iteración)',
    gen(rng) {
      const { g, adj, ids } = randomDigraph(rng, 4, { strong: false });
      const beta = 0.85, N = 4, tel = (1 - beta) / N; const r = ids.map(() => 0.25);
      const s1 = ids.slice(0, 2), s2 = ids.slice(2);
      const acc = ids.map(() => 0); const rows1 = [], rows2 = [];
      const proc = (S, rows) => S.forEach(i => adj[i].forEach(j => { const c = beta * 0.25 / adj[i].length; acc[ids.indexOf(j)] += c; rows.push(`<tr><td>${i} → ${j}</td><td>${beta} × 0.25 / ${adj[i].length}</td><td>r_nuevo[${j}] += ${fmt(c, 5)}</td></tr>`); }));
      proc(s1, rows1); const after1 = acc.slice(); proc(s2, rows2);
      const fin = acc.map(x => x + tel);
      const statement = `<p>La lista de adyacencia está en disco en 2 stripes: <b>Stripe 1</b> = enlaces de ${s1.join(', ')}; <b>Stripe 2</b> = enlaces de ${s2.join(', ')}. Con β = 0.85, N = 4 y r = [0.25, 0.25, 0.25, 0.25], ejecute una iteración Block-Stripe.</p>
        ${drawGraph(g, { uid: 'b' + rng.int(0, 1e6), h: 230 })}<p class="small mono">${ids.map(i => `${i}: ${adj[i].join(', ')} (grado ${adj[i].length})`).join(' · ')}</p>`;
      const fields = [];
      ids.forEach((id, k) => fields.push({ id: 'x' + id, label: `r_nuevo[${id}] tras Stripe 1`, answer: after1[k], tol: 0.0006 }));
      ids.forEach((id, k) => fields.push({ id: 'f' + id, label: `r⁽¹⁾(${id}) final`, answer: fin[k], tol: 0.0006 }));
      const tb = (rows) => `<div class="tbl-wrap"><table class="mtx"><thead><tr><th>Enlace</th><th>Cálculo</th><th>Acumulador</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
      let sol = step(1, 'Stripe 1', tb(rows1) + `<p>r_nuevo tras Stripe 1 = ${vec(after1, 5)}</p>`);
      sol += step(2, 'Stripe 2 (sin reiniciar el acumulador)', tb(rows2) + `<p>Acumulado total = ${vec(acc, 5)}</p>`);
      sol += step(3, 'Sumar (1−β)/N = 0.0375 una sola vez', `<p>r⁽¹⁾ = ${vec(fin, 5)} · suma = ${fmt(fin.reduce((a, b) => a + b, 0), 5)}</p><p class="muted small">Si hay dead ends la suma queda &lt; 1: su masa se pierde (se corregiría renormalizando).</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 12. Ecuaciones de flujo (solución estacionaria) ----- */
  G.pr_flow = {
    topic: 'pr', title: 'Ecuaciones de flujo (solución exacta)',
    gen(rng) {
      for (let t = 0; t < 200; t++) {
        const { g, adj, ids } = randomDigraph(rng, 3);
        const M = buildM(ids, adj);
        // resolver (M - I) r = 0 con suma 1
        const n = 3; const A = M.map((row, i) => row.map((x, j) => x - (i === j ? 1 : 0))); A[n - 1] = [1, 1, 1]; const b = [0, 0, 1];
        const sol = gauss(A, b); if (!sol || sol.some(x => !isFinite(x) || x < -1e-9)) continue;
        const eqs = ids.map((j, k) => `r<sub>${j}</sub> = ${ids.map((i, c) => (M[k][c] ? `${fracStr(M[k][c]) === '1' ? '' : fracStr(M[k][c]) + '·'}r<sub>${i}</sub>` : null)).filter(Boolean).join(' + ')}`);
        const statement = `<p>Escriba las ecuaciones de flujo r<sub>j</sub> = Σ<sub>i→j</sub> r<sub>i</sub>/d<sub>i</sub> y resuélvalas con la restricción r<sub>A</sub> + r<sub>B</sub> + r<sub>C</sub> = 1.</p>${drawGraph(g, { uid: 'f' + rng.int(0, 1e6), h: 230 })}`;
        const fields = ids.map((id, k) => ({ id: 'r' + id, label: `r(${id})`, answer: sol[k], tol: 0.006 }));
        let s = step(1, 'Ecuaciones de flujo', `<p class="mono">${eqs.join('<br>')}<br>r<sub>A</sub> + r<sub>B</sub> + r<sub>C</sub> = 1</p>`);
        s += step(2, 'Resolver (sustitución / Gauss-Jordan)', `<p>Una de las tres ecuaciones de flujo es redundante; se reemplaza por la restricción de suma 1.</p>` + fx(ids.map((id, k) => `r<sub>${id}</sub> = <b>${fracStr(sol[k])}</b> ≈ ${fmt(sol[k], 4)}`).join(' &nbsp; ')));
        return { statement, fields, solution: s };
      }
    }
  };
  function gauss(A, b) {
    const n = A.length; const M = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      if (Math.abs(M[p][c]) < 1e-12) return null;[M[c], M[p]] = [M[p], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    return M.map((r, i) => r[n] / r[i]);
  }

  /* ----- 13. Dead ends y spider traps ----- */
  G.pr_traps = {
    topic: 'pr', title: 'Diagnóstico: dead ends y spider traps',
    gen(rng) {
      for (let t = 0; t < 300; t++) {
        const N = 4; const ids = ['A', 'B', 'C', 'D'];
        const P = [[10, 10], [90, 10], [10, 60], [90, 60]];
        const adj = {}; ids.forEach(i => { const o = ids.filter(x => x !== i); adj[i] = rng.shuffle(o).slice(0, rng.int(0, 2)).sort(); });
        const dead = ids.filter(i => adj[i].length === 0);
        // spider trap: conjunto cerrado propio (no todo el grafo), sin dead ends dentro, alcanzable
        const reach = (s) => { const seen = new Set([s]), st = [s]; while (st.length) { const u = st.pop(); for (const v of adj[u]) if (!seen.has(v)) { seen.add(v); st.push(v); } } return seen; };
        let trap = null;
        for (const s of ids) { const R = reach(s); if (R.size < N && R.size >= 1 && [...R].every(x => adj[x].length > 0)) { if (!trap || R.size < trap.size) trap = R; } }
        if (dead.length + (trap ? 1 : 0) === 0 && rng.chance(0.7)) continue;
        const edges = []; ids.forEach(i => adj[i].forEach(j => edges.push({ u: i, v: j })));
        if (edges.length < 3) continue;
        const g = { nodes: ids.map((id, k) => ({ id, x: P[k][0], y: P[k][1] })), edges, directed: true };
        const trapStr = trap ? [...trap].sort().join(',') : 'NINGUNO';
        const statement = `<p>Analice el grafo. Indique cuántos <b>dead ends</b> hay y qué conjunto de nodos forma un <b>spider trap</b> (el conjunto cerrado más pequeño, sin dead ends dentro, del que el surfista no puede salir). Escriba los nodos separados por comas, o <code>NINGUNO</code>.</p>${drawGraph(g, { uid: 'd' + rng.int(0, 1e6), h: 230 })}`;
        const fields = [{ id: 'dead', label: 'Nº de dead ends', answer: dead.length, tol: 0 }, { id: 'trap', label: 'Spider trap', type: 'text', mode: trap ? 'set' : 'exact', answer: trapStr }];
        let s = step(1, 'Grados de salida', `<p class="mono small">${ids.map(i => `${i} → ${adj[i].join(', ') || '∅'} (d=${adj[i].length})`).join('<br>')}</p><p>Dead ends (d = 0): <b>${dead.join(', ') || 'ninguno'}</b>. Su columna en M es de ceros: M deja de ser columna-estocástica y la masa de PageRank se "fuga".</p>`);
        s += step(2, 'Conjuntos cerrados', `<p>Spider trap: <b>${trap ? '{' + trapStr + '}' : 'ninguno'}</b>. ${trap ? 'Una vez dentro, ningún enlace sale del conjunto: con power iteration acaba acumulando toda la importancia.' : ''}</p>`);
        s += step(3, 'Solución', '<p>Teletransporte: con probabilidad 1−β se salta a una página al azar (y desde un dead end se salta siempre). Así la matriz de Google es estocástica, irreducible y aperiódica.</p>');
        return { statement, fields, solution: s };
      }
    }
  };

  /* ----- 14. Betweenness desde una fuente (Brandes) ----- */
  G.bet_source = {
    topic: 'com', title: 'Edge betweenness desde una fuente (BFS + crédito)',
    gen(rng) {
      const g = randomTemplateGraph(rng);
      const s = rng.pick(g.nodes.map(n => n.id));
      const res = brandes(g, s);
      const keys = g.edges.map(e => edgeKey(e.u, e.v)).sort();
      const statement = `<p>Aplique el algoritmo de propagación de crédito (Girvan-Newman / Brandes con BFS) <b>desde el nodo ${s}</b>. Indique el número de caminos más cortos σ de cada nodo y el aporte de cada arista (0 si conecta nodos del mismo nivel).</p>${drawGraph(g, { h: 250 })}`;
      const fields = [];
      g.nodes.map(n => n.id).sort(cmpLabel).filter(v => v !== s).forEach(v => fields.push({ id: 'sg' + v, label: `σ(${v})`, answer: res.sig[v], tol: 0 }));
      keys.forEach(k => fields.push({ id: 'e' + k, label: `aporte ${k}`, answer: res.eb[k], tol: 0.01 }));
      const h = brandesHTML(g, s, res);
      let sol = step(1, 'BFS desde ' + s + ' y conteo de caminos σ', h.bfs + '<p class="muted small">σ(v) = suma de σ de sus padres (nodos del nivel anterior conectados a v).</p>');
      sol += step(2, 'Propagación de crédito (de abajo hacia arriba)', '<p>Cada nodo tiene crédito 1 + lo que recibe de sus hijos, y lo reparte a sus padres en proporción σ(padre)/σ(hijo).</p>' + h.flow);
      sol += step(3, 'Aportes por arista', table(['Arista', 'Aporte'], keys.map(k => [k, fmt(res.eb[k], 3) + (res.eb[k] === 0 ? ' <span class="muted">(mismo nivel)</span>' : '')])));
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 15. Betweenness con dos fuentes (estilo examen) ----- */
  G.bet_two = {
    topic: 'com', title: 'Edge betweenness desde dos fuentes + puentes', tag: 'Examen 2026-1',
    gen(rng) {
      const g = randomTemplateGraph(rng, ['exam', 'tri2', 'sq2', 'kite', 'house']);
      const ids = g.nodes.map(n => n.id);
      const [s1, s2] = rng.shuffle(ids).slice(0, 2).sort(cmpLabel);
      const a = brandes(g, s1), b = brandes(g, s2);
      const keys = g.edges.map(e => edgeKey(e.u, e.v)).sort();
      const total = {}; keys.forEach(k => total[k] = 0); ids.forEach(s => { const r = brandes(g, s); keys.forEach(k => total[k] += r.eb[k]); });
      const mx = Math.max(...keys.map(k => total[k])); const bridges = keys.filter(k => Math.abs(total[k] - mx) < 1e-9);
      const statement = `<p>Calcule el <i>edge betweenness</i> ejecutando la propagación de crédito <b>solo desde ${s1} y ${s2}</b>. Complete el aporte de cada fuente y la suma. Luego, considerando el betweenness completo (todas las fuentes), indique la(s) arista(s) puente (máximo betweenness), p. ej. <code>C-E, C-F</code>.</p>${drawGraph(g, { h: 250 })}`;
      const fields = []; const rows = [];
      keys.forEach(k => { fields.push({ id: 'a' + k, label: `${k} desde ${s1}`, answer: a.eb[k], tol: 0.01 }, { id: 'b' + k, label: `${k} desde ${s2}`, answer: b.eb[k], tol: 0.01 }, { id: 't' + k, label: `${k} suma`, answer: a.eb[k] + b.eb[k], tol: 0.01 }); rows.push({ label: k, ids: ['a' + k, 'b' + k, 't' + k] }); });
      fields.push({ id: 'br', label: 'Arista(s) puente', type: 'text', mode: 'edges', answer: bridges.join(', ') });
      const ha = brandesHTML(g, s1, a), hb = brandesHTML(g, s2, b);
      let sol = step(1, `Árbol BFS desde ${s1}`, ha.bfs + ha.flow);
      sol += step(2, `Árbol BFS desde ${s2}`, hb.bfs + hb.flow);
      sol += step(3, 'Acumulado', table(['Arista', 'desde ' + s1, 'desde ' + s2, 'Suma', 'Total (todas las fuentes)/2'], keys.map(k => [k, fmt(a.eb[k], 3), fmt(b.eb[k], 3), '<b>' + fmt(a.eb[k] + b.eb[k], 3) + '</b>', fmt(total[k] / 2, 3)])) + `<p class="muted small">Con todas las fuentes, cada camino s–t se cuenta dos veces (desde s y desde t), por eso se divide entre 2. Con solo dos fuentes se reporta la suma.</p>`);
      sol += step(4, 'Aristas puente', `<p>Máximo betweenness total: <b>${bridges.join(', ')}</b> (= ${fmt(mx / 2, 3)}). Son las aristas que Girvan-Newman eliminaría primero: conectan grupos densos distintos.</p>`);
      return { statement, fields, table: { cols: ['Arista', 'desde ' + s1, 'desde ' + s2, 'Suma'], rows }, solution: sol };
    }
  };

  /* ----- 16. Betweenness completo ----- */
  G.bet_full = {
    topic: 'com', title: 'Edge betweenness completo (todas las fuentes)',
    gen(rng) {
      const g = fromTemplate(rng.pick(['six', 'six', 'house']), rng, true);
      const ids = g.nodes.map(n => n.id); const keys = g.edges.map(e => edgeKey(e.u, e.v)).sort();
      const tot = {}; keys.forEach(k => tot[k] = 0); const per = {};
      ids.forEach(s => { per[s] = brandes(g, s); keys.forEach(k => tot[k] += per[s].eb[k]); });
      const statement = `<p>Calcule el edge betweenness de todas las aristas (número de caminos más cortos entre todos los pares que pasan por ella; si hay varios caminos más cortos, se reparte la fracción).</p>${drawGraph(g, { h: 240 })}`;
      const fields = keys.map(k => ({ id: 'e' + k, label: `b(${k})`, answer: tot[k] / 2, tol: 0.02 }));
      const sol = step(1, 'Aporte de cada fuente (BFS + crédito)', table(['Arista'].concat(ids.map(s => 'desde ' + s)).concat(['Suma', '÷2']), keys.map(k => [k].concat(ids.map(s => fmt(per[s].eb[k], 2))).concat([fmt(tot[k], 2), '<b>' + fmt(tot[k] / 2, 2) + '</b>']))))
        + step(2, 'Interpretación', `<p>La arista con mayor valor es el mejor candidato a puente entre comunidades: <b>${keys.filter(k => tot[k] === Math.max(...keys.map(x => tot[x]))).join(', ')}</b>.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 17. Modularidad Q ----- */
  const PARTS = { exam: [['A', 'B', 'C', 'D'], ['E', 'F', 'G']], six: [['A', 'B', 'C'], ['D', 'E', 'F']], tri2: [['A', 'B', 'C'], ['D', 'E', 'F', 'G']], sq2: [['A', 'B', 'C', 'D'], ['E', 'F', 'G', 'H']], house: [['A', 'B', 'C', 'D', 'E'], ['F', 'G']], kite: [['A', 'B', 'C', 'D'], ['E', 'F', 'G']] };
  function modularity(g, parts) {
    const m = g.edges.length; const deg = {}; g.nodes.forEach(n => deg[n.id] = 0); g.edges.forEach(e => { deg[e.u]++; deg[e.v]++; });
    const cOf = {}; parts.forEach((p, i) => p.forEach(v => cOf[v] = i));
    const det = parts.map(p => { const L = g.edges.filter(e => cOf[e.u] === cOf[p[0]] && cOf[e.v] === cOf[p[0]]).length; const D = p.reduce((s, v) => s + deg[v], 0); return { L, D, term: L / m - (D / (2 * m)) ** 2 }; });
    return { m, deg, det, Q: det.reduce((s, d) => s + d.term, 0) };
  }
  G.modularity = {
    topic: 'com', title: 'Modularidad Q de una partición',
    gen(rng) {
      const key = rng.pick(Object.keys(PARTS)); const g = fromTemplate(key, rng, true);
      let p1 = PARTS[key].map(p => p.slice());
      // partición alternativa: mover un nodo
      const p2 = p1.map(p => p.slice()); const from = rng.int(0, 1); const v = rng.pick(p2[from].slice(0, -1).length ? p2[from] : p2[from]); p2[from] = p2[from].filter(x => x !== v); p2[1 - from].push(v); p2.forEach(p => p.sort(cmpLabel));
      const r1 = modularity(g, p1), r2 = modularity(g, p2);
      const show = (p) => p.map(c => '{' + c.join(',') + '}').join(' · ');
      const g1 = cloneG(g); const cOf = {}; p1.forEach((p, i) => p.forEach(x => cOf[x] = i)); g1.nodes.forEach(n => n.comm = cOf[n.id]);
      const statement = `<p>Calcule la modularidad para dos particiones del grafo: <b>P1</b> = ${show(p1)} (colores) y <b>P2</b> = ${show(p2)}. ¿Cuál es mejor?</p>${drawGraph(g1, { h: 240 })}
        <p class="conv">Q = Σ<sub>c</sub> [ L<sub>c</sub>/m − (D<sub>c</sub>/2m)² ], equivalente a (1/2m) Σ<sub>ij</sub> [A<sub>ij</sub> − k<sub>i</sub>k<sub>j</sub>/2m] δ(c<sub>i</sub>,c<sub>j</sub>). L<sub>c</sub> = aristas internas, D<sub>c</sub> = suma de grados.</p>`;
      const fields = [{ id: 'm', label: 'm (aristas)', answer: r1.m, tol: 0 }, { id: 'q1', label: 'Q(P1)', answer: r1.Q, tol: 0.006 }, { id: 'q2', label: 'Q(P2)', answer: r2.Q, tol: 0.006 }, { id: 'best', label: 'Mejor (P1/P2)', type: 'text', answer: r1.Q >= r2.Q ? 'P1' : 'P2' }];
      const det = (r, p, n) => step(n, `Q(${n === 2 ? 'P1' : 'P2'})`, table(['Comunidad', 'L_c', 'D_c', 'L_c/m − (D_c/2m)²'], p.map((c, i) => ['{' + c.join(',') + '}', r.det[i].L, r.det[i].D, `${r.det[i].L}/${r.m} − (${r.det[i].D}/${2 * r.m})² = ${fmt(r.det[i].term, 4)}`])) + `<p>Q = <b>${fmt(r.Q, 4)}</b></p>`);
      let sol = step(1, 'Grados y m', `<p>m = ${r1.m}, 2m = ${2 * r1.m}. Grados: ${Object.entries(r1.deg).map(([k, d]) => `${k}=${d}`).join(', ')}</p>`);
      sol += det(r1, p1, 2) + det(r2, p2, 3) + step(4, 'Comparar', `<p>Mejor partición: <b>${r1.Q >= r2.Q ? 'P1' : 'P2'}</b> (mayor Q = más aristas internas que las esperadas al azar).</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 18. Louvain: fase de agregación (estilo examen) ----- */
  function plantedGraph(rng) {
    for (let t = 0; t < 300; t++) {
      const K = rng.pick([3, 4]); const sizes = Array.from({ length: K }, () => rng.int(3, 4));
      const centers = K === 3 ? [[22, 22], [78, 22], [50, 78]] : [[22, 22], [78, 22], [22, 78], [78, 78]];
      const nodes = []; let id = 0; const comm = [];
      sizes.forEach((sz, c) => { for (let k = 0; k < sz; k++) { const ang = (2 * Math.PI * k) / sz + c; nodes.push({ id: String(id), x: centers[c][0] + 14 * Math.cos(ang), y: centers[c][1] + 14 * Math.sin(ang), comm: c }); comm.push(c); id++; } });
      const edges = []; const has = new Set(); const add = (u, v) => { const k = edgeKey(u, v); if (u === v || has.has(k)) return; has.add(k); edges.push({ u, v }); };
      sizes.forEach((sz, c) => { const ms = nodes.filter(n => n.comm === c).map(n => n.id); for (let i = 1; i < ms.length; i++) add(ms[i - 1], ms[i]); for (let i = 0; i < ms.length; i++) for (let j = i + 2; j < ms.length; j++) if (rng.chance(0.55)) add(ms[i], ms[j]); });
      for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) { const n = rng.pick([0, 1, 1, 2, 3]); for (let k = 0; k < n; k++) { const u = rng.pick(nodes.filter(x => x.comm === a)).id, v = rng.pick(nodes.filter(x => x.comm === b)).id; add(u, v); } }
      const g = { nodes, edges, directed: false };
      if (!connected(g)) continue;
      return { g, K };
    }
  }
  function aggregate(g, cOf, K) {
    const loops = Array(K).fill(0); const W = {};
    g.edges.forEach(e => { const a = cOf[e.u], b = cOf[e.v]; if (a === b) loops[a] += 2; else { const k = [a, b].sort().join('-'); W[k] = (W[k] || 0) + 1; } });
    return { loops, W };
  }
  G.louvain_agg = {
    topic: 'com', title: 'Louvain: fase de agregación (2 niveles)', tag: 'Examen 2026-1',
    gen(rng) {
      const { g, K } = plantedGraph(rng);
      const cOf = {}; g.nodes.forEach(n => cOf[n.id] = n.comm);
      const L1 = aggregate(g, cOf, K);
      const names = ['S1', 'S2', 'S3', 'S4'].slice(0, K);
      const colorNames = ['azul', 'naranja', 'verde', 'rosa'];
      // nivel 2: agrupar el par con mayor peso entre sí y el resto
      const pairs = []; for (let a = 0; a < K; a++) for (let b = a + 1; b < K; b++) pairs.push([a, b, L1.W[a + '-' + b] || 0]);
      pairs.sort((x, y) => y[2] - x[2] || x[0] - y[0]);
      const [pa, pb] = pairs[0]; const groupA = [pa, pb], groupB = [...Array(K).keys()].filter(x => !groupA.includes(x));
      const T1 = groupA.map(i => names[i]).join('+'), T2 = groupB.map(i => names[i]).join('+');
      const sup = (grp) => grp.reduce((s, i) => s + L1.loops[i], 0) + 2 * grp.reduce((s, i, ix) => s + grp.slice(ix + 1).reduce((t, j) => t + (L1.W[[i, j].sort().join('-')] || 0), 0), 0);
      const loopA = sup(groupA), loopB = sup(groupB);
      let between = 0; groupA.forEach(i => groupB.forEach(j => between += L1.W[[i, j].sort().join('-')] || 0));
      const statement = `<p>La fase de movimiento local de Louvain ya terminó; cada color es una comunidad (${names.map((n, i) => `${n} = ${colorNames[i]}`).join(', ')}). Aplique la <b>fase de agregación</b>: cada comunidad pasa a ser un supernodo; indique el peso del auto-lazo de cada supernodo y el peso de las aristas entre supernodos. Después suponga que en el nivel 2 se agrupan <b>${T1}</b> y <b>${T2}</b> y repita la agregación.</p>${drawGraph(g, { h: 300, r: 13 })}
        <p class="conv">Convención de la figura del examen (Blondel/Barabási): auto-lazo = 2 × (aristas internas), porque cada arista interna aporta A<sub>ij</sub> + A<sub>ji</sub>. Peso entre supernodos = nº de aristas que cruzan.</p>`;
      const fields = [];
      names.forEach((n, i) => fields.push({ id: 'l' + i, label: `auto-lazo ${n}`, answer: L1.loops[i], tol: 0 }));
      pairs.slice().sort((x, y) => x[0] - y[0] || x[1] - y[1]).forEach(([a, b, w]) => fields.push({ id: 'w' + a + b, label: `peso ${names[a]}–${names[b]}`, answer: w, tol: 0 }));
      fields.push({ id: 'la', label: `auto-lazo (${T1})`, answer: loopA, tol: 0 }, { id: 'lb', label: `auto-lazo (${T2})`, answer: loopB, tol: 0 }, { id: 'bw', label: `peso (${T1})–(${T2})`, answer: between, tol: 0 });
      const aggG = { nodes: names.map((n, i) => ({ id: n, x: [20, 80, 20, 80][i], y: K === 3 ? [20, 20, 80][i] : [20, 20, 80, 80][i], comm: i })), edges: pairs.filter(p => p[2] > 0).map(([a, b, w]) => ({ u: names[a], v: names[b], label: w })), loops: Object.fromEntries(names.map((n, i) => [n, L1.loops[i]])) };
      if (K === 3) aggG.nodes[2].x = 50;
      let sol = step(1, 'Aristas internas por comunidad → auto-lazos', table(['Supernodo', 'Nodos', 'Aristas internas', 'Auto-lazo (×2)'], names.map((n, i) => { const ms = g.nodes.filter(x => x.comm === i).map(x => x.id); return [n, ms.join(', '), L1.loops[i] / 2, '<b>' + L1.loops[i] + '</b>']; })));
      sol += step(2, 'Aristas entre comunidades → pesos', table(['Par', 'Aristas que cruzan', 'Peso'], pairs.map(([a, b, w]) => [`${names[a]}–${names[b]}`, g.edges.filter(e => [cOf[e.u], cOf[e.v]].sort().join('-') === [a, b].join('-')).map(e => edgeKey(e.u, e.v)).join(', ') || '—', '<b>' + w + '</b>'])) + drawGraph(aggG, { h: 260, w: 420, r: 16 }));
      sol += step(3, 'Nivel 2', `<p>Auto-lazo(${T1}) = suma de auto-lazos + 2 × pesos internos = <b>${loopA}</b>; Auto-lazo(${T2}) = <b>${loopB}</b>; peso entre ambos = suma de pesos que cruzan = <b>${between}</b>.</p><p class="muted small">Comprobación: suma de auto-lazos + 2 × pesos = 2m = ${2 * g.edges.length} en todos los niveles (${loopA} + ${loopB} + 2·${between} = ${loopA + loopB + 2 * between}).</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 19. Louvain: ganancia ΔQ ----- */
  G.louvain_dq = {
    topic: 'com', title: 'Louvain: ganancia de modularidad ΔQ',
    gen(rng) {
      for (let t = 0; t < 200; t++) {
        const key = rng.pick(['exam', 'tri2', 'sq2', 'kite', 'house']); const g = fromTemplate(key, rng, true);
        const parts = PARTS[key]; const adj = adjOf(g); const m = g.edges.length; const deg = {}; for (const k in adj) deg[k] = adj[k].length;
        // nodo i en la frontera: tiene vecinos en ambas comunidades
        const cOf = {}; parts.forEach((p, ix) => p.forEach(v => cOf[v] = ix));
        const border = g.nodes.map(n => n.id).filter(v => new Set(adj[v].map(u => cOf[u])).size === 2);
        if (!border.length) continue;
        const i = rng.pick(border);
        const C = parts.map(p => p.filter(v => v !== i));
        const res = C.map(c => { const kin = adj[i].filter(u => c.includes(u)).length; const tot = c.reduce((s, v) => s + deg[v], 0); return { kin, tot, dq: kin / m - (deg[i] * tot) / (2 * m * m) }; });
        const best = res[0].dq >= res[1].dq ? 'C1' : 'C2';
        const g1 = cloneG(g); g1.nodes.forEach(n => { if (n.id !== i) n.comm = C[0].includes(n.id) ? 0 : 1; });
        const statement = `<p>El nodo <b>${i}</b> está aislado en su propia comunidad. Las comunidades vecinas son <b>C1</b> = {${C[0].join(',')}} y <b>C2</b> = {${C[1].join(',')}}. Calcule ΔQ de mover ${i} a cada una y diga cuál elige Louvain.</p>${drawGraph(g1, { h: 240 })}
          <p class="conv">ΔQ = k<sub>i,in</sub>/m − k<sub>i</sub>·Σ<sub>tot</sub>/(2m²), con k<sub>i,in</sub> = aristas de i hacia C, Σ<sub>tot</sub> = suma de grados de C (sin i).</p>`;
        const fields = [{ id: 'm', label: 'm', answer: m, tol: 0 }, { id: 'ki', label: `k(${i})`, answer: deg[i], tol: 0 }];
        res.forEach((r, ix) => fields.push({ id: 'kin' + ix, label: `k_in hacia C${ix + 1}`, answer: r.kin, tol: 0 }, { id: 'tot' + ix, label: `Σtot(C${ix + 1})`, answer: r.tot, tol: 0 }, { id: 'dq' + ix, label: `ΔQ(C${ix + 1})`, answer: r.dq, tol: 0.003 }));
        fields.push({ id: 'best', label: 'Elige (C1/C2)', type: 'text', answer: best });
        let sol = step(1, 'Datos', `<p>m = ${m}; grado de ${i} = ${deg[i]}; vecinos de ${i}: ${adj[i].join(', ')}.</p><p class="small">Grados: ${Object.entries(deg).map(([k, d]) => `${k}=${d}`).join(', ')}</p>`);
        sol += step(2, 'ΔQ para cada comunidad', res.map((r, ix) => fx(`C${ix + 1}: k_in = ${r.kin}, Σtot = ${r.tot} → ΔQ = ${r.kin}/${m} − ${deg[i]}·${r.tot}/(2·${m}²) = ${fmt(r.kin / m, 4)} − ${fmt(deg[i] * r.tot / (2 * m * m), 4)} = <b>${fmt(r.dq, 4)}</b>`)).join(''));
        sol += step(3, 'Decisión', `<p>Louvain mueve ${i} a la comunidad con mayor ΔQ positivo: <b>${best}</b>${Math.max(res[0].dq, res[1].dq) <= 0 ? ' (ninguno es positivo: se quedaría solo)' : ''}.</p>`);
        return { statement, fields, solution: sol };
      }
    }
  };

  /* ----- 20. Clustering espectral ----- */
  G.spectral = {
    topic: 'com', title: 'Clustering espectral: Laplaciana y Fiedler',
    gen(rng) {
      const key = rng.pick(['six', 'exam', 'tri2', 'kite']); const g = fromTemplate(key, rng, true);
      const ids = g.nodes.map(n => n.id).sort(cmpLabel); const adj = adjOf(g); const n = ids.length;
      const L = ids.map((i) => ids.map((j) => (i === j ? adj[i].length : adj[i].includes(j) ? -1 : 0)));
      const { vals, vecs } = jacobiEigen(L);
      let f = vecs[1]; if (f[0] < 0) f = f.map(x => -x);
      const pos = ids.filter((_, k) => f[k] > 1e-9), neg = ids.filter((_, k) => f[k] <= 1e-9);
      const x = rng.pick(ids), y = rng.pick(adj[x]);
      const ev = [0, 0.01, 0.03, 1.45, 1.6, 1.75].map(v => v); const kOpts = [[0, 0.02, 1.3, 1.5, 2.1, 2.4], [0, 0.01, 0.04, 1.45, 1.6, 1.75], [0, 0.05, 0.09, 0.12, 1.9, 2.3]];
      const eg = rng.pick(kOpts); let bestK = 1, gap = -1; for (let i2 = 0; i2 < eg.length - 1; i2++) if (eg[i2 + 1] - eg[i2] > gap) { gap = eg[i2 + 1] - eg[i2]; bestK = i2 + 1; }
      const statement = `<p>(a) Para el grafo, construya L = D − A e indique L[${x}][${x}], L[${x}][${y}] y la traza de L. (b) Se le da el vector de Fiedler (2º autovector de L): agrupe los nodos por signo. Escriba los nodos con el mismo signo que <b>${ids[0]}</b>. (c) Si los autovalores fueran ${eg.join(', ')}, ¿qué k sugiere el eigengap?</p>${drawGraph(g, { h: 240 })}
        <p class="mono small">v₂ ≈ ${ids.map((id, k) => `${id}: ${fmt(f[k], 3)}`).join(' · ')} &nbsp; (λ₂ ≈ ${fmt(vals[1], 3)})</p>`;
      const fields = [{ id: 'lxx', label: `L[${x}][${x}]`, answer: adj[x].length, tol: 0 }, { id: 'lxy', label: `L[${x}][${y}]`, answer: -1, tol: 0 }, { id: 'tr', label: 'traza(L) = 2m', answer: 2 * g.edges.length, tol: 0 }, { id: 'grp', label: `Grupo de ${ids[0]}`, type: 'text', mode: 'set', answer: pos.join(',') }, { id: 'k', label: 'k por eigengap', answer: bestK, tol: 0 }];
      let sol = step(1, 'Laplaciana L = D − A', table([''].concat(ids), ids.map((i, r) => [i].concat(L[r]))) + `<p class="muted small">Diagonal = grado; −1 si hay arista. Cada fila suma 0, por eso λ₁ = 0 con autovector constante. Traza = suma de grados = 2m = ${2 * g.edges.length}.</p>`);
      sol += step(2, 'Partición por signo del vector de Fiedler', `<p>Positivos: <b>{${pos.join(',')}}</b> · No positivos: <b>{${neg.join(',')}}</b>.</p><p class="muted small">El signo global del autovector es arbitrario; lo que importa es qué nodos comparten signo.</p>`);
      sol += step(3, 'Eigengap', `<p>Saltos: ${eg.slice(0, -1).map((v, i2) => `λ${i2 + 2}−λ${i2 + 1} = ${fmt(eg[i2 + 1] - v, 2)}`).join(', ')}. El mayor salto está después de λ${bestK} → <b>k = ${bestK}</b>.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 21. Label Propagation ----- */
  G.lpa = {
    topic: 'com', title: 'Label Propagation (LPA)',
    gen(rng) {
      const g = randomTemplateGraph(rng); const ids = g.nodes.map(n => n.id).sort(cmpLabel); const adj = adjOf(g);
      const lab = {}; ids.forEach(v => lab[v] = v);
      const trace = []; let it1 = null, iters = 0;
      for (let it = 0; it < 20; it++) {
        let changed = false; const rows = [];
        for (const v of ids) {
          const cnt = {}; adj[v].forEach(u => cnt[lab[u]] = (cnt[lab[u]] || 0) + 1);
          const mx = Math.max(...Object.values(cnt)); const tied = Object.keys(cnt).filter(k => cnt[k] === mx).sort(cmpLabel); const best = tied[0];
          rows.push([v, adj[v].map(u => `${u}(${lab[u]})`).join(', '), tied.length > 1 ? `empate ${tied.join('/')} → ${best}` : best]);
          if (lab[v] !== best) { lab[v] = best; changed = true; }
        }
        trace.push(rows); if (it === 0) it1 = { ...lab }; iters = it + 1; if (!changed) break;
      }
      const ncom = new Set(Object.values(lab)).size;
      const statement = `<p>Ejecute Label Propagation. Inicialmente cada nodo tiene su propia etiqueta (su nombre). Actualización <b>asíncrona</b> en orden alfabético; cada nodo adopta la etiqueta más frecuente entre sus vecinos (con los valores ya actualizados); <b>empate → la etiqueta alfabéticamente menor</b>. Dé las etiquetas tras la 1ª iteración y el número de comunidades al converger.</p>${drawGraph(g, { h: 240 })}`;
      const fields = ids.map(v => ({ id: 'l' + v, label: `etiqueta(${v}) iter 1`, type: 'text', mode: 'seq', answer: it1[v] }));
      fields.push({ id: 'nc', label: 'Nº comunidades final', answer: ncom, tol: 0 });
      let sol = trace.map((rows, i) => step(i + 1, `Iteración ${i + 1}`, table(['Nodo', 'Vecinos (etiqueta)', 'Nueva etiqueta'], rows))).join('');
      sol += step(trace.length + 1, 'Resultado', `<p>Converge en ${iters} iteraciones (la última sin cambios). Etiquetas finales: ${ids.map(v => `${v}→${lab[v]}`).join(', ')} → <b>${ncom}</b> comunidad(es).</p><p class="muted small">LPA no es determinista en la práctica (orden aleatorio y empates al azar); aquí fijamos reglas para poder corregir.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 22. node2vec: caminata sesgada + skip-gram ----- */
  G.node2vec = {
    topic: 'rep', title: 'node2vec: caminata sesgada y pares skip-gram',
    gen(rng) {
      const useNum = rng.chance(0.5);
      let g;
      if (useNum) {
        const P = { 1: [8, 12], 2: [8, 52], 3: [28, 32], 4: [50, 32], 5: [68, 12], 6: [68, 52], 7: [84, 52], 8: [99, 52] };
        g = { nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: '1-2 1-3 2-3 3-4 4-5 4-6 5-6 6-7 7-8'.split(' ').map(s => ({ u: s.split('-')[0], v: s.split('-')[1] })), directed: false };
        if (rng.chance(0.4)) g.edges.push({ u: '5', v: '7' });
      } else g = randomTemplateGraph(rng);
      const adj = adjOf(g); const ids = g.nodes.map(n => n.id).sort(cmpLabel);
      const p = rng.pick([1, 2, 4]), q = rng.pick([0.5, 2, 0.25, 4]);
      const start = rng.pick(ids.slice(0, 3)); const len = 6, win = rng.pick([1, 2]);
      const walk = [start]; const steps = [];
      walk.push(adj[start][0]); steps.push(`Paso 1: desde ${start}, sin nodo previo → menor vecino <b>${adj[start][0]}</b>`);
      while (walk.length < len) {
        const t = walk[walk.length - 2], v = walk[walk.length - 1];
        const al = adj[v].map(x => ({ x, a: x === t ? 1 / p : adj[t].includes(x) ? 1 : 1 / q }));
        const mx = Math.max(...al.map(o => o.a)); const ch = al.filter(o => Math.abs(o.a - mx) < 1e-12).map(o => o.x).sort(cmpLabel)[0];
        steps.push(`Paso ${walk.length}: t=${t}, v=${v} → ${al.map(o => `${o.x}: α=${fmt(o.a, 3)}`).join(', ')} → <b>${ch}</b>`);
        walk.push(ch);
      }
      const pairs = []; walk.forEach((c, i) => { for (let d = -win; d <= win; d++) if (d && walk[i + d] != null) pairs.push(`(${c}→${walk[i + d]})`); });
      const distinct = new Set(pairs).size;
      const statement = `<p>Genere una caminata de node2vec de <b>${len} nodos</b> desde <b>${start}</b> con <b>p = ${p}</b>, <b>q = ${q}</b>. Luego, con ventana = ${win}, cuente los pares (centro → contexto) del skip-gram.</p>${drawGraph(g, { h: 230 })}
        <p class="conv">Reglas (como en clase): α = 1/p si x = t (regresar), α = 1 si x es vecino de t, α = 1/q si x está a distancia 2 de t. Se elige el vecino con <b>mayor α</b>; empate → etiqueta menor. El primer paso va al menor vecino.</p>`;
      const fields = [{ id: 'walk', label: 'Caminata (p.ej. 1-2-3-…)', type: 'text', mode: 'seq', answer: walk.join('-') }, { id: 'np', label: 'Nº de pares', answer: pairs.length, tol: 0 }, { id: 'nd', label: 'Nº de pares distintos', answer: distinct, tol: 0 }];
      let sol = step(1, 'Caminata paso a paso', `<p class="small">${steps.join('<br>')}</p><p>Caminata: <b>${walk.join(' → ')}</b></p><p class="muted small">${q > 1 ? 'q > 1 penaliza alejarse: caminata tipo BFS (local).' : q < 1 ? 'q < 1 premia alejarse: caminata tipo DFS (exploratoria).' : ''} ${p > 1 ? 'p > 1 penaliza regresar.' : p < 1 ? 'p < 1 favorece regresar.' : ''}</p>`);
      sol += step(2, 'Pares skip-gram (ventana ' + win + ')', `<p class="mono small">${pairs.join(' ')}</p><p>Total = <b>${pairs.length}</b>, distintos = <b>${distinct}</b>.</p><p class="muted small">Para un camino de L nodos y ventana w, cada nodo aporta min(w, nodos antes) + min(w, nodos después).</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 23. Pérdida con muestreo negativo ----- */
  G.neg_sampling = {
    topic: 'rep', title: 'Pérdida con muestreo negativo',
    gen(rng) {
      const v2 = () => [rng.dec(-1, 1, 1), rng.dec(-1, 1, 1)];
      const zu = v2(), zv = v2(), n1 = v2(), n2 = v2();
      const s = dot(zu, zv), a = dot(zu, n1), b = dot(zu, n2);
      const L = -Math.log(sigmoid(s)) - Math.log(sigmoid(-a)) - Math.log(sigmoid(-b));
      const statement = `<p>Par positivo (u → v) con 2 negativos n₁, n₂. z<sub>u</sub> = ${vec(zu, 1)}, z′<sub>v</sub> = ${vec(zv, 1)}, z′<sub>n1</sub> = ${vec(n1, 1)}, z′<sub>n2</sub> = ${vec(n2, 1)}. Calcule la pérdida L = −log σ(z<sub>u</sub>·z′<sub>v</sub>) − Σ log σ(−z<sub>u</sub>·z′<sub>n</sub>) (log natural).</p>`;
      const fields = [{ id: 's', label: 'zᵤ·z′ᵥ', answer: s }, { id: 'a', label: 'zᵤ·z′ₙ₁', answer: a }, { id: 'b', label: 'zᵤ·z′ₙ₂', answer: b }, { id: 'L', label: 'L', answer: L, tol: 0.01 }];
      const sol = step(1, 'Productos punto', fx(`zᵤ·z′ᵥ = ${fmt(s, 3)} · zᵤ·z′ₙ₁ = ${fmt(a, 3)} · zᵤ·z′ₙ₂ = ${fmt(b, 3)}`))
        + step(2, 'Sigmoides', fx(`σ(${fmt(s, 3)}) = ${fmt(sigmoid(s), 4)} · σ(${fmt(-a, 3)}) = ${fmt(sigmoid(-a), 4)} · σ(${fmt(-b, 3)}) = ${fmt(sigmoid(-b), 4)}`))
        + step(3, 'Pérdida', fx(`L = −ln ${fmt(sigmoid(s), 4)} − ln ${fmt(sigmoid(-a), 4)} − ln ${fmt(sigmoid(-b), 4)} = <b>${fmt(L, 4)}</b>`) + '<p class="muted small">El primer término quiere σ → 1 para el par real; los otros quieren σ → 0 para los negativos. Así se evita el SoftMax sobre todos los nodos (O(|V|)).</p>');
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 24. Una capa GNN ----- */
  G.gnn_layer = {
    topic: 'gnn', title: 'Una capa GNN a mano (promedio + ReLU)',
    gen(rng) {
      const P = { 1: [20, 10], 2: [6, 55], 3: [48, 40], 4: [90, 40] };
      const pairs = ['1-2', '1-3', '2-3', '3-4']; if (rng.chance(0.4)) pairs.push(rng.pick(['1-4', '2-4']));
      const g = { nodes: Object.entries(P).map(([id, [x, y]]) => ({ id, x, y })), edges: pairs.map(s => ({ u: s[0], v: s[2] })), directed: false };
      const adj = adjOf(g); const ids = ['1', '2', '3', '4'];
      const H = {}; ids.forEach(i => H[i] = [rng.int(0, 2), rng.int(0, 2)]);
      const m2 = () => [[rng.int(-2, 2), rng.int(-2, 2)], [rng.int(-2, 2), rng.int(-2, 2)]];
      const W = m2(), B = m2();
      const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
      const targets = rng.shuffle(ids).slice(0, 2).sort();
      g.nodes.forEach(n => n.tag = vec(H[n.id], 0));
      const comp = (v) => { const msgs = adj[v].map(u => mv(W, H[u])); const avg = [mean(msgs.map(m => m[0])), mean(msgs.map(m => m[1]))]; const self = mv(B, H[v]); const pre = [avg[0] + self[0], avg[1] + self[1]]; return { msgs, avg, self, pre, out: pre.map(x => Math.max(0, x)) }; };
      const R = {}; targets.forEach(v => R[v] = comp(v));
      const mstr = (M) => `[[${M[0].join(', ')}], [${M[1].join(', ')}]]`;
      const statement = `<p>Aplique una capa GNN: h<sub>v</sub><sup>(1)</sup> = ReLU( W · (1/|N(v)|) Σ<sub>u∈N(v)</sub> h<sub>u</sub><sup>(0)</sup> + B · h<sub>v</sub><sup>(0)</sup> ), con <b>W = ${mstr(W)}</b> y <b>B = ${mstr(B)}</b>. Los atributos iniciales aparecen bajo cada nodo. Calcule h<sup>(1)</sup> de los nodos <b>${targets.join(' y ')}</b>.</p>${drawGraph(g, { h: 230, w: 460 })}`;
      const fields = []; targets.forEach(v => { fields.push({ id: v + 'a', label: `h⁽¹⁾(${v})[0]`, answer: R[v].out[0] }, { id: v + 'b', label: `h⁽¹⁾(${v})[1]`, answer: R[v].out[1] }); });
      let sol = targets.map((v, k) => step(k + 1, `Nodo ${v} (vecinos ${adj[v].join(', ')})`, `<p class="mono small">1. Mensajes: ${adj[v].map((u, j) => `W·${vec(H[u], 0)} = ${vec(R[v].msgs[j], 2)}`).join('; ')}<br>2. Promedio: ${vec(R[v].avg, 3)}<br>3. Propio: B·${vec(H[v], 0)} = ${vec(R[v].self, 2)}<br>4. Suma: ${vec(R[v].pre, 3)} → ReLU → <b>${vec(R[v].out, 3)}</b></p>`)).join('');
      sol += step(targets.length + 1, 'Idea clave', '<p class="muted small">W y B son los mismos para todos los nodos (parámetros compartidos); por eso la GNN es inductiva y usa los atributos X, a diferencia de node2vec. Apilar L capas = información de vecinos a L saltos.</p>');
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 25. Clasificación de nodo con softmax ----- */
  G.gnn_softmax = {
    topic: 'gnn', title: 'Clasificar un nodo: Wout + softmax',
    gen(rng) {
      const h = [rng.int(0, 3), rng.int(0, 3)]; const Wo = [[rng.int(-1, 2), rng.int(-1, 2)], [rng.int(-1, 2), rng.int(-1, 2)], [rng.int(-1, 2), rng.int(-1, 2)]];
      const z = Wo.map(r => dot(r, h)); const ex = z.map(Math.exp); const S = ex.reduce((a, b) => a + b, 0); const y = ex.map(e => e / S);
      const cls = y.indexOf(Math.max(...y)) + 1;
      const statement = `<p>El embedding final de un nodo es h<sup>L</sup> = ${vec(h, 0)} y W<sub>out</sub> = [${Wo.map(r => '[' + r.join(', ') + ']').join(', ')}] (3 clases). Calcule z = W<sub>out</sub>·h, las probabilidades softmax y la clase predicha (1, 2 o 3).</p>`;
      const fields = z.map((v, i) => ({ id: 'z' + i, label: `z${i + 1}`, answer: v, tol: 0.001 })).concat(y.map((v, i) => ({ id: 'y' + i, label: `P(clase ${i + 1})`, answer: v, tol: 0.006 }))).concat([{ id: 'c', label: 'Clase', answer: cls, tol: 0 }]);
      const sol = step(1, 'Scores', fx(`z = ${vec(z, 2)}`)) + step(2, 'Softmax', fx(`e^z = ${vec(ex, 3)}; suma = ${fmt(S, 3)} → ŷ = ${vec(y, 3)}`)) + step(3, 'Clase', `<p>argmax → <b>clase ${cls}</b>. W<sub>out</sub> es la misma para todos los nodos; la información del vecindario ya está en h<sup>L</sup>.</p>`);
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 26. Predicción de enlaces ----- */
  G.link_pred = {
    topic: 'gnn', title: 'Predicción de enlace: producto punto + sigmoide',
    gen(rng) {
      const hu = [rng.dec(-1, 2, 1), rng.dec(-1, 2, 1)], hv = [rng.dec(-1, 2, 1), rng.dec(-1, 2, 1)];
      const real = rng.chance(0.5); const s = dot(hu, hv), P = sigmoid(s); const loss = real ? -Math.log(P) : -Math.log(1 - P);
      const statement = `<p>Con h<sub>u</sub> = ${vec(hu, 1)} y h<sub>v</sub> = ${vec(hv, 1)}, el decodificador es el producto punto. Calcule el score, P(u–v) = σ(s) y la entropía cruzada binaria sabiendo que el par <b>${real ? 'SÍ' : 'NO'}</b> es una arista real.</p>`;
      const fields = [{ id: 's', label: 'score s', answer: s }, { id: 'P', label: 'P(u–v)', answer: P }, { id: 'L', label: 'pérdida BCE', answer: loss, tol: 0.01 }];
      const sol = step(1, 'Score', fx(`s = ${hu[0]}·${hv[0]} + ${hu[1]}·${hv[1]} = <b>${fmt(s, 3)}</b>`)) + step(2, 'Probabilidad', fx(`σ(${fmt(s, 3)}) = <b>${fmt(P, 4)}</b>`)) + step(3, 'Pérdida', fx(`${real ? '−ln σ(s)' : '−ln(1 − σ(s))'} = <b>${fmt(loss, 4)}</b>`) + '<p class="muted small">Recuerda retirar del grafo las aristas a predecir al propagar mensajes, para evitar fuga de información. En grafos no dirigidos el decodificador debe ser simétrico.</p>');
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 27. Construcción de grafo KNN ----- */
  G.knn_graph = {
    topic: 'rep', title: 'Construir un grafo k-NN desde vectores',
    gen(rng) {
      for (let t = 0; t < 300; t++) {
        const ids = ['A', 'B', 'C', 'D', 'E', 'F']; const pts = ids.map(() => [rng.int(0, 9), rng.int(0, 9)]);
        const d = (a, b) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
        let ok = true; const knn = ids.map((_, i) => { const o = ids.map((_, j) => j).filter(j => j !== i).sort((a, b) => d(i, a) - d(i, b)); if (d(i, o[1]) === d(i, o[2]) || d(i, o[0]) === 0) ok = false; return o.slice(0, 2); });
        if (!ok) continue;
        const E = new Set(); knn.forEach((nb, i) => nb.forEach(j => E.add(edgeKey(ids[i], ids[j]))));
        const mutual = [...E].filter(k => { const [a, b] = k.split('-').map(x => ids.indexOf(x)); return knn[a].includes(b) && knn[b].includes(a); });
        const x = rng.int(0, 5); const deg = {}; ids.forEach(v => deg[v] = 0); E.forEach(k => k.split('-').forEach(v => deg[v]++));
        const yv = rng.pick(ids);
        const g = { nodes: ids.map((id, i) => ({ id, x: pts[i][0], y: 9 - pts[i][1] })), edges: [...E].map(k => ({ u: k.split('-')[0], v: k.split('-')[1] })), directed: false };
        const statement = `<p>Seis objetos con vectores 2D. Construya el grafo <b>k-NN con k = 2</b> (distancia euclidiana). Arista i–j si j está entre los 2 vecinos de i <b>o</b> i entre los 2 de j (grafo no dirigido, unión).</p>${table(['Objeto', 'x', 'y'], ids.map((id, i) => [id, pts[i][0], pts[i][1]]))}`;
        const fields = [{ id: 'nb', label: `2 vecinos de ${ids[x]}`, type: 'text', mode: 'set', answer: knn[x].map(j => ids[j]).join(',') }, { id: 'ne', label: 'Nº de aristas', answer: E.size, tol: 0 }, { id: 'dg', label: `grado de ${yv}`, answer: deg[yv], tol: 0 }, { id: 'mu', label: 'Nº de aristas mutuas', answer: mutual.length, tol: 0 }];
        let sol = step(1, 'Vecinos más cercanos de cada objeto', table(['Objeto', '1er vecino (dist)', '2º vecino (dist)'], ids.map((id, i) => [id, `${ids[knn[i][0]]} (${fmt(d(i, knn[i][0]), 3)})`, `${ids[knn[i][1]]} (${fmt(d(i, knn[i][1]), 3)})`])));
        sol += step(2, 'Grafo resultante', drawGraph(g, { h: 260, w: 360 }) + `<p>Aristas (${E.size}): ${[...E].sort().join(', ')}. Mutuas (i y j se eligen mutuamente): ${mutual.sort().join(', ') || 'ninguna'}.</p><p class="muted small">El grafo k-NN es un grafo de proximidad: las aristas no se observan, se construyen y dependen de k y de la métrica.</p>`);
        return { statement, fields, solution: sol };
      }
    }
  };

  /* ----- 28. SVD como embebedor ----- */
  G.svd_embed = {
    topic: 'rep', title: 'Embedding por proyección SVD',
    gen(rng) {
      const doc = Array.from({ length: 5 }, () => rng.int(0, 10));
      const V = Array.from({ length: 5 }, () => [rng.dec(-0.7, 0.7, 2), rng.dec(-0.7, 0.7, 2)]);
      const e = [0, 1].map(k => doc.reduce((s, x, i) => s + x * V[i][k], 0));
      const statement = `<p>Documento (bag-of-words sobre 5 términos): doc = ${vec(doc, 0)}. Los dos primeros vectores singulares derechos son las columnas de V. Calcule emb(doc) = [⟨doc, v₁⟩, ⟨doc, v₂⟩].</p>${table(['Término', 'v₁', 'v₂'], V.map((r, i) => ['t' + (i + 1), r[0], r[1]]))}`;
      const fields = [{ id: 'e1', label: '⟨doc, v₁⟩', answer: e[0], tol: 0.02 }, { id: 'e2', label: '⟨doc, v₂⟩', answer: e[1], tol: 0.02 }];
      const sol = step(1, 'Proyecciones', [0, 1].map(k => fx(`⟨doc, v${k + 1}⟩ = ${doc.map((x, i) => `${x}·${V[i][k]}`).join(' + ')} = <b>${fmt(e[k], 3)}</b>`)).join('') + '<p class="muted small">De un vector disperso de L dimensiones pasamos a uno denso de d ≪ L. SVD es lineal y necesita la matriz completa en memoria: no escala a corpus masivos.</p>');
      return { statement, fields, solution: sol };
    }
  };

  /* ----- 29. BFR: estadísticas suficientes ----- */
  G.bfr = {
    topic: 'clu', title: 'BFR: N, SUM, SUMSQ y Mahalanobis', tag: 'Examen 2026-1 (teoría)',
    gen(rng) {
      for (let t = 0; t < 100; t++) {
        const n = rng.int(4, 5); const cx = rng.int(2, 8), cy = rng.int(2, 8);
        const pts = Array.from({ length: n }, () => [cx + rng.int(-2, 2), cy + rng.int(-2, 2)]);
        const N = n, SUM = [0, 1].map(k => pts.reduce((s, p) => s + p[k], 0)), SQ = [0, 1].map(k => pts.reduce((s, p) => s + p[k] ** 2, 0));
        const c = SUM.map(s => s / N), vr = [0, 1].map(k => SQ[k] / N - c[k] ** 2);
        if (vr.some(v => v < 0.3)) continue;
        const sd = vr.map(Math.sqrt);
        const np = [cx + rng.int(-3, 3), cy + rng.int(-3, 3)];
        const md = Math.sqrt(((np[0] - c[0]) / sd[0]) ** 2 + ((np[1] - c[1]) / sd[1]) ** 2);
        const th = rng.pick([2, 3]);
        const statement = `<p>Un cluster del Discard Set (DS) contiene los puntos ${pts.map(p => '(' + p.join(', ') + ')').join(', ')}. (a) Calcule su resumen BFR: N, SUM y SUMSQ por dimensión. (b) Centroide y desviación estándar por dimensión. (c) Distancia de Mahalanobis del punto nuevo <b>(${np.join(', ')})</b> y decida si se añade al DS con umbral <b>${th}</b> (escriba si/no).</p>
          <p class="conv">σ²ᵢ = SUMSQᵢ/N − (SUMᵢ/N)²; &nbsp; d = √Σ ((xᵢ − cᵢ)/σᵢ)²</p>`;
        const fields = [{ id: 'N', label: 'N', answer: N, tol: 0 }, { id: 's0', label: 'SUM x', answer: SUM[0], tol: 0 }, { id: 's1', label: 'SUM y', answer: SUM[1], tol: 0 }, { id: 'q0', label: 'SUMSQ x', answer: SQ[0], tol: 0 }, { id: 'q1', label: 'SUMSQ y', answer: SQ[1], tol: 0 }, { id: 'c0', label: 'centroide x', answer: c[0] }, { id: 'c1', label: 'centroide y', answer: c[1] }, { id: 'd0', label: 'σ x', answer: sd[0] }, { id: 'd1', label: 'σ y', answer: sd[1] }, { id: 'md', label: 'Mahalanobis', answer: md, tol: 0.02 }, { id: 'dec', label: '¿Al DS? (si/no)', type: 'text', answer: md < th ? 'si' : 'no' }];
        let sol = step(1, 'Estadísticas suficientes (2d + 1 números)', fx(`N = ${N}; SUM = [${SUM.join(', ')}]; SUMSQ = [${SQ.join(', ')}]`) + `<p class="muted small">SUMSQ x = ${pts.map(p => p[0] + '²').join(' + ')}.</p>`);
        sol += step(2, 'Centroide y varianza', fx(`c = SUM/N = ${vec(c, 3)}`) + fx(`σ²x = ${SQ[0]}/${N} − ${fmt(c[0], 3)}² = ${fmt(vr[0], 4)} → σx = ${fmt(sd[0], 4)}`) + fx(`σ²y = ${SQ[1]}/${N} − ${fmt(c[1], 3)}² = ${fmt(vr[1], 4)} → σy = ${fmt(sd[1], 4)}`));
        sol += step(3, 'Mahalanobis', fx(`d = √(((${np[0]}−${fmt(c[0], 3)})/${fmt(sd[0], 3)})² + ((${np[1]}−${fmt(c[1], 3)})/${fmt(sd[1], 3)})²) = <b>${fmt(md, 3)}</b>`) + `<p>${md < th ? `d &lt; ${th} → se añade al DS y se actualizan N, SUM y SUMSQ (solo sumas).` : `d ≥ ${th} → no entra al DS; va al CS/RS (se intenta agrupar con otros puntos sobrantes).`}</p>`);
        return { statement, fields, solution: sol };
      }
    }
  };

  /* ----- 30. Codificaciones y dispersión ----- */
  G.encoding = {
    topic: 'rep', title: 'Codificaciones: dimensión y dispersión',
    gen(rng) {
      const prov = rng.int(3, 8), gen = rng.pick([14, 20, 28]), vocab = rng.pick([10000, 50000, 1000000]), words = rng.pick([200, 500, 1000]);
      const dims = prov + gen + 2; const sp = 1 - words / vocab;
      const statement = `<p>(a) Un dataset tiene: proveedor (${prov} valores, one-hot), géneros (${gen} valores, multi-hot), año (1 numérica) y rating (1 numérica). ¿Cuántas dimensiones tiene el vector? (b) Un corpus tiene un vocabulario de ${vocab.toLocaleString('es')} palabras y cada documento contiene unas ${words} palabras distintas. ¿Qué fracción del vector multi-hot es cero?</p>`;
      const fields = [{ id: 'd', label: 'Dimensiones', answer: dims, tol: 0 }, { id: 's', label: 'Dispersión (0–1)', answer: sp, tol: 0.0001 }];
      const sol = step(1, 'Dimensiones', fx(`${prov} + ${gen} + 1 + 1 = <b>${dims}</b>`)) + step(2, 'Dispersión', fx(`1 − ${words}/${vocab} = <b>${fmt(sp, 5)}</b>`) + '<p class="muted small">One-hot/multi-hot: alta dimensión, muy dispersos y sin semántica (good está tan lejos de great como de bad). Solución: embeddings densos (d ≪ L).</p>');
      return { statement, fields, solution: sol };
    }
  };

  window.ENG = { makeRng, fmt, round, parseNum, gradeField, drawGraph, table, step, fx, vec, G, brandes, edgeKey, esc, cosine, cmpLabel };
})();
