// Servidor local sem dependências: serve o app e salva os dados em data/dados.json
// Uso: node server.js   (depois abra http://localhost:3000)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "dados.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Um backup por dia, mantendo os 30 mais recentes
function dailyBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) return;
  const day = new Date().toISOString().slice(0, 10);
  const target = path.join(BACKUP_DIR, `dados-${day}.json`);
  if (!fs.existsSync(target)) fs.copyFileSync(DATA_FILE, target);
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".json")).sort();
  while (files.length > 30) fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/data") {
    if (req.method === "GET") {
      if (!fs.existsSync(DATA_FILE)) return send(res, 200, "null");
      return send(res, 200, fs.readFileSync(DATA_FILE, "utf8"));
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", chunk => {
        body += chunk;
        if (body.length > 20 * 1024 * 1024) req.destroy();
      });
      req.on("end", () => {
        try {
          JSON.parse(body);
        } catch {
          return send(res, 400, JSON.stringify({ error: "JSON inválido" }));
        }
        dailyBackup();
        const tmp = DATA_FILE + ".tmp";
        fs.writeFileSync(tmp, body);
        fs.renameSync(tmp, DATA_FILE);
        send(res, 200, JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
      });
      return;
    }
    return send(res, 405, JSON.stringify({ error: "Método não suportado" }));
  }

  let file = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  if (!file) file = "index.html";
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT) || full.startsWith(DATA_DIR)) return send(res, 403, "Proibido", "text/plain");
  fs.readFile(full, (err, content) => {
    if (err) return send(res, 404, "Não encontrado", "text/plain");
    send(res, 200, content, MIME[path.extname(full)] || "application/octet-stream");
  });
});

const URL_APP = "http://localhost:" + PORT;
const ABRIR = process.argv.includes("--abrir");

function abrirNavegador() {
  const { exec } = require("child_process");
  const cmd = process.platform === "win32" ? `start "" "${URL_APP}"` : process.platform === "darwin" ? `open "${URL_APP}"` : `xdg-open "${URL_APP}"`;
  exec(cmd, () => {});
}

// Se o app já estiver aberto (porta em uso), só abre o navegador e sai
server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.log("\n  ✦ O Aurum já está rodando. Abrindo o navegador…\n");
    if (ABRIR) abrirNavegador();
    setTimeout(() => process.exit(0), 800);
    return;
  }
  throw err;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("  ✦ Aurum Finanças rodando em  " + URL_APP);
  console.log("  ✦ Seus dados ficam em        " + DATA_FILE);
  console.log("  ✦ Deixe esta janela aberta enquanto usa o app. Para parar: feche-a ou Ctrl + C");
  console.log("");
  if (ABRIR) abrirNavegador();
});
