"use strict";
// Ferro — plano de força A/B com progressão de carga. Tudo fica neste navegador (localStorage).
// Ordem: 1. configuração (edite aqui)  2. dados  3. contas  4. tela  5. sessão  6. cópia de segurança  7. cronômetro
// 8. abas e início. A tela é montada pelo DOM: o que vem de uma cópia importada entra sempre como texto, nunca como HTML.

/* ========================================================= 1. CONFIGURAÇÃO — edite aqui */
const BARRA = 20;
const ANILHAS = [25, 20, 15, 10, 5, 2, 1];

// s = séries; inc = aumento (kg) quando todas as séries batem a meta; shared = o mesmo nos treinos A e B;
// reps/goal = repetições pedidas e a meta (padrão 5); noProg = sem progressão automática.
const EX = {
  squat: { n: "Agachamento livre", s: 3, inc: 4, shared: 1 },
  bench: { n: "Supino reto", s: 3, inc: 2 },
  row: { n: "Remada curvada", s: 3, inc: 2 },
  ohp: { n: "Desenvolvimento militar", s: 3, inc: 2 },
  dead: { n: "Levantamento terra", s: 1, inc: 4 },
  hip: { n: "Elevação pélvica", s: 2, inc: 4, reps: "10-12", goal: 10, noProg: 1 },
};
const A = ["squat", "bench", "row"];
const B = ["squat", "ohp", "dead", "hip"];

const PADRAO = {
  loads: { squat: 108, bench: 74, row: 88, ohp: 52, dead: 174, hip: 80 },
  fails: {}, floor: { bench: 70 }, next: "A", log: [],
};
const PRANCHA = { min: 30, max: 45 };

/* ========================================================= 2. DADOS */
const CHAVE = "forca.v2";   // a mesma de antes: o histórico continua

// Confere uma cópia (salva ou importada): cargas de exercícios conhecidos, números de verdade, sessões com o formato certo.
function valido(d) {
  const numero = (v) => Number.isFinite(v) && v >= 0 && v <= 1000;
  if (!d || typeof d !== "object" || !d.loads || typeof d.loads !== "object") return false;
  if (!Object.entries(d.loads).every(([k, v]) => EX[k] && numero(v))) return false;
  if (d.next !== undefined && !["A", "B"].includes(d.next)) return false;
  if (d.log !== undefined && !Array.isArray(d.log)) return false;
  return (d.log || []).every((s) => s && ["A", "B"].includes(s.t) && typeof s.d === "string" && s.ex && typeof s.ex === "object"
    && Object.entries(s.ex).every(([k, v]) => EX[k] && v && numero(v.w) && Array.isArray(v.reps) && v.reps.every(numero))
    && Array.isArray(s.msg) && s.msg.every((m) => typeof m === "string"));
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (valido(salvo)) return { ...structuredClone(PADRAO), ...salvo };
  } catch { /* estragado: volta ao padrão */ }
  return structuredClone(PADRAO);
}
let S = carregar();

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(S));
  } catch {
    alert("Não deu para salvar neste navegador (armazenamento cheio ou bloqueado).");
  }
}

/* ========================================================= 3. CONTAS */
const par = (kg) => Math.max(BARRA, Math.round(kg / 2) * 2);   // carga montável (de 2 em 2 kg)
const meta = (k) => EX[k].goal || 5;
const lista = () => (S.next === "A" ? A : B);

// Anilhas de cada lado da barra: "25 + 15 + 2×2 por lado".
function anilhas(total) {
  let lado = (total - BARRA) / 2;
  if (lado < 0) return "carga menor que a barra";
  if (lado === 0) return "barra vazia";
  const partes = [];
  for (const a of ANILHAS) {
    const n = Math.floor(lado / a);
    if (n) { partes.push(n > 1 ? `${n}×${a}` : `${a}`); lado = +(lado - n * a).toFixed(2); }
  }
  return (lado > 0.01 ? "⚠ " : "") + partes.join(" + ") + " por lado";
}

const aquecimento = (kg) => [0.28, 0.5, 0.7, 0.85].map((f, i) => `${par(kg * f)} kg × ${i < 2 ? 5 : 3}`);

/* ========================================================= 4. TELA */
const $ = (s) => document.querySelector(s);
function el(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nome.startsWith("on")) no.addEventListener(nome.slice(2), valor);
    else if (nome === "class") no.className = valor;
    else no.setAttribute(nome, valor === true ? "" : valor);
  }
  no.append(...filhos.flat().filter((f) => f !== null && f !== undefined && f !== false));
  return no;
}

function cartaoDoExercicio(k) {
  const e = EX[k], kg = S.loads[k], falhou = S.fails[k] || 0;
  return el("article", { class: "cartao" },
    el("h2", {}, e.n, e.shared ? el("span", { class: "nos-dois", title: "O mesmo nos treinos A e B" }, "A/B") : null),
    el("p", { class: "carga" }, String(kg), el("small", {}, " kg")),
    el("p", { class: "meta" }, `${e.s} × ${e.reps || 5} repetições`, falhou ? el("span", { class: "alerta" }, " · 1ª falha registrada") : null),
    el("p", { class: "anilhas" }, anilhas(kg)),
    el("details", { class: "aquecimento" }, el("summary", {}, "Aquecimento"),
      el("ol", {}, aquecimento(kg).map((t) => el("li", {}, t)))),
    el("div", { class: "series" }, Array.from({ length: e.s }, (_, i) => el("label", {}, `Série ${i + 1}`,
      el("input", { type: "number", inputmode: "numeric", min: 0, max: 100, id: `r_${k}_${i}`, placeholder: String(e.reps || 5) })))));
}

function desenhar() {
  $("#titulo").textContent = `Treino ${S.next} · sessão ${S.log.length + 1}`;
  $("#subtitulo").textContent = `${lista().length} exercícios · descanso de 2 a 3 min`;
  $("#trocar").textContent = `Trocar para o Treino ${S.next === "A" ? "B" : "A"}`;
  $("#cartoes").replaceChildren(...lista().map(cartaoDoExercicio));
  desenharHistorico();
  $("#json").value = JSON.stringify(S, null, 1);
}

const corDaMensagem = (m) => (m.startsWith("✔") ? "ok" : m.startsWith("↺") ? "atencao" : "perigo");
function desenharHistorico() {
  const h = $("#historico");
  if (!S.log.length) { h.replaceChildren(el("p", { class: "nota" }, "Nenhuma sessão registrada ainda.")); return; }
  h.replaceChildren(...S.log.map((s, i) => el("div", { class: "registro" },
    el("p", {}, el("b", {}, `Treino ${s.t}`), el("span", { class: "data" }, ` · ${s.d.split("-").reverse().join("/")}`)),
    el("ul", {}, Object.entries(s.ex).map(([k, v]) => el("li", {}, `${EX[k]?.n || k}: ${v.w} kg — ${v.reps.join(" / ")}`))),
    s.msg.map((m) => el("p", { class: `msg ${corDaMensagem(m)}` }, m)),
    i === 0 ? el("button", { type: "button", class: "botao pequeno", onclick: desfazer }, "Desfazer esta sessão") : null)));
}

/* ========================================================= 5. SESSÃO (regras de progressão) */
function encerrar() {
  const ks = lista(), ex = {}, msg = [], antes = { loads: { ...S.loads }, fails: { ...S.fails } };
  const reps = {};
  for (const k of ks) {   // primeiro confere tudo: faltando reps, nada muda
    reps[k] = Array.from({ length: EX[k].s }, (_, i) => Number($(`#r_${k}_${i}`).value || 0));
    if (reps[k].every((r) => !r)) { alert(`Preencha as repetições de ${EX[k].n}.`); return; }
  }
  for (const k of ks) {
    const e = EX[k];
    ex[k] = { w: S.loads[k], reps: reps[k] };
    if (e.noProg) { msg.push(`↺ ${e.n}: mantém ${S.loads[k]} kg (ajuste manual)`); continue; }
    if (reps[k].every((r) => r >= meta(k))) {
      S.fails[k] = 0;
      const nova = S.loads[k] + e.inc;
      msg.push(`✔ ${e.n}: ${S.loads[k]} → ${nova} kg`);
      S.loads[k] = nova;
    } else if ((S.fails[k] || 0) === 0) {
      S.fails[k] = 1;
      msg.push(`↺ ${e.n}: mantém ${S.loads[k]} kg (1ª falha)`);
    } else {
      S.fails[k] = 0;
      const piso = S.floor[k] || BARRA;
      const nova = Math.max(piso, Math.floor(S.loads[k] * 0.9 / 2) * 2);   // deload de 10%
      msg.push(`↓ ${e.n}: deload ${S.loads[k]} → ${nova} kg${nova === piso ? " (piso)" : ""}`);
      S.loads[k] = nova;
    }
  }
  S.log.unshift({ t: S.next, d: new Date().toLocaleDateString("sv-SE"), ex, msg, prev: antes });
  S.next = S.next === "A" ? "B" : "A";
  salvar();
  desenhar();
  alert(`Sessão registrada\n\n${msg.join("\n")}\n\nPróximo: Treino ${S.next}`);
}

function desfazer() {
  if (!S.log.length || !confirm("Desfazer a última sessão? As cargas voltam ao que eram antes dela.")) return;
  const s = S.log.shift();
  if (s.prev) { S.loads = s.prev.loads; S.fails = s.prev.fails; }
  S.next = s.t;
  salvar();
  desenhar();
}

function trocar() {
  S.next = S.next === "A" ? "B" : "A";
  salvar();
  desenhar();
}

/* ========================================================= 6. CÓPIA DE SEGURANÇA */
function copiar() {
  navigator.clipboard.writeText($("#json").value).then(() => alert("Cópia copiada. Guarde num lugar seguro."),
    () => { $("#json").select(); alert("Não deu para copiar sozinho: o texto ficou selecionado, copie com o dedo."); });
}

function importar() {
  let d;
  try { d = JSON.parse($("#importar").value); } catch { d = null; }
  if (!valido(d)) { alert("Esta cópia não está no formato do Ferro. Nada foi alterado."); return; }
  if (!confirm("Substituir os dados de agora por esta cópia?")) return;
  S = { ...structuredClone(PADRAO), ...d };
  salvar();
  desenhar();
  $("#importar").value = "";
  alert("Importado.");
}

function zerar() {
  if (!confirm("Apagar TUDO (histórico e cargas) e voltar às cargas iniciais?")) return;
  localStorage.removeItem(CHAVE);
  S = carregar();
  desenhar();
}

/* ========================================================= 7. CRONÔMETRO (descanso ↓ / prancha ↑) */
// Conta pelo relógio do aparelho (hora de início), não "um segundo por vez": com a tela bloqueada o navegador
// desacelera os temporizadores, e o descanso de 3:00 viraria mais. Assim o tempo é sempre o certo.
const Cronometro = {
  modo: "descanso", preset: 180, t: 180, rodando: false, inicio: 0, base: 0, id: null, avisouMin: false,

  formatar: (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`,

  pintar(acabou = false) {
    $("#relogio").textContent = this.formatar(this.t);
    $("#relogio").className = acabou ? "acabou" : this.rodando ? "rodando" : "";
    $("#rotulo").textContent = this.modo === "prancha" ? `prancha · meta ${PRANCHA.min} a ${PRANCHA.max} s` : "descanso";
    $("#iniciar").textContent = this.rodando ? "Pausar" : "Iniciar";
  },

  escolher(v) {
    this.parar();
    if (v === "prancha") { this.modo = "prancha"; this.t = 0; } else { this.modo = "descanso"; this.preset = Number(v); this.t = this.preset; }
    for (const b of document.querySelectorAll(".escolha button")) b.classList.toggle("ligado", b.dataset.tempo === v);
    this.pintar();
  },

  alternar() { if (this.rodando) this.parar(); else this.comecar(); },

  comecar() {
    this.rodando = true;
    ligarSom();
    this.inicio = Date.now();
    this.base = this.t;   // de onde volta a contar (pausar e continuar não perde nada)
    this.avisouMin = this.modo === "prancha" && this.t >= PRANCHA.min;
    this.id = setInterval(() => this.passo(), 250);
    this.pintar();
  },

  passo() {
    const passados = Math.floor((Date.now() - this.inicio) / 1000);
    if (this.modo === "descanso") {
      this.t = Math.max(0, this.base - passados);
      if (this.t === 0) {
        this.parar(); alarme(3); this.pintar(true);
        setTimeout(() => { if (!this.rodando) { this.t = this.preset; this.pintar(); } }, 2500);
        return;
      }
    } else {
      this.t = this.base + passados;
      if (!this.avisouMin && this.t >= PRANCHA.min) { this.avisouMin = true; alarme(1); }
      if (this.t >= PRANCHA.max) { this.t = PRANCHA.max; this.parar(); alarme(3); this.pintar(true); return; }
    }
    this.pintar();
  },

  parar() { clearInterval(this.id); this.rodando = false; this.pintar(); },
  reiniciar() { this.parar(); this.t = this.modo === "prancha" ? 0 : this.preset; this.pintar(); },
};

// Som e vibração (o som só liga depois de um toque: regra dos navegadores).
let audio = null;
function ligarSom() {
  if (!audio) try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* sem som */ }
  audio?.resume?.();
}
function bipe(freq = 880, ms = 140, depois = 0) {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + depois;
  o.type = "sine"; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000);
  o.connect(g).connect(audio.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
}
function alarme(n) {
  for (let i = 0; i < n; i++) bipe(n === 1 ? 660 : 880, 150, i * 0.25);
  navigator.vibrate?.(n === 1 ? [200] : [200, 120, 200, 120, 200]);
}

// Tela acesa durante o treino (nem todo navegador deixa).
let trava = null;
async function telaAcesa(ligar) {
  try {
    if (ligar) {
      trava = await navigator.wakeLock.request("screen");
      trava.onrelease = () => { trava = null; };
    } else { await trava?.release(); trava = null; }
  } catch {
    $("#telaAcesa").checked = false;
    alert("Este navegador não deixa manter a tela acesa.");
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && $("#telaAcesa").checked && !trava) telaAcesa(true);
  if (document.visibilityState === "visible" && Cronometro.rodando) Cronometro.passo();   // volta já no tempo certo
});

/* ========================================================= 8. ABAS E INÍCIO */
function abrirAba(nome) {
  for (const b of document.querySelectorAll('[role="tab"]')) b.setAttribute("aria-selected", String(b.dataset.aba === nome));
  for (const s of document.querySelectorAll(".aba")) s.classList.toggle("ativa", s.id === nome);
  window.scrollTo(0, 0);
}

for (const b of document.querySelectorAll('[role="tab"]')) b.addEventListener("click", () => abrirAba(b.dataset.aba));
$("#encerrar").addEventListener("click", encerrar);
$("#trocar").addEventListener("click", trocar);
$("#copiar").addEventListener("click", copiar);
$("#botaoImportar").addEventListener("click", importar);
$("#zerar").addEventListener("click", zerar);
$("#telaAcesa").addEventListener("change", (e) => telaAcesa(e.target.checked));
$("#iniciar").addEventListener("click", () => Cronometro.alternar());
$("#zerarTempo").addEventListener("click", () => Cronometro.reiniciar());
for (const b of document.querySelectorAll(".escolha button")) b.addEventListener("click", () => Cronometro.escolher(b.dataset.tempo));

desenhar();
Cronometro.pintar();
