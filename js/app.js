/* ===== CÓDIGO ===== */
const fm = (m) =>
  String(Math.floor(m / 60)).padStart(2, "0") +
  ":" +
  String(m % 60).padStart(2, "0");
const WA = CONFIG.whatsapp.replace(/\D/g, "");
/* ===== NÚMERO DO PEDIDO: reinicia em #001 a cada dia de funcionamento (a partir do horário de abertura) ===== */
function diaLoja() {
  const d = new Date(Date.now() - CONFIG.horario.abre * 60000),
    p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function lerSeq() {
  try {
    const s = JSON.parse(localStorage.getItem("pedSeq") || "null");
    if (s && s.d === diaLoja()) return s.n;
  } catch (e) {}
  return 0;
}
function proxPed() {
  return lerSeq() + 1;
}
function gravaPed() {
  const n = lerSeq() + 1;
  try {
    localStorage.setItem("pedSeq", JSON.stringify({ d: diaLoja(), n }));
  } catch (e) {}
  return n;
}
const fmPed = (n) => "#" + String(n).padStart(3, "0");
function sz() {
  const h = document.querySelector(".top").offsetHeight,
    r = document.documentElement.style;
  r.setProperty("--th", h + "px");
  r.scrollPaddingTop = h + $("chips").offsetHeight + 6 + "px";
}
let dp = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  dp = e;
});
function pwaX() {
  $("pwa").style.display = "none";
  try {
    localStorage.setItem("pwaX", "1");
  } catch (e) {}
}
function pwaInit() {
  if (matchMedia("(display-mode:standalone)").matches || navigator.standalone)
    return;
  try {
    if (localStorage.getItem("pwaX")) return;
  } catch (e) {}
  setTimeout(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    $("pwt").textContent = ios
      ? "📲 Salve na tela inicial: toque em Compartilhar › Adicionar à Tela de Início."
      : "📲 Salve na tela inicial: menu ⋮ do navegador › Instalar app ou Adicionar à tela inicial.";
    if (dp) {
      $("pwi").classList.remove("hide");
      $("pwi").onclick = () => {
        dp.prompt();
        pwaX();
      };
    }
    $("pwa").style.display = "flex";
    setTimeout(() => {
      $("pwa").style.display = "none";
    }, 12e3);
  }, 2500);
}
const $ = (id) => document.getElementById(id),
  R = (v) => "R$ " + v.toFixed(2).replace(".", ","),
  H = (s) =>
    String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
let uid = 0,
  cart = [],
  cur = null,
  tipo = "entrega",
  pag = "";
const im = (u) => u || "";
function toast(t) {
  const e = $("toast");
  e.textContent = t;
  e.classList.add("show");
  clearTimeout(e._t);
  e._t = setTimeout(() => e.classList.remove("show"), 1800);
}
function aberto() {
  const d = new Date(),
    n = d.getHours() * 60 + d.getMinutes(),
    a = CONFIG.horario.abre,
    f = CONFIG.horario.fecha;
  return a <= f ? n >= a && n < f : n >= a || n < f;
}
function status() {
  const o = aberto(),
    e = $("st");
  e.className = "st " + (o ? "on" : "off");
  e.textContent = o ? "● Aberto agora" : "● Fechado";
}
function init() {
  const C = CONFIG;
  if (C.areaLoja === false) $("fL").classList.add("hide");
  if (C.logo) {
    const l = document.createElement("img");
    l.src = C.logo;
    l.alt = C.nome;
    l.className = "logo-img";
    l.onerror = () => {
      $("bE").textContent = C.emoji;
    };
    $("bE").appendChild(l);
  } else $("bE").textContent = C.emoji;
  $("bN").textContent = C.nome;
  $("hN").textContent = C.nome;
  $("hT").textContent = C.tagline;
  $("fN").textContent = C.nome;
  $("fT").textContent = C.tagline;
  $("fC").textContent =
    "© " +
    new Date().getFullYear() +
    " " +
    C.nome +
    ". " +
    (C.direitos || "Todos os direitos reservados.");
  document.title = C.nome + " · Cardápio";
  $("hk").textContent = "🔥 " + C.subtitulo;
  $("hP").innerHTML =
    `<span>🕒 ${fm(C.horario.abre)} às ${fm(C.horario.fecha)}</span><span>🛵 Entrega ${R(C.taxaEntrega)}</span><span>⏱ ${C.tempoEntrega}</span>`;
  $("fI").innerHTML =
    `📍 ${H(C.endereco)}<br>🕒 ${fm(C.horario.abre)} às ${fm(C.horario.fecha)}<br>📞 +${C.whatsapp}`;
  if (C.promo.ativo && C.promo.texto) {
    $("pt").textContent = C.promo.texto;
    const p = $("promo");
    p.style.background = C.promo.cor;
    p.style.display = "flex";
  }
  const lk = () => {
    document.body.style.overflow = document.querySelector(".ov.show")
      ? "hidden"
      : "";
  };
  document
    .querySelectorAll(".ov")
    .forEach((o) =>
      new MutationObserver(lk).observe(o, {
        attributes: true,
        attributeFilter: ["class"],
      }),
    );
  let h = "",
    c = "",
    n = 0;
  CATS.forEach(([k, t]) => {
    c += `<button class="chip" data-k="${k}" onclick="document.getElementById('s-${k}').scrollIntoView()">${t}</button>`;
    h += `<section id="s-${k}"><h2>${t}</h2><div class="${k === "burger" || k === "combo" ? "grid" : ""}">`;
    ITEMS.filter((i) => i.tipo === k).forEach((i) => {
      h += card(i, n++);
    });
    h += "</div></section>";
  });
  $("menu").innerHTML = h;
  $("chips").innerHTML = c;
  status();
  setInterval(status, 6e4);
  spy();
  sz();
  addEventListener("resize", sz);
  document.fonts && document.fonts.ready.then(sz);
  pwaInit();
}
function card(i, n) {
  const s = `style="--i:${n}"`,
    b = i.badge
      ? `<span class="bdg${i.gold ? " gold" : ""}">${H(i.badge)}</span>`
      : "";
  if (i.tipo === "burger")
    return `<article class="card" ${s} onclick="openItem('${i.id}')"><div class="ph"><img src="${im(i.img)}" alt="${H(i.nome)}" loading="lazy">${b}</div><div class="cb"><h3>${H(i.nome)}</h3><p>${H(i.desc)}</p><div class="row"><span class="pr">${R(i.preco)}</span><span class="plus">+</span></div></div></article>`;
  if (i.tipo === "combo")
    return `<article class="combo" ${s} onclick="openItem('${i.id}')">${b}${i.img ? `<img class="cimg" src="${im(i.img)}" alt="${H(i.nome)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'em',textContent:'${i.emoji}'}))">` : `<div class="em">${i.emoji}</div>`}<div style="flex:1"><h3>${H(i.nome)}</h3><div class="inc">${i.combo_items.map(H).join(" + ")}</div><div class="row"><span><span class="old">${R(i.original)}</span><span class="pr">${R(i.preco)}</span><span class="eco">Economize ${R(i.economiza)}</span></span><span class="plus">+</span></div></div></article>`;
  const ic = i.img
    ? `<img src="${im(i.img)}" alt="" loading="lazy">`
    : `<div class="em">${i.emoji}</div>`;
  return `<article class="line" ${s} onclick="quick('${i.id}')">${ic}<div class="m"><h3>${H(i.nome)}</h3>${i.desc ? `<p>${H(i.desc)}</p>` : ""}<span class="pr" style="font-size:16px">${R(i.preco)}</span></div><span class="plus">+</span></article>`;
}
function spy() {
  const f = () => {
    let a = CATS[0][0];
    CATS.forEach(([k]) => {
      if (
        $("s-" + k).getBoundingClientRect().top <
        (parseFloat(document.documentElement.style.scrollPaddingTop) || 120) +
          20
      )
        a = k;
    });
    document.querySelectorAll(".chip").forEach((c) => {
      const on = c.dataset.k === a;
      if (on && !c.classList.contains("on")) {
        const n = $("chips");
        n.scrollTo({
          left: c.offsetLeft - (n.clientWidth - c.offsetWidth) / 2,
          behavior: "smooth",
        });
      }
      c.classList.toggle("on", on);
    });
  };
  addEventListener("scroll", f, { passive: true });
  f();
}
const get = (id) => ITEMS.find((i) => i.id === id);
function quick(id) {
  const i = get(id);
  push({
    id,
    nome: i.nome,
    preco: i.preco,
    qtd: 1,
    img: i.img,
    emoji: i.emoji,
    extras: [],
    obs: "",
    combo_items: null,
  });
  toast("✅ " + i.nome + " adicionado!");
}
function openItem(id) {
  cur = { i: get(id), q: 1, ex: new Set() };
  drawM();
  mo.classList.add("show");
}
const mo = $("mo"),
  dro = $("do");
function unit() {
  return (
    cur.i.preco +
    [...cur.ex].reduce(
      (s, x) => s + ADICIONAIS.find((a) => a.id === x).preco,
      0,
    )
  );
}
function drawM() {
  const i = cur.i,
    h = i.tipo === "burger";
  $("sh").innerHTML =
    `<button class="x" onclick="closeM()">✕</button>${i.img ? `<div class="ph"><img src="${im(i.img)}" alt=""></div>` : `<div style="font-size:90px;text-align:center;padding:30px 0 0">${i.emoji}</div>`}<div class="body"><h2 class="an" style="font-size:28px">${H(i.nome)}</h2><p style="color:var(--mu)">${H(i.desc || "")}</p>
${h ? `<h4 style="margin:14px 0 2px;color:var(--g)">Adicionais</h4>` + ADICIONAIS.map((a) => `<label class="ck"><span><input type="checkbox" ${cur.ex.has(a.id) ? "checked" : ""} onchange="tg('${a.id}')"> ${a.nome}</span><b>+ ${R(a.preco)}</b></label>`).join("") : `<h4 style="margin:14px 0 4px;color:var(--g)">Inclui</h4>` + i.combo_items.map((x) => `<div class="ck">✔ ${H(x)}</div>`).join("")}
<h4 style="margin:14px 0 0;color:var(--g)">Observações</h4><textarea id="ob" placeholder="Ex: sem cebola, ponto da carne...">${H(cur.ob || "")}</textarea>
<div class="row" style="margin-top:14px"><div class="qty"><button onclick="qm(-1)">−</button><b id="qv">${cur.q}</b><button onclick="qm(1)">+</button></div><b class="pr" id="mt">${R(unit() * cur.q)}</b></div><button class="cta" onclick="addM()">Adicionar ao carrinho</button></div>`;
}
function tg(x) {
  cur.ob = $("ob").value;
  cur.ex.has(x) ? cur.ex.delete(x) : cur.ex.add(x);
  drawM();
}
function qm(d) {
  cur.q = Math.max(1, cur.q + d);
  $("qv").textContent = cur.q;
  $("mt").textContent = R(unit() * cur.q);
}
function addM() {
  const i = cur.i;
  push({
    id: i.id,
    nome: i.nome,
    preco: unit(),
    qtd: cur.q,
    img: i.img,
    emoji: i.emoji,
    extras: [...cur.ex].map((x) => ADICIONAIS.find((a) => a.id === x).nome),
    obs: $("ob").value.trim(),
    combo_items: i.combo_items || null,
  });
  closeM();
  toast("✅ " + i.nome + " adicionado!");
}
function closeM() {
  mo.classList.remove("show");
}
function push(it) {
  const k = it.id + "|" + it.extras.join() + "|" + it.obs,
    e = cart.find((c) => c.k === k);
  e ? (e.qtd += it.qtd) : cart.push({ ...it, k, uid: ++uid });
  bar();
}
const sub = () => cart.reduce((s, c) => s + c.preco * c.qtd, 0),
  cnt = () => cart.reduce((s, c) => s + c.qtd, 0);
function bar() {
  const b = $("bar");
  b.style.display = cart.length ? "flex" : "none";
  b.innerHTML = `<span>🛒 ${cnt()} ${cnt() > 1 ? "itens" : "item"}</span><span>Ver carrinho · ${R(sub())}</span>`;
  if (dro.classList.contains("show")) drawD();
}
function openCart() {
  drawD();
  dro.classList.add("show");
}
function closeD() {
  dro.classList.remove("show");
}
function cq(u, d) {
  const c = cart.find((x) => x.uid === u);
  c.qtd += d;
  if (c.qtd < 1) cart = cart.filter((x) => x !== c);
  bar();
  if (!cart.length) closeD();
}
function keep() {
  const o = {};
  document
    .querySelectorAll("#dr [data-f]")
    .forEach((e) => (o[e.dataset.f] = e.value));
  return o;
}
let F = {};
function drawD() {
  F = { ...F, ...keep() };
  const t = sub(),
    tx = tipo === "entrega" ? CONFIG.taxaEntrega : 0,
    v = (k) => H(F[k] || "");
  $("dr").innerHTML =
    `<button class="x" style="position:sticky;float:right" onclick="closeD()">✕</button><h2>Seu pedido</h2>
${cart.map((c) => `<div class="ci">${c.img ? `<img src="${im(c.img)}" alt="">` : `<div class="e">${c.emoji}</div>`}<div class="m"><b>${H(c.nome)}</b>${c.combo_items ? `<small>↳ ${c.combo_items.map(H).join(" + ")}</small>` : ""}${c.extras.length ? `<small>+ ${c.extras.join(", ")}</small>` : ""}${c.obs ? `<small>📝 ${H(c.obs)}</small>` : ""}<small>${R(c.preco * c.qtd)}</small></div><div class="qty"><button onclick="cq(${c.uid},-1)">−</button><b>${c.qtd}</b><button onclick="cq(${c.uid},1)">+</button></div></div>`).join("")}
<h4>Como quer receber?</h4><div class="seg"><label><input type="radio" name="t" ${tipo === "entrega" ? "checked" : ""} onchange="tipo='entrega';drawD()"><span>🛵 Entrega</span></label><label><input type="radio" name="t" ${tipo === "retirada" ? "checked" : ""} onchange="tipo='retirada';drawD()"><span>🏪 Retirada</span></label></div>
<h4>Seus dados</h4><input type="text" data-f="nome" placeholder="Seu nome *" value="${v("nome")}"><input type="tel" data-f="tel" placeholder="Telefone / WhatsApp *" value="${v("tel")}">
${tipo === "entrega" ? `<input type="text" data-f="end" placeholder="Rua / Avenida *" value="${v("end")}"><input type="text" data-f="num" placeholder="Número *" value="${v("num")}"><input type="text" data-f="bai" placeholder="Bairro *" value="${v("bai")}"><input type="text" data-f="comp" placeholder="Complemento / referência" value="${v("comp")}">` : `<p style="margin-top:10px;color:var(--mu)">📍 Retire em: ${H(CONFIG.endereco)}</p><iframe loading="lazy" src="https://www.google.com/maps?q=${CONFIG.googleMapsQuery}&output=embed"></iframe>`}
<h4>Pagamento</h4><div class="pay" id="pg">${["Pix", "Crédito", "Débito", "Dinheiro"].map((p) => `<label><input type="radio" name="p" ${pag === p ? "checked" : ""} onchange="pag='${p}';drawD()"><span>${p}</span></label>`).join("")}</div>
${pag === "Pix" ? `<p style="margin-top:8px;color:var(--mu)">Chave Pix: <b style="color:var(--g)">${H(CONFIG.pixChave)}</b></p>` : ""}${pag === "Dinheiro" ? `<input type="text" data-f="troco" placeholder="Troco para quanto? (opcional)" value="${v("troco")}">` : ""}
<div style="margin-top:18px"><div class="tot"><span>Subtotal</span><span>${R(t)}</span></div><div class="tot"><span>Entrega</span><span>${tipo === "entrega" ? R(tx) : "Grátis"}</span></div><div class="tot f"><span>Total</span><span>${R(t + tx)}</span></div></div><button class="cta wa" onclick="send()">Enviar pedido pelo WhatsApp</button>`;
}
function bad(el) {
  el.classList.add("err");
  setTimeout(() => el.classList.remove("err"), 500);
}
function valida() {
  let ok = true,
    first = null;
  const need = ["nome", "tel"].concat(
    tipo === "entrega" ? ["end", "num", "bai"] : [],
  );
  need.forEach((k) => {
    const e = document.querySelector(`#dr [data-f=${k}]`);
    if (!(F[k] || "").trim()) {
      ok = false;
      bad(e);
      first = first || e;
    }
  });
  if ((F.tel || "").replace(/\D/g, "").length < 10) {
    ok = false;
    const e = document.querySelector("#dr [data-f=tel]");
    bad(e);
    first = first || e;
  }
  if (!pag) {
    ok = false;
    bad($("pg"));
    first = first || $("pg");
  }
  if (!ok) {
    first.scrollIntoView({ block: "center", behavior: "smooth" });
    toast("Preencha os campos obrigatórios");
    $("toast").style.background = "#3a1410";
    $("toast").style.color = "#ff7a66";
    setTimeout(() => {
      $("toast").style.background = "";
      $("toast").style.color = "";
    }, 1900);
    return false;
  }
  return true;
}
/* ===== CONTADOR ONLINE (Google Planilhas / Apps Script) ===== */
const PLAN = () => (CONFIG.planilha && CONFIG.planilha.url) || "";
function api(body, ms = 9000) {
  const c = new AbortController(),
    t = setTimeout(() => c.abort(), ms);
  return fetch(PLAN(), {
    method: "POST",
    body: JSON.stringify(body),
    signal: c.signal,
  })
    .then((r) => r.json())
    .finally(() => clearTimeout(t));
}
async function numeroPedido(tx) {
  if (!PLAN()) return fmPed(gravaPed()); /* sem planilha: contador local */
  try {
    const r = await api({
      action: "novo",
      abre: CONFIG.horario.abre,
      nome: F.nome,
      tel: F.tel,
      tipo: tipo === "entrega" ? "Entrega" : "Retirada",
      endereco:
        tipo === "entrega"
          ? F.end + ", " + F.num + " - " + F.bai + (F.comp ? " (" + F.comp + ")" : "")
          : "Retirada no local",
      itens: cart
        .map(
          (c) =>
            c.qtd + "x " + c.nome +
            (c.extras.length ? " (+" + c.extras.join(", ") + ")" : "") +
            (c.obs ? " [obs: " + c.obs + "]" : ""),
        )
        .join(" | "),
      total: sub() + tx,
      pagamento: pag,
      troco: pag === "Dinheiro" ? F.troco || "" : "",
      dados: {
        nome: F.nome,
        tel: F.tel,
        tipo: tipo === "entrega" ? "Entrega" : "Retirada",
        end: tipo === "entrega" ? F.end + ", " + F.num : "",
        bai: tipo === "entrega" ? F.bai : "",
        comp: tipo === "entrega" ? F.comp || "" : "",
        itens: cart.map((c) => ({
          q: c.qtd,
          n: c.nome,
          p: c.preco * c.qtd,
          ci: c.combo_items || [],
          ex: c.extras,
          ob: c.obs,
        })),
        sub: sub(),
        taxa: tx,
        total: sub() + tx,
        pag: pag,
        troco: pag === "Dinheiro" ? F.troco || "" : "",
        prev: tipo === "entrega" ? CONFIG.tempoEntrega : "",
      },
    });
    if (r && r.ok) return fmPed(r.n);
  } catch (e) {}
  /* planilha indisponível: não trava o pedido, usa número provisório */
  const d = new Date(),
    p = (x) => String(x).padStart(2, "0");
  toast("⚠️ Sem conexão com o contador. Pedido enviado sem número oficial");
  return "#~" + p(d.getHours()) + p(d.getMinutes());
}
let enviando = false;
async function send() {
  if (enviando) return;
  F = { ...F, ...keep() };
  if (!aberto() && !CONFIG.pedidoSempreAtivo) {
    $("clp").textContent =
      `Abrimos às ${fm(CONFIG.horario.abre)} e fechamos às ${fm(CONFIG.horario.fecha)}. Volte nesse horário para pedir.`;
    $("cl").classList.add("show");
    return;
  }
  if (!valida()) return;
  const tx = tipo === "entrega" ? CONFIG.taxaEntrega : 0,
    btn = document.querySelector("#dr .cta.wa"),
    lbl = btn && btn.textContent;
  enviando = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Gerando seu pedido…";
  }
  const n = await numeroPedido(tx);
  enviando = false;
  if (btn) {
    btn.disabled = false;
    btn.textContent = lbl;
  }
  let m = `${CONFIG.emoji} *${CONFIG.nome}*\n🧾 *PEDIDO ${n}*\n\n👤 ${F.nome}\n📞 ${F.tel}\n${tipo === "entrega" ? "🛵 *Entrega*\n📍 " + F.end + ", " + F.num + " - " + F.bai + (F.comp ? " (" + F.comp + ")" : "") : "🏪 *Retirada no local*\n📍 " + CONFIG.endereco}\n\n*ITENS*\n`;
  cart.forEach((c) => {
    m += `${c.qtd}x ${c.nome} — ${R(c.preco * c.qtd)}\n`;
    if (c.combo_items) m += `   ↳ ${c.combo_items.join(" + ")}\n`;
    if (c.extras.length) m += `   ➕ ${c.extras.join(", ")}\n`;
    if (c.obs) m += `   📝 ${c.obs}\n`;
  });
  m += `\nSubtotal: ${R(sub())}\nEntrega: ${tipo === "entrega" ? R(tx) : "R$ 0,00 (retirada)"}\n*TOTAL: ${R(sub() + tx)}*\n\n💳 Pagamento: ${pag}`;
  if (pag === "Pix") m += ` (chave ${CONFIG.pixChave})`;
  if (pag === "Dinheiro" && F.troco) m += ` · troco para ${F.troco}`;
  if (tipo === "entrega") m += `\n⏱ Previsão: ${CONFIG.tempoEntrega}`;
  const u = `https://wa.me/${WA}?text=${encodeURIComponent(m)}`,
    a = $("wal");
  a.href = u;
  a.click();
  setTimeout(() => {
    location.href = u;
  }, 2000);
}
init();

if ("serviceWorker" in navigator && /^https?:/.test(location.protocol))
  addEventListener("load", () =>
    navigator.serviceWorker.register("sw.js").catch(() => {}),
  );
