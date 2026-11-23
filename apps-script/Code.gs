/**
 * CARDÁPIO DIGITAL - contador de pedidos + registro em Google Planilhas + lista para a loja
 * Cole este código em: Planilha > Extensões > Apps Script  (veja INSTALAR.txt)
 */

// ====== EDITE AQUI ======
var PIN = "1234";            // senha da área da loja (TROQUE!)
var ABA = "Pedidos";         // nome da aba onde os pedidos são gravados
var TZ  = Session.getScriptTimeZone(); // fuso do projeto (confira em Configurações do projeto)
// ========================

// Colunas da planilha: A Data | B Hora | C Dia da loja | D Nº | E Cliente | F Telefone | G Tipo |
// H Endereço | I Itens | J Total | K Pagamento | L Troco | M Dados do pedido (não apague) | N Impresso

function doGet() {
  return saida({ ok: true, msg: "Cardápio online" });
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.action === "auth") return saida(autenticar(d.pin));
    if (d.action === "novo") return saida(novoPedido(d));
    if (d.action === "listar") return saida(listar(d));
    if (d.action === "marcar") return saida(marcar(d));
    return saida({ ok: false, erro: "acao" });
  } catch (err) {
    return saida({ ok: false, erro: String(err) });
  }
}

function saida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Texto seguro para a planilha (evita fórmulas maliciosas como =IMPORTXML)
function t(v, max) {
  v = String(v == null ? "" : v).slice(0, max || 200);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Dia de funcionamento: vira na hora de abertura (ex.: 18:00), não à meia-noite
function diaLoja(abreMin, diasAtras) {
  var m = Number(abreMin);
  if (!(m >= 0 && m < 1440)) m = 0;
  var ms = Date.now() - m * 60000 - (diasAtras || 0) * 86400000;
  return Utilities.formatDate(new Date(ms), TZ, "yyyy-MM-dd");
}

function ds(v) { // a planilha pode converter o texto em data; volta para yyyy-MM-dd
  return v instanceof Date ? Utilities.formatDate(v, TZ, "yyyy-MM-dd") : String(v);
}

function novoPedido(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // garante que dois pedidos ao mesmo tempo não repitam o número
  try {
    var p = PropertiesService.getScriptProperties();
    var dia = diaLoja(d.abre);
    var n = p.getProperty("dia") === dia ? parseInt(p.getProperty("n") || "0", 10) : 0;
    n++;
    p.setProperties({ dia: dia, n: String(n) });

    var sh = aba();
    var agora = new Date();
    var hora = Utilities.formatDate(agora, TZ, "HH:mm");
    var dados = "";
    try {
      var o = d.dados || {};
      o.hora = hora;
      dados = JSON.stringify(o);
      if (dados.length > 40000) dados = "";
    } catch (x) {}
    sh.appendRow([
      Utilities.formatDate(agora, TZ, "dd/MM/yyyy"),
      hora,
      dia,
      n,
      t(d.nome, 80),
      t(d.tel, 30),
      t(d.tipo, 20),
      t(d.endereco, 200),
      t(d.itens, 1000),
      Number(d.total) || 0,
      t(d.pagamento, 30),
      t(d.troco, 30),
      dados,
      ""
    ]);
    return { ok: true, n: n, dia: dia };
  } finally {
    lock.releaseLock();
  }
}

function aba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
  if (sh.getLastRow() === 0 || !sh.getRange("M1").getValue()) { // cria / atualiza o cabeçalho
    sh.getRange("A:C").setNumberFormat("@"); // data, hora e dia como texto
    sh.getRange(1, 1, 1, 14).setValues([["Data", "Hora", "Dia da loja", "Nº", "Cliente", "Telefone",
      "Tipo", "Endereço", "Itens", "Total (R$)", "Pagamento", "Troco", "Dados do pedido (não apague)", "Impresso"]])
      .setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

// ---------- acesso da loja ----------
function segredo() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty("seg");
  if (!s) { s = Utilities.getUuid(); p.setProperty("seg", s); }
  return s;
}
function tokenAtual() { // muda se você trocar o PIN
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(PIN), segredo()));
}
function tokenOk(tk) { return !!tk && String(tk) === tokenAtual(); }

// Confere a senha (bloqueia após 5 erros por 10 minutos)
function autenticar(pin) {
  var cache = CacheService.getScriptCache();
  var falhas = parseInt(cache.get("falhas") || "0", 10);
  if (falhas >= 5) return { ok: false, bloqueado: true };
  if (String(pin) === String(PIN)) {
    cache.remove("falhas");
    return { ok: true, token: tokenAtual() };
  }
  cache.put("falhas", String(falhas + 1), 600);
  return { ok: false };
}

// ---------- lista de pedidos do dia (só com token da loja) ----------
function listar(d) {
  if (!tokenOk(d.token)) return { ok: false, erro: "auth" };
  var dia = diaLoja(d.abre, d.ontem ? 1 : 0);
  var sh = aba(), last = sh.getLastRow();
  if (last < 2) return { ok: true, dia: dia, pedidos: [] };
  var ini = Math.max(2, last - 399);
  var v = sh.getRange(ini, 1, last - ini + 1, 14).getValues();
  var out = [];
  for (var i = v.length - 1; i >= 0; i--) {
    var r = v[i];
    if (ds(r[2]) !== dia) continue;
    var dados = null;
    try { dados = r[12] ? JSON.parse(r[12]) : null; } catch (x) {}
    out.push({
      n: r[3],
      data: r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, "dd/MM/yyyy") : String(r[0]),
      hora: (dados && dados.hora) || (r[1] instanceof Date ? "" : String(r[1]).slice(0, 5)),
      nome: String(r[4]), tel: String(r[5]), tipo: String(r[6]),
      endereco: String(r[7]), itens: String(r[8]), total: Number(r[9]) || 0,
      pag: String(r[10]), troco: String(r[11]),
      dados: dados, impresso: String(r[13] || "")
    });
  }
  return { ok: true, dia: dia, pedidos: out };
}

function marcar(d) { // marca o pedido como impresso
  if (!tokenOk(d.token)) return { ok: false, erro: "auth" };
  var dia = diaLoja(d.abre, d.ontem ? 1 : 0);
  var sh = aba(), last = sh.getLastRow();
  var ini = Math.max(2, last - 399);
  if (last < 2) return { ok: false };
  var v = sh.getRange(ini, 3, last - ini + 1, 2).getValues(); // colunas C e D
  for (var i = v.length - 1; i >= 0; i--) {
    if (ds(v[i][0]) === dia && Number(v[i][1]) === Number(d.n)) {
      sh.getRange(ini + i, 14).setValue("Sim " + Utilities.formatDate(new Date(), TZ, "HH:mm"));
      return { ok: true };
    }
  }
  return { ok: false };
}

// Opcional: rode manualmente para zerar o contador (ex.: depois de testes)
function zerarContador() {
  var p = PropertiesService.getScriptProperties();
  p.deleteProperty("dia");
  p.deleteProperty("n");
}
