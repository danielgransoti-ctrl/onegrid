/* ==========================================================================
   ONE GRID — Landing Page
   Configuração, idioma, interações e formulário de qualificação
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) CONFIGURAÇÃO — ajuste estes valores antes de publicar
   -------------------------------------------------------------------------- */
const SITE_CONFIG = {
  // Número do WhatsApp comercial, só dígitos, com DDI. Ex.: "5541999999999"
  whatsapp: "5541999999999",

  // E-mail que recebe as solicitações
  email: "contato@onegridoficial.com.br",

  // Endpoint que recebe o lead (RD Station, HubSpot, Zapier, Make, Formspree,
  // API própria…). Deixe "" para o site funcionar sem back-end: nesse caso o
  // lead é guardado no navegador e o cliente é levado ao WhatsApp já com o
  // resumo preenchido.
  endpoint: "",

  // Cabeçalhos extras do POST (ex.: { "Authorization": "Bearer ..." })
  endpointHeaders: {}
};

/* --------------------------------------------------------------------------
   2) IDIOMA
   -------------------------------------------------------------------------- */
const LANGS = ["en", "pt"];
const DEFAULT_LANG = "en";          // idioma padrão do site
const html = document.documentElement;

// O site SEMPRE abre em inglês. A troca para português vale só enquanto a
// pessoa está navegando; ao recarregar, volta para o padrão. O parâmetro
// ?lang=pt na URL força o português (útil para campanhas em português).
function detectLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q && LANGS.includes(q)) return q;
  return DEFAULT_LANG;
}

function t(key, lang) {
  const dict = window.I18N[lang || html.dataset.lang || DEFAULT_LANG];
  return (dict && dict[key]) !== undefined ? dict[key] : null;
}

function applyLang(lang) {
  const dict = window.I18N[lang];
  if (!dict) return;

  html.dataset.lang = lang;
  html.lang = lang === "pt" ? "pt-BR" : "en";

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const val = dict[el.dataset.i18n];
    if (val === undefined) return;
    if (el.tagName === "META") el.setAttribute("content", val);
    else if (el.tagName === "TITLE") document.title = val;
    else el.textContent = val;
  });

  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    el.dataset.i18nAttr.split(",").forEach(pair => {
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
    });
  });

  document.querySelectorAll(".lang__btn").forEach(b =>
    b.classList.toggle("is-on", b.dataset.lang === lang)
  );

  // Botão de envio guarda o rótulo atual (usado no estado "enviando…")
  const send = document.getElementById("btnSend");
  if (send && !send.disabled) send.textContent = dict["form.send"];

  syncContactLinks();
}

document.querySelectorAll(".lang__btn").forEach(btn =>
  btn.addEventListener("click", () => applyLang(btn.dataset.lang))
);

/* --------------------------------------------------------------------------
   3) LINKS DE CONTATO
   -------------------------------------------------------------------------- */
function waURL(text) {
  const msg = text || t("form.wa.intro") || "";
  return "https://wa.me/" + SITE_CONFIG.whatsapp + (msg ? "?text=" + encodeURIComponent(msg) : "");
}

function syncContactLinks() {
  const wa = waURL();
  ["waLink", "ftrWa", "doneWa"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.href = wa;
  });
  ["mailLink", "ftrMail"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = "mailto:" + SITE_CONFIG.email;
    if (id === "ftrMail") el.textContent = SITE_CONFIG.email;
  });
}

/* --------------------------------------------------------------------------
   4) HEADER / MENU
   -------------------------------------------------------------------------- */
const hdr = document.getElementById("hdr");
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const sticky = document.querySelector(".stickycta");

burger.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach(a =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  })
);

const formSection = document.getElementById("form");
function onScroll() {
  const y = window.scrollY;
  hdr.classList.toggle("is-stuck", y > 40);
  if (sticky) {
    const formTop = formSection.getBoundingClientRect().top;
    sticky.classList.toggle("is-on", y > window.innerHeight * 0.6 && formTop > window.innerHeight * 0.4);
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* --------------------------------------------------------------------------
   5) REVEAL ON SCROLL
   -------------------------------------------------------------------------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 60 + "ms";
  io.observe(el);
});

/* --------------------------------------------------------------------------
   6) BANNER — a sequencia de video avanca conforme a pessoa rola
   -------------------------------------------------------------------------- */
const hero = document.getElementById("hero");
if (hero) {
  const shots = [...hero.querySelectorAll(".hero__vid")];
  const lines = [...hero.querySelectorAll(".hero__lines p")];
  const heroIn = document.getElementById("heroIn");
  const heroHint = document.getElementById("heroHint");

  // Video pesa ~9 MB. Fica de fora em tela pequena, em conexao economica e
  // para quem pediu menos animacao — nesses casos a foto continua valendo.
  const telaGrande = window.matchMedia("(min-width: 900px)").matches;
  const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const economiaDados = navigator.connection && navigator.connection.saveData;

  const temVideo = shots.length > 0 && shots.every(v => v.dataset.src);

  if (!temVideo || !telaGrande || menosMovimento || economiaDados) {
    hero.classList.add("is-static");
    shots.forEach(v => v.remove());
  } else {
    hero.classList.add("has-video");
    shots.forEach(v => { v.src = v.dataset.src; v.load(); });

    // Os clipes nao tocam sozinhos: a rolagem e que avanca (descendo) ou
    // retrocede (subindo) a cena. Sao 20s de video distribuidos ao longo da
    // secao. Varios navegadores so renderizam um seek depois que o video foi
    // tocado ao menos uma vez, entao damos um play/pause de partida.
    const acordar = v => {
      if (v.dataset.pronto) return;
      v.dataset.pronto = "1";
      const t = v.play();
      if (t) t.then(() => v.pause()).catch(() => { delete v.dataset.pronto; });
      else v.pause();
    };
    const acordarTodos = () => shots.forEach(acordar);
    acordarTodos();
    ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach(ev =>
      window.addEventListener(ev, acordarTodos, { once: true, passive: true }));

    const duracoes = [6.04, 6.04, 8.04];   // lidas dos proprios arquivos
    const total = duracoes.reduce((a, b) => a + b, 0);
    const INICIO = 0.06;                   // antes disso, so o titulo
    let ultimo = -1;

    const desenhar = () => {
      const alcance = hero.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / alcance));

      const rodando = p > INICIO + 0.06;
      heroIn.classList.toggle("is-off", rodando);
      heroHint.classList.toggle("is-off", p > INICIO);
      hero.classList.toggle("is-playing", rodando);

      // posicao dentro dos 20s, e em qual dos tres clipes ela cai
      const tempo = Math.max(0, (p - INICIO) / (1 - INICIO)) * total;
      let soma = 0, atual = 0, dentro = 0;
      for (let i = 0; i < duracoes.length; i++) {
        if (tempo <= soma + duracoes[i] || i === duracoes.length - 1) {
          atual = i; dentro = tempo - soma; break;
        }
        soma += duracoes[i];
      }

      if (atual !== ultimo) {
        shots.forEach((v, i) => v.classList.toggle("is-on", i === atual));
        ultimo = atual;
      }

      const v = shots[atual];
      if (!v.paused) v.pause();
      const alvo = Math.max(0, Math.min(dentro, duracoes[atual] - 0.05));
      if (v.readyState >= 1 && Math.abs(v.currentTime - alvo) > 0.03) v.currentTime = alvo;

      // As frases so entram no ultimo clipe, o de dentro do cockpit. Nos dois
      // primeiros — o capacete e a pista pelo visor — o video fica limpo.
      const inicioFrases = soma / total * (1 - INICIO) + INICIO;
      const faixa = atual < duracoes.length - 1
        ? 0
        : Math.max(0, Math.min(1, (p - inicioFrases) / (0.97 - inicioFrases)));
      const ativa = faixa <= 0 || faixa >= 1 ? -1 : Math.min(lines.length - 1, Math.floor(faixa * lines.length));
      lines.forEach((l, i) => l.classList.toggle("is-on", i === ativa));
    };

    window.addEventListener("scroll", desenhar, { passive: true });
    window.addEventListener("resize", desenhar);
    shots.forEach(v => v.addEventListener("loadeddata", desenhar, { once: true }));
    desenhar();
  }
}

/* --------------------------------------------------------------------------
   7) RAIO-X — a carenagem fica transparente onde o cursor passa
   -------------------------------------------------------------------------- */
const xray = document.getElementById("xrayFig");
if (xray) {
  const raio = () => Math.max(78, Math.min(160, xray.clientWidth * 0.125));
  const mover = (x, y) => {
    const r = xray.getBoundingClientRect();
    xray.style.setProperty("--mx", (x - r.left) + "px");
    xray.style.setProperty("--my", (y - r.top) + "px");
    xray.style.setProperty("--mr", raio() + "px");
    xray.classList.add("is-open");
  };
  xray.addEventListener("mousemove", e => mover(e.clientX, e.clientY));
  xray.addEventListener("mouseleave", () => {
    xray.style.setProperty("--mr", "0px");
    xray.classList.remove("is-open");
  });
  // no celular nao ha cursor: mostra o interior ao tocar
  xray.addEventListener("touchmove", e => {
    const t = e.touches[0];
    if (t) mover(t.clientX, t.clientY);
  }, { passive: true });
  xray.addEventListener("touchend", () => {
    xray.style.setProperty("--mr", "0px");
    xray.classList.remove("is-open");
  });
}

/* --------------------------------------------------------------------------
   8) ANATOMIA — pontos interativos no corte do simulador
   -------------------------------------------------------------------------- */
const hots = document.querySelectorAll(".hot");
const items = document.querySelectorAll(".anatomy__list li");

function setHot(n) {
  hots.forEach(h => h.classList.toggle("is-on", h.dataset.hot === String(n)));
  items.forEach(li => li.classList.toggle("is-on", li.dataset.item === String(n)));
}
hots.forEach(h => {
  h.addEventListener("click", () => setHot(h.dataset.hot));
  h.addEventListener("mouseenter", () => setHot(h.dataset.hot));
});
items.forEach(li => {
  li.addEventListener("click", () => setHot(li.dataset.item));
  li.addEventListener("mouseenter", () => setHot(li.dataset.item));
});
setHot(1);

/* --------------------------------------------------------------------------
   9) FORMULÁRIO — etapas, validação e envio
   -------------------------------------------------------------------------- */
const form = document.getElementById("leadForm");
const steps = [...document.querySelectorAll(".fstep")];
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnSend = document.getElementById("btnSend");
const progBar = document.getElementById("progBar");
const progNow = document.getElementById("progNow");
const consentErr = document.getElementById("consentErr");
const done = document.getElementById("formDone");
let step = 0;

function showStep(i) {
  step = Math.max(0, Math.min(steps.length - 1, i));
  steps.forEach((s, n) => s.classList.toggle("is-on", n === step));
  progBar.style.width = ((step + 1) / steps.length) * 100 + "%";
  progNow.textContent = step + 1;
  btnPrev.hidden = step === 0;
  btnNext.hidden = step === steps.length - 1;
  btnSend.hidden = step !== steps.length - 1;
  const first = steps[step].querySelector("input,select,textarea");
  if (first && window.innerWidth > 760) first.focus({ preventScroll: true });
}

function markError(field, on) {
  const wrap = field.closest(".field");
  if (wrap) wrap.classList.toggle("has-err", on);
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
}
function validPhone(v) {
  return v.replace(/\D/g, "").length >= 8;
}

function validateStep(i) {
  let ok = true;
  const scope = steps[i];

  scope.querySelectorAll("input,select,textarea").forEach(f => {
    if (f.type === "radio" || f.type === "checkbox") return;
    if (!f.required) return;
    let bad = !f.value.trim();
    if (!bad && f.type === "email") bad = !validEmail(f.value);
    if (!bad && f.type === "tel") bad = !validPhone(f.value);
    markError(f, bad);
    if (bad && ok) f.focus();
    if (bad) ok = false;
  });

  const radios = scope.querySelectorAll('input[type="radio"][required]');
  if (radios.length) {
    const group = radios[0].name;
    const chosen = scope.querySelector(`input[name="${group}"]:checked`);
    markError(radios[0], !chosen);
    if (!chosen) ok = false;
  }

  const consent = scope.querySelector("#consent");
  if (consent) {
    const bad = !consent.checked;
    consentErr.classList.toggle("is-on", bad);
    if (bad) ok = false;
  }

  return ok;
}

btnNext.addEventListener("click", () => {
  if (validateStep(step)) showStep(step + 1);
});
btnPrev.addEventListener("click", () => showStep(step - 1));

form.querySelectorAll("input,select,textarea").forEach(f => {
  f.addEventListener("input", () => markError(f, false));
  f.addEventListener("change", () => {
    markError(f, false);
    if (f.id === "consent") consentErr.classList.remove("is-on");
  });
});

/* --- Máscara leve de telefone (apenas para o padrão brasileiro) --- */
const tel = document.getElementById("telefone");
tel.addEventListener("input", () => {
  if (html.dataset.lang !== "pt") return;
  let d = tel.value.replace(/\D/g, "").slice(0, 11);
  if (d.length > 6) tel.value = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  else if (d.length > 2) tel.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  else tel.value = d;
});

/* --- Monta o payload --- */
function collect() {
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v, k) => { data[k] = String(v).trim(); });

  const params = new URLSearchParams(location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"]
    .forEach(k => { if (params.get(k)) data[k] = params.get(k); });

  data.idioma = html.dataset.lang;
  data.pagina = location.href;
  data.enviado_em = new Date().toISOString();
  return data;
}

function summaryText(d) {
  const L = html.dataset.lang;
  const lines = L === "pt"
    ? [
        t("form.wa.intro"), "",
        "Nome: " + (d.nome_completo || "-"),
        "E-mail: " + (d.email || "-"),
        "Telefone: " + (d.telefone || "-"),
        "Cidade/País: " + [d.cidade, d.pais].filter(Boolean).join(" / "),
        "Profissão: " + (d.profissao || "-"),
        "Perfil: " + (d.perfil || "-"),
        "Local de instalação: " + (d.local_instalacao || "-"),
        "Simulador hoje: " + (d.simulador_atual || "-"),
        "Investimento: " + (d.investimento || "-"),
        "Prazo: " + (d.prazo || "-"),
        d.mensagem ? "Mensagem: " + d.mensagem : ""
      ]
    : [
        t("form.wa.intro"), "",
        "Name: " + (d.nome_completo || "-"),
        "E-mail: " + (d.email || "-"),
        "Phone: " + (d.telefone || "-"),
        "City/Country: " + [d.cidade, d.pais].filter(Boolean).join(" / "),
        "Profession: " + (d.profissao || "-"),
        "Profile: " + (d.perfil || "-"),
        "Install location: " + (d.local_instalacao || "-"),
        "Current simulator: " + (d.simulador_atual || "-"),
        "Investment: " + (d.investimento || "-"),
        "Timeline: " + (d.prazo || "-"),
        d.mensagem ? "Message: " + d.mensagem : ""
      ];
  return lines.filter(l => l !== "").join("\n");
}

function storeLocally(d) {
  try {
    const all = JSON.parse(localStorage.getItem("og_leads") || "[]");
    all.push(d);
    localStorage.setItem("og_leads", JSON.stringify(all));
  } catch (e) { /* silencioso */ }
}

form.addEventListener("submit", async ev => {
  ev.preventDefault();
  if (!validateStep(step)) return;

  const data = collect();
  const label = btnSend.textContent;
  btnSend.disabled = true;
  btnSend.textContent = t("form.sending") || "…";

  if (SITE_CONFIG.endpoint) {
    try {
      await fetch(SITE_CONFIG.endpoint, {
        method: "POST",
        headers: Object.assign({ "Content-Type": "application/json" }, SITE_CONFIG.endpointHeaders),
        body: JSON.stringify(data)
      });
    } catch (e) {
      storeLocally(data);
    }
  } else {
    storeLocally(data);
  }

  btnSend.disabled = false;
  btnSend.textContent = label;

  const doneWa = document.getElementById("doneWa");
  if (doneWa) doneWa.href = waURL(summaryText(data));

  form.hidden = true;
  done.hidden = false;
  done.scrollIntoView({ behavior: "smooth", block: "center" });

  if (window.dataLayer) window.dataLayer.push({ event: "lead_form_submit" });
});

/* --------------------------------------------------------------------------
   10) BOOT
   -------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
showStep(0);
applyLang(detectLang());
