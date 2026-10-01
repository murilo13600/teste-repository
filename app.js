/* =========================================================
   AURUM — Finanças pessoais
   Tudo roda no navegador. Se aberto via `node server.js`,
   os dados são salvos em data/dados.json; senão, no navegador.
   ========================================================= */
(() => {
  "use strict";

  // ---------- Utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = n => String(n).padStart(2, "0");
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const money = v => brl.format(+v || 0);
  const moneyShort = v => {
    const a = Math.abs(v);
    if (a >= 1e6) return "R$ " + (v / 1e6).toFixed(1).replace(".", ",") + "M";
    if (a >= 1e3) return "R$ " + (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(".", ",") + "k";
    return "R$ " + Math.round(v);
  };
  const parseMoney = s => {
    if (typeof s === "number") return s;
    s = String(s || "").replace(/[R$\s]/g, "");
    if (!s) return 0;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  };
  const moneyInputValue = v => (v ? (+v).toFixed(2).replace(".", ",") : "");
  const sum = (arr, f = x => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);

  // Datas (sempre no fuso local)
  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d || 1); };
  const todayISO = () => toISO(new Date());
  const monthOf = iso => iso.slice(0, 7);
  const currentMonth = () => todayISO().slice(0, 7);
  const addMonths = (mk, n) => { const d = fromISO(mk + "-01"); d.setMonth(d.getMonth() + n); return toISO(d).slice(0, 7); };
  const daysInMonth = mk => { const [y, m] = mk.split("-").map(Number); return new Date(y, m, 0).getDate(); };
  const dateInMonth = (mk, day) => `${mk}-${pad(Math.min(Math.max(1, +day || 1), daysInMonth(mk)))}`;
  const monthName = mk => { const [y, m] = mk.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };
  const monthShort = mk => MONTHS_SHORT[+mk.slice(5, 7) - 1];
  const fmtDate = iso => { const d = fromISO(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const daysUntil = iso => Math.round((fromISO(iso) - fromISO(todayISO())) / 864e5);

  // ---------- Ícones ----------
  const I = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17 19 7"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    arrowDown: '<svg viewBox="0 0 24 24"><path d="M12 4v16M6 14l6 6 6-6"/></svg>',
    arrowUp: '<svg viewBox="0 0 24 24"><path d="M12 20V4M6 10l6-6 6 6"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7V6a2 2 0 0 1 2-2h11v3M16 13.5h2"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    coins: '<svg viewBox="0 0 24 24"><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/></svg>',
    receipt: '<svg viewBox="0 0 24 24"><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    party: '<svg viewBox="0 0 24 24"><path d="M4 20 9 7l8 8z"/><path d="M14 4v2M19 9h2M17 5l-1.5 1.5M20 13l-2-.5M11 3l.5 2"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    trendUp: '<svg viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  };

  // ---------- Dados ----------
  const EMPTY = () => ({
    version: 1,
    settings: { nome: "" },
    pix: [],          // pagamentos recorrentes (pessoas, contas fixas)
    pagamentos: {},   // { "AAAA-MM": { idPix: { valor, data } } }
    valoresMes: {},   // { "AAAA-MM": { idPix: valor } } ajuste só daquele mês
    avulsos: [],      // contas únicas: { id, descricao, valor, vencimento, categoria, pagoEm }
    cartoes: [],
    faturas: {},      // { "AAAA-MM": { idCartao: { valor, pagoEm } } }
    recebimentos: [], // { id, cliente, descricao, valor, previsto, recebidoEm, forma, fixoId? }
    recFixos: [],     // recebimentos de todo mês: { id, cliente, descricao, valor, dia, forma, inicio, ativo, meses: ["AAAA-MM"] }
    conta: { saldoInicial: null, inicio: null },  // saldo da conta no começo do mês `inicio`
    reserva: { saldoInicial: 0, movimentos: [] }, // movimentos: { id, tipo: guardar|resgatar|rendimento, valor, data, descricao }
  });

  let db = EMPTY();
  let serverMode = false;
  let saveTimer = null;
  const LS_KEY = "aurum-financas-v1";

  async function load() {
    let local = null;
    try { local = JSON.parse(localStorage.getItem(LS_KEY)); } catch { /* sem dados locais */ }
    try {
      if (location.protocol.startsWith("http")) {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 2500);
        const r = await fetch("/api/data", { signal: ctrl.signal, cache: "no-store" });
        if (r.ok) {
          serverMode = true;
          const remote = await r.json();
          db = normalize(remote || local || EMPTY());
          if (!remote && local) persist();
          return;
        }
      }
    } catch { /* sem servidor: modo navegador */ }
    db = normalize(local || EMPTY());
  }

  function normalize(d) {
    const base = EMPTY();
    for (const k of Object.keys(base)) if (d[k] === undefined) d[k] = base[k];
    d.settings = { ...base.settings, ...d.settings };
    return d;
  }

  function persist() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch { /* armazenamento indisponível */ }
    if (!serverMode) return updateStoragePill();
    fetch("/api/data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(db) })
      .then(r => { if (!r.ok) throw new Error(); updateStoragePill(); })
      .catch(() => { updateStoragePill(true); toast("Não consegui salvar no servidor — dados guardados no navegador.", "warn"); });
  }
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }

  function updateStoragePill(error) {
    const el = $("#storage-pill");
    el.classList.toggle("server", serverMode && !error);
    el.querySelector("span").textContent = error ? "erro ao salvar" : serverMode ? "salvo em dados.json" : "salvo no navegador";
    el.title = serverMode ? "Dados salvos no arquivo data/dados.json do servidor local" : "Abra com `node server.js` para salvar em arquivo";
  }

  // ---------- Regras de negócio ----------
  const activePix = mk => db.pix.filter(p => p.ativo !== false && (!p.inicio || p.inicio <= mk));
  const pixValor = (p, mk) => db.valoresMes[mk]?.[p.id] ?? p.valor;
  const pixPago = (p, mk) => db.pagamentos[mk]?.[p.id];
  const avulsosDoMes = mk => db.avulsos.filter(a => monthOf(a.vencimento) === mk);
  const fatura = (c, mk) => db.faturas[mk]?.[c.id] || { valor: 0, pagoEm: null };
  const recMonth = r => monthOf(r.recebidoEm || r.previsto);

  function cardDates(c, mk) {
    const venc = dateInMonth(mk, c.vencimento);
    const fechMonth = +c.fechamento >= +c.vencimento ? addMonths(mk, -1) : mk;
    return { venc, fech: dateInMonth(fechMonth, c.fechamento) };
  }

  function totals(mk) {
    const pix = activePix(mk);
    const pagosPix = sum(Object.values(db.pagamentos[mk] || {}), x => x.valor);
    const pendPix = sum(pix.filter(p => !pixPago(p, mk)), p => pixValor(p, mk));
    const av = avulsosDoMes(mk);
    const pagosAv = sum(av.filter(a => a.pagoEm), a => a.valor);
    const pendAv = sum(av.filter(a => !a.pagoEm), a => a.valor);
    const fats = db.cartoes.map(c => fatura(c, mk));
    const pagosCC = sum(fats.filter(f => f.pagoEm), f => f.valor);
    const pendCC = sum(fats.filter(f => !f.pagoEm), f => f.valor);
    const recebido = sum(db.recebimentos.filter(r => r.recebidoEm && monthOf(r.recebidoEm) === mk), r => r.valor);
    const previsto = sum(db.recebimentos.filter(r => !r.recebidoEm && monthOf(r.previsto) === mk), r => r.valor);
    const pago = pagosPix + pagosAv + pagosCC;
    const pendente = pendPix + pendAv + pendCC;
    return {
      pagosPix, pendPix, pagosAv, pendAv, pagosCC, pendCC, recebido, previsto, pago, pendente,
      saldo: recebido - pago, projecao: recebido + previsto - pago - pendente,
      pixCount: pix.length, pixPagos: pix.filter(p => pixPago(p, mk)).length,
      ccCount: db.cartoes.length, ccPagos: db.cartoes.filter(c => fatura(c, mk).pagoEm).length,
    };
  }

  // Saldo em conta e reserva no fim do mês, acumulando desde o saldo inicial
  function saldos(mk) {
    const { saldoInicial, inicio } = db.conta;
    if (saldoInicial == null || !inicio || mk < inicio) return null;
    let conta = saldoInicial;
    for (let m = inicio; m <= mk; m = addMonths(m, 1)) conta += totals(m).saldo;
    let reserva = db.reserva.saldoInicial;
    for (const mv of db.reserva.movimentos) {
      const m = monthOf(mv.data);
      if (m < inicio || m > mk) continue;
      if (mv.tipo === "guardar") { conta -= mv.valor; reserva += mv.valor; }
      else if (mv.tipo === "resgatar") { conta += mv.valor; reserva -= mv.valor; }
      else reserva += mv.valor;
    }
    return { conta, reserva };
  }

  // Recebimentos fixos: cria o lançamento do mês na primeira vez que o mês é aberto
  function gerarFixos(mk) {
    let novos = false;
    for (const f of db.recFixos) {
      if (f.ativo === false || mk < f.inicio || f.meses.includes(mk)) continue;
      db.recebimentos.push({ id: uid(), fixoId: f.id, cliente: f.cliente, descricao: f.descricao, valor: f.valor, forma: f.forma, previsto: dateInMonth(mk, f.dia), recebidoEm: null });
      f.meses.push(mk);
      novos = true;
    }
    if (novos) save();
  }

  function statusFor(iso, done) {
    if (done) return { cls: "done", chip: `<span class="chip chip-ok">${I.check}pago</span>` };
    const d = daysUntil(iso);
    if (d < 0) return { cls: "late", chip: `<span class="chip chip-late">${I.alert}${-d}d atrasado</span>` };
    if (d === 0) return { cls: "today", chip: `<span class="chip chip-today">${I.clock}hoje</span>` };
    if (d <= 3) return { cls: "soon", chip: `<span class="chip chip-soon">em ${d}d</span>` };
    return { cls: "", chip: `<span class="chip chip-wait">em ${d}d</span>` };
  }

  function agenda(mk) {
    const items = [];
    for (const p of activePix(mk)) {
      const pg = pixPago(p, mk);
      items.push({ date: dateInMonth(mk, p.dia), name: p.nome, kind: p.metodo || "Pix", value: pg ? pg.valor : pixValor(p, mk), done: !!pg, dir: "out", view: "pix" });
    }
    for (const a of avulsosDoMes(mk)) items.push({ date: a.vencimento, name: a.descricao, kind: "Conta avulsa", value: a.valor, done: !!a.pagoEm, dir: "out", view: "pix" });
    for (const c of db.cartoes) {
      const f = fatura(c, mk);
      items.push({ date: cardDates(c, mk).venc, name: `Fatura ${c.nome}`, kind: "Cartão" + (c.final ? ` •${c.final}` : ""), value: f.valor, done: !!f.pagoEm, dir: "out", view: "cartoes" });
    }
    for (const r of db.recebimentos.filter(r => recMonth(r) === mk)) {
      items.push({ date: r.recebidoEm || r.previsto, name: r.cliente, kind: r.descricao || "Recebimento", value: r.valor, done: !!r.recebidoEm, dir: "in", view: "receitas" });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date) || a.done - b.done);
  }

  // ---------- Estado da interface ----------
  const ui = {
    view: "painel",
    month: currentMonth(),
    pixFilter: "todos",
    pixSearch: "",
    recFilter: "todos",
    pop: null,
  };

  const VIEWS = {
    painel: { title: "Painel", render: renderPainel },
    pix: { title: "Pagamentos do mês", render: renderPix },
    cartoes: { title: "Cartões de crédito", render: renderCartoes },
    receitas: { title: "Recebimentos", render: renderReceitas },
    reserva: { title: "Saldo e reserva", render: renderReserva },
    ajustes: { title: "Ajustes", render: renderAjustes },
  };

  function go(view) {
    if (!VIEWS[view]) view = "painel";
    ui.view = view;
    if (location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    render(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render(enter = false) {
    gerarFixos(ui.month);
    gerarFixos(currentMonth());
    const v = $("#view");
    $("#view-title").textContent = VIEWS[ui.view].title;
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === ui.view));
    const ml = $("#month-label");
    ml.textContent = monthName(ui.month);
    ml.classList.toggle("not-current", ui.month !== currentMonth());
    $("#month-switch").style.visibility = ui.view === "ajustes" ? "hidden" : "";
    $("#quick-add").style.visibility = ui.view === "ajustes" ? "hidden" : "";

    v.innerHTML = VIEWS[ui.view].render(ui.month);
    if (enter) {
      v.classList.remove("enter");
      void v.offsetWidth;
      v.classList.add("enter");
      v.style.animation = "none"; void v.offsetWidth; v.style.animation = "";
      clearTimeout(render.t);
      render.t = setTimeout(() => v.classList.remove("enter"), 1600);
      countUp(v);
    } else {
      $$("[data-count]", v).forEach(el => (el.textContent = money(+el.dataset.count)));
    }
    if (ui.pop) {
      const el = $(`[data-id="${ui.pop}"] .check`, v);
      if (el) { el.classList.add("pop"); }
      ui.pop = null;
    }
    updateSeg(v);
    updateBadges();
  }

  function updateBadges() {
    const mk = currentMonth();
    const t = totals(mk);
    const setB = (id, n, okWhenZero) => {
      const b = $("#" + id);
      [b, $(`#bottom-nav [data-badge="${id}"]`)].forEach(el => {
        if (!el) return;
        el.textContent = n > 0 ? n : "✓";
        el.classList.toggle("show", n > 0 || (okWhenZero && n === 0));
        el.classList.toggle("ok", n === 0);
      });
    };
    const avPend = avulsosDoMes(mk).filter(a => !a.pagoEm).length;
    setB("badge-pix", t.pixCount - t.pixPagos + avPend, t.pixCount > 0);
    setB("badge-cartoes", db.cartoes.filter(c => { const f = fatura(c, mk); return !f.pagoEm && daysUntil(cardDates(c, mk).venc) <= 5; }).length, false);
    setB("badge-receitas", db.recebimentos.filter(r => !r.recebidoEm && daysUntil(r.previsto) < 0).length, false);
  }

  // ---------- Componentes ----------
  const avatarColors = [
    ["#f3d27a", "#b8862b"], ["#7ff0c0", "#169a66"], ["#e8dcc4", "#a8997a"], ["#9ab8ff", "#3d5fae"],
    ["#ffc9a8", "#c9764a"], ["#c7b8ff", "#6b58c9"], ["#a8ecff", "#2a8fae"],
  ];
  function avatar(name) {
    const initials = String(name || "?").replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase() || "?";
    let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = avatarColors[h % avatarColors.length];
    return `<div class="avatar" style="background:linear-gradient(135deg,${a},${b})">${esc(initials)}</div>`;
  }

  function ring(pct, label, value, color) {
    const r = 48, c = 2 * Math.PI * r;
    const off = c * (1 - Math.min(1, Math.max(0, pct)));
    return `<div class="ring">
      <svg viewBox="0 0 116 116"><circle class="track" cx="58" cy="58" r="${r}"/>
      <circle class="bar ring-anim" cx="58" cy="58" r="${r}" stroke="${color}" style="color:${color};stroke-dasharray:${c};stroke-dashoffset:${off};--full:${c}"/></svg>
      <div class="ring-center"><b>${value}</b><span>${label}</span></div></div>`;
  }

  function kpi(tone, icon, label, value, foot) {
    return `<div class="panel kpi tone-${tone}">
      <div class="kpi-top"><div class="kpi-icon">${icon}</div>${label}</div>
      <div class="kpi-value" data-count="${value}">${money(value)}</div>
      <div class="kpi-foot">${foot}</div></div>`;
  }

  function empty(icon, title, text, action) {
    return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p>${action || ""}</div>`;
  }

  // ---------- Painel ----------
  function renderPainel(mk) {
    const t = totals(mk);
    const isEmpty = !db.pix.length && !db.cartoes.length && !db.recebimentos.length && !db.avulsos.length;
    if (isEmpty) {
      return `<div class="stagger">
        <div class="panel hero" style="grid-template-columns:1fr">
          <div>
            <div class="hero-label">bem-vindo ao</div>
            <div class="hero-value gold-text" style="letter-spacing:.2em">AURUM</div>
            <p style="color:var(--text-2);max-width:620px;margin:0 0 20px">Seu painel para nunca mais esquecer um Pix, acompanhar as faturas dos cartões e saber exatamente quanto entrou no mês. Comece cadastrando quem você paga todo mês.</p>
            <div class="btn-row">
              <button class="btn btn-gold" data-action="new-pix">${I.plus}Cadastrar pagamentos</button>
              <button class="btn btn-ghost" data-action="new-card">${I.card}Adicionar cartões</button>
              <button class="btn btn-ghost" data-action="new-rec">${I.coins}Lançar recebimento</button>
              <button class="btn btn-ghost" data-action="seed">${I.sparkle}Ver com dados de exemplo</button>
            </div>
          </div>
        </div></div>`;
    }
    const pctPix = t.pixCount ? t.pixPagos / t.pixCount : 0;
    const pctCC = t.ccCount ? t.ccPagos / t.ccCount : 0;
    const ag = agenda(mk);
    const late = ag.filter(i => !i.done && i.dir === "out" && daysUntil(i.date) < 0).length;
    const s = saldos(mk);
    const saldoMeta = s
      ? `<span>Em conta <b>${money(s.conta)}</b></span><span>Reserva <b>${money(s.reserva)}</b></span>`
      : db.conta.inicio ? "" : `<span><button class="btn btn-ghost btn-sm" data-action="edit-saldos">${I.wallet}Informar saldo da conta</button></span>`;

    return `
    <div class="stagger">
      <div class="panel hero">
        <div>
          <div class="hero-label">saldo realizado em ${esc(monthName(mk))}</div>
          <div class="hero-value ${t.saldo < 0 ? "neg" : "pos"}" data-count="${t.saldo}">${money(t.saldo)}</div>
          <div class="hero-meta">
            <span>Projeção do mês <b>${money(t.projecao)}</b></span>
            <span>Compromissos <b>${money(t.pago + t.pendente)}</b></span>
            ${late ? `<span class="chip chip-late">${I.alert}${late} em atraso</span>` : ""}
          </div>
          ${saldoMeta ? `<div class="hero-meta" style="margin-top:10px">${saldoMeta}</div>` : ""}
        </div>
        <div class="hero-rings">
          ${ring(pctPix, "pix pagos", `${t.pixPagos}/${t.pixCount}`, "#3ee0a0")}
          ${ring(pctCC, "faturas", `${t.ccPagos}/${t.ccCount}`, "#e2bb5a")}
        </div>
      </div>
    </div>
    <div class="grid kpis stagger">
      ${kpi("green", I.arrowDown, "Recebido", t.recebido, "entrou na conta este mês")}
      ${kpi("sand", I.clock, "A receber", t.previsto, "previsto para este mês")}
      ${kpi("gold", I.arrowUp, "Pago", t.pago, `Pix ${moneyShort(t.pagosPix)} · Cartões ${moneyShort(t.pagosCC)}`)}
      ${kpi("coral", I.receipt, "A pagar", t.pendente, "ainda pendente no mês")}
    </div>
    <div class="grid dash-main">
      <div class="grid stagger" style="align-content:start">
        <div class="panel">
          <div class="panel-head">
            <h3 class="panel-title"><span class="dot"></span>Entradas × saídas pagas</h3>
            <div class="legend">
              <span><i style="background:var(--chart-in)"></i>Entradas</span>
              <span><i style="background:repeating-linear-gradient(135deg,var(--chart-out) 0 3px,#8a6420 3px 5px)"></i>Saídas</span>
            </div>
          </div>
          ${barChart(mk)}
        </div>
        <div class="panel">
          <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Para onde vai o dinheiro</h3><span class="panel-sub">pago + pendente no mês</span></div>
          ${donut(t)}
        </div>
      </div>
      <div class="stagger">
        <div class="panel">
          <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Agenda do mês</h3><span class="panel-sub">${ag.filter(i => !i.done).length} pendentes</span></div>
          <div class="timeline">
            ${ag.length ? ag.map(timelineItem).join("") : empty(I.clock, "Nada agendado", "Cadastre pagamentos, cartões ou recebimentos.")}
          </div>
        </div>
      </div>
    </div>`;
  }

  function timelineItem(i) {
    const d = fromISO(i.date);
    const st = i.dir === "in"
      ? (i.done ? { cls: "done", chip: `<span class="chip chip-ok">${I.check}recebido</span>` } : daysUntil(i.date) < 0 ? { cls: "late", chip: `<span class="chip chip-late">${I.alert}atrasado</span>` } : { cls: daysUntil(i.date) === 0 ? "today" : "", chip: `<span class="chip chip-wait">a receber</span>` })
      : statusFor(i.date, i.done);
    return `<div class="tl-item ${st.cls}" data-go="${i.view}" style="cursor:pointer">
      <div class="tl-date"><b>${pad(d.getDate())}</b><span>${WEEK[d.getDay()]}</span></div>
      <div style="min-width:0"><div class="tl-name">${esc(i.name)}</div><div class="tl-kind">${esc(i.kind)} ${st.chip}</div></div>
      <div class="tl-amount ${i.dir === "in" ? "in" : ""}">${i.dir === "in" ? "+" : "−"} ${money(i.value)}</div>
    </div>`;
  }

  function barChart(mk) {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(mk, i - 5));
    const data = months.map(m => { const t = totals(m); return { m, in: t.recebido, out: t.pago }; });
    const max = Math.max(1, ...data.flatMap(d => [d.in, d.out]));
    const step = niceStep(max / 4);
    const top = Math.ceil(max / step) * step;
    const W = 600, H = 260, L = 52, B = 30, T = 12, R = 8;
    const cw = (W - L - R) / months.length;
    const bw = Math.min(26, cw / 3.2);
    const y = v => T + (H - T - B) * (1 - v / top);
    let s = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de entradas e saídas dos últimos 6 meses">
      <defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--chart-out)"/><rect width="1.6" height="5" fill="#8a6420"/></pattern></defs>`;
    for (let v = 0; v <= top + 1e-6; v += step) {
      s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${moneyShort(v).replace("R$ ", "")}</text>`;
    }
    data.forEach((d, i) => {
      const cx = L + cw * i + cw / 2;
      const bar = (v, x, fill, delay) => {
        const h = Math.max(v > 0 ? 3 : 0, H - B - y(v));
        return `<path class="bar" style="animation-delay:${delay}s" fill="${fill}" d="${roundTop(x, H - B - h, bw, h, Math.min(4, h))}"/>`;
      };
      s += bar(d.in, cx - bw - 1, "var(--chart-in)", i * 0.06);
      s += bar(d.out, cx + 1, "url(#hatch)", i * 0.06 + 0.03);
      if (d.m === mk && (d.in || d.out)) {
        const lbl = (v, x) => v ? `<text class="axis-label" x="${x + bw / 2}" y="${y(v) - 6}" text-anchor="middle" style="fill:var(--text-2)">${moneyShort(v).replace("R$ ", "")}</text>` : "";
        s += lbl(d.in, cx - bw - 1) + lbl(d.out, cx + 1);
      }
      s += `<text class="month-label ${d.m === mk ? "current" : ""}" x="${cx}" y="${H - 8}" text-anchor="middle">${monthShort(d.m)}</text>`;
      s += `<rect class="hit" x="${L + cw * i}" y="${T}" width="${cw}" height="${H - T - B}" rx="8" data-tip='${esc(JSON.stringify({ t: monthName(d.m), in: d.in, out: d.out }))}'/>`;
    });
    return `<div class="chart-wrap">${s}</svg></div>`;
  }
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function roundTop(x, y, w, h, r) {
    if (h <= 0) return "";
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  function donut(t) {
    const parts = [
      { label: "Pagamentos recorrentes", v: t.pagosPix + t.pendPix, c: "#bd8a2e" },
      { label: "Faturas de cartão", v: t.pagosCC + t.pendCC, c: "#4d7fd6" },
      { label: "Contas avulsas", v: t.pagosAv + t.pendAv, c: "#20a070" },
    ];
    const total = sum(parts, p => p.v);
    const r = 60, C = 2 * Math.PI * r, gap = total ? 3 : 0;
    let acc = 0;
    const segs = parts.filter(p => p.v > 0).map(p => {
      const len = (p.v / total) * C;
      const seg = `<circle cx="75" cy="75" r="${r}" stroke="${p.c}" stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-acc}" data-tip='${esc(JSON.stringify({ t: p.label, v: p.v, pct: p.v / total }))}'/>`;
      acc += len;
      return seg;
    }).join("");
    return `<div class="donut-wrap">
      <div class="donut"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${r}" stroke="rgba(255,255,255,.06)"/>${segs}</svg>
        <div class="donut-center"><span>total</span><b>${moneyShort(total)}</b></div></div>
      <div class="donut-legend">${parts.map(p => `<div><i style="background:${p.c}"></i><span>${p.label}</span><b>${money(p.v)}</b></div>`).join("")}</div>
    </div>`;
  }

  // ---------- Pagamentos (Pix) ----------
  function renderPix(mk) {
    const t = totals(mk);
    const list = activePix(mk).slice().sort((a, b) => a.dia - b.dia || a.nome.localeCompare(b.nome));
    const q = ui.pixSearch.trim().toLowerCase();
    const filtered = list.filter(p => {
      const paid = !!pixPago(p, mk);
      if (ui.pixFilter === "pendentes" && paid) return false;
      if (ui.pixFilter === "pagos" && !paid) return false;
      return !q || [p.nome, p.chave, p.categoria].some(s => String(s || "").toLowerCase().includes(q));
    });
    const totalMes = t.pagosPix + t.pendPix;
    const pct = t.pixCount ? t.pixPagos / t.pixCount : 0;
    const av = avulsosDoMes(mk).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
    const allDone = t.pixCount > 0 && t.pixPagos === t.pixCount;

    return `
    <div class="summary-strip stagger">
      <div class="panel">
        <div class="big-progress-label"><b>${t.pixPagos} <span style="font-size:15px;color:var(--text-3)">de ${t.pixCount}</span></b><span>${Math.round(pct * 100)}% pagos</span></div>
        <div class="progress"><span class="prog-anim" style="width:${pct * 100}%"></span></div>
      </div>
      <div class="panel"><div class="stat-label">Total recorrente</div><div class="stat-value" data-count="${totalMes}">${money(totalMes)}</div></div>
      <div class="panel"><div class="stat-label">Já pago</div><div class="stat-value" style="color:var(--green-400)" data-count="${t.pagosPix}">${money(t.pagosPix)}</div></div>
      <div class="panel"><div class="stat-label">Falta pagar</div><div class="stat-value" style="color:${t.pendPix ? "var(--gold-300)" : "var(--text)"}" data-count="${t.pendPix}">${money(t.pendPix)}</div></div>
    </div>
    ${allDone ? `<div class="all-done">${I.party}<div><b>Tudo pago em ${esc(monthName(mk))}!</b><div style="font-size:13px;color:var(--text-2)">Ninguém ficou pra trás. Pode respirar.</div></div></div>` : ""}
    <div class="toolbar">
      <div class="seg" data-seg="pixFilter">
        <span class="seg-thumb"></span>
        ${["todos", "pendentes", "pagos"].map(f => `<button data-val="${f}" class="${ui.pixFilter === f ? "active" : ""}">${f[0].toUpperCase() + f.slice(1)}</button>`).join("")}
      </div>
      <label class="search">${I.search}<input id="pix-search" placeholder="Buscar nome, chave ou categoria…" value="${esc(ui.pixSearch)}"></label>
      <button class="btn btn-ghost" data-action="copy-pending">${I.list}Copiar pendentes</button>
      <button class="btn btn-gold" data-action="new-pix">${I.plus}Novo recorrente</button>
    </div>
    <div class="pay-list stagger">
      ${filtered.length ? filtered.map(p => pixRow(p, mk)).join("") :
        list.length ? `<div class="panel">${empty(I.search, "Nada por aqui", "Nenhum pagamento com esse filtro.")}</div>` :
        `<div class="panel">${empty(I.user, "Nenhum pagamento recorrente", "Cadastre as pessoas e contas que você paga todo mês, com a chave Pix e o dia.", `<button class="btn btn-gold" data-action="new-pix">${I.plus}Cadastrar o primeiro</button>`)}</div>`}
    </div>

    <div class="section-title">
      <h2>Contas avulsas <small>só deste mês · ${av.length ? `${av.filter(a => a.pagoEm).length}/${av.length} pagas` : "nenhuma"}</small></h2>
      <button class="btn btn-ghost btn-sm" data-action="new-avulso">${I.plus}Adicionar conta</button>
    </div>
    <div class="pay-list">
      ${av.length ? av.map(avulsoRow).join("") : `<div class="panel" style="padding:18px;color:var(--text-3);font-size:13.5px">Boletos, IPVA, consertos, presentes… qualquer gasto que não se repete todo mês.</div>`}
    </div>`;
  }

  function pixRow(p, mk) {
    const pg = pixPago(p, mk);
    const due = dateInMonth(mk, p.dia);
    const st = statusFor(due, !!pg);
    const val = pg ? pg.valor : pixValor(p, mk);
    const adjusted = !pg && db.valoresMes[mk]?.[p.id] !== undefined;
    return `<div class="pay-item ${pg ? "paid" : ""} ${st.cls === "late" ? "late" : ""}" data-id="${p.id}">
      <button class="check ${pg ? "on" : ""}" data-action="toggle-pix" aria-label="Marcar como pago">${I.check}<span class="burst"></span></button>
      ${avatar(p.nome)}
      <div style="min-width:0">
        <div class="pay-name">${esc(p.nome)}</div>
        <div class="pay-sub">${p.categoria ? `<span class="chip chip-kind">${esc(p.categoria)}</span>` : ""}${esc(p.metodo || "Pix")} ${pg ? `<span class="chip chip-ok">${I.check}pago ${fmtDate(pg.data)}</span>` : st.chip}</div>
      </div>
      <div class="pay-key">
        ${p.chave ? `<div class="key-box" data-action="copy-key" title="Clique para copiar">${esc(p.chave)}</div><button class="icon-btn" data-action="copy-key" title="Copiar chave">${I.copy}</button>` : `<span style="font-size:12px;color:var(--text-3)">sem chave cadastrada</span>`}
      </div>
      <div class="pay-day"><b>${pad(p.dia)}</b><span>dia</span></div>
      <div class="pay-value" data-action="${pg ? "" : "month-value"}" style="${pg ? "" : "cursor:pointer"}" title="${pg ? "" : "Ajustar valor só deste mês"}">${money(val)}${adjusted ? `<small>ajustado (padrão ${money(p.valor)})</small>` : ""}</div>
      <div class="row-actions">
        <button class="icon-btn" data-action="edit-pix" title="Editar">${I.edit}</button>
        <button class="icon-btn" data-action="del-pix" title="Excluir">${I.trash}</button>
      </div>
    </div>`;
  }

  function avulsoRow(a) {
    const st = statusFor(a.vencimento, !!a.pagoEm);
    return `<div class="pay-item ${a.pagoEm ? "paid" : ""} ${st.cls === "late" ? "late" : ""}" data-id="${a.id}">
      <button class="check ${a.pagoEm ? "on" : ""}" data-action="toggle-avulso" aria-label="Marcar como pago">${I.check}<span class="burst"></span></button>
      <div class="inc-icon">${I.receipt}</div>
      <div style="min-width:0"><div class="pay-name">${esc(a.descricao)}</div><div class="pay-sub">${a.categoria ? `<span class="chip chip-kind">${esc(a.categoria)}</span>` : ""}${st.chip}</div></div>
      <div class="pay-key"><span style="font-size:12.5px;color:var(--text-2)">vence ${fmtDate(a.vencimento)}</span></div>
      <div class="pay-day"><b>${fmtDate(a.vencimento).slice(0, 2)}</b><span>dia</span></div>
      <div class="pay-value">${money(a.valor)}</div>
      <div class="row-actions">
        <button class="icon-btn" data-action="edit-avulso" title="Editar">${I.edit}</button>
        <button class="icon-btn" data-action="del-avulso" title="Excluir">${I.trash}</button>
      </div>
    </div>`;
  }

  // ---------- Cartões ----------
  const CC_THEMES = {
    navy: "linear-gradient(135deg,#25407a,#0a1630 55%,#1a2f5e)",
    ouro: "linear-gradient(135deg,#d4a843,#7a5516 60%,#b8862b)",
    esmeralda: "linear-gradient(135deg,#169a66,#063324 60%,#0f5c43)",
    areia: "linear-gradient(135deg,#cfc0a0,#7d6d4e 60%,#a8997a)",
    grafite: "linear-gradient(135deg,#3b4150,#0e1015 60%,#262a33)",
    roxo: "linear-gradient(135deg,#8b5cf6,#2e1065 60%,#6d28d9)",
    laranja: "linear-gradient(135deg,#f97316,#7c2d12 60%,#ea580c)",
    azul: "linear-gradient(135deg,#3b82f6,#172554 60%,#1d4ed8)",
    vinho: "linear-gradient(135deg,#b91c1c,#3b0a0a 60%,#7f1d1d)",
  };
  const BRANDS = ["Mastercard", "Visa", "Elo", "American Express", "Hipercard", "Outra"];

  function brandMark(b) {
    if (b === "Mastercard") return `<svg width="46" height="28" viewBox="0 0 46 28"><circle cx="16" cy="14" r="13" fill="#eb001b" opacity=".92"/><circle cx="30" cy="14" r="13" fill="#f79e1b" opacity=".92"/><path d="M23 3.2a13 13 0 0 1 0 21.6 13 13 0 0 1 0-21.6z" fill="#ff5f00"/></svg>`;
    if (b === "Visa") return `<span class="cc-brand">VISA</span>`;
    if (b === "American Express") return `<span class="cc-brand" style="font-size:15px">AMEX</span>`;
    return `<span class="cc-brand" style="font-size:16px">${esc((b || "").toUpperCase())}</span>`;
  }

  function renderCartoes(mk) {
    const t = totals(mk);
    const upcoming = db.cartoes.map(c => ({ c, d: cardDates(c, mk).venc, f: fatura(c, mk) })).filter(x => !x.f.pagoEm).sort((a, b) => a.d.localeCompare(b.d))[0];
    return `
    <div class="summary-strip stagger">
      <div class="panel">
        <div class="big-progress-label"><b>${t.ccPagos} <span style="font-size:15px;color:var(--text-3)">de ${t.ccCount}</span></b><span>faturas pagas</span></div>
        <div class="progress"><span class="prog-anim" style="width:${t.ccCount ? (t.ccPagos / t.ccCount) * 100 : 0}%"></span></div>
      </div>
      <div class="panel"><div class="stat-label">Total em faturas</div><div class="stat-value" data-count="${t.pagosCC + t.pendCC}">${money(t.pagosCC + t.pendCC)}</div></div>
      <div class="panel"><div class="stat-label">Já pago</div><div class="stat-value" style="color:var(--green-400)" data-count="${t.pagosCC}">${money(t.pagosCC)}</div></div>
      <div class="panel"><div class="stat-label">Próximo vencimento</div><div class="stat-value" style="font-size:17px;color:var(--gold-300)">${upcoming ? `${fmtDate(upcoming.d)} · ${esc(upcoming.c.nome)}` : "—"}</div></div>
    </div>
    <div class="cards-grid stagger">
      ${db.cartoes.slice().sort((a, b) => a.vencimento - b.vencimento).map(c => cardBlock(c, mk)).join("")}
      <button class="cc-add" data-action="new-card">${I.plus}<span>Adicionar cartão</span></button>
    </div>`;
  }

  function cardBlock(c, mk) {
    const f = fatura(c, mk);
    const { venc, fech } = cardDates(c, mk);
    const st = statusFor(venc, !!f.pagoEm);
    const prev = fatura(c, addMonths(mk, -1)).valor;
    const closed = daysUntil(fech) < 0;
    const limitPct = c.limite ? Math.min(1, f.valor / c.limite) : 0;
    return `<div class="cc-block" data-id="${c.id}">
      <div class="cc-scene"><div class="cc" style="--cc-bg:${CC_THEMES[c.cor] || CC_THEMES.navy}">
        <div class="glare"></div>
        <div class="cc-row"><div><div class="cc-bank">${esc(c.nome)}</div><div class="cc-nick">${esc(c.apelido || "")}</div></div>
          <svg class="cc-contactless" viewBox="0 0 24 24"><path d="M8 8a6 6 0 0 1 0 8M11.5 5.5a10 10 0 0 1 0 13M15 3a14 14 0 0 1 0 18"/></svg></div>
        <div class="cc-row" style="align-items:center"><div class="cc-chip"></div>${f.pagoEm ? `<div class="cc-paid-stamp">PAGA</div>` : ""}</div>
        <div class="cc-number">•••• •••• •••• ${esc(c.final || "••••")}</div>
        <div class="cc-row" style="align-items:flex-end">
          <div style="display:flex;gap:20px">
            <div><div class="cc-label">fatura</div><div class="cc-val">${money(f.valor)}</div></div>
            <div><div class="cc-label">vence</div><div class="cc-val">${fmtDate(venc)}</div></div>
          </div>
          ${brandMark(c.bandeira)}
        </div>
      </div></div>
      <div class="panel cc-info">
        <div class="cc-dates">
          <span>Fecha <b>${fmtDate(fech)}</b>${closed ? " ✓" : ""}</span>
          <span>Vence <b>${fmtDate(venc)}</b></span>
          ${f.pagoEm ? `<span class="chip chip-ok">${I.check}paga em ${fmtDate(f.pagoEm)}</span>` : st.chip}
        </div>
        <div class="cc-info-row">
          <label class="money-input"><span>R$</span><input inputmode="decimal" data-action="fatura-valor" placeholder="valor da fatura" value="${moneyInputValue(f.valor)}"></label>
          <button class="btn ${f.pagoEm ? "btn-ghost" : "btn-green"}" data-action="toggle-fatura">${f.pagoEm ? I.undo + "Desfazer" : I.check + "Paguei"}</button>
        </div>
        ${c.limite ? `<div class="limit-bar"><div class="progress"><span class="prog-anim" style="width:${limitPct * 100}%"></span></div><div class="meta"><span>${Math.round(limitPct * 100)}% do limite</span><span>limite ${money(c.limite)}</span></div></div>` : ""}
        <div class="cc-info-row" style="margin-top:10px;font-size:12px;color:var(--text-3)">
          <span>Mês anterior: <b style="font-family:var(--mono);color:var(--text-2);font-weight:500">${money(prev)}</b>${prev && f.valor ? ` · <span style="color:${f.valor > prev ? "var(--coral)" : "var(--green-400)"}">${f.valor > prev ? "▲" : "▼"} ${Math.abs(Math.round((f.valor / prev - 1) * 100))}%</span>` : ""}</span>
          <div class="row-actions"><button class="icon-btn" data-action="edit-card" title="Editar">${I.edit}</button><button class="icon-btn" data-action="del-card" title="Excluir">${I.trash}</button></div>
        </div>
      </div>
    </div>`;
  }

  // ---------- Recebimentos ----------
  function renderReceitas(mk) {
    const t = totals(mk);
    const year = mk.slice(0, 4);
    const doMes = db.recebimentos.filter(r => recMonth(r) === mk);
    const atrasados = db.recebimentos.filter(r => !r.recebidoEm && daysUntil(r.previsto) < 0 && monthOf(r.previsto) < mk);
    const filtered = doMes.filter(r => ui.recFilter === "todos" || (ui.recFilter === "recebidos" ? r.recebidoEm : !r.recebidoEm))
      .sort((a, b) => (a.recebidoEm || a.previsto).localeCompare(b.recebidoEm || b.previsto));
    const anoRecebido = db.recebimentos.filter(r => r.recebidoEm && r.recebidoEm.startsWith(year));
    const porCliente = {};
    anoRecebido.forEach(r => (porCliente[r.cliente] = (porCliente[r.cliente] || 0) + +r.valor));
    const ranking = Object.entries(porCliente).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxC = ranking[0]?.[1] || 1;
    const totalAno = sum(anoRecebido, r => r.valor);
    const mesesComReceita = new Set(anoRecebido.map(r => monthOf(r.recebidoEm))).size;
    const fixos = db.recFixos.filter(f => f.ativo !== false);

    return `
    <div class="summary-strip stagger">
      <div class="panel">
        <div class="stat-label">Recebido em ${esc(monthName(mk))}</div>
        <div class="stat-value" style="font-size:28px;color:var(--green-400)" data-count="${t.recebido}">${money(t.recebido)}</div>
        <div class="progress" style="margin-top:12px"><span class="prog-anim" style="width:${t.recebido + t.previsto ? (t.recebido / (t.recebido + t.previsto)) * 100 : 0}%"></span></div>
      </div>
      <div class="panel"><div class="stat-label">Ainda a receber</div><div class="stat-value" style="color:var(--sand-200)" data-count="${t.previsto}">${money(t.previsto)}</div></div>
      <div class="panel"><div class="stat-label">Atrasados (meses anteriores)</div><div class="stat-value" style="color:${atrasados.length ? "var(--coral)" : "var(--text)"}" data-count="${sum(atrasados, r => r.valor)}">${money(sum(atrasados, r => r.valor))}</div></div>
      <div class="panel"><div class="stat-label">Média mensal ${year}</div><div class="stat-value" data-count="${mesesComReceita ? totalAno / mesesComReceita : 0}">${money(mesesComReceita ? totalAno / mesesComReceita : 0)}</div></div>
    </div>
    <div class="grid dash-main" style="margin-top:0">
      <div>
        ${atrasados.length ? `<div class="section-title" style="margin-top:0"><h2 style="color:var(--coral)">${I.alert.replace("<svg", '<svg style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2"')}Atrasados <small>previstos em meses anteriores</small></h2></div>
          <div class="pay-list" style="margin-bottom:24px">${atrasados.map(recRow).join("")}</div>` : ""}
        <div class="toolbar">
          <div class="seg" data-seg="recFilter"><span class="seg-thumb"></span>
            ${[["todos", "Todos"], ["areceber", "A receber"], ["recebidos", "Recebidos"]].map(([k, l]) => `<button data-val="${k}" class="${ui.recFilter === k ? "active" : ""}">${l}</button>`).join("")}
          </div>
          <span style="flex:1"></span>
          <button class="btn btn-gold" data-action="new-rec">${I.plus}Novo recebimento</button>
        </div>
        <div class="pay-list stagger">
          ${filtered.length ? filtered.map(recRow).join("") : `<div class="panel">${empty(I.coins, doMes.length ? "Nada com esse filtro" : "Nenhum recebimento neste mês", "Lance o que você espera receber (e de quem). Quando o dinheiro cair, é só clicar em “Recebi”.", doMes.length ? "" : `<button class="btn btn-gold" data-action="new-rec">${I.plus}Lançar recebimento</button>`)}</div>`}
        </div>
      </div>
      <div class="grid stagger" style="align-content:start">
        <div class="panel">
          <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Recebimentos fixos</h3>${fixos.length ? `<span class="panel-sub">${money(sum(fixos, f => f.valor))}/mês</span>` : ""}</div>
          <div class="clients">
            ${fixos.length ? fixos.map(f => `<div class="client-row" data-id="${f.id}">
              <div class="top" style="align-items:center"><span style="flex:1">${esc(f.cliente)} <small style="color:var(--text-3)">· dia ${f.dia}</small></span><b>${money(f.valor)}</b>
                <button class="icon-btn" data-action="edit-fixo" title="Editar">${I.edit}</button>
                <button class="icon-btn" data-action="stop-fixo" title="Parar">${I.trash}</button>
              </div></div>`).join("") : `<div style="color:var(--text-3);font-size:13px">Salário ou qualquer valor que entra todo mês. Lance em “Novo recebimento” e escolha repetir “todo mês”.</div>`}
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Quem mais pagou em ${year}</h3><span class="panel-sub">${money(totalAno)}</span></div>
          <div class="clients">
            ${ranking.length ? ranking.map(([n, v]) => `<div class="client-row"><div class="top"><span>${esc(n)}</span><b>${money(v)}</b></div><div class="progress"><span class="prog-anim" style="width:${(v / maxC) * 100}%"></span></div></div>`).join("") : `<div style="color:var(--text-3);font-size:13px">Sem recebimentos confirmados neste ano ainda.</div>`}
          </div>
        </div>
      </div>
    </div>`;
  }

  function recRow(r) {
    const late = !r.recebidoEm && daysUntil(r.previsto) < 0;
    const chip = r.recebidoEm ? `<span class="chip chip-ok">${I.check}recebido</span>` : late ? `<span class="chip chip-late">${I.alert}${-daysUntil(r.previsto)}d atrasado</span>` : daysUntil(r.previsto) === 0 ? `<span class="chip chip-today">hoje</span>` : `<span class="chip chip-wait">previsto</span>`;
    return `<div class="inc-item ${r.recebidoEm ? "received" : ""} ${late ? "late" : ""}" data-id="${r.id}">
      <div class="inc-icon">${r.recebidoEm ? I.arrowDown : I.clock}</div>
      <div style="min-width:0"><div class="pay-name">${esc(r.cliente)}</div><div class="pay-sub">${chip}${esc(r.descricao || "")}${r.forma ? ` · ${esc(r.forma)}` : ""}</div></div>
      <div class="inc-date">${r.recebidoEm ? `recebido ${fmtDate(r.recebidoEm)}` : `previsto ${fmtDate(r.previsto)}`}</div>
      <div class="inc-value">${r.recebidoEm ? "+ " : ""}${money(r.valor)}</div>
      <div class="row-actions">
        <button class="btn btn-sm ${r.recebidoEm ? "btn-ghost" : "btn-green"} recv-btn" data-action="toggle-rec">${r.recebidoEm ? I.undo + "Desfazer" : I.check + "Recebi"}</button>
        <button class="icon-btn" data-action="edit-rec" title="Editar">${I.edit}</button>
        <button class="icon-btn" data-action="del-rec" title="Excluir">${I.trash}</button>
      </div>
    </div>`;
  }

  // ---------- Saldo e reserva ----------
  function renderReserva(mk) {
    const s = saldos(mk);
    if (!s) {
      const antes = db.conta.inicio && mk < db.conta.inicio;
      return `<div class="stagger"><div class="panel">${empty(I.wallet,
        antes ? "Antes do saldo inicial" : "Informe seus saldos",
        antes ? `Seus saldos começam a contar em ${esc(monthName(db.conta.inicio))}.` : "Diga quanto você tem hoje na conta corrente e na reserva. A partir daí o app acompanha os dois mês a mês.",
        `<button class="btn btn-gold" data-action="edit-saldos">${I.wallet}${antes ? "Mudar mês inicial" : "Informar saldos"}</button>`)}</div></div>`;
    }
    const movs = db.reserva.movimentos.filter(m => monthOf(m.data) === mk).sort((a, b) => a.data.localeCompare(b.data));
    const guardado = sum(movs.filter(m => m.tipo === "guardar"), m => m.valor) - sum(movs.filter(m => m.tipo === "resgatar"), m => m.valor);
    const rendeu = sum(movs.filter(m => m.tipo === "rendimento"), m => m.valor);
    const fimDo = mk === currentMonth() ? "hoje" : `fim de ${esc(monthName(mk))}`;

    return `
    <div class="summary-strip stagger">
      <div class="panel"><div class="stat-label">Em conta · ${fimDo}</div><div class="stat-value" style="font-size:28px;color:${s.conta < 0 ? "var(--coral)" : "var(--text)"}" data-count="${s.conta}">${money(s.conta)}</div></div>
      <div class="panel"><div class="stat-label">Reserva · ${fimDo}</div><div class="stat-value" style="font-size:28px;color:var(--gold-300)" data-count="${s.reserva}">${money(s.reserva)}</div></div>
      <div class="panel"><div class="stat-label">Guardado no mês</div><div class="stat-value" style="color:${guardado < 0 ? "var(--coral)" : "var(--green-400)"}" data-count="${guardado}">${money(guardado)}</div></div>
      <div class="panel"><div class="stat-label">Rendimento no mês</div><div class="stat-value" data-count="${rendeu}">${money(rendeu)}</div></div>
    </div>
    <div class="grid dash-main" style="margin-top:0">
      <div>
        <div class="toolbar">
          <button class="btn btn-gold" data-action="new-mov" data-tipo="guardar">${I.arrowDown}Guardar</button>
          <button class="btn btn-ghost" data-action="new-mov" data-tipo="resgatar">${I.arrowUp}Resgatar</button>
          <button class="btn btn-ghost" data-action="new-mov" data-tipo="rendimento">${I.trendUp}Rendimento</button>
        </div>
        <div class="pay-list stagger">
          ${movs.length ? movs.map(m => `<div class="inc-item ${m.tipo === "resgatar" ? "" : "received"}" data-id="${m.id}">
            <div class="inc-icon">${MOV[m.tipo].icon}</div>
            <div style="min-width:0"><div class="pay-name">${MOV[m.tipo].nome}</div><div class="pay-sub">${esc(m.descricao || "")}</div></div>
            <div class="inc-date">${fmtDate(m.data)}</div>
            <div class="inc-value">${MOV[m.tipo].sinal}${money(m.valor)}</div>
            <div class="row-actions">
              <button class="icon-btn" data-action="edit-mov" title="Editar">${I.edit}</button>
              <button class="icon-btn" data-action="del-mov" title="Excluir">${I.trash}</button>
            </div></div>`).join("") : `<div class="panel">${empty(I.wallet, "Nenhum movimento neste mês", "Quando guardar ou tirar dinheiro da reserva, registre aqui. O saldo da conta se ajusta sozinho.")}</div>`}
        </div>
      </div>
      <div class="stagger">
        <div class="panel">
          <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Saldos iniciais</h3><span class="panel-sub">${esc(monthName(db.conta.inicio))}</span></div>
          <div class="clients">
            <div class="client-row"><div class="top"><span>Conta corrente</span><b>${money(db.conta.saldoInicial)}</b></div></div>
            <div class="client-row"><div class="top"><span>Reserva</span><b>${money(db.reserva.saldoInicial)}</b></div></div>
          </div>
          <p style="color:var(--text-3);font-size:12.5px;margin:12px 0">A conta soma tudo que você marcou como recebido e tira tudo que marcou como pago, mês a mês.</p>
          <button class="btn btn-ghost btn-sm" data-action="edit-saldos">${I.edit}Editar saldos</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- Ajustes ----------
  function renderAjustes() {
    return `<div class="settings stagger">
      <div class="panel">
        <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Perfil</h3></div>
        <p>Como devo te chamar na saudação?</p>
        <div class="field"><input id="set-nome" placeholder="Seu nome" value="${esc(db.settings.nome)}"></div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Onde seus dados ficam</h3></div>
        ${serverMode
          ? `<p>Você está usando o servidor local. Tudo é salvo automaticamente em <code class="path">data/dados.json</code>, com um backup diário em <code class="path">data/backups/</code>.</p>`
          : `<p>Você abriu o arquivo direto no navegador, então os dados ficam guardados <b>neste navegador</b>. Para salvar em arquivo (mais seguro), dê dois cliques em <code class="path">iniciar.bat</code> e abra <code class="path">http://localhost:3000</code>.</p>`}
        <p style="margin:0">Registros: ${db.pix.length} recorrentes · ${db.cartoes.length} cartões · ${db.recebimentos.length} recebimentos · ${db.avulsos.length} contas avulsas.</p>
      </div>
      <div class="panel">
        <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Backup</h3></div>
        <p>Exporte um arquivo com todos os dados, ou importe um backup para restaurar (substitui os dados atuais).</p>
        <div class="btn-row">
          <button class="btn btn-gold" data-action="export">${I.download}Exportar backup</button>
          <button class="btn btn-ghost" data-action="import">${I.upload}Importar backup</button>
          <input type="file" id="import-file" accept="application/json,.json" hidden>
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><h3 class="panel-title"><span class="dot"></span>Zona de testes</h3></div>
        <p>Carregue dados de exemplo para ver o app funcionando, ou apague tudo para começar do zero.</p>
        <div class="btn-row">
          <button class="btn btn-ghost" data-action="seed">${I.sparkle}Dados de exemplo</button>
          <button class="btn btn-danger" data-action="reset">${I.trash}Apagar tudo</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- Modais ----------
  function openModal({ title, sub, body, submit = "Salvar", onSubmit, danger, extra }) {
    const root = $("#modal-root");
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<form class="modal" novalidate>
      <h3>${title}</h3>${sub ? `<p class="modal-sub">${sub}</p>` : '<div style="height:16px"></div>'}
      ${body || ""}
      <div class="modal-actions">${extra || ""}<span class="spacer"></span>
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn ${danger ? "btn-danger" : "btn-gold"}">${submit}</button>
      </div></form>`;
    root.appendChild(back);
    const form = $("form", back);
    const close = () => { back.classList.add("closing"); setTimeout(() => back.remove(), 200); document.removeEventListener("keydown", onKey); };
    const onKey = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    back.addEventListener("mousedown", e => { if (e.target === back) close(); });
    $("[data-close]", back).onclick = close;
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      $$("input[type=checkbox]", form).forEach(cb => (data[cb.name] = cb.checked));
      if (onSubmit(data, form) !== false) close();
    });
    setTimeout(() => $("input:not([type=hidden]):not([type=checkbox]), select", form)?.focus(), 60);
    return { back, form, close };
  }

  const field = (name, label, value = "", attrs = "", full = false, hint = "") =>
    `<div class="field ${full ? "full" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" value="${esc(value)}" ${attrs}>${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  const select = (name, label, options, value, full = false) =>
    `<div class="field ${full ? "full" : ""}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options.map(o => `<option ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
  const datalist = (id, values) => `<datalist id="${id}">${[...new Set(values.filter(Boolean))].map(v => `<option value="${esc(v)}">`).join("")}</datalist>`;

  function need(form, name, msg) {
    const el = form.elements[name];
    if (!String(el.value).trim() || (el.inputMode === "decimal" && parseMoney(el.value) <= 0)) {
      el.focus(); el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 250 });
      toast(msg, "warn");
      return false;
    }
    return true;
  }

  function pixForm(p) {
    const edit = !!p;
    p = p || { nome: "", chave: "", tipoChave: "CPF/CNPJ", valor: "", dia: 5, categoria: "", metodo: "Pix", obs: "" };
    openModal({
      title: edit ? "Editar pagamento recorrente" : "Novo pagamento recorrente",
      sub: "Alguém ou algo que você paga todo mês. Vai aparecer automaticamente em todos os meses.",
      body: `<div class="form">
        ${field("nome", "Nome / para quem", p.nome, 'placeholder="Ex.: Maria (diarista)" required', true)}
        ${select("metodo", "Forma de pagamento", ["Pix", "Boleto", "Transferência", "Débito automático", "Dinheiro"], p.metodo)}
        ${select("tipoChave", "Tipo de chave", ["CPF/CNPJ", "Celular", "E-mail", "Aleatória", "Dados bancários", "—"], p.tipoChave)}
        ${field("chave", "Chave Pix / dados", p.chave, 'placeholder="Chave para copiar rapidinho" autocomplete="off"', true)}
        ${field("valor", "Valor mensal (R$)", moneyInputValue(p.valor), 'inputmode="decimal" placeholder="0,00"')}
        ${field("dia", "Dia do pagamento", p.dia, 'type="number" min="1" max="31"')}
        ${field("categoria", "Categoria", p.categoria, 'list="dl-cat" placeholder="Ex.: Equipe, Casa, Família"', true)}
        ${datalist("dl-cat", ["Equipe", "Casa", "Família", "Aluguel", "Serviços", "Assinaturas", ...db.pix.map(x => x.categoria)])}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "nome", "Informe o nome.") || !need(form, "valor", "Informe o valor.")) return false;
        const data = { nome: d.nome.trim(), metodo: d.metodo, tipoChave: d.tipoChave, chave: d.chave.trim(), valor: parseMoney(d.valor), dia: Math.min(31, Math.max(1, +d.dia || 1)), categoria: d.categoria.trim() };
        if (edit) Object.assign(db.pix.find(x => x.id === p.id), data);
        else db.pix.push({ id: uid(), ativo: true, inicio: ui.month < currentMonth() ? ui.month : currentMonth(), ...data });
        save(); render(); toast(edit ? "Pagamento atualizado." : `${data.nome} adicionado aos pagamentos do mês.`);
      },
    });
  }

  function avulsoForm(a) {
    const edit = !!a;
    a = a || { descricao: "", valor: "", vencimento: dateInMonth(ui.month, ui.month === currentMonth() ? new Date().getDate() : 10), categoria: "" };
    openModal({
      title: edit ? "Editar conta avulsa" : "Nova conta avulsa",
      sub: "Um gasto que acontece só uma vez (ou de vez em quando).",
      body: `<div class="form">
        ${field("descricao", "Descrição", a.descricao, 'placeholder="Ex.: IPVA, conserto do carro"', true)}
        ${field("valor", "Valor (R$)", moneyInputValue(a.valor), 'inputmode="decimal" placeholder="0,00"')}
        ${field("vencimento", "Vencimento", a.vencimento, 'type="date"')}
        ${field("categoria", "Categoria", a.categoria, 'list="dl-cat2" placeholder="Opcional"', true)}
        ${datalist("dl-cat2", ["Impostos", "Carro", "Saúde", "Casa", "Educação", "Lazer", ...db.avulsos.map(x => x.categoria)])}
        ${edit ? "" : `<label class="toggle field full"><input type="checkbox" name="jaPago"><span class="sw"></span>Já está paga</label>`}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "descricao", "Informe a descrição.") || !need(form, "valor", "Informe o valor.") || !need(form, "vencimento", "Informe o vencimento.")) return false;
        const data = { descricao: d.descricao.trim(), valor: parseMoney(d.valor), vencimento: d.vencimento, categoria: d.categoria.trim() };
        if (edit) Object.assign(db.avulsos.find(x => x.id === a.id), data);
        else db.avulsos.push({ id: uid(), pagoEm: d.jaPago ? todayISO() : null, ...data });
        if (monthOf(data.vencimento) !== ui.month) ui.month = monthOf(data.vencimento);
        save(); render(); toast("Conta salva.");
      },
    });
  }

  function cardForm(c) {
    const edit = !!c;
    c = c || { nome: "", apelido: "", final: "", bandeira: "Mastercard", fechamento: 1, vencimento: 10, cor: "navy", limite: "" };
    const { form } = openModal({
      title: edit ? "Editar cartão" : "Novo cartão de crédito",
      sub: "O app calcula o vencimento de cada mês. Você só informa o valor da fatura.",
      body: `<div class="form">
        ${field("nome", "Banco / emissor", c.nome, 'placeholder="Ex.: Nubank, Itaú, Inter"')}
        ${field("apelido", "Apelido", c.apelido, 'placeholder="Ex.: Pessoal, Empresa"')}
        ${select("bandeira", "Bandeira", BRANDS, c.bandeira)}
        ${field("final", "4 últimos dígitos", c.final, 'maxlength="4" inputmode="numeric" placeholder="1234"')}
        ${field("fechamento", "Dia do fechamento", c.fechamento, 'type="number" min="1" max="31"')}
        ${field("vencimento", "Dia do vencimento", c.vencimento, 'type="number" min="1" max="31"')}
        ${field("limite", "Limite (opcional)", moneyInputValue(c.limite), 'inputmode="decimal" placeholder="0,00"', true)}
        <div class="field full"><label>Cor do cartão</label><div class="swatches">${Object.keys(CC_THEMES).map(k => `<button type="button" class="swatch ${k === c.cor ? "on" : ""}" data-cor="${k}" style="--cc-bg:${CC_THEMES[k]}" title="${k}"></button>`).join("")}</div><input type="hidden" name="cor" value="${c.cor}"></div>
      </div>`,
      onSubmit(d, f) {
        if (!need(f, "nome", "Informe o banco do cartão.")) return false;
        const data = { nome: d.nome.trim(), apelido: d.apelido.trim(), bandeira: d.bandeira, final: d.final.replace(/\D/g, "").slice(-4), fechamento: Math.min(31, Math.max(1, +d.fechamento || 1)), vencimento: Math.min(31, Math.max(1, +d.vencimento || 1)), limite: parseMoney(d.limite), cor: d.cor };
        if (edit) Object.assign(db.cartoes.find(x => x.id === c.id), data);
        else db.cartoes.push({ id: uid(), ...data });
        save(); render(); toast(edit ? "Cartão atualizado." : "Cartão adicionado.");
      },
    });
    form.addEventListener("click", e => {
      const s = e.target.closest(".swatch");
      if (!s) return;
      $$(".swatch", form).forEach(x => x.classList.toggle("on", x === s));
      form.elements.cor.value = s.dataset.cor;
    });
  }

  function recForm(r) {
    const edit = !!r;
    r = r || { cliente: "", descricao: "", valor: "", previsto: dateInMonth(ui.month, ui.month === currentMonth() ? new Date().getDate() : 5), recebidoEm: null, forma: "Pix" };
    openModal({
      title: edit ? "Editar recebimento" : "Novo recebimento",
      sub: "Registre o que você vai receber (ou já recebeu) de cada cliente.",
      body: `<div class="form">
        ${field("cliente", "Cliente / fonte", r.cliente, 'list="dl-cli" placeholder="De quem vem o dinheiro"')}
        ${datalist("dl-cli", db.recebimentos.map(x => x.cliente))}
        ${field("valor", "Valor (R$)", moneyInputValue(r.valor), 'inputmode="decimal" placeholder="0,00"')}
        ${field("descricao", "Descrição", r.descricao, 'placeholder="Ex.: Projeto X, consultoria, parcela 1/3"', true)}
        ${field("previsto", "Data prevista", r.previsto, 'type="date"')}
        ${select("forma", "Como recebe", ["Pix", "Transferência", "Boleto", "Cartão", "Dinheiro", "Outro"], r.forma || "Pix")}
        ${edit ? field("recebidoEm", "Recebido em (vazio = ainda não)", r.recebidoEm || "", 'type="date"', true) : `
          <label class="toggle field full"><input type="checkbox" name="jaRecebido"><span class="sw"></span>Já caiu na conta (hoje)</label>
          <div class="field full"><label for="f-repetir">Repetir nos próximos meses</label><select id="f-repetir" name="repetir">${[0, 1, 2, 3, 5, 11].map(n => `<option value="${n}">${n ? `mais ${n} ${n === 1 ? "mês" : "meses"} (${n + 1} parcelas)` : "não repetir"}</option>`).join("")}<option value="fixo">todo mês (recebimento fixo, ex.: salário)</option></select><span class="hint">“Todo mês” para salário; parcelas para trabalhos pagos em partes.</span></div>`}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "cliente", "Informe o cliente.") || !need(form, "valor", "Informe o valor.") || !need(form, "previsto", "Informe a data prevista.")) return false;
        const base = { cliente: d.cliente.trim(), descricao: d.descricao.trim(), valor: parseMoney(d.valor), forma: d.forma };
        if (edit) {
          Object.assign(db.recebimentos.find(x => x.id === r.id), base, { previsto: d.previsto, recebidoEm: d.recebidoEm || null });
        } else if (d.repetir === "fixo") {
          const mk = monthOf(d.previsto);
          const f = { id: uid(), ...base, dia: +d.previsto.slice(8, 10), inicio: mk, ativo: true, meses: [mk] };
          db.recFixos.push(f);
          db.recebimentos.push({ id: uid(), fixoId: f.id, ...base, previsto: d.previsto, recebidoEm: d.jaRecebido ? todayISO() : null });
          if (d.jaRecebido) coinBurst();
        } else {
          const n = +d.repetir || 0;
          const day = +d.previsto.slice(8, 10);
          for (let i = 0; i <= n; i++) {
            const mk = addMonths(monthOf(d.previsto), i);
            db.recebimentos.push({ id: uid(), ...base, descricao: n ? `${base.descricao ? base.descricao + " · " : ""}${i + 1}/${n + 1}` : base.descricao, previsto: dateInMonth(mk, day), recebidoEm: i === 0 && d.jaRecebido ? todayISO() : null });
          }
          if (d.jaRecebido) coinBurst();
        }
        save(); render(); toast(edit ? "Recebimento atualizado." : "Recebimento lançado.");
      },
    });
  }

  function monthValueForm(p) {
    const mk = ui.month;
    const cur = pixValor(p, mk);
    openModal({
      title: `Valor de ${esc(p.nome)} em ${monthName(mk)}`,
      sub: `Ajuste só este mês (ex.: hora extra, desconto). O valor padrão continua ${money(p.valor)}.`,
      body: `<div class="form">${field("valor", "Valor deste mês (R$)", moneyInputValue(cur), 'inputmode="decimal"', true)}</div>`,
      extra: db.valoresMes[mk]?.[p.id] !== undefined ? `<button type="button" class="btn btn-ghost" id="reset-val">Voltar ao padrão</button>` : "",
      onSubmit(d, form) {
        if (!need(form, "valor", "Informe o valor.")) return false;
        (db.valoresMes[mk] ||= {})[p.id] = parseMoney(d.valor);
        save(); render(); toast("Valor ajustado para este mês.");
      },
    });
    const btn = $("#reset-val");
    if (btn) btn.onclick = () => { delete db.valoresMes[mk][p.id]; save(); render(); $(".modal-back:last-child [data-close]")?.click(); toast("Valor padrão restaurado."); };
  }

  function fixoForm(f) {
    openModal({
      title: "Editar recebimento fixo",
      sub: "Vale a partir deste mês, para o que ainda não foi recebido. Meses anteriores ficam como estão.",
      body: `<div class="form">
        ${field("cliente", "Cliente / fonte", f.cliente, "", true)}
        ${field("valor", "Valor mensal (R$)", moneyInputValue(f.valor), 'inputmode="decimal"')}
        ${field("dia", "Dia previsto", f.dia, 'type="number" min="1" max="31"')}
        ${field("descricao", "Descrição", f.descricao, "", true)}
        ${select("forma", "Como recebe", ["Pix", "Transferência", "Boleto", "Cartão", "Dinheiro", "Outro"], f.forma || "Pix", true)}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "cliente", "Informe o cliente.") || !need(form, "valor", "Informe o valor.")) return false;
        Object.assign(f, { cliente: d.cliente.trim(), descricao: d.descricao.trim(), valor: parseMoney(d.valor), forma: d.forma, dia: Math.min(31, Math.max(1, +d.dia || 1)) });
        for (const r of db.recebimentos) {
          if (r.fixoId !== f.id || r.recebidoEm || monthOf(r.previsto) < currentMonth()) continue;
          Object.assign(r, { cliente: f.cliente, descricao: f.descricao, valor: f.valor, forma: f.forma, previsto: dateInMonth(monthOf(r.previsto), f.dia) });
        }
        save(); render(); toast("Recebimento fixo atualizado.");
      },
    });
  }

  function saldosForm() {
    const c = db.conta;
    openModal({
      title: "Saldos iniciais",
      sub: "Quanto você tinha no começo do mês escolhido. A partir daí o app soma o que entra e tira o que sai.",
      body: `<div class="form">
        ${field("inicio", "A partir do mês", c.inicio || currentMonth(), 'type="month"', true)}
        ${field("conta", "Saldo na conta corrente (R$)", c.saldoInicial == null ? "" : moneyInputValue(c.saldoInicial), 'inputmode="decimal" placeholder="0,00"', false, "Pode ser negativo, ex.: -150,00")}
        ${field("reserva", "Saldo da reserva / poupança (R$)", moneyInputValue(db.reserva.saldoInicial), 'inputmode="decimal" placeholder="0,00"')}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "inicio", "Informe o mês.")) return false;
        db.conta = { saldoInicial: parseMoney(d.conta), inicio: d.inicio };
        db.reserva.saldoInicial = parseMoney(d.reserva);
        save(); render(); toast("Saldos salvos.");
      },
    });
  }

  const MOV = {
    guardar: { titulo: "Guardar na reserva", nome: "Guardei", icon: I.arrowDown, sinal: "+ " },
    resgatar: { titulo: "Resgatar da reserva", nome: "Resgatei", icon: I.arrowUp, sinal: "− " },
    rendimento: { titulo: "Rendimento da reserva", nome: "Rendimento", icon: I.trendUp, sinal: "+ " },
  };

  function movForm(tipo, m) {
    const edit = !!m;
    m = m || { tipo, valor: "", data: ui.month === currentMonth() ? todayISO() : dateInMonth(ui.month, 1), descricao: "" };
    openModal({
      title: edit ? "Editar movimento" : MOV[m.tipo].titulo,
      sub: m.tipo === "rendimento" ? "Juros que a reserva rendeu. Não mexe no saldo da conta." : m.tipo === "guardar" ? "Sai da conta corrente e entra na reserva." : "Sai da reserva e volta para a conta corrente.",
      body: `<div class="form">
        ${field("valor", "Valor (R$)", moneyInputValue(m.valor), 'inputmode="decimal" placeholder="0,00"')}
        ${field("data", "Data", m.data, 'type="date"')}
        ${field("descricao", "Descrição", m.descricao, 'placeholder="Opcional"', true)}
      </div>`,
      onSubmit(d, form) {
        if (!need(form, "valor", "Informe o valor.") || !need(form, "data", "Informe a data.")) return false;
        const data = { valor: parseMoney(d.valor), data: d.data, descricao: d.descricao.trim() };
        if (edit) Object.assign(m, data);
        else db.reserva.movimentos.push({ id: uid(), tipo: m.tipo, ...data });
        if (monthOf(data.data) !== ui.month) ui.month = monthOf(data.data);
        save(); render(); toast("Movimento salvo.");
      },
    });
  }

  function confirmModal(title, text, onYes, submit = "Excluir") {
    openModal({ title, sub: text, submit, danger: true, onSubmit() { onYes(); } });
  }

  function quickAdd() {
    const map = { pix: () => pixForm(), cartoes: () => cardForm(), receitas: () => recForm(), reserva: () => movForm("guardar") };
    if (map[ui.view]) return map[ui.view]();
    const { back, close } = openModal({
      title: "O que você quer lançar?",
      sub: "Escolha o tipo de registro.",
      body: `<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
        ${[["pix", I.user, "Pagamento recorrente", "Pix de todo mês"], ["avulso", I.receipt, "Conta avulsa", "Gasto único"], ["card", I.card, "Cartão de crédito", "Novo cartão"], ["rec", I.coins, "Recebimento", "Dinheiro entrando"]]
          .map(([k, ic, t, s]) => `<button type="button" class="panel" data-q="${k}" style="text-align:left;padding:16px;cursor:pointer"><div class="kpi-icon" style="background:rgba(212,168,67,.12);color:var(--gold-300);margin-bottom:10px">${ic}</div><b style="display:block;font-size:14px">${t}</b><span style="font-size:12px;color:var(--text-3)">${s}</span></button>`).join("")}
      </div>`,
      submit: "Fechar",
      onSubmit() {},
    });
    $("button[type=submit]", back).remove();
    back.addEventListener("click", e => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      close();
      setTimeout(() => ({ pix: pixForm, avulso: avulsoForm, card: cardForm, rec: recForm })[b.dataset.q](), 120);
    });
  }

  // ---------- Ações ----------
  function handleAction(action, el, e) {
    const id = el.closest("[data-id]")?.dataset.id;
    const mk = ui.month;
    switch (action) {
      case "new-pix": return pixForm();
      case "new-avulso": return avulsoForm();
      case "new-card": return cardForm();
      case "new-rec": return recForm();
      case "edit-pix": return pixForm(db.pix.find(x => x.id === id));
      case "edit-avulso": return avulsoForm(db.avulsos.find(x => x.id === id));
      case "edit-card": return cardForm(db.cartoes.find(x => x.id === id));
      case "edit-rec": return recForm(db.recebimentos.find(x => x.id === id));
      case "month-value": return monthValueForm(db.pix.find(x => x.id === id));
      case "edit-fixo": return fixoForm(db.recFixos.find(x => x.id === id));
      case "stop-fixo": {
        const f = db.recFixos.find(x => x.id === id);
        return confirmModal(`Parar o recebimento fixo de ${esc(f.cliente)}?`, "Ele deixa de aparecer nos próximos meses. O que já foi lançado continua.", () => {
          f.ativo = false; save(); render(); toast("Recebimento fixo parado.");
        }, "Parar");
      }
      case "edit-saldos": return saldosForm();
      case "new-mov": return movForm(el.dataset.tipo);
      case "edit-mov": return movForm(null, db.reserva.movimentos.find(x => x.id === id));
      case "del-mov": return confirmModal("Excluir movimento?", "Essa ação não pode ser desfeita.", () => { db.reserva.movimentos = db.reserva.movimentos.filter(x => x.id !== id); save(); render(); });

      case "toggle-pix": {
        const p = db.pix.find(x => x.id === id);
        const m = (db.pagamentos[mk] ||= {});
        if (m[id]) delete m[id];
        else {
          m[id] = { valor: pixValor(p, mk), data: mk === currentMonth() ? todayISO() : dateInMonth(mk, p.dia) };
          ui.pop = id;
        }
        save(); render();
        const t = totals(mk);
        if (m[id] && t.pixCount && t.pixCount === t.pixPagos) { confetti(); toast("Todos os pagamentos do mês feitos! 🎉"); }
        return;
      }
      case "toggle-avulso": {
        const a = db.avulsos.find(x => x.id === id);
        a.pagoEm = a.pagoEm ? null : todayISO();
        if (a.pagoEm) ui.pop = id;
        save(); render(); return;
      }
      case "toggle-fatura": {
        const c = db.cartoes.find(x => x.id === id);
        const input = $(`[data-id="${id}"] [data-action="fatura-valor"]`);
        const f = ((db.faturas[mk] ||= {})[id] ||= { valor: 0, pagoEm: null });
        if (input) f.valor = parseMoney(input.value);
        if (!f.pagoEm && !f.valor) { input?.focus(); return toast("Informe o valor da fatura antes.", "warn"); }
        f.pagoEm = f.pagoEm ? null : (mk === currentMonth() ? todayISO() : cardDates(c, mk).venc);
        save(); render();
        if (f.pagoEm) {
          const t = totals(mk);
          if (t.ccCount === t.ccPagos) { confetti(); toast("Todas as faturas pagas! 💳✨"); } else toast(`Fatura ${c.nome} paga.`);
        }
        return;
      }
      case "toggle-rec": {
        const r = db.recebimentos.find(x => x.id === id);
        r.recebidoEm = r.recebidoEm ? null : todayISO();
        save(); render();
        if (r.recebidoEm) { coinBurst(e); toast(`+ ${money(r.valor)} de ${r.cliente} 💰`); }
        return;
      }
      case "del-pix": {
        const p = db.pix.find(x => x.id === id);
        return confirmModal("Excluir pagamento recorrente?", `${esc(p.nome)} deixa de aparecer nos meses. O histórico do que já foi pago continua nos totais.`, () => {
          db.pix = db.pix.filter(x => x.id !== id); save(); render(); toast("Pagamento excluído.");
        });
      }
      case "del-avulso": return confirmModal("Excluir conta avulsa?", "Essa ação não pode ser desfeita.", () => { db.avulsos = db.avulsos.filter(x => x.id !== id); save(); render(); });
      case "del-card": {
        const c = db.cartoes.find(x => x.id === id);
        return confirmModal(`Excluir o cartão ${esc(c.nome)}?`, "As faturas lançadas desse cartão também serão removidas.", () => {
          db.cartoes = db.cartoes.filter(x => x.id !== id);
          Object.values(db.faturas).forEach(m => delete m[id]);
          save(); render(); toast("Cartão excluído.");
        });
      }
      case "del-rec": return confirmModal("Excluir recebimento?", "Essa ação não pode ser desfeita.", () => { db.recebimentos = db.recebimentos.filter(x => x.id !== id); save(); render(); });

      case "copy-key": {
        const p = db.pix.find(x => x.id === id);
        copyText(p.chave).then(() => {
          const box = $(`[data-id="${id}"] .key-box`);
          if (box) { box.classList.add("copied"); const old = box.textContent; box.textContent = "✓ chave copiada"; setTimeout(() => { box.textContent = old; box.classList.remove("copied"); }, 1300); }
          toast(`Chave de ${p.nome} copiada · ${money(pixValor(p, mk))}`);
        });
        return;
      }
      case "copy-pending": {
        const pend = activePix(mk).filter(p => !pixPago(p, mk)).sort((a, b) => a.dia - b.dia);
        if (!pend.length) return toast("Nenhum pagamento pendente. 🎉");
        const txt = `Pagamentos pendentes — ${monthName(mk)}\n\n` + pend.map(p => `• Dia ${pad(p.dia)} · ${p.nome} · ${money(pixValor(p, mk))}${p.chave ? `\n  ${p.tipoChave && p.tipoChave !== "—" ? p.tipoChave + ": " : ""}${p.chave}` : ""}`).join("\n") + `\n\nTotal: ${money(sum(pend, p => pixValor(p, mk)))}`;
        copyText(txt).then(() => toast(`Lista com ${pend.length} pendentes copiada.`));
        return;
      }
      case "seed": {
        const go2 = () => { db = normalize(seedData()); save(); ui.month = currentMonth(); go("painel"); toast("Dados de exemplo carregados. Apague em Ajustes quando quiser."); };
        if (db.pix.length || db.cartoes.length || db.recebimentos.length) return confirmModal("Substituir pelos dados de exemplo?", "Seus dados atuais serão apagados. Exporte um backup antes se precisar.", go2, "Substituir");
        return go2();
      }
      case "reset": return confirmModal("Apagar tudo?", "Todos os pagamentos, cartões e recebimentos serão apagados. Exporte um backup antes se precisar.", () => { const nome = db.settings.nome; db = EMPTY(); db.settings.nome = nome; save(); go("painel"); toast("Tudo apagado."); }, "Apagar tudo");
      case "export": {
        const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `aurum-backup-${todayISO()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        return toast("Backup exportado.");
      }
      case "import": return $("#import-file").click();
    }
  }

  function copyText(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt).catch(() => fallbackCopy(txt));
    return Promise.resolve(fallbackCopy(txt));
  }
  function fallbackCopy(txt) {
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* ignora */ }
    ta.remove();
  }

  // ---------- Toast ----------
  function toast(msg, type = "ok") {
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = (type === "warn" ? I.alert : I.check) + `<span>${esc(msg)}</span>`;
    $("#toasts").appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 3200);
  }

  // ---------- Efeitos ----------
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function countUp(root) {
    $$("[data-count]", root).forEach(el => {
      const target = +el.dataset.count;
      if (reduced || !target) { el.textContent = money(target); return; }
      const dur = 1100, t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 4);
        el.textContent = money(target * e);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // anéis e barras animam a partir do zero só na entrada da tela
    $$(".ring-anim", root).forEach(c => {
      const final = c.style.strokeDashoffset;
      c.style.transition = "none"; c.style.strokeDashoffset = c.style.getPropertyValue("--full");
      requestAnimationFrame(() => requestAnimationFrame(() => { c.style.transition = ""; c.style.strokeDashoffset = final; }));
    });
    $$(".prog-anim", root).forEach(b => {
      const w = b.style.width;
      b.style.transition = "none"; b.style.width = "0";
      requestAnimationFrame(() => requestAnimationFrame(() => { b.style.transition = ""; b.style.width = w; }));
    });
    $$(".chart-svg .bar", root).forEach(b => b.classList.add("bar"));
  }

  function updateSeg(root) {
    $$(".seg", root).forEach(seg => {
      const active = $("button.active", seg), thumb = $(".seg-thumb", seg);
      if (active && thumb) { thumb.style.left = active.offsetLeft + "px"; thumb.style.width = active.offsetWidth + "px"; }
    });
  }

  // Partículas conectadas no fundo
  function particles() {
    const cv = $("#particles"), ctx = cv.getContext("2d");
    let W, H, pts = [], mouse = { x: -999, y: -999 }, raf;
    const colors = ["212,168,67", "62,224,160", "232,220,196", "120,160,255"];
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .6, c: colors[Math.floor(Math.random() * colors.length)] }));
    };
    const step = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140) { p.x += dx / d * .8; p.y += dy / d * .8; }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) { ctx.strokeStyle = `rgba(212,168,67,${.14 * (1 - d / 130)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${p.c},.75)`; ctx.shadowColor = `rgba(${p.c},.9)`; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(step);
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden) step(); });
    step();
  }

  // Confete
  const confettiCanvas = $("#confetti");
  let confettiParts = [], confettiRaf = null;
  function confettiLoop() {
    const ctx = confettiCanvas.getContext("2d");
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParts = confettiParts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    for (const p of confettiParts) {
      p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life / 40);
      ctx.fillStyle = p.color;
      if (p.coin) { ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * Math.abs(Math.cos(p.rot * 2)) + 1, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#8a6420"; ctx.lineWidth = 1; ctx.stroke(); }
      else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (confettiParts.length) confettiRaf = requestAnimationFrame(confettiLoop);
    else { confettiRaf = null; ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
  }
  function launch(parts) {
    if (reduced) return;
    confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight;
    confettiParts.push(...parts);
    if (!confettiRaf) confettiLoop();
  }
  function confetti() {
    const colors = ["#f3d27a", "#d4a843", "#3ee0a0", "#e8dcc4", "#7ff0c0", "#ffffff", "#9ab8ff"];
    const parts = [];
    for (const side of [0, 1]) for (let i = 0; i < 90; i++) {
      parts.push({ x: side ? innerWidth : 0, y: innerHeight * .75, vx: (side ? -1 : 1) * (Math.random() * 12 + 5), vy: -(Math.random() * 16 + 8), g: .35, s: Math.random() * 9 + 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 180 + Math.random() * 60, color: colors[i % colors.length] });
    }
    launch(parts);
  }
  function coinBurst(e) {
    const x = e?.clientX ?? innerWidth / 2, y = e?.clientY ?? innerHeight / 2;
    launch(Array.from({ length: 28 }, () => ({ x, y, vx: (Math.random() - .5) * 10, vy: -(Math.random() * 10 + 5), g: .4, s: Math.random() * 4 + 5, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, life: 90 + Math.random() * 30, color: Math.random() > .3 ? "#f3d27a" : "#3ee0a0", coin: true })));
  }

  function ripple(e, btn) {
    const r = btn.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const sp = document.createElement("span");
    sp.className = "ripple";
    sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    btn.appendChild(sp);
    setTimeout(() => sp.remove(), 650);
  }

  function showTip(el, e) {
    const tip = $("#tooltip");
    let d; try { d = JSON.parse(el.dataset.tip); } catch { return; }
    if (d.in !== undefined) {
      const net = d.in - d.out;
      tip.innerHTML = `<div class="tt-title">${esc(d.t)}</div>
        <div class="tt-row"><span><i style="background:var(--chart-in)"></i>Entradas</span><b>${money(d.in)}</b></div>
        <div class="tt-row"><span><i style="background:var(--chart-out)"></i>Saídas pagas</span><b>${money(d.out)}</b></div>
        <div class="tt-row" style="margin-top:4px;padding-top:4px;border-top:1px solid var(--stroke-soft)"><span>Saldo</span><b style="color:${net < 0 ? "var(--coral)" : "var(--green-400)"}">${money(net)}</b></div>`;
    } else {
      tip.innerHTML = `<div class="tt-title" style="text-transform:none">${esc(d.t)}</div><div class="tt-row"><span>${Math.round(d.pct * 100)}% do total</span><b>${money(d.v)}</b></div>`;
    }
    tip.style.left = e.clientX + "px"; tip.style.top = e.clientY + "px";
    tip.classList.add("show");
  }

  // ---------- Dados de exemplo ----------
  function seedData() {
    const d = EMPTY();
    const cm = currentMonth();
    d.settings.nome = db.settings.nome;
    const pessoas = [
      ["Ana Souza", "Equipe", "ana.souza@email.com", "E-mail", 2800, 5],
      ["Bruno Lima", "Equipe", "(11) 98888-1234", "Celular", 3200, 5],
      ["Carla Mendes", "Equipe", "123.456.789-00", "CPF/CNPJ", 2500, 5],
      ["Diego Rocha", "Equipe", "d1f3a9e2-77b4-4c1a-9d0e-5a6b7c8d9e0f", "Aleatória", 1900, 10],
      ["Maria (diarista)", "Casa", "(11) 97777-4321", "Celular", 960, 10],
      ["Aluguel do escritório", "Aluguel", "imobiliaria@email.com", "E-mail", 4200, 8],
      ["Contador", "Serviços", "12.345.678/0001-90", "CPF/CNPJ", 650, 15],
      ["Mãe", "Família", "(11) 96666-0000", "Celular", 1200, 20],
    ];
    d.pix = pessoas.map(([nome, categoria, chave, tipoChave, valor, dia]) => ({ id: uid(), nome, categoria, chave, tipoChave, valor, dia, metodo: "Pix", ativo: true, inicio: addMonths(cm, -6) }));
    d.cartoes = [
      { id: uid(), nome: "Nubank", apelido: "Pessoal", final: "4821", bandeira: "Mastercard", fechamento: 3, vencimento: 10, cor: "roxo", limite: 12000 },
      { id: uid(), nome: "Itaú Personnalité", apelido: "Viagens", final: "1337", bandeira: "Visa", fechamento: 8, vencimento: 15, cor: "navy", limite: 25000 },
      { id: uid(), nome: "Inter", apelido: "Empresa", final: "9054", bandeira: "Mastercard", fechamento: 13, vencimento: 20, cor: "laranja", limite: 8000 },
      { id: uid(), nome: "C6 Carbon", apelido: "Assinaturas", final: "7710", bandeira: "Mastercard", fechamento: 20, vencimento: 27, cor: "grafite", limite: 15000 },
    ];
    const clientes = [["Studio Alfa", 9500], ["Construtora Beta", 14800], ["Loja Gama", 5200], ["Consultoria Delta", 7500], ["App Ômega", 11200]];
    const today = new Date().getDate();
    for (let i = -5; i <= 1; i++) {
      const mk = addMonths(cm, i);
      const past = i < 0;
      d.pagamentos[mk] = {};
      d.faturas[mk] = {};
      d.pix.forEach((p, k) => {
        const due = dateInMonth(mk, p.dia);
        if (past || (i === 0 && +p.dia < today - 1 && k < 5)) d.pagamentos[mk][p.id] = { valor: p.valor, data: due };
      });
      d.cartoes.forEach((c, k) => {
        const valor = Math.round((1800 + k * 900 + Math.random() * 2200) * 100) / 100;
        const venc = dateInMonth(mk, c.vencimento);
        if (i <= 0) d.faturas[mk][c.id] = { valor, pagoEm: past || (i === 0 && +c.vencimento < today && k < 2) ? venc : null };
      });
      clientes.forEach(([nome, base], k) => {
        if ((k + i) % 3 === 0 && k > 2) return;
        const day = 3 + ((k * 7) % 25);
        const previsto = dateInMonth(mk, day);
        const valor = Math.round(base * (0.8 + Math.random() * 0.5));
        const received = past ? !(i === -1 && k === 4) : i === 0 && day < today && k < 3;
        d.recebimentos.push({ id: uid(), cliente: nome, descricao: ["Projeto mensal", "Consultoria", "Manutenção", "Sprint", "Design"][k], valor, previsto, recebidoEm: received ? previsto : null, forma: "Pix" });
      });
    }
    d.avulsos.push(
      { id: uid(), descricao: "IPVA parcela", valor: 890.4, vencimento: dateInMonth(cm, 18), categoria: "Impostos", pagoEm: null },
      { id: uid(), descricao: "Revisão do carro", valor: 1350, vencimento: dateInMonth(cm, 7), categoria: "Carro", pagoEm: dateInMonth(cm, 7) },
      { id: uid(), descricao: "Dentista", valor: 420, vencimento: dateInMonth(addMonths(cm, -1), 12), categoria: "Saúde", pagoEm: dateInMonth(addMonths(cm, -1), 12) },
    );
    return d;
  }

  // ---------- Eventos globais ----------
  function bind() {
    document.addEventListener("click", e => {
      const btn = e.target.closest(".btn, .nav-item, .check");
      if (btn && !reduced) ripple(e, btn);

      const nav = e.target.closest("[data-view]");
      if (nav) return go(nav.dataset.view);
      const g = e.target.closest("[data-go]");
      if (g) return go(g.dataset.go);

      const segBtn = e.target.closest(".seg button");
      if (segBtn) {
        const key = segBtn.closest(".seg").dataset.seg;
        ui[key] = segBtn.dataset.val;
        return render();
      }
      const act = e.target.closest("[data-action]");
      if (act && act.dataset.action && act.tagName !== "INPUT") handleAction(act.dataset.action, act, e);
    });

    document.addEventListener("input", e => {
      if (e.target.id === "pix-search") {
        ui.pixSearch = e.target.value;
        const pos = e.target.selectionStart;
        render();
        const s = $("#pix-search"); s.focus(); s.setSelectionRange(pos, pos);
      }
      if (e.target.id === "set-nome") { db.settings.nome = e.target.value; save(); greet(); }
    });

    document.addEventListener("change", e => {
      if (e.target.dataset.action === "fatura-valor") {
        const id = e.target.closest("[data-id]").dataset.id;
        const f = ((db.faturas[ui.month] ||= {})[id] ||= { valor: 0, pagoEm: null });
        f.valor = parseMoney(e.target.value);
        save(); render(); toast("Valor da fatura salvo.");
      }
      if (e.target.id === "import-file") {
        const file = e.target.files[0];
        if (!file) return;
        file.text().then(txt => {
          const data = JSON.parse(txt);
          if (!data || typeof data !== "object" || !Array.isArray(data.pix)) throw new Error();
          confirmModal("Importar backup?", `Os dados atuais serão substituídos pelo arquivo ${esc(file.name)}.`, () => { db = normalize(data); save(); go("painel"); toast("Backup importado."); }, "Importar");
        }).catch(() => toast("Arquivo inválido.", "warn"));
        e.target.value = "";
      }
    });

    document.addEventListener("keydown", e => {
      if (e.target.matches?.("[data-action=fatura-valor]") && e.key === "Enter") e.target.blur();
      if (e.target.closest?.("input, textarea, select") || $(".modal-back")) return;
      if (e.key === "ArrowLeft") changeMonth(-1);
      if (e.key === "ArrowRight") changeMonth(1);
      if (e.key.toLowerCase() === "n") { e.preventDefault(); quickAdd(); }
      const k = { 1: "painel", 2: "pix", 3: "cartoes", 4: "receitas", 5: "reserva", 6: "ajustes" }[e.key];
      if (k) go(k);
    });

    $("#month-switch").addEventListener("click", e => {
      const b = e.target.closest("[data-month]");
      if (b) changeMonth(+b.dataset.month);
      if (e.target.closest("#month-label")) { ui.month = currentMonth(); render(true); }
    });
    $("#quick-add").addEventListener("click", quickAdd);

    // Holofote dos painéis, brilho do cursor e inclinação 3D dos cartões
    const glow = $(".cursor-glow");
    document.addEventListener("mousemove", e => {
      glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px";
      const panel = e.target.closest(".panel, .pay-item, .inc-item");
      if (panel) { const r = panel.getBoundingClientRect(); panel.style.setProperty("--mx", e.clientX - r.left + "px"); panel.style.setProperty("--my", e.clientY - r.top + "px"); }
      const scene = e.target.closest(".cc-scene");
      $$(".cc-scene .cc").forEach(cc => { if (!scene || !scene.contains(cc)) cc.style.transform = ""; });
      if (scene && !reduced) {
        const cc = $(".cc", scene), r = scene.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        cc.style.transform = `rotateY(${(px - .5) * 18}deg) rotateX(${(.5 - py) * 14}deg) translateZ(10px)`;
        cc.style.setProperty("--gx", px * 100 + "%"); cc.style.setProperty("--gy", py * 100 + "%");
      }
      const tipEl = e.target.closest("[data-tip]");
      if (tipEl) showTip(tipEl, e); else $("#tooltip").classList.remove("show");
    });

    addEventListener("hashchange", () => { const v = location.hash.slice(1); if (v && v !== ui.view) go(v); });
    addEventListener("resize", () => updateSeg($("#view")));
  }

  function changeMonth(n) {
    ui.month = addMonths(ui.month, n);
    const v = $("#view");
    v.animate([{ opacity: 0, transform: `translateX(${n * 30}px)` }, { opacity: 1, transform: "none" }], { duration: 400, easing: "cubic-bezier(.2,.8,.2,1)" });
    render();
    countUp(v);
  }

  function greet() {
    const h = new Date().getHours();
    const s = h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    $("#greeting").textContent = db.settings.nome ? `${s}, ${db.settings.nome}` : s;
  }

  function clock() {
    const d = new Date();
    $("#clock").textContent = `${WEEK[d.getDay()]} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function buildBottomNav() {
    const bn = $("#bottom-nav");
    bn.innerHTML = $$("#nav .nav-item").map(b => {
      const c = b.cloneNode(true);
      const badge = c.querySelector(".nav-badge");
      if (badge) { badge.dataset.badge = badge.id; badge.removeAttribute("id"); }
      if (c.dataset.view === "pix") c.querySelector("span").textContent = "Pagar";
      if (c.dataset.view === "receitas") c.querySelector("span").textContent = "Receber";
      return c.outerHTML;
    }).join("");
  }

  // ---------- Início ----------
  async function init() {
    buildBottomNav();
    bind();
    await load();
    updateStoragePill();
    greet();
    clock(); setInterval(clock, 1000);
    setInterval(greet, 60000);
    const v = location.hash.slice(1);
    ui.view = VIEWS[v] ? v : "painel";
    if (!reduced) particles();
    setTimeout(() => {
      $("#splash").classList.add("hide");
      render(true);
    }, reduced ? 0 : 1300);
    // se virar o mês com o app aberto, acompanha
    let lastMonth = currentMonth();
    setInterval(() => { const cm = currentMonth(); if (cm !== lastMonth) { if (ui.month === lastMonth) ui.month = cm; lastMonth = cm; render(); } }, 60000);
  }

  init();
})();
