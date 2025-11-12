const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');
const bcrypt = require('bcrypt');
const xss = require("xss");
const { exec } = require('child_process');
const cron = require("node-cron");
const cookieParser = require('cookie-parser');
const AdmZip = require("adm-zip");
const mysqlRaw = require('mysql2/promise');
const execPromise = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve({ stdout, stderr });
    });
  });
const dayjs = require("dayjs");
const nodemailer = require("nodemailer");

const { enviarEmail } = require("./emailService");

// Detecta se está em produção (Hostinger) ou local (XAMPP)
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true" ||
  process.env.HOSTINGER === "true" ||
  process.env.PORT === "10000"; // só exemplo, pode ajustar se quiser

const envFile = isProduction
  ? path.resolve(__dirname, "../../.env") // ou apenas .env se preferir
  : path.resolve(__dirname, "../../.env.local");

console.log("🌍 Carregando variáveis de:", envFile);
require("dotenv").config({ path: envFile, override: true });


const SECRET = process.env.JWT_SECRET;

const mmToPt = mm => mm * 2.8346456693;
const ETIQUETA_W_MM = 85;
const ETIQUETA_H_MM = 50;
const ETIQUETA_W_PT = mmToPt(ETIQUETA_W_MM);
const ETIQUETA_H_PT = mmToPt(ETIQUETA_H_MM);

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];


const pool = mysqlRaw.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bibliontec",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- Wrapper que substitui connection.query por pool.query ---
function queryCallback(sql, params, cb) {
  if (typeof params === 'function') {
    cb = params;
    params = [];
  }
  pool.query(sql, params)
    .then(([rows]) => cb(null, rows))
    .catch(err => cb(err));
}

// Testa conexão inicial
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexão inicial ao MySQL testada com sucesso!");
    conn.release();
  } catch (err) {
    console.error("❌ Erro inicial ao conectar ao MySQL:", err.message);
  }
})();

function validarToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "segredo");
  } catch {
    return null;
  }
}

// Middleware para validar token
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado" });
    console.log("🔑 Payload do token:", payload);
    req.user = payload;
    next();
  });
}

const app = express();

// --- SEGURANÇA, LOGS, CORS e PARSERS --- //
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const expressWinston = require('express-winston');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ===== 1. CORS (antes de tudo que usa rotas) =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://bibliontec.com.br',
  'https://bibliontec.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

/// ✅ Corrige o bug do path-to-regexp (*)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204); // pré-flight OK
  }
  next();
});


// ===== 2. Helmet =====
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bibliontec.com.br",
        "https://bibliontec.onrender.com"
      ],
      "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"]
    }
  }
}));

// Corrige bloqueio "NotSameOrigin"
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// ===== 3. Body Parsers =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 4. Logs =====
app.use(morgan('combined'));

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// ==================== FUNÇÃO PADRÃO DE LOG ====================
function registrarLog(acao, mensagem, req, tipo = "info") {
  const usuario = req.user ? req.user.nome || `Usuário #${req.user.id}` : "Sistema";
  const email = req.user ? req.user.email || "sem email" : "sistema@local";
  const instituicao = req.user ? req.user.FK_instituicao_id || "desconhecida" : "sem instituição";

  logger.log({
    level: tipo,
    message: `${acao} - ${mensagem}`,
    meta: {
      usuario,
      email,
      instituicao,
      rota: req.originalUrl,
      metodo: req.method
    }
  });
}

app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} - {{res.responseTime}}ms",
  expressFormat: false,
  colorize: false
}));

// ===== 5. Servir uploads e páginas =====
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

// ===== 6. Rate Limiter =====
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Muitas tentativas de login. Aguarde alguns minutos." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("⚠️ Bloqueio temporário por excesso de tentativas", { ip: req.ip, rota: "/login" });
    res.status(429).json({ error: "Muitas tentativas de login. Tente novamente em alguns minutos." });
  }
});

// ===== 7. Middleware de validação =====
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Falha de validação', { errors: errors.array(), ip: req.ip });
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// ===== 8. Check session =====
app.get("/check-session", (req, res) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) {
      return res.status(401).json({ autenticado: false, mensagem: "Não logado" });
    }

    jwt.verify(token, SECRET, (err, payload) => {
      if (err) {
        return res.status(401).json({ autenticado: false, mensagem: "Sessão inválida" });
      }
      res.json({ autenticado: true, payload });
    });
  } catch (error) {
    console.error("Erro no /check-session:", error);
    res.status(500).json({ autenticado: false, mensagem: "Erro interno" });
  }
});

//================= MULTER =================//
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas arquivos de imagem JPEG, PNG, JPG e WEBP são permitidos.'));
  }
});
// ================= FILTRO DE PALAVRÕES =================
async function filtrarComentario(texto) {
  try {
    const url = `https://myptify.vercel.app/api/filter?text=${encodeURIComponent(texto)}`;
    const resp = await fetch(url, { timeout: 5000 }); // 5 segundos de timeout

    if (!resp.ok) {
      throw new Error(`API status: ${resp.status}`);
    }

    const data = await resp.json();
    return data.filtered_text || texto;

  } catch (err) {
    return filtrarPalavroesLocal(texto);
  }
}

function filtrarPalavroesLocal(texto) {
  const palavroes = {
    'porra': '*',
    'caralho': '*',
    'merda': '*',
    'puta': '*',
    'buceta': '*',
    'cacete': '*',
    'viado': '*',
    'bicha': '*',
    'cu': '*',
    'foda': '*',
    'foder': '*',
    'puto': '*',
    'corno': '*',
    'vadia': '*',
    'pau': '*',
    'rola': '*',
    'bosta': '*',
    'xota': '*',
    'caralhos': '*',
    'porras': '*',
    'merdas': '*',
    'putas': '*',
    'bucetas': '*',
    'viados': '*',
    'bichas': '*',
    'cus': '*',
    'fodas': '*',
    'cornos': '*',
    'vadias': '*',
    'paus': '*',
    'rolas': '*',
    'bostas': '*',
    'xotas': '*',
    'p0rr4': '*',
    'c4r4lh0': '*',
    'm3rd4': '*',
    'put4': '*',
    'buc3t4': '*',
    'vi4d0': '*',
    'idiota': '*',
    'imbecil': '*',
    'estupido': '*',
    'burro': '*',
    'retardado': '*',
    'demonio': '*',
    'diabo': '*',
    'bobão': '*'
  };

  let textoFiltrado = texto;
  Object.keys(palavroes).forEach(palavrao => {
    const regex = new RegExp(palavrao, 'gi');
    textoFiltrado = textoFiltrado.replace(regex, palavroes[palavrao]);
  });

  return textoFiltrado;
}

// ================= UTIL =================

function telefoneValido(telefone) {
  return /^\d{10,11}$/.test(telefone);
}

function gerarSenhaSegura() {
  return Math.random().toString(36).slice(-8); // gera senha aleatória de 8 caracteres
}




// ==================== CADASTRO ALUNO/PROF ====================


// ==================== CADASTRO USUÁRIO (GENÉRICO) ====================
app.post('/cadastrarUsuario', autenticarToken, upload.single('foto'), (req, res) => {
  const { nome, telefone, email, senha, tipo_usuario_id, curso_id, serie, funcionario_id } = req.body;
  const foto = req.file ? req.file.filename : null;

  if (!nome || !telefone || !email || !tipo_usuario_id)
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

  if (!telefoneValido(telefone))
    return res.status(400).json({ error: 'Telefone inválido.' });

  const checkEmailSql = `SELECT id FROM usuario WHERE email = ?`;
  queryCallback(checkEmailSql, [email], (err, results) => {
    if (err) {
      registrarLog("Erro ao verificar e-mail", `Erro interno ao verificar e-mail de ${email}`, req, "error");
      return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
    }

    if (results.length > 0) {
      registrarLog("Tentativa de cadastro duplicado", `O e-mail ${email} já está cadastrado.`, req, "warn");
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

    bcrypt.hash(senhaFinal, 12)
      .then((hash) => {
        const sql = `
          INSERT INTO usuario 
          (nome, telefone, email, senha, foto, FK_tipo_usuario_id, curso_id, serie, FK_funcionario_id, FK_instituicao_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        queryCallback(sql, [
          nome,
          telefone,
          email,
          hash,
          foto,
          tipo_usuario_id,
          tipo_usuario_id == 1 ? (curso_id || null) : null,
          tipo_usuario_id == 1 ? (serie || null) : null,
          funcionario_id || null,
          req.user.FK_instituicao_id
        ], (err) => {
          if (err) {
            registrarLog("Erro ao cadastrar usuário", `Falha ao inserir usuário "${nome}" (${email}).`, req, "error");
            console.error('Erro ao cadastrar usuário:', err);
            return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
          }

          // ✅ Sucesso — registra o log
          registrarLog(
            "Cadastro de usuário",
            `Usuário "${nome}" (${email}) cadastrado por ${req.user.nome || 'Sistema'}.`,
            req,
            "info"
          );

          return res.status(200).json({ message: 'Usuário cadastrado com sucesso!', senhaGerada: senhaFinal });
        });
      })
      .catch(err => {
        registrarLog("Erro ao gerar hash", `Erro ao gerar senha de ${email}`, req, "error");
        console.error('Erro ao gerar hash da senha:', err);
        return res.status(500).json({ error: 'Erro ao processar senha.' });
      });
  });
});

// ==================== BUSCAR CDD VIA OPEN LIBRARY ====================
app.get('/api/buscar-cdd/:isbn', autenticarToken, async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const resposta = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);

    if (!resposta.ok) {
      registrarLog(
        "Consulta de CDD",
        `Falha ao buscar CDD do ISBN ${isbn} — livro não encontrado.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    const dados = await resposta.json();

    let cdd = "000";
    if (dados.classifications && dados.classifications.dewey_decimal_class) {
      cdd = dados.classifications.dewey_decimal_class[0] || "000";
    }

    // ✅ Loga sucesso na busca
    registrarLog(
      "Consulta de CDD",
      `CDD ${cdd} obtido para ISBN ${isbn} por ${req.user.nome || "Sistema"}.`,
      req,
      "info"
    );

    res.json({ cdd });
  } catch (erro) {
    console.error('Erro ao buscar CDD:', erro);
    registrarLog(
      "Erro ao buscar CDD",
      `Erro ao buscar CDD para ISBN ${isbn}.`,
      req,
      "error"
    );
    res.status(500).json({ error: 'Erro ao buscar CDD' });
  }
});

// ==================== ETIQUETAS ====================
app.get('/etiquetas/:id', autenticarToken, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const livro = await buscarLivroPorId(id);
    if (!livro) {
      registrarLog(
        "Geração de etiqueta",
        `Falha — livro ID ${id} não encontrado.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    const doc = new PDFDocument({ size: [ETIQUETA_W_PT, ETIQUETA_H_PT], margin: mmToPt(5) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=etiqueta_${livro.id}.pdf`);
    doc.pipe(res);

    const largura = ETIQUETA_W_PT - mmToPt(10);
    let y = doc.y;

    doc.fontSize(14).text(livro.titulo || '', { align: 'center', width: largura });
    y += mmToPt(6);
    doc.moveDown(0.1);
    doc.fontSize(10).text(livro.autores || '', { align: 'center', width: largura });

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: (livro.isbn || String(livro.id)),
      scale: 2,
      height: 20,
      includetext: false
    });

    const imgWidth = Math.min(mmToPt(60), largura);
    const imgX = (ETIQUETA_W_PT - imgWidth) / 2;
    const imgY = doc.y + mmToPt(6);
    doc.image(barcodeBuffer, imgX, imgY, { width: imgWidth });
    doc.moveDown(2);

    doc.fontSize(8).text(`ISBN: ${livro.isbn || ''}`, { align: 'center', width: largura });
    doc.fontSize(8).text(`CDD: ${livro.cdd || ''}`, { align: 'center', width: largura });
    doc.fontSize(8).text(livro.editora || '', ETIQUETA_W_PT - mmToPt(5) - mmToPt(30), ETIQUETA_H_PT - mmToPt(12), {
      width: mmToPt(30),
      align: 'right'
    });

    doc.end();

    // ✅ Log de sucesso
    registrarLog(
      "Geração de etiqueta",
      `Etiqueta do livro "${livro.titulo}" (ID ${livro.id}) gerada por ${req.user.nome || "Sistema"}.`,
      req,
      "info"
    );
  } catch (err) {
    console.error('Erro ao gerar etiqueta:', err);
    registrarLog(
      "Erro ao gerar etiqueta",
      `Erro ao gerar etiqueta do livro ID ${req.params.id}.`,
      req,
      "error"
    );
    return res.status(500).json({ error: 'Erro ao gerar etiqueta' });
  }
});
// ==================== ETIQUETAS MÚLTIPLAS ====================
app.post('/etiquetas/multiple', autenticarToken, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];
  if (!ids.length) {
    registrarLog(
      "Geração de etiquetas múltiplas",
      `Falha — nenhum ID de livro fornecido na requisição.`,
      req,
      "warn"
    );
    return res.status(400).json({ error: 'Nenhum id fornecido' });
  }

  try {
    const livros = [];
    for (const id of ids) {
      const l = await buscarLivroPorId(id);
      if (l) livros.push(l);
    }

    if (!livros.length) {
      registrarLog(
        "Geração de etiquetas múltiplas",
        `Falha — IDs fornecidos (${ids.join(", ")}) não encontrados.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: 'Nenhum livro encontrado' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: mmToPt(10) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=etiquetas_multipla.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const labelW = ETIQUETA_W_PT;
    const labelH = ETIQUETA_H_PT;
    const hGap = mmToPt(6);
    const vGap = mmToPt(6);

    const cols = Math.floor((pageWidth + hGap) / (labelW + hGap));
    const rows = Math.floor((pageHeight + vGap) / (labelH + vGap));
    const perPage = Math.max(1, cols * rows);

    let index = 0;
    for (let p = 0; index < livros.length; p++) {
      if (p > 0) doc.addPage();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (index >= livros.length) break;
          const livro = livros[index++];

          const x = doc.page.margins.left + c * (labelW + hGap);
          const y = doc.page.margins.top + r * (labelH + vGap);

          doc.rect(x, y, labelW, labelH).strokeOpacity(0.2).stroke();

          const innerX = x + mmToPt(4);
          const innerW = labelW - mmToPt(8);
          let cursorY = y + mmToPt(4);

          doc.fontSize(12).text(livro.titulo || '', innerX, cursorY, { width: innerW, align: 'center' });
          cursorY += mmToPt(8);

          doc.fontSize(9).text(livro.autores || '', innerX, cursorY, { width: innerW, align: 'center' });

          try {
            const barcodeBuffer = await bwipjs.toBuffer({
              bcid: 'code128',
              text: (livro.isbn || String(livro.id)),
              scale: 2,
              height: 18,
              includetext: false
            });
            const imgW = Math.min(innerW * 0.9, mmToPt(55));
            const imgX = x + (labelW - imgW) / 2;
            const imgY = y + labelH - mmToPt(28);
            doc.image(barcodeBuffer, imgX, imgY, { width: imgW });
            doc.fontSize(7).text(`ISBN: ${livro.isbn || ''}`, innerX, imgY + mmToPt(10), { width: innerW, align: 'center' });
          } catch (err) {
            console.error('Erro barcode (multiple):', err);
          }

        }
        if (index >= livros.length) break;
      }
    }

    doc.end();

    // ✅ Loga sucesso ao final
    registrarLog(
      "Geração de etiquetas múltiplas",
      `Geradas ${livros.length} etiquetas (${livros.map(l => l.titulo).join(", ")}) por ${req.user.nome || "Sistema"}.`,
      req,
      "info"
    );

  } catch (err) {
    console.error('Erro ao gerar etiquetas múltiplas:', err);
    registrarLog(
      "Erro ao gerar etiquetas múltiplas",
      `Erro interno ao gerar etiquetas para IDs: ${ids.join(", ")}.`,
      req,
      "error"
    );
    return res.status(500).json({ error: 'Erro ao gerar etiquetas' });
  }
});
// ==================== RESERVAS ====================

app.post('/reservas', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.body;
  if (!usuarioId || !livroId) {
    registrarLog(
      "Criação de reserva",
      `Tentativa falhou — campos obrigatórios ausentes (usuarioId: ${usuarioId}, livroId: ${livroId}).`,
      req,
      "warn"
    );
    return res.status(400).json({ error: 'usuarioId e livroId são obrigatórios' });
  }

  const instituicaoId = req.user ? req.user.FK_instituicao_id : null;

  // 1️⃣ Contar quantas reservas já existem para o livro
  const sqlCount = `
    SELECT COUNT(*) AS cnt
    FROM reserva_livro
    WHERE FK_livro_id = ?
  `;
  queryCallback(sqlCount, [livroId], (err, rows) => {
    if (err) {
      console.error('Erro ao contar reservas existentes:', err);
      registrarLog(
        "Criação de reserva",
        `Erro ao contar reservas para o livro ID ${livroId}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: 'Erro ao processar reserva (count)' });
    }

    const posicao = (rows[0].cnt || 0) + 1;

    // 2️⃣ Inserir reserva
    const sqlInsertReserva = `
      INSERT INTO reserva (reserva, hora_reserva, retirada, posicao, FK_instituicao_id)
      VALUES (?, CURDATE(), ?, ?, ?)
    `;
    queryCallback(sqlInsertReserva, [1, 0, String(posicao), instituicaoId], (err2, result) => {
      if (err2) {
        console.error('Erro ao inserir reserva:', err2);
        registrarLog(
          "Criação de reserva",
          `Erro ao criar reserva do livro ${livroId} para o usuário ${usuarioId}: ${err2.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: err2.sqlMessage || 'Erro ao inserir reserva' });
      }

      const reservaId = result.insertId;

      // 3️⃣ Vincular livro à reserva
      queryCallback('INSERT INTO reserva_livro (FK_reserva_id, FK_livro_id) VALUES (?, ?)', [reservaId, livroId], (err3) => {
        if (err3) {
          console.error('Erro ao inserir reserva_livro:', err3);
          registrarLog(
            "Criação de reserva",
            `Erro ao vincular livro ${livroId} à reserva ${reservaId}: ${err3.message}`,
            req,
            "error"
          );
          return res.status(500).json({ error: 'Erro ao vincular livro à reserva' });
        }

        // 4️⃣ Vincular usuário à reserva
        queryCallback('INSERT INTO reserva_usuario (FK_reserva_id, FK_usuario_id) VALUES (?, ?)', [reservaId, usuarioId], (err4) => {
          if (err4) {
            console.warn('Aviso: erro ao inserir reserva_usuario:', err4.message);
            registrarLog(
              "Criação de reserva",
              `Aviso — falha ao vincular usuário ${usuarioId} à reserva ${reservaId}: ${err4.message}`,
              req,
              "warn"
            );
          }

          // 5️⃣ Criar histórico
          queryCallback('INSERT INTO historico (data_leitura, FK_instituicao_id) VALUES (NOW(), ?)', [instituicaoId], (err5, histRes) => {
            if (err5) {
              console.error('Erro ao inserir historico:', err5);
              registrarLog(
                "Criação de reserva",
                `Erro ao criar histórico da reserva ${reservaId}: ${err5.message}`,
                req,
                "error"
              );
              return res.status(500).json({ error: 'Erro ao criar histórico' });
            }

            const historicoId = histRes.insertId;

            // 6️⃣ Vincular histórico ao usuário
            queryCallback('INSERT INTO historico_usuario (FK_usuario_id, FK_historico_id) VALUES (?, ?)', [usuarioId, historicoId], (err6) => {
              if (err6) console.warn('Erro ao inserir historico_usuario:', err6.message);
            });

            // 7️⃣ Vincular histórico ao livro
            queryCallback('INSERT INTO historico_livro (FK_historico_id, FK_livro_id) VALUES (?, ?)', [historicoId, livroId], (err7) => {
              if (err7) console.warn('Erro ao inserir historico_livro:', err7.message);

              // ✅ Tudo certo
              registrarLog(
                "Reserva criada",
                `Usuário ${req.user.nome || usuarioId} reservou o livro ID ${livroId} (posição ${posicao}).`,
                req,
                "info"
              );

              return res.status(201).json({
                message: 'Reserva criada e histórico registrado (onde possível).',
                reservaId,
                posicao
              });
            });
          });
        });
      });
    });
  });
});


// ==================== INDICAÇÕES ====================

// --- Criar indicação ---
app.post('/indicacoes/multiplas', autenticarToken, (req, res) => {
  const { usuarioId, indicacaoId, cursoId, serie } = req.body;

  if (!usuarioId || !indicacaoId) {
    registrarLog(
      "Criação de indicação",
      `Tentativa falhou — Campos obrigatórios ausentes (usuarioId: ${usuarioId}, indicacaoId: ${indicacaoId}).`,
      req,
      "warn"
    );
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  const sql = `
    INSERT INTO indicacao_usuario (FK_usuario_id, FK_indicacao_id, FK_curso_id, serie)
    VALUES (?, ?, ?, ?)
  `;

  queryCallback(sql, [usuarioId, indicacaoId, cursoId, serie], (err, result) => {
    if (err) {
      console.error("Erro ao salvar indicação:", err);
      registrarLog(
        "Criação de indicação",
        `Erro ao salvar indicação do usuário ${usuarioId} para a indicação ${indicacaoId}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao salvar indicação." });
    }

    registrarLog(
      "Indicação criada",
      `Usuário ${req.user?.nome || usuarioId} criou uma indicação (ID ${indicacaoId}) para o curso ${cursoId || 'N/A'}, série ${serie || 'N/A'}.`,
      req,
      "info"
    );

    res.json({ success: true });
  });
});


// --- Remover indicação ---
app.delete('/indicacoes/:usuarioId/:livroId', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.params;

  const sqlBusca = `
    SELECT i.id AS indicacao_id
    FROM indicacao i
    JOIN indicacao_usuario iu ON iu.FK_indicacao_id = i.id
    JOIN livro l ON l.id = ?
    WHERE iu.FK_usuario_id = ?;
  `;

  queryCallback(sqlBusca, [livroId, usuarioId], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar indicação:", err);
      registrarLog(
        "Remoção de indicação",
        `Erro ao buscar indicação do livro ${livroId} para o usuário ${usuarioId}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao buscar indicação." });
    }

    if (!rows.length) {
      registrarLog(
        "Remoção de indicação",
        `Nenhuma indicação encontrada para o livro ${livroId} e usuário ${usuarioId}.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: "Nenhuma indicação encontrada." });
    }

    const indicacaoId = rows[0].indicacao_id;

    const sqlDelete = `
      DELETE FROM indicacao_usuario
      WHERE FK_indicacao_id = ? AND FK_usuario_id = ?
    `;

    queryCallback(sqlDelete, [indicacaoId, usuarioId], (err) => {
      if (err) {
        console.error("Erro ao remover indicação:", err);
        registrarLog(
          "Remoção de indicação",
          `Erro ao remover indicação ${indicacaoId} do usuário ${usuarioId}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: "Erro ao remover indicação." });
      }

      registrarLog(
        "Indicação removida",
        `Usuário ${req.user?.nome || usuarioId} removeu a indicação ${indicacaoId} (livro ${livroId}).`,
        req,
        "info"
      );

      res.json({ success: true });
    });
  });
});

//=================  Eventos =================
app.post("/eventos", autenticarToken, upload.single("foto"), async (req, res) => {
  try {
    const { nome, descri, hora, data } = req.body;

    const titulo = nome;
    const descricao = descri;
    const data_evento = data;
    const hora_evento = hora;
    const foto = req.file ? req.file.filename : null;
    const FK_instituicao_id = req.user?.FK_instituicao_id || 1;
    const FK_funcionario_id = req.user?.id || null;

    await pool.query(
      `INSERT INTO evento 
        (titulo, descricao, data_evento, hora_evento, foto, FK_instituicao_id, FK_funcionario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao, data_evento, hora_evento, foto, FK_instituicao_id, FK_funcionario_id]
    );

    // ✅ Logar ação de criação de evento
    registrarLog(
      "Evento cadastrado",
      `O usuário ${req.user?.nome || FK_funcionario_id} cadastrou o evento "${titulo}" (data ${data_evento}, hora ${hora_evento}).`,
      req,
      "info"
    );

    res.status(201).json({ message: "Evento cadastrado com sucesso!" });
  } catch (err) {
    console.error("Erro ao cadastrar evento:", err);

    // ❌ Logar erro
    registrarLog(
      "Erro ao cadastrar evento",
      `Falha ao cadastrar evento: ${err.message}`,
      req,
      "error"
    );

    res.status(500).json({ error: "Erro ao cadastrar evento." });
  }
});


//=================  Buscar evento mais recente =================
app.get("/eventos/recente", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo, descricao, data_evento, hora_evento, foto
       FROM evento 
       ORDER BY data_evento DESC, hora_evento DESC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      registrarLog("Busca de evento recente", "Nenhum evento encontrado no sistema.", req, "warn");
      return res.json(null);
    }

    registrarLog(
      "Busca de evento recente",
      `Evento mais recente consultado: "${rows[0].titulo}" (data ${rows[0].data_evento}).`,
      req,
      "info"
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar evento mais recente:", err);
    registrarLog(
      "Erro ao buscar evento recente",
      `Erro interno ao consultar evento recente: ${err.message}`,
      req,
      "error"
    );
    res.status(500).json({ error: "Erro ao buscar evento mais recente." });
  }
});


//=================  Listar todos os eventos =================
app.get("/eventos", autenticarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, titulo, descricao, data_evento, hora_evento, foto FROM evento ORDER BY data_evento ASC"
    );

    registrarLog(
      "Listagem de eventos",
      `Usuário ${req.user?.nome || req.user?.id} visualizou a lista de ${rows.length} eventos.`,
      req,
      "info"
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    registrarLog(
      "Erro ao listar eventos",
      `Erro ao buscar eventos: ${err.message}`,
      req,
      "error"
    );
    res.status(500).json({ error: "Erro ao buscar eventos." });
  }
});


//=================  Indicar livro para múltiplas turmas =================
app.post('/indicacoes/multiplas-turmas', autenticarToken, (req, res) => {
  const { usuarioId, livroId, turmas } = req.body;

  if (!usuarioId || !livroId || !Array.isArray(turmas) || turmas.length === 0) {
    registrarLog("Erro ao indicar livro", `Usuário ${req.user?.nome || usuarioId} enviou dados inválidos.`, req, "warn");
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  queryCallback(
    'SELECT FK_tipo_usuario_id, nome FROM usuario WHERE id = ?',
    [usuarioId],
    (err, usuarioResults) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        registrarLog("Erro ao buscar usuário", `Erro interno ao buscar usuário ${usuarioId}: ${err.message}`, req, "error");
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      if (usuarioResults.length === 0 || usuarioResults[0].FK_tipo_usuario_id !== 2) {
        registrarLog("Tentativa de indicação não autorizada", `Usuário ${req.user?.nome || usuarioId} tentou indicar livro, mas não é professor.`, req, "warn");
        return res.status(403).json({ error: 'Apenas professores podem indicar livros' });
      }

      const nomeUsuario = usuarioResults[0].nome || `Usuário ${usuarioId}`;

      const indicacoesPromises = turmas.map(turma => {
        return new Promise((resolve, reject) => {
          const { cursoId, serie } = turma;

          queryCallback(
            `SELECT i.id 
             FROM indicacao i
             JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
             WHERE iu.FK_usuario_id = ? AND i.indicacao = ? AND iu.FK_curso_id = ? AND iu.serie = ?`,
            [usuarioId, livroId.toString(), cursoId, serie],
            (err, results) => {
              if (err) return reject(err);

              if (results.length > 0) {
                registrarLog(
                  "Indicação duplicada",
                  `${nomeUsuario} tentou indicar novamente o livro ${livroId} para curso ${cursoId} - série ${serie}.`,
                  req,
                  "warn"
                );
                return resolve({ cursoId, serie, status: 'já_existe' });
              }

              queryCallback(
                'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
                [livroId.toString(), req.user?.FK_instituicao_id || 1],
                (err, result) => {
                  if (err) return reject(err);

                  const indicacaoId = result.insertId;

                  queryCallback(
                    'INSERT INTO indicacao_usuario (FK_indicacao_id, FK_usuario_id, FK_curso_id, serie) VALUES (?, ?, ?, ?)',
                    [indicacaoId, usuarioId, cursoId, serie],
                    (err) => {
                      if (err) return reject(err);

                      registrarLog(
                        "Nova indicação",
                        `${nomeUsuario} indicou o livro ${livroId} para o curso ${cursoId} - série ${serie}.`,
                        req,
                        "info"
                      );
                      resolve({ cursoId, serie, status: 'sucesso' });
                    }
                  );
                }
              );
            }
          );
        });
      });

      Promise.all(indicacoesPromises)
        .then(results => {
          const sucessos = results.filter(r => r.status === 'sucesso');
          const jaExistentes = results.filter(r => r.status === 'já_existe');

          registrarLog(
            "Processamento de indicações",
            `${nomeUsuario} processou ${sucessos.length} novas indicações (${jaExistentes.length} já existentes).`,
            req,
            "info"
          );

          res.status(201).json({
            message: `Indicações processadas: ${sucessos.length} novas, ${jaExistentes.length} já existiam`,
            detalhes: results
          });
        })
        .catch(error => {
          console.error('Erro ao processar indicações:', error);
          registrarLog("Erro ao processar indicações", `Falha ao registrar indicações de ${nomeUsuario}: ${error.message}`, req, "error");
          res.status(500).json({ error: 'Erro ao processar indicações' });
        });
    }
  );
});
//=================  Depurar turmas =================
app.get('/turmas', autenticarToken, (req, res) => {
  console.log('=== INICIANDO DEBUG TURMAS ===');
  registrarLog("Depuração de turmas iniciada", `${req.user?.nome || 'Usuário'} iniciou a verificação de turmas.`, req, "info");

  // 1. Primeiro, verifica todos os cursos
  queryCallback('SELECT id, curso FROM curso', (err, cursos) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
      registrarLog("Erro em depuração de turmas", `Falha ao buscar cursos: ${err.message}`, req, "error");
      return res.status(500).json({ error: 'Erro ao buscar cursos', details: err.message });
    }

    console.log('Cursos encontrados:', cursos);

    // 2. Verifica usuários com curso e série
    queryCallback(`
      SELECT id, nome, curso_id, serie 
      FROM usuario 
      WHERE curso_id IS NOT NULL AND serie IS NOT NULL
      ORDER BY curso_id, serie
    `, (err, usuarios) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        registrarLog("Erro em depuração de turmas", `Falha ao buscar usuários: ${err.message}`, req, "error");
        return res.status(500).json({ error: 'Erro ao buscar usuários', details: err.message });
      }

      console.log('Usuários com curso e série:', usuarios);

      // 3. Agrupa por curso e série
      const turmasAgrupadas = {};
      usuarios.forEach(usuario => {
        const chave = `${usuario.curso_id}-${usuario.serie}`;
        if (!turmasAgrupadas[chave]) {
          turmasAgrupadas[chave] = {
            curso_id: usuario.curso_id,
            serie: usuario.serie,
            quantidade: 0
          };
        }
        turmasAgrupadas[chave].quantidade++;
      });

      console.log('Turmas agrupadas:', Object.values(turmasAgrupadas));

      // 4. Testa a query original
      queryCallback(`
        SELECT DISTINCT c.id, c.curso, u.serie 
        FROM curso c 
        JOIN usuario u ON c.id = u.curso_id 
        WHERE u.serie IS NOT NULL 
        ORDER BY c.curso, u.serie
      `, (err, resultadoQuery) => {
        if (err) {
          console.error('Erro na query original:', err);
          registrarLog("Erro em depuração de turmas", `Erro na query original: ${err.message}`, req, "error");
          return res.status(500).json({ error: 'Erro na query original', details: err.message });
        }

        console.log('Resultado da query original:', resultadoQuery);

        registrarLog(
          "Depuração de turmas concluída",
          `${req.user?.nome || 'Usuário'} finalizou a depuração com ${usuarios.length} usuários e ${cursos.length} cursos encontrados.`,
          req,
          "info"
        );

        res.json({
          total_cursos: cursos.length,
          cursos: cursos,
          total_usuarios_com_curso: usuarios.length,
          usuarios: usuarios,
          turmas_agrupadas: Object.values(turmasAgrupadas),
          query_original: resultadoQuery
        });
      });
    });
  });
});

//=================  Indicar livro para uma turma =================
app.post('/indicacoes', autenticarToken, (req, res) => {
  const { usuarioId, livroId, cursoId, serie } = req.body;

  registrarLog(
    "Indicação de livro iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a indicação do livro ${livroId} para o curso ${cursoId}, série ${serie}.`,
    req,
    "info"
  );

  // 1. Verificar se usuário é professor
  queryCallback(
    'SELECT FK_tipo_usuario_id, nome FROM usuario WHERE id = ?',
    [usuarioId],
    (err, usuarioResults) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        registrarLog("Erro ao buscar usuário", `Falha ao buscar usuário ${usuarioId}: ${err.message}`, req, "error");
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      if (usuarioResults.length === 0 || usuarioResults[0].FK_tipo_usuario_id !== 2) {
        registrarLog("Acesso negado", `Usuário ${usuarioId} tentou indicar livro, mas não é professor.`, req, "warn");
        return res.status(403).json({ error: 'Apenas professores podem indicar livros' });
      }

      const nomeProfessor = usuarioResults[0].nome;

      // 2. Verificar se já indicou este livro para a mesma turma
      queryCallback(
        `SELECT i.id 
         FROM indicacao i
         JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
         WHERE iu.FK_usuario_id = ? AND i.indicacao = ? AND iu.FK_curso_id = ? AND iu.serie = ?`,
        [usuarioId, livroId.toString(), cursoId, serie],
        (err, indicacoesResults) => {
          if (err) {
            console.error('Erro ao verificar indicações:', err);
            registrarLog("Erro ao verificar indicações", `Erro ao verificar indicações do livro ${livroId}: ${err.message}`, req, "error");
            return res.status(500).json({ error: 'Erro interno no servidor' });
          }

          if (indicacoesResults.length > 0) {
            registrarLog("Indicação duplicada", `${nomeProfessor} tentou indicar novamente o livro ${livroId} para o curso ${cursoId} - série ${serie}.`, req, "warn");
            return res.status(409).json({ error: 'Você já indicou este livro para esta turma' });
          }

          // 3. Criar indicação
          queryCallback(
            'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
            [livroId.toString(), req.user?.FK_instituicao_id || 1],
            (err, result) => {
              if (err) {
                console.error('Erro ao criar indicação:', err);
                registrarLog("Erro ao criar indicação", `Falha ao criar registro de indicação para o livro ${livroId}: ${err.message}`, req, "error");
                return res.status(500).json({ error: 'Erro interno no servidor' });
              }

              const indicacaoId = result.insertId;

              // 4. Vincular usuário e turma à indicação
              queryCallback(
                'INSERT INTO indicacao_usuario (FK_indicacao_id, FK_usuario_id, FK_curso_id, serie) VALUES (?, ?, ?, ?)',
                [indicacaoId, usuarioId, cursoId, serie],
                (err) => {
                  if (err) {
                    console.error('Erro ao vincular indicação:', err);
                    registrarLog("Erro ao vincular indicação", `Erro ao vincular indicação ${indicacaoId} (livro ${livroId}) ao curso ${cursoId}, série ${serie}: ${err.message}`, req, "error");
                    return res.status(500).json({ error: 'Erro interno no servidor' });
                  }

                  registrarLog(
                    "Indicação criada",
                    `${nomeProfessor} indicou o livro ${livroId} para o curso ${cursoId} - série ${serie}.`,
                    req,
                    "info"
                  );

                  res.status(201).json({ message: 'Livro indicado com sucesso para a turma!' });
                }
              );
            }
          );
        }
      );
    }
  );
});

//=================  Verificar se usuário já indicou o livro =================
app.get('/verificar-indicacao/:usuarioId/:livroId', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.params;

  registrarLog(
    "Verificação de indicação iniciada",
    `${req.user?.nome || 'Usuário'} está verificando se o usuário ${usuarioId} já indicou o livro ${livroId}.`,
    req,
    "info"
  );

  queryCallback(
    `SELECT i.id 
     FROM indicacao i
     JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
     WHERE iu.FK_usuario_id = ? AND i.indicacao = ?`,
    [usuarioId, livroId.toString()],
    (err, results) => {
      if (err) {
        console.error('Erro ao verificar indicação:', err);
        registrarLog(
          "Erro ao verificar indicação",
          `Falha ao verificar se o usuário ${usuarioId} indicou o livro ${livroId}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      const indicado = results.length > 0;

      registrarLog(
        "Verificação de indicação concluída",
        `${req.user?.nome || 'Usuário'} verificou a indicação: usuário ${usuarioId} ${indicado ? 'já indicou' : 'ainda não indicou'} o livro ${livroId}.`,
        req,
        "info"
      );

      res.json({ indicado });
    }
  );
});


//=================  Buscar todas as indicações feitas por um professor =================
app.get('/indicacoes-professor/:usuarioId', autenticarToken, (req, res) => {
  const { usuarioId } = req.params;

  registrarLog(
    "Listagem de indicações iniciada",
    `${req.user?.nome || 'Usuário'} está buscando todas as indicações do professor ${usuarioId}.`,
    req,
    "info"
  );

  queryCallback(
    `SELECT i.indicacao AS livro_id, i.id AS indicacao_id
     FROM indicacao i
     JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
     WHERE iu.FK_usuario_id = ?`,
    [usuarioId],
    (err, indicacoes) => {
      if (err) {
        console.error('Erro ao buscar indicações:', err);
        registrarLog(
          "Erro ao buscar indicações",
          `Falha ao buscar indicações do professor ${usuarioId}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      registrarLog(
        "Listagem de indicações concluída",
        `${req.user?.nome || 'Usuário'} listou ${indicacoes.length} indicações feitas pelo professor ${usuarioId}.`,
        req,
        "info"
      );

      res.json(indicacoes);
    }
  );
});
//================= LOGIN DE USUÁRIO E FUNCIONÁRIO (seguro + validado) =================
app.post(
  '/login',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('senha').isString().isLength({ min: 6 }),
  handleValidationErrors,
  async (req, res) => {
    const { email, senha } = req.body;

    try {
      registrarLog("Tentativa de login", `Tentativa de login com o e-mail ${email}`, req, "info");

      // --- Login de usuário ---
      const [users] = await pool.query(`
        SELECT id, nome, FK_tipo_usuario_id, foto, FK_instituicao_id, senha, curso_id, serie
        FROM usuario
        WHERE email = ?
        LIMIT 1
      `, [email]);

      if (users.length > 0) {
        const usuario = users[0];
        const match = await bcrypt.compare(senha, usuario.senha);

        if (!match) {
          registrarLog("Login falhou", `Senha incorreta para o e-mail ${email}`, req, "warn");
          return res.status(401).json({ error: "Email ou senha inválidos" });
        }

        await pool.query(`UPDATE usuario SET ultimo_login = NOW() WHERE id = ?`, [usuario.id]);

        const token = jwt.sign({
          id: usuario.id,
          nome: usuario.nome,
          email,
          tipo_usuario_id: usuario.FK_tipo_usuario_id,
          FK_instituicao_id: usuario.FK_instituicao_id,
          curso_id: usuario.curso_id,
          serie: usuario.serie
        }, SECRET, { expiresIn: '8h' });

        registrarLog(
          "Login bem-sucedido (usuário)",
          `Usuário ${usuario.nome} (ID ${usuario.id}) efetuou login com sucesso.`,
          req,
          "info"
        );

        return res.status(200).json({
          message: 'Login usuário bem-sucedido',
          token,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            tipo_usuario_id: usuario.FK_tipo_usuario_id,
            FK_instituicao_id: usuario.FK_instituicao_id,
            curso_id: usuario.curso_id,
            serie: usuario.serie,
            foto: usuario.foto || 'padrao.png'
          }
        });
      }

      // --- Login de funcionário ---
      const [funcionarios] = await pool.query(`
        SELECT f.id, f.nome, f.email, f.senha, f.telefone, f.foto,
               f.FK_funcao_id AS funcao_id,
               f.FK_instituicao_id, fn.funcao AS funcao_nome
        FROM funcionario f
        LEFT JOIN funcao fn ON f.FK_funcao_id = fn.id
        WHERE f.email = ?
        LIMIT 1
      `, [email]);

      if (funcionarios.length === 0) {
        registrarLog("Login falhou", `E-mail ${email} não encontrado no sistema.`, req, "warn");
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const funcionario = funcionarios[0];
      const matchFunc = await bcrypt.compare(senha, funcionario.senha);

      if (!matchFunc) {
        registrarLog("Login falhou (funcionário)", `Senha incorreta para o e-mail ${email}`, req, "warn");
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      await pool.query(`UPDATE funcionario SET ultimo_login = NOW() WHERE id = ?`, [funcionario.id]);

      const token = jwt.sign({
        id: funcionario.id,
        nome: funcionario.nome,
        email,
        role: "funcionario",
        funcao: funcionario.funcao_id,
        FK_instituicao_id: funcionario.FK_instituicao_id,
      }, SECRET, { expiresIn: '8h' });

      registrarLog(
        "Login bem-sucedido (funcionário)",
        `Funcionário ${funcionario.nome} (ID ${funcionario.id}) efetuou login com sucesso.`,
        req,
        "info"
      );

      return res.status(200).json({
        message: "Login funcionário bem-sucedido",
        token,
        funcionario: {
          id: funcionario.id,
          nome: funcionario.nome,
          email: funcionario.email,
          telefone: funcionario.telefone,
          funcao_id: funcionario.funcao_id,
          FK_instituicao_id: funcionario.FK_instituicao_id,
          funcao_nome: funcionario.funcao_nome,
          foto: funcionario.foto || "padrao.png"
        }
      });

    } catch (err) {
      console.error("🔥 Erro detalhado no login:", err);
      registrarLog("Erro interno no login", `Erro inesperado ao processar login (${email}): ${err.message}`, req, "error");
      return res.status(500).json({ error: "Erro no servidor", detalhe: err.message });
    }
  }
);

// ================= ROTAS DE FUNCIONARIO =================

// ==================== CADASTRO FUNCIONÁRIO ====================
app.post('/api/funcionarios', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const { nome, senha, email, telefone, FK_funcao_id } = req.body;
    let permissoes = req.body['permissoes[]'] || [];

    registrarLog(
      "Cadastro de funcionário iniciado",
      `${req.user?.nome || 'Usuário'} iniciou o cadastro de um novo funcionário (${nome || 'sem nome informado'}).`,
      req,
      "info"
    );

    if (typeof permissoes === "string") {
      permissoes = [permissoes];
    }

    let foto = req.file ? req.file.filename : 'padrao.png';

    if (!nome || !email) {
      registrarLog(
        "Erro no cadastro de funcionário",
        `${req.user?.nome || 'Usuário'} tentou cadastrar funcionário, mas faltam campos obrigatórios.`,
        req,
        "warn"
      );
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }

    if (telefone && !telefoneValido(telefone)) {
      registrarLog(
        "Erro no cadastro de funcionário",
        `${req.user?.nome || 'Usuário'} informou telefone inválido (${telefone}) ao cadastrar funcionário ${nome}.`,
        req,
        "warn"
      );
      return res.status(400).json({ error: 'Telefone inválido.' });
    }

    // Processar e redimensionar a imagem, se enviada
    if (req.file) {
      foto = Date.now() + '.jpg';
      const uploadDir = path.join(__dirname, '..', 'uploads', foto);

      await sharp(req.file.path)
        .resize(300, 300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(uploadDir);

      fs.unlinkSync(req.file.path);
    }

    const checkEmailSql = `SELECT id FROM funcionario WHERE email = ?`;
    queryCallback(checkEmailSql, [email], (err, results) => {
      if (err) {
        console.error('Erro ao verificar e-mail:', err);
        registrarLog(
          "Erro ao verificar e-mail",
          `Falha ao verificar e-mail ${email}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
      }

      if (results.length > 0) {
        registrarLog(
          "Cadastro de funcionário bloqueado",
          `${req.user?.nome || 'Usuário'} tentou cadastrar funcionário com e-mail duplicado (${email}).`,
          req,
          "warn"
        );
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

      bcrypt.hash(senhaFinal, 12)
        .then((hash) => {
          const sql = `
            INSERT INTO funcionario 
              (nome, senha, email, foto, telefone, FK_funcao_id, FK_instituicao_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          queryCallback(sql, [nome, hash, email, foto, telefone, FK_funcao_id, req.user.FK_instituicao_id], (err, result) => {
            if (err) {
              console.error("Erro no INSERT:", err);
              registrarLog(
                "Erro ao cadastrar funcionário",
                `Erro ao inserir funcionário ${nome} (${email}): ${err.message}`,
                req,
                "error"
              );
              return res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
            }

            const funcionarioId = result.insertId;

            registrarLog(
              "Cadastro de funcionário concluído",
              `${req.user?.nome || 'Usuário'} cadastrou o funcionário ${nome} (ID ${funcionarioId}, e-mail ${email}).`,
              req,
              "info"
            );

            return res.status(200).json({
              message: 'Funcionário cadastrado com sucesso!',
              senhaGerada: senhaFinal
            });
          });
        })
        .catch(err => {
          console.error('Erro ao gerar hash da senha (func):', err);
          registrarLog(
            "Erro ao gerar hash da senha",
            `Erro ao processar senha do funcionário ${nome}: ${err.message}`,
            req,
            "error"
          );
          return res.status(500).json({ error: 'Erro ao processar senha' });
        });

    });

  } catch (error) {
    console.error("Erro inesperado:", error);
    registrarLog(
      "Erro inesperado no cadastro de funcionário",
      `Erro inesperado ao cadastrar funcionário: ${error.message}`,
      req,
      "error"
    );
    return res.status(500).json({ error: 'Erro inesperado no servidor.' });
  }
});

// Função para validar senha forte
function senhaValida(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(senha);
}

// ==================== BUSCAR FUNCIONÁRIO PELO ID ====================
app.get('/api/funcionarios/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  registrarLog(
    "Busca de funcionário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a busca pelo funcionário ID ${id}.`,
    req,
    "info"
  );

  const sql = `
    SELECT f.*, f.telefone, fu.funcao AS nome_funcao
    FROM funcionario f
    LEFT JOIN funcao fu ON f.FK_funcao_id = fu.id
    WHERE f.id = ? AND f.FK_instituicao_id = ?
  `;

  queryCallback(sql, [id, req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar funcionário:", err);
      registrarLog("Erro ao buscar funcionário", `Falha ao buscar funcionário ID ${id}: ${err.message}`, req, "error");
      return res.status(500).json({ error: "Erro ao buscar funcionário" });
    }

    if (results.length === 0) {
      registrarLog(
        "Funcionário não encontrado",
        `${req.user?.nome || 'Usuário'} tentou acessar o funcionário ID ${id}, que não pertence à sua instituição.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: "Funcionário não encontrado ou não pertence à sua instituição" });
    }

    registrarLog(
      "Busca de funcionário concluída",
      `${req.user?.nome || 'Usuário'} visualizou os dados do funcionário ${results[0].nome} (ID ${id}).`,
      req,
      "info"
    );

    res.json({ funcionario: results[0] });
  });
});


// ==================== BUSCAR INDICAÇÕES POR CURSO E SÉRIE ====================
app.get('/indicacoes/:cursoId/:serie', autenticarToken, (req, res) => {
  const { cursoId, serie } = req.params;

  registrarLog(
    "Consulta de indicações iniciada",
    `${req.user?.nome || 'Usuário'} está consultando indicações do curso ${cursoId}, série ${serie}.`,
    req,
    "info"
  );

  const sql = `
    SELECT l.id, l.titulo, l.capa, l.sinopse, c.curso, iu.serie
    FROM indicacao_usuario iu
    JOIN indicacao i ON iu.FK_indicacao_id = i.id
    JOIN livro l ON i.indicacao = l.id
    JOIN curso c ON iu.FK_curso_id = c.id
    WHERE iu.FK_curso_id = ? AND iu.serie = ?
  `;

  queryCallback(sql, [cursoId, serie], (err, results) => {
    if (err) {
      console.error('Erro ao buscar indicações:', err);
      registrarLog("Erro na consulta de indicações", `Falha ao buscar indicações do curso ${cursoId}, série ${serie}: ${err.message}`, req, "error");
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    registrarLog(
      "Consulta de indicações concluída",
      `${req.user?.nome || 'Usuário'} consultou ${results.length} indicações do curso ${cursoId}, série ${serie}.`,
      req,
      "info"
    );

    res.json(results);
  });
});


// ==================== EXCLUSÃO DE FUNCIONÁRIO E DEPENDÊNCIAS ====================
app.delete('/api/funcionarios/:id', autenticarToken, (req, res) => {
  const id = parseInt(req.params.id);

  registrarLog(
    "Exclusão de funcionário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a exclusão do funcionário ID ${id}.`,
    req,
    "info"
  );

  const sqlUsuarios = 'SELECT id FROM usuario WHERE FK_funcionario_id = ?';
  queryCallback(sqlUsuarios, [id], (err, usuarios) => {
    if (err) {
      registrarLog("Erro na exclusão", `Erro ao buscar usuários vinculados ao funcionário ${id}: ${err.message}`, req, "error");
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    const usuarioIds = usuarios.map(u => u.id);

    const deletarFuncionario = () => {
      queryCallback('DELETE FROM funcionario WHERE id = ?', [id], (err, result) => {
        if (err) {
          registrarLog("Erro ao excluir funcionário", `Erro ao excluir funcionário ID ${id}: ${err.message}`, req, "error");
          return res.status(500).json({ error: 'Erro ao excluir funcionário' });
        }

        if (result.affectedRows === 0) {
          registrarLog("Funcionário não encontrado", `Tentativa de exclusão de funcionário inexistente (ID ${id}).`, req, "warn");
          return res.status(404).json({ error: 'Funcionário não encontrado' });
        }

        registrarLog("Exclusão concluída", `${req.user?.nome || 'Usuário'} excluiu o funcionário ID ${id} com sucesso.`, req, "info");
        res.status(200).json({ message: 'Funcionário excluído com sucesso' });
      });
    };

    if (usuarioIds.length > 0) {
      // Usuários vinculados — remover dependências primeiro
      queryCallback('DELETE FROM usuario_curso WHERE FK_usuario_id IN (?)', [usuarioIds], (err) => {
        if (err) {
          registrarLog("Erro ao excluir dependências", `Erro ao remover usuario_curso de usuários vinculados ao funcionário ${id}: ${err.message}`, req, "error");
          return res.status(500).json({ error: 'Erro ao deletar usuario_curso' });
        }

        queryCallback('DELETE FROM usuario WHERE id IN (?)', [usuarioIds], (err) => {
          if (err) {
            registrarLog("Erro ao excluir usuários vinculados", `Erro ao excluir usuários vinculados ao funcionário ${id}: ${err.message}`, req, "error");
            return res.status(500).json({ error: 'Erro ao deletar usuários' });
          }

          deletarFuncionario();
        });
      });
    } else {
      // Sem usuários vinculados
      deletarFuncionario();
    }
  });
});


// ==================== LISTAR FUNÇÕES DE FUNCIONÁRIOS ====================
app.get("/funcoes", autenticarToken, (req, res) => {
  registrarLog(
    "Listagem de funções iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a listagem de funções de funcionários.`,
    req,
    "info"
  );

  const sql = "SELECT id, funcao FROM funcao";
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar funções:", err);
      registrarLog(
        "Erro na listagem de funções",
        `Falha ao listar funções: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro no servidor" });
    }

    registrarLog(
      "Listagem de funções concluída",
      `${req.user?.nome || 'Usuário'} listou ${results.length} funções de funcionários.`,
      req,
      "info"
    );

    res.json(results);
  });
});


// ==================== LISTAR FUNCIONÁRIOS (MESMA INSTITUIÇÃO) ====================
app.get('/api/funcionarios', autenticarToken, (req, res) => {
  registrarLog(
    "Listagem de funcionários iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a listagem de funcionários da instituição ${req.user.FK_instituicao_id}.`,
    req,
    "info"
  );

  const sql = `
    SELECT 
      f.id, 
      f.nome, 
      f.email, 
      f.telefone, 
      f.foto, 
      f.ultimo_login,
      f.FK_funcao_id,
      fun.funcao AS funcao,
      CASE
        WHEN f.ultimo_login IS NULL THEN 'Inativo'
        WHEN DATEDIFF(NOW(), f.ultimo_login) > 15 THEN 'Inativo'
        ELSE 'Ativo'
      END AS status
    FROM funcionario f
    LEFT JOIN funcao fun ON f.FK_funcao_id = fun.id
    WHERE f.FK_instituicao_id = ?
  `;

  queryCallback(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      registrarLog(
        "Erro na listagem de funcionários",
        `Falha ao buscar funcionários da instituição ${req.user.FK_instituicao_id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    registrarLog(
      "Listagem de funcionários concluída",
      `${req.user?.nome || 'Usuário'} listou ${results.length} funcionários da instituição ${req.user.FK_instituicao_id}.`,
      req,
      "info"
    );

    res.json(results);
  });
});
// ==================== ATUALIZAR FUNCIONÁRIO (com foto) ====================
app.put('/api/funcionarios/:id', autenticarToken, upload.single("foto"), (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, FK_funcao_id } = req.body;
  const foto = req.file ? req.file.filename : undefined;

  registrarLog(
    "Atualização de funcionário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a atualização do funcionário ID ${id}.`,
    req,
    "info"
  );

  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (telefone !== undefined) { updates.push("telefone = ?"); values.push(telefone); }
  if (FK_funcao_id !== undefined) { updates.push("FK_funcao_id = ?"); values.push(FK_funcao_id); }
  if (foto !== undefined) { updates.push("foto = ?"); values.push(foto); }

  if (updates.length === 0) {
    registrarLog(
      "Atualização de funcionário cancelada",
      `${req.user?.nome || 'Usuário'} tentou atualizar o funcionário ID ${id}, mas não enviou nenhum campo.`,
      req,
      "warn"
    );
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  const sql = `UPDATE funcionario SET ${updates.join(", ")} WHERE id = ? AND FK_instituicao_id = ?`;
  values.push(id, req.user.FK_instituicao_id);

  queryCallback(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar funcionário:", err);
      registrarLog(
        "Erro na atualização de funcionário",
        `Falha ao atualizar o funcionário ID ${id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao atualizar funcionário" });
    }

    if (result.affectedRows === 0) {
      registrarLog(
        "Funcionário não encontrado na atualização",
        `${req.user?.nome || 'Usuário'} tentou atualizar o funcionário ID ${id}, mas ele não pertence à sua instituição ou não existe.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    registrarLog(
      "Atualização de funcionário concluída",
      `${req.user?.nome || 'Usuário'} atualizou com sucesso o funcionário ID ${id} (${[
        nome ? `nome: ${nome}` : "",
        email ? `email: ${email}` : "",
        telefone ? `telefone: ${telefone}` : "",
        FK_funcao_id ? `função: ${FK_funcao_id}` : "",
        foto ? `nova foto: ${foto}` : ""
      ].filter(Boolean).join(", ")}).`,
      req,
      "info"
    );

    res.json({ message: "Funcionário atualizado com sucesso!" });
  });
});


// ================= ROTAS DE USUÁRIO =================


// ================= LISTAR TODOS USUÁRIOS DA MESMA INSTITUIÇÃO =================
app.get('/api/usuarios', autenticarToken, (req, res) => {
  registrarLog(
    "Listagem de usuários iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a listagem de todos os usuários da instituição ${req.user.FK_instituicao_id}.`,
    req,
    "info"
  );

  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto, u.senha,
           tu.tipo AS tipo,
           u.FK_tipo_usuario_id,
           c.curso AS nome_curso,
           u.serie
    FROM usuario u
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    LEFT JOIN curso c ON u.curso_id = c.id
    WHERE u.FK_instituicao_id = ?
  `;

  queryCallback(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      registrarLog(
        "Erro na listagem de usuários",
        `Falha ao listar usuários da instituição ${req.user.FK_instituicao_id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }

    registrarLog(
      "Listagem de usuários concluída",
      `${req.user?.nome || 'Usuário'} listou ${results.length} usuários da instituição ${req.user.FK_instituicao_id}.`,
      req,
      "info"
    );

    res.json(results);
  });
});


// ================= BUSCAR USUÁRIO PELO ID =================
app.get('/api/usuario/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  registrarLog(
    "Busca de usuário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a busca pelo usuário ID ${id}.`,
    req,
    "info"
  );

  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto, u.senha,
           tu.tipo AS tipo,
           u.FK_tipo_usuario_id,
           c.curso AS nome_curso,
           u.serie
    FROM usuario u
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    LEFT JOIN curso c ON u.curso_id = c.id
    WHERE u.id = ? AND u.FK_instituicao_id = ?
  `;

  queryCallback(sql, [id, req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      registrarLog(
        "Erro na busca de usuário",
        `Erro ao buscar usuário ID ${id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (results.length === 0) {
      registrarLog(
        "Usuário não encontrado",
        `${req.user?.nome || 'Usuário'} tentou acessar o usuário ID ${id}, que não pertence à sua instituição.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    registrarLog(
      "Busca de usuário concluída",
      `${req.user?.nome || 'Usuário'} visualizou os dados do usuário ${results[0].nome} (ID ${id}).`,
      req,
      "info"
    );

    res.json({ usuario: results[0] });
  });
});


// ================= ATUALIZAR USUÁRIO =================
app.put('/api/usuarios/:id', autenticarToken, upload.single('foto'), async (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, senha, curso_id, serie, FK_tipo_usuario_id } = req.body;
  const foto = req.file ? req.file.filename : undefined;

  registrarLog(
    "Atualização de usuário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a atualização do usuário ID ${id}.`,
    req,
    "info"
  );

  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (telefone !== undefined) { updates.push("telefone = ?"); values.push(telefone); }

  // Criptografa a senha se enviada
  if (senha !== undefined && senha.trim() !== "") {
    try {
      const hash = await bcrypt.hash(senha, 12);
      updates.push("senha = ?");
      values.push(hash);
    } catch (err) {
      console.error("Erro ao gerar hash da senha:", err);
      registrarLog(
        "Erro ao criptografar senha",
        `Erro ao criptografar senha do usuário ID ${id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao processar senha." });
    }
  }

  if (curso_id !== undefined) { updates.push("curso_id = ?"); values.push(curso_id); }
  if (serie !== undefined) { updates.push("serie = ?"); values.push(serie); }
  if (FK_tipo_usuario_id !== undefined) { updates.push("FK_tipo_usuario_id = ?"); values.push(FK_tipo_usuario_id); }
  if (foto !== undefined) { updates.push("foto = ?"); values.push(foto); }

  if (updates.length === 0) {
    registrarLog(
      "Atualização de usuário cancelada",
      `${req.user?.nome || 'Usuário'} tentou atualizar o usuário ID ${id}, mas não enviou nenhum campo.`,
      req,
      "warn"
    );
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  const sql = `UPDATE usuario SET ${updates.join(", ")} WHERE id = ? AND FK_instituicao_id = ?`;
  values.push(id, req.user.FK_instituicao_id);

  queryCallback(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar usuário:", err);
      registrarLog(
        "Erro na atualização de usuário",
        `Erro ao atualizar o usuário ID ${id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao atualizar usuário." });
    }

    if (result.affectedRows === 0) {
      registrarLog(
        "Usuário não encontrado na atualização",
        `${req.user?.nome || 'Usuário'} tentou atualizar o usuário ID ${id}, mas ele não pertence à sua instituição ou não existe.`,
        req,
        "warn"
      );
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    registrarLog(
      "Atualização de usuário concluída",
      `${req.user?.nome || 'Usuário'} atualizou com sucesso o usuário ID ${id} (${[
        nome ? `nome: ${nome}` : "",
        email ? `email: ${email}` : "",
        telefone ? `telefone: ${telefone}` : "",
        curso_id ? `curso_id: ${curso_id}` : "",
        serie ? `série: ${serie}` : "",
        FK_tipo_usuario_id ? `tipo: ${FK_tipo_usuario_id}` : "",
        foto ? `nova foto: ${foto}` : ""
      ].filter(Boolean).join(", ")}).`,
      req,
      "info"
    );

    res.json({ message: "Usuário atualizado com sucesso!" });
  });
});

// ================= DELETAR USUÁRIO =================
app.delete('/api/usuarios/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  registrarLog(
    "Exclusão de usuário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a exclusão do usuário ID ${id}.`,
    req,
    "info"
  );

  const sqlDependencias = 'DELETE FROM usuario_curso WHERE FK_usuario_id = ?';
  queryCallback(sqlDependencias, [id], (err) => {
    if (err) {
      console.error("Erro ao deletar dependências:", err);
      registrarLog(
        "Erro ao excluir dependências de usuário",
        `Erro ao remover dependências do usuário ID ${id}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: 'Erro ao deletar dependências' });
    }

    queryCallback('DELETE FROM usuario WHERE id = ? AND FK_instituicao_id = ?', [id, req.user.FK_instituicao_id], (err, result) => {
      if (err) {
        console.error("Erro ao excluir usuário:", err);
        registrarLog(
          "Erro na exclusão de usuário",
          `Erro ao excluir usuário ID ${id}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: 'Erro ao excluir usuário' });
      }

      if (result.affectedRows === 0) {
        registrarLog(
          "Usuário não encontrado para exclusão",
          `${req.user?.nome || 'Usuário'} tentou excluir o usuário ID ${id}, mas ele não pertence à sua instituição ou não existe.`,
          req,
          "warn"
        );
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      registrarLog(
        "Exclusão de usuário concluída",
        `${req.user?.nome || 'Usuário'} excluiu o usuário ID ${id} com sucesso.`,
        req,
        "info"
      );

      res.status(200).json({ message: 'Usuário excluído com sucesso' });
    });
  });
});


// ================= VERIFICAR SE NOME JÁ EXISTE =================
app.get('/verificarNome', (req, res) => {
  const { nome } = req.query;

  registrarLog(
    "Verificação de nome iniciada",
    `Verificando se o nome '${nome || 'não informado'}' já existe no sistema.`,
    req,
    "info"
  );

  if (!nome) {
    registrarLog(
      "Verificação de nome inválida",
      "Tentativa de verificação de nome sem informar o parâmetro 'nome'.",
      req,
      "warn"
    );
    return res.status(400).json({ error: 'Nome não informado.' });
  }

  const sqlAluno = 'SELECT id FROM usuario WHERE nome = ? LIMIT 1';
  const sqlFunc = 'SELECT id FROM funcionario WHERE nome = ? LIMIT 1';

  queryCallback(sqlAluno, [nome], (err, alunoResult) => {
    if (err) {
      console.error("Erro ao verificar aluno:", err);
      registrarLog("Erro ao verificar nome (aluno)", `Erro ao verificar nome '${nome}' em usuários: ${err.message}`, req, "error");
      return res.status(500).json({ error: 'Erro ao verificar aluno.' });
    }

    queryCallback(sqlFunc, [nome], (err2, funcResult) => {
      if (err2) {
        console.error("Erro ao verificar funcionário:", err2);
        registrarLog("Erro ao verificar nome (funcionário)", `Erro ao verificar nome '${nome}' em funcionários: ${err2.message}`, req, "error");
        return res.status(500).json({ error: 'Erro ao verificar funcionário.' });
      }

      const exists = (alunoResult.length > 0) || (funcResult.length > 0);

      registrarLog(
        "Verificação de nome concluída",
        `Nome '${nome}' ${exists ? 'já existe' : 'ainda não está cadastrado'} no sistema.`,
        req,
        "info"
      );

      res.json({ exists });
    });
  });
});


// ================= LISTAR TIPOS DE USUÁRIO =================
app.get("/tipos-usuario", autenticarToken, (req, res) => {
  registrarLog(
    "Listagem de tipos de usuário iniciada",
    `${req.user?.nome || 'Usuário'} iniciou a listagem de tipos de usuário.`,
    req,
    "info"
  );

  const sql = "SELECT id, tipo FROM tipo_usuario";
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar tipos de usuário:", err);
      registrarLog(
        "Erro na listagem de tipos de usuário",
        `Falha ao buscar tipos de usuário: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: "Erro ao buscar tipos de usuário" });
    }

    registrarLog(
      "Listagem de tipos de usuário concluída",
      `${req.user?.nome || 'Usuário'} listou ${results.length} tipos de usuário.`,
      req,
      "info"
    );

    res.json(results);
  });
});


// ================= ROTAS DE LISTA DE DESEJOS =================
app.post('/lista-desejos', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.body;

  registrarLog(
    "Adição à lista de desejos iniciada",
    `${req.user?.nome || 'Usuário'} iniciou o processo de adicionar o livro ${livroId || 'não informado'} à lista de desejos do usuário ${usuarioId || 'não informado'}.`,
    req,
    "info"
  );

  if (!usuarioId || !livroId) {
    registrarLog(
      "Adição à lista de desejos cancelada",
      `${req.user?.nome || 'Usuário'} tentou adicionar um livro sem informar usuário ou ID do livro.`,
      req,
      "warn"
    );
    return res.status(400).json({ error: 'Usuário e livro são obrigatórios' });
  }

  // Verificar se já existe na lista de desejos
  const sqlCheck = `
    SELECT ld.id 
    FROM lista_desejo ld
    JOIN lista_livro ll ON ld.id = ll.FK_lista_desejo_id
    WHERE ld.FK_usuario_id = ? AND ll.FK_livro_id = ?
  `;

  queryCallback(sqlCheck, [usuarioId, livroId], (err, results) => {
    if (err) {
      console.error('Erro ao verificar lista de desejos:', err);
      registrarLog(
        "Erro ao verificar lista de desejos",
        `Falha ao verificar se o livro ${livroId} já está na lista de desejos do usuário ${usuarioId}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }

    if (results.length > 0) {
      registrarLog(
        "Livro já presente na lista de desejos",
        `${req.user?.nome || 'Usuário'} tentou adicionar o livro ${livroId}, mas ele já estava na lista de desejos do usuário ${usuarioId}.`,
        req,
        "warn"
      );
      return res.status(409).json({ error: 'Livro já está na lista de desejos' });
    }

    // Verificar se o usuário já tem uma lista de desejos
    const sqlFindLista = 'SELECT id FROM lista_desejo WHERE FK_usuario_id = ? LIMIT 1';
    queryCallback(sqlFindLista, [usuarioId], (err, listaResults) => {
      if (err) {
        console.error('Erro ao buscar lista de desejos:', err);
        registrarLog(
          "Erro ao buscar lista de desejos",
          `Falha ao buscar a lista de desejos do usuário ${usuarioId}: ${err.message}`,
          req,
          "error"
        );
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      let listaId;
      if (listaResults.length > 0) {
        // Usar lista existente
        listaId = listaResults[0].id;
        registrarLog(
          "Lista de desejos encontrada",
          `Foi encontrada uma lista existente (ID ${listaId}) para o usuário ${usuarioId}. Adicionando livro ${livroId}.`,
          req,
          "info"
        );
        adicionarLivroLista(listaId, livroId, req, res);
      } else {
        // Criar nova lista de desejos
        const sqlCreateLista = `
          INSERT INTO lista_desejo (lista_desejo, FK_usuario_id, FK_instituicao_id) 
          VALUES (?, ?, ?)
        `;
        queryCallback(sqlCreateLista, ['Minha Lista', usuarioId, req.user.FK_instituicao_id || 1], (err, result) => {
          if (err) {
            console.error('Erro ao criar lista de desejos:', err);
            registrarLog(
              "Erro ao criar lista de desejos",
              `Falha ao criar nova lista de desejos para o usuário ${usuarioId}: ${err.message}`,
              req,
              "error"
            );
            return res.status(500).json({ error: 'Erro interno no servidor' });
          }

          listaId = result.insertId;
          registrarLog(
            "Lista de desejos criada",
            `Foi criada uma nova lista de desejos (ID ${listaId}) para o usuário ${usuarioId}. Adicionando livro ${livroId}.`,
            req,
            "info"
          );
          adicionarLivroLista(listaId, livroId, req, res);
        });
      }
    });
  });
});

function adicionarLivroLista(listaId, livroId, req, res) {
  const sqlInsert = 'INSERT INTO lista_livro (FK_lista_desejo_id, FK_livro_id) VALUES (?, ?)';

  queryCallback(sqlInsert, [listaId, livroId], (err) => {
    if (err) {
      console.error('Erro ao adicionar livro à lista:', err);
      registrarLog(
        "Erro ao adicionar livro à lista de desejos",
        `Erro ao adicionar o livro ${livroId} à lista ${listaId}: ${err.message}`,
        req,
        "error"
      );
      return res.status(500).json({ error: 'Erro ao adicionar livro à lista de desejos' });
    }

    registrarLog(
      "Livro adicionado à lista de desejos",
      `${req.user?.nome || 'Usuário'} adicionou o livro ${livroId} à lista de desejos (ID ${listaId}).`,
      req,
      "info"
    );

    res.status(201).json({ message: 'Livro adicionado à lista de desejos com sucesso!' });
  });
}//parei aqui

// Verificar se livro está na lista de desejos
app.get('/lista-desejos/verificar/:usuarioId/:livroId', (req, res) => {
  const { usuarioId, livroId } = req.params;

  const sql = `
    SELECT ll.FK_livro_id 
    FROM lista_livro ll
    JOIN lista_desejo ld ON ll.FK_lista_desejo_id = ld.id
    WHERE ld.FK_usuario_id = ? AND ll.FK_livro_id = ?
  `;

  queryCallback(sql, [usuarioId, livroId], (err, results) => {
    if (err) {
      console.error('Erro ao verificar lista de desejos:', err);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }

    res.json({ naLista: results.length > 0 });
  });
});

app.get('/lista-desejos/:usuarioId', autenticarToken, (req, res) => {
  const { usuarioId } = req.params;

  const sql = `
    SELECT l.id, l.titulo, l.capa, l.disponivel
    FROM lista_livro ll
    JOIN lista_desejo ld ON ll.FK_lista_desejo_id = ld.id
    JOIN livro l ON ll.FK_livro_id = l.id
    WHERE ld.FK_usuario_id = ?
  `;

  queryCallback(sql, [usuarioId], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar lista de desejos:', err.sqlMessage);
      return res.status(500).json({ error: 'Erro interno no servidor', details: err.sqlMessage });
    }

    if (!rows || rows.length === 0) {
      return res.json([]); // retorna array vazio se não houver livros
    }

    res.json(rows);
  });
});

app.delete('/lista-desejos/:usuarioId/:livroId', (req, res) => {
  const { usuarioId, livroId } = req.params;

  const sqlLista = 'SELECT id FROM lista_desejo WHERE FK_usuario_id = ?';
  queryCallback(sqlLista, [usuarioId], (err, listas) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (listas.length === 0)
      return res.status(404).json({ error: 'Lista de desejos não encontrada' });

    const listaId = listas[0].id;

    const sqlDeleteLivro = 'DELETE FROM lista_livro WHERE FK_lista_desejo_id = ? AND FK_livro_id = ?';
    queryCallback(sqlDeleteLivro, [listaId, livroId], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.sqlMessage });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Livro não encontrado na lista de desejos' });

      const sqlVerifica = 'SELECT COUNT(*) AS total FROM lista_livro WHERE FK_lista_desejo_id = ?';
      queryCallback(sqlVerifica, [listaId], (err3, rows) => {
        if (err3) return res.status(500).json({ error: err3.sqlMessage });

        if (rows[0].total === 0) {
          const sqlDeleteLista = 'DELETE FROM lista_desejo WHERE id = ?';
          queryCallback(sqlDeleteLista, [listaId], (err4) => {
            if (err4) return res.status(500).json({ error: err4.sqlMessage });
            return res.json({ message: 'Livro removido e lista de desejos deletada (ficou vazia)' });
          });
        } else {
          return res.json({ message: 'Livro removido da lista de desejos com sucesso!' });
        }
      });
    });
  });
});




// ======================= LISTAR LIVROS DO ACERVO =======================
app.get('/acervo/livros', autenticarToken, (req, res) => {
  const sql = `
SELECT 
  l.id,
  l.titulo,
  l.isbn,
  l.sinopse,
  l.paginas,
  l.capa,
  l.cdd,
  l.quantidade,
  l.local_publicacao,
  l.data_publicacao,
  l.FK_genero_id,
  l.FK_editora_id,              
  l.FK_autor_id,                
  g.genero,
  e.editora,
  f.nome AS funcionario_cadastrou,
  GROUP_CONCAT(a.nome SEPARATOR ', ') AS autores
FROM livro l
LEFT JOIN genero g ON l.FK_genero_id = g.id
LEFT JOIN editora e ON l.FK_editora_id = e.id
LEFT JOIN funcionario f ON l.FK_funcionario_id = f.id
LEFT JOIN autor a ON l.FK_autor_id = a.id
GROUP BY l.id;
`;


  queryCallback(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar livros do acervo' });

    // garante que venha o campo "disponibilidade"
    const out = results.map(l => ({
      ...l,
      disponibilidade: l.disponivel == 1 ? "disponivel" : "indisponivel"
    }));

    res.json(out);
  });
});

// ======================= BUSCA DE LIVROS POR TÍTULO =======================
app.get('/acervo/livros/busca/:termo', autenticarToken, (req, res) => {
  const termo = `%${req.params.termo}%`;

  const sql = `
SELECT 
  l.id,
  l.titulo,
  l.isbn,
  l.sinopse,
  l.paginas,
  l.capa,
  l.cdd,
  l.quantidade,
  l.local_publicacao,
  l.data_publicacao,
  l.FK_genero_id,
  l.FK_editora_id,
  l.FK_autor_id,
  g.genero,
  e.editora,
  f.nome AS funcionario_cadastrou,
  GROUP_CONCAT(a.nome SEPARATOR ', ') AS autores
FROM livro l
LEFT JOIN genero g ON l.FK_genero_id = g.id
LEFT JOIN editora e ON l.FK_editora_id = e.id
LEFT JOIN funcionario f ON l.FK_funcionario_id = f.id
LEFT JOIN autor a ON l.FK_autor_id = a.id
WHERE l.titulo LIKE ?
GROUP BY l.id;
`;

  queryCallback(sql, [termo], (err, results) => {
    if (err) {
      console.error('Erro ao buscar livros:', err);
      return res.status(500).json({ error: 'Erro ao buscar livros por título' });
    }
    res.json(results);
  });
});

//=================  Cadastro de Livro =================
app.post('/cadastrarLivro', autenticarToken, upload.single('capa'), (req, res) => {
  const {
    titulo,
    edicao,
    paginas,
    quantidade,
    local_publicacao,
    data_publicacao,
    cdd,
    sinopse,
    isbn,
    assunto_discutido,
    subtitulo,
    volume,
    FK_genero_id,
    FK_classificacao_id,
    FK_status_id,
    FK_editora_id,
    FK_autor_id
  } = req.body;

  const capa = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO livro (
      titulo, edicao, paginas, quantidade, local_publicacao,
      data_publicacao, cdd, sinopse, isbn, assunto_discutido,
      subtitulo, volume, FK_genero_id, FK_funcionario_id,
      FK_classificacao_id, FK_status_id, capa, FK_instituicao_id,
      FK_editora_id, FK_autor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    titulo || null,
    edicao || null,
    paginas || null,
    quantidade || null,
    local_publicacao || null,
    data_publicacao || null,
    cdd || null,
    sinopse || null,
    isbn || null,
    assunto_discutido || null,
    subtitulo || null,
    volume || null,
    FK_genero_id || null,
    req.user.id, // funcionario logado
    FK_classificacao_id || null,
    FK_status_id || null,
    capa || null,
    req.user.FK_instituicao_id || null,
    FK_editora_id || null,
    FK_autor_id || null
  ];

  queryCallback(sql, values, (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar livro:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar livro' });
    }
    res.status(200).json({ message: 'Livro cadastrado com sucesso!' });
  });
});


//================= Carrega Gêneros =================
app.get('/generos', (req, res) => {
  const sql = 'SELECT id, genero FROM genero';  // ajuste o nome da tabela se necessário

  queryCallback(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar gêneros:', err);
      return res.status(500).json({ error: 'Erro ao buscar gêneros' });
    }

    res.json(results);
  });
});
app.post('/generos', (req, res) => {
  const { genero } = req.body;

  if (!genero || genero.trim() === '') {
    return res.status(400).json({ error: 'Gênero é obrigatório' });
  }

  // Verifica se já existe (opcional, para evitar duplicidade)
  const sqlCheck = 'SELECT * FROM genero WHERE LOWER(genero) = LOWER(?) LIMIT 1';
  queryCallback(sqlCheck, [genero], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    if (results.length > 0) return res.status(409).json({ error: 'Gênero já existe' });

    const sqlInsert = 'INSERT INTO genero (genero) VALUES (?)';
    queryCallback(sqlInsert, [genero], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erro ao salvar gênero' });
      res.status(201).json({ message: 'Gênero salvo com sucesso' });
    });
  });
});
//=================  Rota para buscar gêneros ordenados (para filtro)=================

app.get('/generosFiltro', (req, res) => {
  const sql = 'SELECT * FROM genero ORDER BY genero ASC';
  queryCallback(sql, (err, result) => {
    if (err) {
      console.error('Erro ao buscar gêneros:', err);
      return res.status(500).json({ erro: 'Erro ao buscar gêneros' });
    }
    res.json(result);
  });
});


// ================= Rota para buscar detalhes de um livro específico, incluindo autores, gênero, editora e funcionário que cadastrou =================

app.get('/livros/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
  SELECT 
    l.id,
    l.titulo,
    l.sinopse,
    l.capa,
    l.paginas,
    l.isbn,
    g.genero,
    e.editora,
    (SELECT GROUP_CONCAT(a.nome SEPARATOR ', ')
     FROM livro_autor la
     JOIN autor a ON la.FK_autor_id = a.id
     WHERE la.FK_livro_id = l.id) AS autores,
    f.nome AS funcionario_cadastrou
  FROM livro l
  LEFT JOIN genero g ON l.FK_genero_id = g.id
  LEFT JOIN editora e ON l.FK_editora_id = e.id
  LEFT JOIN funcionario f ON l.FK_funcionario_id = f.id
  WHERE l.id = ?
`;

  queryCallback(sql, [id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar livro:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    res.json(results[0]); // retorna só o livro encontrado
  });
});

//=================  Atualizar livro com chaves estrangeiras =================

app.put('/livros/:id', autenticarToken, upload.single('capa'), (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, isbn, sinopse, paginas, generoId, editoraId, FK_autor_id } = req.body;
  const capa = req.file ? req.file.filename : null;

  const sql = `
    UPDATE livro 
    SET titulo=?, isbn=?, sinopse=?, paginas=?, FK_genero_id=?, FK_editora_id=?, FK_autor_id=? ${capa ? ', capa=?' : ''} 
    WHERE id=?`;

  const values = [titulo, isbn, sinopse, paginas, generoId, editoraId, FK_autor_id];
  if (capa) values.push(capa);
  values.push(id);

  queryCallback(sql, values, (err) => {
    if (err) {
      console.error('Erro ao atualizar livro:', err);
      return res.status(500).json({ error: 'Erro ao atualizar livro' });
    }
    res.json({ message: 'Livro atualizado com sucesso!' });
  });
});

// ================== EXCLUIR LIVRO ==================
app.delete('/livros/:id', (req, res) => {
  const { id } = req.params;

  // Apaga dependências diretas
  const tabelasDependentes = [
    'livro_autor',
    'emprestimo_livro',
    'emprestimo',
    'reserva',
    'historico_emprestimos'
  ];

  const excluirDependencias = (index = 0) => {
    if (index >= tabelasDependentes.length) return excluirLivro();

    const tabela = tabelasDependentes[index];
    const sql = `DELETE FROM ${tabela} WHERE FK_livro_id = ? OR livro_id = ?`;
    queryCallback(sql, [id, id], (err) => {
      if (err) {
        console.warn(`⚠️ Aviso: não foi possível limpar ${tabela}:`, err.sqlMessage);
      }
      excluirDependencias(index + 1);
    });
  };

  const excluirLivro = () => {
    queryCallback('DELETE FROM livro WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Erro ao deletar livro:', err);
        return res.status(500).json({ error: 'Erro ao deletar livro' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.json({ message: 'Livro excluído com sucesso!' });
    });
  };

  excluirDependencias();
});

// ================= Buscar comentários de um livro =================
function filtrarComentario(texto) {
  return xss(texto);
}

// --- Buscar comentários ---
app.get('/livros/:id/comentarios', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      c.id, 
      c.comentario, 
      c.data_comentario, 
      u.nome, 
      u.foto,
      u.id as usuario_id
    FROM comentario c
    JOIN usuario_comentario uc ON c.id = uc.FK_comentario_id
    JOIN usuario u ON uc.FK_usuario_id = u.id
    JOIN comentario_livro cl ON c.id = cl.FK_comentario_id
    WHERE cl.FK_livro_id = ?
    ORDER BY c.data_comentario DESC
  `;

  queryCallback(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar comentários:", err);
      return res.status(500).json({ error: "Erro no servidor" });
    }
    res.json(results);
  });
});

// --- Salvar comentário com proteção XSS ---
app.post("/livros/:id/comentarios", async (req, res) => {
  try {
    const { usuarioId, comentario } = req.body;
    const livroId = req.params.id;

    if (!usuarioId || !comentario) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    // 🧹 Limpa o comentário de possíveis scripts
    const comentarioFiltrado = filtrarComentario(comentario);

    // Inserir comentário
    queryCallback(
      "INSERT INTO comentario (comentario, data_comentario) VALUES (?, NOW())",
      [comentarioFiltrado],
      (err, result) => {
        if (err) {
          console.error("Erro ao salvar comentário:", err);
          return res.status(500).json({ error: "Erro ao salvar comentário." });
        }

        const comentarioId = result.insertId;

        // Vincular usuário
        queryCallback(
          "INSERT INTO usuario_comentario (FK_usuario_id, FK_comentario_id) VALUES (?, ?)",
          [usuarioId, comentarioId],
          (err) => {
            if (err) {
              console.error("Erro ao vincular usuário:", err);
              return res.status(500).json({ error: "Erro ao salvar comentário." });
            }

            // Vincular livro
            queryCallback(
              "INSERT INTO comentario_livro (FK_comentario_id, FK_livro_id) VALUES (?, ?)",
              [comentarioId, livroId],
              (err) => {
                if (err) {
                  console.error("Erro ao vincular livro:", err);
                  return res.status(500).json({ error: "Erro ao salvar comentário." });
                }

                res.status(201).json({ message: "Comentário salvo com sucesso!" });
              }
            );
          }
        );
      }
    );
  } catch (err) {
    console.error("Erro ao salvar comentário:", err);
    res.status(500).json({ error: "Erro ao salvar comentário." });
  }
});


// ===== Listar autores =====
app.get('/autores', autenticarToken, (req, res) => {
  const sql = 'SELECT id, nome FROM autor ORDER BY nome ASC';
  queryCallback(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar autores' });
    res.json(results);
  });
});

// ===== Cadastrar autor =====
app.post('/autores', autenticarToken, (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome do autor é obrigatório' });
  }

  // Verifica se já existe
  const sqlCheck = 'SELECT * FROM autor WHERE LOWER(nome) = LOWER(?) LIMIT 1';
  queryCallback(sqlCheck, [nome.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no banco ao verificar autor' });
    if (results.length > 0) return res.status(409).json({ error: 'Autor já existe' });

    // Insere novo autor
    const sqlInsert = 'INSERT INTO autor (nome) VALUES (?)';
    queryCallback(sqlInsert, [nome.trim()], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erro ao salvar autor' });
      res.status(201).json({ message: 'Autor cadastrado com sucesso' });
    });
  });
});

// ===== Listar editoras =====
// ===== Listar editoras =====
app.get('/editoras', autenticarToken, (req, res) => {
  const sql = 'SELECT id, editora AS editora FROM editora ORDER BY editora ASC'; // <-- CORRIGIDO
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar editoras:', err);
      return res.status(500).json({ error: 'Erro ao buscar editoras' });
    }
    res.json(results);
  });
});

// ===== Cadastrar editora =====
app.post('/editoras', autenticarToken, (req, res) => {
  const { nome } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome da editora é obrigatório' });
  }

  const sqlCheck = 'SELECT * FROM editora WHERE LOWER(editora) = LOWER(?) LIMIT 1'; // <-- CORRIGIDO
  queryCallback(sqlCheck, [nome.trim()], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no banco ao verificar editora' });
    if (results.length > 0) return res.status(409).json({ error: 'Editora já existe' });

    const sqlInsert = 'INSERT INTO editora (editora) VALUES (?)'; // <-- CORRIGIDO
    queryCallback(sqlInsert, [nome.trim()], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erro ao salvar editora' });
      res.status(201).json({ message: 'Editora cadastrada com sucesso' });
    });
  });
});


// ================= Lista tipos de instituição =================

app.get("/tipos-instituicao", (req, res) => {
  const sql = "SELECT * FROM tipo_instituicao";
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ mensagem: "Erro ao carregar tipos de instituição" });
    }
    res.json(results);
  });
});

// Buscar dados da instituição
app.get("/instituicao", (req, res) => {
  const sql = "SELECT * FROM instituicao LIMIT 1";
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar instituição:", err);
      return res.status(500).json({ mensagem: "Erro ao buscar instituição" });
    }
    if (results.length === 0) {
      return res.json(null);
    }
    res.json(results[0]);
  });
});

//  ================= Cadastrar instituição =================

app.post("/instituicao", (req, res) => {
  const { nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id } = req.body;

  if (!nome || !FK_tipo_instituicao_id) {
    return res.status(400).json({ mensagem: "Nome e tipo da instituição são obrigatórios." });
  }

  const sql = `
        INSERT INTO instituicao 
        (nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

  queryCallback(sql, [nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id], (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar instituição:", err);
      return res.status(500).json({ mensagem: "Erro ao cadastrar instituição" });
    }
    res.json({ mensagem: "Instituição cadastrada com sucesso!", id: result.insertId });
  });
});

// Atualizar instituição
app.put("/instituicao/:id", (req, res) => {
  const { id } = req.params;
  const { nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id } = req.body;

  const sql = `
    UPDATE instituicao
    SET nome = ?, email = ?, horario_funcionamento = ?, telefone = ?, website = ?, endereco = ?, FK_tipo_instituicao_id = ?
    WHERE id = ?
  `;

  queryCallback(sql, [nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id, id], (err) => {
    if (err) {
      console.error("Erro ao atualizar instituição:", err);
      return res.status(500).json({ mensagem: "Erro ao atualizar instituição" });
    }
    res.json({ mensagem: "Instituição atualizada com sucesso!" });
  });
});
// ================= CONFIGURAÇÕES GERAIS=================

app.get("/configuracoes-gerais/:instituicaoId", (req, res) => {
  const instituicaoId = req.params.instituicaoId;
  const sql = "SELECT * FROM configuracoes_gerais WHERE FK_instituicao_id = ? LIMIT 1";
  queryCallback(sql, [instituicaoId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar configurações gerais", details: err });
    res.json(results[0] || null);
  });
});

app.post("/configuracoes-gerais", (req, res) => {
  const { duracao_padrao_emprestimo, numero_maximo_renovacoes, tempo_retirada_reserva, numero_maximo_emprestimos, multa_por_atraso, FK_instituicao_id } = req.body;

  const sql = `
    INSERT INTO configuracoes_gerais 
      (duracao_padrao_emprestimo, numero_maximo_renovacoes, tempo_retirada_reserva, numero_maximo_emprestimos, multa_por_atraso, FK_instituicao_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      duracao_padrao_emprestimo = VALUES(duracao_padrao_emprestimo),
      numero_maximo_renovacoes = VALUES(numero_maximo_renovacoes),
      tempo_retirada_reserva = VALUES(tempo_retirada_reserva),
      numero_maximo_emprestimos = VALUES(numero_maximo_emprestimos),
      multa_por_atraso = VALUES(multa_por_atraso)
  `;

  queryCallback(sql, [
    duracao_padrao_emprestimo,
    numero_maximo_renovacoes,
    tempo_retirada_reserva,
    numero_maximo_emprestimos,
    multa_por_atraso,
    FK_instituicao_id
  ], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao salvar configurações gerais", details: err });

    res.json({ mensagem: "Configurações gerais salvas com sucesso!" });
  });
});

// ================= CONFIGURAÇÕES DE NOTIFICAÇÕES =================


// Buscar configuração de notificações por instituição
app.get("/configuracoes-notificacao/:instituicaoId", (req, res) => {
  const { instituicaoId } = req.params;
  const sql = "SELECT * FROM configuracoes_notificacao WHERE FK_instituicao_id = ? LIMIT 1";
  queryCallback(sql, [instituicaoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar notificações:", err);
      return res.status(500).json({ mensagem: "Erro ao buscar notificações" });
    }
    if (results.length === 0) {
      return res.json(null);
    }
    res.json(results[0]);
  });
});

// Cadastrar configuração de notificações
app.post("/configuracoes-notificacao", (req, res) => {
  const { lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, FK_instituicao_id } = req.body;

  const sql = `
    INSERT INTO configuracoes_notificacao
    (lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, FK_instituicao_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  queryCallback(sql, [lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, FK_instituicao_id], (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar notificações:", err);
      return res.status(500).json({ mensagem: "Erro ao cadastrar notificações" });
    }
    res.json({ mensagem: "Configuração de notificações cadastrada com sucesso!", id: result.insertId });
  });
});

// Atualizar configuração de notificações
app.put("/configuracoes-notificacao/:id", (req, res) => {
  const { id } = req.params;
  const { lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao } = req.body;

  const sql = `
    UPDATE configuracoes_notificacao
    SET lembrete_vencimento = ?, dias_antes_vencimento = ?, notificacao_atraso = ?, notificacao_reserva = ?, notificacao_livro_disponivel = ?, sms_notificacao = ?
    WHERE id = ?
  `;

  queryCallback(sql, [lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, id], (err) => {
    if (err) {
      console.error("Erro ao atualizar notificações:", err);
      return res.status(500).json({ mensagem: "Erro ao atualizar notificações" });
    }
    res.json({ mensagem: "Configuração de notificações atualizada com sucesso!" });
  });
});

// =================CONFIGURAÇÕES DE TIPO DE USUÁRIO =================

// GET por instituição
app.get("/configuracoes-tipo-usuario/:instituicaoId", (req, res) => {
  const { instituicaoId } = req.params;
  const sql = "SELECT * FROM configuracoes_tipo_usuario WHERE FK_instituicao_id = ? OR FK_instituicao_id IS NULL";
  queryCallback(sql, [instituicaoId], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar tipos de usuário" });
    res.json(results);
  });
});

// POST
app.post("/configuracoes-tipo-usuario", (req, res) => {
  const { FK_tipo_usuario_id, maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, FK_instituicao_id } = req.body;
  const sql = `INSERT INTO configuracoes_tipo_usuario 
    (FK_tipo_usuario_id, maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, FK_instituicao_id) 
    VALUES (?, ?, ?, ?, ?, ?)`;
  queryCallback(sql, [FK_tipo_usuario_id, maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, FK_instituicao_id], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao salvar configuração" });
    res.json({ mensagem: "Configuração salva com sucesso!" });
  });
});

// PUT
app.put("/configuracoes-tipo-usuario/:id", (req, res) => {
  const { id } = req.params;
  const { maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar } = req.body;
  const sql = `UPDATE configuracoes_tipo_usuario 
               SET maximo_emprestimos=?, duracao_emprestimo=?, pode_reservar=?, pode_renovar=? 
               WHERE id=?`;
  queryCallback(sql, [maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, id], (err) => {
    if (err) return res.status(500).json({ error: "Erro ao atualizar configuração" });
    res.json({ mensagem: "Configuração atualizada com sucesso!" });
  });
});
//================= Lista funcionários por instituição =================
app.get('/api/funcionarios/:instituicaoId', (req, res) => {
  const { instituicaoId } = req.params;

  const sql = `
    SELECT 
      f.id, 
      f.nome, 
      f.email, 
      f.telefone, 
      f.foto, 
      f.ultimo_login,
      f.FK_funcao_id,
      fun.funcao AS funcao,
      CASE
        WHEN f.ultimo_login IS NULL THEN 'Inativo'
        WHEN DATEDIFF(NOW(), f.ultimo_login) > 15 THEN 'Inativo'
        ELSE 'Ativo'
      END AS status
    FROM funcionario f
    LEFT JOIN funcao fun ON f.FK_funcao_id = fun.id
    WHERE f.FK_instituicao_id = ?
  `;

  queryCallback(sql, [instituicaoId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});


//================= Emprestimo =================


// ===== Rota: Pesquisar usuários =====
// ===== Rota: Pesquisar usuários =====
app.get('/usuarios', autenticarToken, (req, res) => {
  const termo = req.query.busca;

  const sql = `
    SELECT 
      u.id, 
      u.nome, 
      u.email, 
      u.telefone, 
      u.foto,
      tu.tipo AS tipo_usuario,
      u.ativo,
      u.ultimo_login,
      -- 👇 Conta quantos empréstimos ativos o usuário tem
      (
        SELECT COUNT(*)
        FROM emprestimo e
        WHERE e.FK_usuario_id = u.id 
          AND e.data_real_devolucao IS NULL
      ) AS qtd_emprestimos
    FROM usuario u
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    WHERE u.nome LIKE ? OR u.email LIKE ?
  `;

  queryCallback(sql, [`%${termo}%`, `%${termo}%`], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }

    res.json(results.map(u => ({
      id: u.id,
      nome: u.nome,
      tipo: u.tipo_usuario || "Não informado",
      status: u.ativo ? "Ativo" : "Inativo",
      ultimo_login: u.ultimo_login || "-",
      qtd_emprestimos: u.qtd_emprestimos || 0, // 👈 já vem do COUNT
      foto: u.foto ? `/uploads/${u.foto}` : "/uploads/padrao.png"
    })));
  });
});


app.get('/api/usuarios', autenticarToken, (req, res) => {
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, 
           u.foto,
           u.ultimo_login,       -- 👈 ADICIONAR
           tu.tipo AS tipo,
           u.FK_tipo_usuario_id,
           c.curso AS nome_curso,
           u.serie
    FROM usuario u
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    LEFT JOIN curso c ON u.curso_id = c.id
    WHERE u.FK_instituicao_id = ?
  `;

  queryCallback(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }
    res.json(results);
  });
});

// ======================= PESQUISAR LIVROS PARA EMPRÉSTIMO =======================
app.get("/emprestimo/livros", autenticarToken, (req, res) => {
  const busca = `%${req.query.busca || ''}%`;

  const sql = `
    SELECT 
      l.id,
      l.titulo,
      l.capa,
      l.isbn,
      l.local_publicacao AS localizacao,
      (SELECT GROUP_CONCAT(a.nome SEPARATOR ', ') 
         FROM livro_autor la 
         JOIN autor a ON la.FK_autor_id = a.id 
        WHERE la.FK_livro_id = l.id) AS autores,
      ed.editora AS editora,
      l.disponivel,

      -- Dados do empréstimo (se o livro estiver emprestado)
      e.id AS emprestimo_id,
      DATE_FORMAT(e.data_emprestimo, '%d/%m/%Y') AS data_emprestimo,
      DATE_FORMAT(e.data_devolucao_prevista, '%d/%m/%Y') AS data_devolucao_prevista,
      u.nome AS usuario
    FROM livro l
    LEFT JOIN editora ed ON ed.id = l.FK_editora_id
    LEFT JOIN emprestimo_livro el ON el.FK_livro_id = l.id
    LEFT JOIN emprestimo e 
           ON e.id = el.FK_emprestimo_id 
          AND e.data_real_devolucao IS NULL
    LEFT JOIN usuario u ON u.id = e.FK_usuario_id
    WHERE l.titulo LIKE ? OR l.isbn LIKE ? OR u.nome LIKE ?
    ORDER BY e.data_emprestimo DESC
    LIMIT 10;
  `;

  queryCallback(sql, [busca, busca, busca], (err, rows) => {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return res.status(500).json({ error: "Erro ao buscar livros" });
    }

    const out = rows.map(l => ({
      id: l.id,
      titulo: l.titulo,
      capa: l.capa ? `/uploads/${l.capa}` : null,
      isbn: l.isbn,
      localizacao: l.localizacao,
      autor: l.autores || null,
      editora: l.editora || null,
      disponibilidade: l.disponivel == 1 ? "disponivel" : "indisponivel",
      emprestimo_id: l.emprestimo_id || null,
      data_emprestimo: l.data_emprestimo || null,
      data_devolucao_prevista: l.data_devolucao_prevista || null,
      usuario: l.usuario || null
    }));

    res.json(out);
  });
});

/*app.post('/emprestimos', autenticarToken, async (req, res) => {
  const { usuarioId, livros } = req.body;

  if (!usuarioId || !Array.isArray(livros) || livros.length === 0) {
    return res.status(400).json({ error: "Dados inválidos. Informe usuário e ao menos um livro." });
  }

  const instituicaoId = req.user?.FK_instituicao_id || null;

  try {
    const [config] = await pool.query(
      "SELECT duracao_padrao_emprestimo FROM configuracoes_gerais WHERE FK_instituicao_id = ?",
      [instituicaoId]
    );
    const dias = config[0]?.duracao_padrao_emprestimo || 7;

    const hoje = new Date();
    const devolucaoPrevista = new Date();
    devolucaoPrevista.setDate(hoje.getDate() + dias);

    const [result] = await pool.query(
      "INSERT INTO emprestimo (data_emprestimo, data_devolucao_prevista, FK_usuario_id, FK_instituicao_id) VALUES (?, ?, ?, ?)",
      [hoje, devolucaoPrevista, usuarioId, instituicaoId]
    );
    const emprestimoId = result.insertId;

    for (const livroId of livros) {
      await pool.query("INSERT INTO emprestimo_livro (FK_emprestimo_id, FK_livro_id) VALUES (?, ?)", [emprestimoId, livroId]);
      await pool.query("UPDATE livro SET disponivel = 0 WHERE id = ?", [livroId]);
    }

    const [historicoRes] = await pool.query(
      "INSERT INTO historico (data_leitura, FK_instituicao_id) VALUES (?, ?)",
      [hoje, instituicaoId]
    );
    const historicoId = historicoRes.insertId;

    await pool.query(
      "INSERT INTO historico_usuario (FK_usuario_id, FK_historico_id) VALUES (?, ?)",
      [usuarioId, historicoId]
    );

    for (const livroId of livros) {
      await pool.query(
        "INSERT INTO historico_livro (FK_historico_id, FK_livro_id) VALUES (?, ?)",
        [historicoId, livroId]
      );
    }

    res.status(201).json({
      message: "Empréstimo registrado com sucesso e histórico atualizado!",
      emprestimoId,
      historicoId
    });

  } catch (err) {
    console.error("Erro ao registrar empréstimo:", err);
    res.status(500).json({ error: "Erro ao registrar empréstimo" });
  }
});*/

app.get('/emprestimos/:usuarioId/historico', autenticarToken, async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const [rows] = await pool.query(`
      SELECT h.id AS historico_id, h.data_leitura, l.titulo, e.data_emprestimo, e.data_devolucao_prevista
      FROM historico h
      JOIN historico_usuario hu ON hu.FK_historico_id = h.id
      JOIN historico_livro hl ON hl.FK_historico_id = h.id
      JOIN livro l ON l.id = hl.FK_livro_id
      LEFT JOIN emprestimo_livro el ON el.FK_livro_id = l.id
      LEFT JOIN emprestimo e ON e.id = el.FK_emprestimo_id
      WHERE hu.FK_usuario_id = ?
      ORDER BY h.data_leitura DESC
    `, [usuarioId]);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar histórico do usuário:", err);
    res.status(500).json({ error: "Erro ao buscar histórico do usuário" });
  }
});

app.get('/historico/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  const sql = `
    SELECT 
      h.id AS historico_id,
      h.data_leitura,
      l.titulo,
      'emprestimo/reserva' AS tipo
    FROM historico h
    JOIN historico_usuario hu ON hu.FK_historico_id = h.id
    JOIN historico_livro hl ON hl.FK_historico_id = h.id
    JOIN livro l ON l.id = hl.FK_livro_id
    WHERE hu.FK_usuario_id = ?

    UNION ALL

    SELECT 
      h.id AS historico_id,
      h.data_leitura,
      l.titulo,
      'indicacao' AS tipo
    FROM historico h
    JOIN historico_usuario hu ON hu.FK_historico_id = h.id
    JOIN historico_livro hl ON hl.FK_historico_id = h.id
    JOIN historico_indicacao hi ON hi.FK_historico_id = h.id
    JOIN indicacao i ON i.id = hi.FK_indicacao_id
    JOIN livro l ON l.id = i.indicacao
    WHERE hu.FK_usuario_id = ?

    ORDER BY data_leitura DESC
  `;

  queryCallback(sql, [usuarioId, usuarioId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar histórico:', err);
      return res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
    res.json(results);
  });
});

// ===== Rota: Devolver livro =====
app.post('/emprestimos/:id/devolver', autenticarToken, (req, res) => {
  const emprestimoId = req.params.id;

  const sql = `
    UPDATE emprestimo 
    SET data_real_devolucao = NOW() 
    WHERE id = ?`;

  queryCallback(sql, [emprestimoId], (err) => {
    if (err) {
      console.error("Erro ao devolver:", err);
      return res.status(500).json({ error: "Erro ao devolver livro" });
    }

    const sqlLivro = `
      UPDATE livro 
      SET disponivel = 1 
      WHERE id IN (SELECT FK_livro_id FROM emprestimo_livro WHERE FK_emprestimo_id = ?)
    `;

    queryCallback(sqlLivro, [emprestimoId], (err2) => {
      if (err2) {
        console.warn("⚠️ Coluna 'disponivel' pode não existir na tabela livro");
      }
      res.json({ message: "Livro devolvido com sucesso!" });
    });
  });
});

// ==================== BACKUP E RESTAURAÇÃO ==================== //
const archiver = require("archiver");

// Cria a pasta de backups se não existir
const pastaBackups = path.join(__dirname, "..", "backups");
if (!fs.existsSync(pastaBackups)) {
  fs.mkdirSync(pastaBackups, { recursive: true });
}
function validarToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "segredo");
  } catch (err) {
    return null;
  }
}
// === ROTA: Fazer Backup Manual (gera ZIP e envia download) ===
// ROTA: Fazer Backup Manual (gera ZIP e envia download direto)

// ROTA DE BACKUP E DOWNLOAD DIRETO


// ROTA: Fazer Backup Manual e download direto
app.get("/backup", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  const usuario = validarToken(token);
  if (!usuario) return res.status(401).json({ error: "Token inválido" });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dumpPath = path.join(pastaBackups, `dump-${timestamp}.sql`);
    const zipPath = path.join(pastaBackups, `backup-${timestamp}.zip`);

    // Gerar dump MySQL
    const caminhoDumpExe = `"D:\\Nova pasta\\mysql\\bin\\mysqldump.exe"`;
    const comandoDump = `${caminhoDumpExe} -u${process.env.DB_USER || "root"} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ""} ${process.env.DB_NAME || "bibliontec"} > "${dumpPath}"`;
    console.log("🧱 Executando comando:", comandoDump);
    await execPromise(comandoDump);

    // Criar ZIP
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    archive.file(dumpPath, { name: path.basename(dumpPath) });

    // Adiciona uploads, se houver
    const pastaUploads = path.join(__dirname, "..", "uploads");
    if (fs.existsSync(pastaUploads)) archive.directory(pastaUploads, "uploads");

    await new Promise((resolve, reject) => {
      output.on("close", resolve);
      archive.on("error", reject);
      archive.finalize();
    });

    fs.unlinkSync(dumpPath);

    // Envia download direto
    res.download(zipPath, path.basename(zipPath), (err) => {
      if (err) console.error("Erro ao enviar ZIP:", err);
      else fs.unlinkSync(zipPath); // remove ZIP após download
    });

  } catch (err) {
    console.error("❌ Erro ao gerar backup:", err);
    res.status(500).json({ error: "Falha ao gerar backup: " + err.message });
  }
});
const multerRestore = multer({ dest: path.join(__dirname, "..", "uploads") });
const sqlFilePath = path.join(__dirname, "..", "uploads", "restore.sql");



// === ROTA: Restaurar Backup ===
app.post("/backup/restaurar", autenticarToken, multerRestore.single("arquivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    const extractDir = path.join(__dirname, "restore_temp");

    // Garante que a pasta temporária existe
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);

    // Extrai o ZIP
    zip.extractAllTo(extractDir, true);

    // Busca o arquivo .sql dentro do ZIP
    const sqlFile = fs.readdirSync(extractDir).find(f => f.endsWith(".sql"));
    if (!sqlFile) {
      return res.status(400).json({ error: "Arquivo .sql não encontrado no backup." });
    }

    const sqlFilePath = path.join(extractDir, sqlFile);

    exec(`mysql -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ""} ${DB_NAME} < "${sqlFilePath}"`, (error) => {
      if (error) {
        console.error("Erro ao restaurar:", error);
        return res.status(500).json({ error: "Falha ao restaurar o banco." });
      }

      console.log("✅ Banco restaurado com sucesso!");
      res.json({ message: "✅ Banco restaurado com sucesso!" });
    });

  } catch (err) {
    console.error("Erro ao restaurar backup:", err);
    res.status(500).json({ error: "Falha ao restaurar backup." });
  }
});


// === ROTA: Histórico de Backups ===
app.get("/backup/historico", autenticarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, tipo, caminho_arquivo, data_criacao, status, tamanho
      FROM backup
      ORDER BY data_criacao DESC
    `);

    console.log("📦 BACKUPS ENVIADOS:", rows); // <-- ADICIONE ESTA LINHA

    res.json(rows);
  } catch (err) {
    console.error("Erro ao carregar histórico de backups:", err);
    res.status(500).json({ error: "Erro ao listar histórico" });
  }


});



// === BACKUP AUTOMÁTICO AGENDADO ===
cron.schedule("* * * * *", async () => {
  try {
    const [configs] = await pool.query("SELECT * FROM backup_config");
    for (const cfg of configs) {
      const agora = new Date();
      const horaAtual = agora.toTimeString().slice(0, 5);

      if (horaAtual === cfg.hora) {
        console.log(`⏰ Executando backup automático para instituição ${cfg.FK_instituicao_id}`);

        const nomeArquivo = `backup_auto_${Date.now()}.sql`;
        const caminho = `./backups/${nomeArquivo}`;

        const comando = `mysqldump -u ${DB_USER} ${DB_PASS ? `-p${DB_PASS}` : ""} ${DB_NAME} > ${caminho}`;
        exec(comando, async (error) => {
          if (error) {
            console.error("Erro no backup automático:", error);
            await pool.query(
              "INSERT INTO backup (tipo, caminho_arquivo, status, mensagem) VALUES ('automatico', ?, 'falhou', ?)",
              [nomeArquivo, error.message]
            );
          } else {
            const stats = fs.statSync(caminho);
            const tamanho = (stats.size / (1024 * 1024)).toFixed(2) + " MB";
            await pool.query(
              "INSERT INTO backup (tipo, caminho_arquivo, status, tamanho) VALUES ('automatico', ?, 'concluido', ?)",
              [nomeArquivo, tamanho]
            );
            console.log(`✅ Backup automático concluído: ${nomeArquivo}`);
          }
        });
      }
    }
  } catch (err) {
    console.error("Erro ao executar backup automático:", err);
  }
});
// === ROTA: Configurar Backup Automático ===
app.post("/backup/configurar", autenticarToken, async (req, res) => {
  try {
    const { hora, dias_retencao, compressao } = req.body;

    if (!hora) {
      return res.status(400).json({ error: "Hora do backup é obrigatória." });
    }

    // ID da instituição do usuário logado (padrão 1 se não tiver no token)
    const instituicaoId = req.user?.FK_instituicao_id || 1;

    await pool.query(`
      INSERT INTO backup_config (FK_instituicao_id, hora, dias_retencao, compressao)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        hora = VALUES(hora),
        dias_retencao = VALUES(dias_retencao),
        compressao = VALUES(compressao),
        updated_at = CURRENT_TIMESTAMP
    `, [
      instituicaoId,
      hora,
      dias_retencao || 30,
      compressao ? 1 : 0
    ]);

    console.log(`⚙️ Backup automático configurado: ${hora}, ${dias_retencao} dias, compressão=${compressao}`);

    res.json({ message: "✅ Configuração salva com sucesso!" });
  } catch (err) {
    console.error("Erro ao salvar configuração de backup:", err);
    res.status(500).json({ error: "Erro ao salvar configuração de backup." });
  }
});
// === ROTA: Obter Configuração Atual de Backup ===
app.get("/backup/configurar", autenticarToken, async (req, res) => {
  try {
    const instituicaoId = req.user?.FK_instituicao_id || 1;

    const [config] = await pool.query(
      "SELECT hora, dias_retencao, compressao FROM backup_config WHERE FK_instituicao_id = ? LIMIT 1",
      [instituicaoId]
    );

    const [ultimoBackup] = await pool.query(`
      SELECT data_criacao, tipo, status
      FROM backup
      ORDER BY data_criacao DESC
      LIMIT 1
    `);

    res.json({
      configuracao: config[0] || null,
      ultimo_backup: ultimoBackup[0] || null
    });
  } catch (err) {
    console.error("Erro ao buscar configuração de backup:", err);
    res.status(500).json({ error: "Erro ao buscar configuração de backup." });
  }
});

// ==================== VISUALIZAR LOGS (JSON PADRONIZADO E PAGINADO) ====================
app.get("/logs", autenticarToken, (req, res) => {
  try {
    const logPath = path.join(__dirname, "logs", "combined.log");
    if (!fs.existsSync(logPath)) {
      return res.json({ total: 0, logs: [] });
    }

    // Lê o arquivo de logs
    const linhas = fs.readFileSync(logPath, "utf8")
      .trim()
      .split("\n")
      .slice(-1000) // lê só os 1000 últimos registros (evita travamento)
      .reverse();


    const todosLogs = linhas.map(linha => {
      try {
        const log = JSON.parse(linha);
        let icone, badge;

        if (log.tipo === "erro") {
          icone = "bi-x-circle text-danger";
          badge = "bg-danger";
        } else if (log.tipo === "aviso" || log.tipo === "atenção") {
          icone = "bi-exclamation-triangle text-warning";
          badge = "bg-warning text-dark";
        } else {
          icone = "bi-check-circle text-success";
          badge = "bg-success";
        }

        return {
          data: log.timestamp,
          titulo: log.titulo || "Evento do sistema",
          mensagem: log.mensagem || "",
          usuario: log.usuario || "Sistema",
          tipo: (log.tipo || "sucesso").charAt(0).toUpperCase() + (log.tipo || "sucesso").slice(1),
          icone,
          badge
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    // 🔁 Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const start = (page - 1) * limit;
    const end = start + limit;

    const logsPaginados = todosLogs.slice(start, end);

    res.json({
      total: todosLogs.length,
      logs: logsPaginados
    });

  } catch (err) {
    console.error("Erro ao ler logs:", err);
    res.status(500).json({ error: "Erro ao carregar logs" });
  }
});


// ==================== EXPORTAR LOGS EM PDF ====================
app.get("/logs/export/pdf", autenticarToken, (req, res) => {
  try {
    const logPath = path.join(__dirname, "logs", "combined.log");
    if (!fs.existsSync(logPath)) {
      return res.status(404).send("Nenhum log encontrado");
    }

    const linhas = fs.readFileSync(logPath, "utf8").trim().split("\n").slice(-1000).reverse();
    const logs = linhas.map(l => {
      try {
        const log = JSON.parse(l);
        return {
          data: new Date(log.timestamp).toLocaleString("pt-BR"),
          tipo: log.tipo || "sucesso",
          titulo: log.titulo || "Evento do sistema",
          mensagem: log.mensagem || "",
          usuario: log.usuario || "Sistema"
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    // 📄 Configuração do PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=logs_sistema.pdf");

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // Título
    doc.fontSize(18).text("Relatório de Logs do Sistema", { align: "center" });
    doc.moveDown(1);

    logs.forEach((log, i) => {
      doc
        .fontSize(12)
        .text(`🕒 ${log.data}`, { continued: true })
        .text(`   👤 ${log.usuario}`)
        .moveDown(0.3)
        .font("Helvetica-Bold")
        .text(`${log.titulo} (${log.tipo.toUpperCase()})`)
        .font("Helvetica")
        .text(log.mensagem || "-", { align: "justify" })
        .moveDown(0.8);

      if (i < logs.length - 1) doc.moveDown(0.3).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    });

    doc.end();

  } catch (err) {
    console.error("Erro ao exportar PDF:", err);
    res.status(500).send("Erro ao gerar PDF");
  }
});
// ============================================================================
// 🔔 Funções principais de notificação
// ============================================================================
async function enviarNotificacaoUsuario(usuarioOuId, mensagem, tipo) {
  // 🔍 Garante que temos os dados completos do usuário
  let usuario = usuarioOuId;
  if (!usuario.id) {
    const [rows] = await pool.query("SELECT * FROM usuario WHERE id = ?", [usuarioOuId]);
    usuario = rows[0];
    if (!usuario) return console.warn("⚠️ Usuário não encontrado para notificação");
  }

  // 📨 Cria notificação
  const [result] = await pool.query(
    "INSERT INTO notificacao (mensagem, tipo, data_envio, FK_instituicao_id) VALUES (?, ?, NOW(), ?)",
    [mensagem, tipo, usuario.FK_instituicao_id]
  );
  const notificacaoId = result.insertId;
  console.log("📨 Enviando notificação ao usuário:", usuario);

  // 🔗 Relaciona com o usuário
  await pool.query(
    "INSERT INTO usuario_notificacao (FK_usuario_id, FK_notificacao_id) VALUES (?, ?)",
    [usuario.id, notificacaoId]
  );

  // 💌 Envia e-mail (opcional)
  await enviarEmail(usuario.email, "📚 Notificação BibliONtec", `<p>${mensagem}</p>`);
}

async function enviarNotificacaoFuncionario(funcionarioOuInstituicao, mensagem, tipo) {
  let funcionarios = [];

  // 🧩 Se recebeu um objeto de funcionário individual
  if (funcionarioOuInstituicao && funcionarioOuInstituicao.id) {
    funcionarios = [funcionarioOuInstituicao];
  } else {
    // 🔍 Busca todos os funcionários com permissão de circulação dessa instituição
    const instituicaoId = funcionarioOuInstituicao.FK_instituicao_id || funcionarioOuInstituicao;
    const [rows] = await pool.query(
      "SELECT * FROM funcionario WHERE FK_funcao_id = 2 AND FK_instituicao_id = ?",
      [instituicaoId]
    );
    funcionarios = rows;
  }

  if (funcionarios.length === 0) {
    console.warn("⚠️ Nenhum funcionário com permissão de circulação encontrado.");
    return;
  }

  // 📨 Cria uma única notificação
  const [result] = await pool.query(
    "INSERT INTO notificacao (mensagem, tipo, data_envio, FK_instituicao_id) VALUES (?, ?, NOW(), ?)",
    [mensagem, tipo, funcionarios[0].FK_instituicao_id]
  );
  const notificacaoId = result.insertId;

  // 🔗 Vincula a todos os funcionários encontrados
  for (const f of funcionarios) {
    await pool.query(
      "INSERT INTO funcionario_notificacao (FK_funcionario_id, FK_notificacao_id) VALUES (?, ?)",
      [f.id, notificacaoId]
    );
    await enviarEmail(f.email, "📚 Alerta BibliONtec", `<p>${mensagem}</p>`);
  }
}

// ============================================================================
// ⚙️ Função de verificação automática (chamada manual ou pelo cron)
// ============================================================================
async function gerarNotificacoesAutomaticas() {
  const [configs] = await pool.query("SELECT * FROM configuracoes_notificacao");
  const [emprestimos] = await pool.query(`
    SELECT e.*, u.email, u.nome, u.FK_instituicao_id, u.telefone, u.id
    FROM emprestimo e
    JOIN usuario u ON e.FK_usuario_id = u.id
    WHERE e.data_real_devolucao IS NULL
  `);

  const hoje = dayjs();

  for (const emp of emprestimos) {
    // pula empréstimos sem data de devolução
    if (!emp.data_devolucao_prevista) continue;

    // encontra configuração da instituição
    const config = configs.find(c => c.FK_instituicao_id === emp.FK_instituicao_id);
    if (!config) {
      console.warn(`⚠️ Nenhuma configuração encontrada para instituição ${emp.FK_instituicao_id}`);
      continue;
    }

    const diasAntes = config.dias_antes_vencimento || 2;
    const dataPrevista = dayjs(emp.data_devolucao_prevista);
    const diff = dataPrevista.diff(hoje, "day");

    try {
      // 📆 Lembrete antes do vencimento
      if (diff === diasAntes && config.lembrete_vencimento) {
        await enviarNotificacaoUsuario(
          emp,
          `Lembrete: o livro deve ser devolvido em ${diasAntes} dia(s)!`,
          "lembrete"
        );
      }

      // ⏰ Livros atrasados
      if (diff < 0 && config.notificacao_atraso) {
        await enviarNotificacaoFuncionario(
          { FK_instituicao_id: emp.FK_instituicao_id },
          `📕 O usuário ${emp.nome} está com livro em atraso.`,
          "atraso"
        );
      }

    } catch (erroInterno) {
      console.error("❌ Erro ao gerar notificação para empréstimo:", erroInterno);
    }
  }
}


// ============================================================================
// ⏰ Agendamento automático diário às 8h
// ============================================================================

cron.schedule("0 8 * * *", async () => {
  try {
    console.log("⏰ Verificando notificações automáticas...");
    await gerarNotificacoesAutomaticas();
    console.log("✅ Notificações verificadas e enviadas.");
  } catch (err) {
    console.error("❌ Erro no agendamento de notificações:", err);
  }
});

// ============================================================================
// 🌐 ROTAS DE NOTIFICAÇÕES
// ============================================================================

// Buscar notificações do usuário
app.get("/notificacoes/usuario/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT n.id, n.mensagem, n.tipo, DATE_FORMAT(n.data_envio, '%d/%m/%Y') AS data_envio
      FROM notificacao n
      JOIN usuario_notificacao un ON n.id = un.FK_notificacao_id
      WHERE un.FK_usuario_id = ?
      ORDER BY n.data_envio DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar notificações do usuário:", err);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// Buscar notificações do funcionário
app.get("/notificacoes/funcionario/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT n.id, n.mensagem, n.tipo, DATE_FORMAT(n.data_envio, '%d/%m/%Y') AS data_envio
      FROM notificacao n
      JOIN funcionario_notificacao fn ON n.id = fn.FK_notificacao_id
      WHERE fn.FK_funcionario_id = ?
      ORDER BY n.data_envio DESC
    `, [id]);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar notificações do funcionário:", err);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// Rota manual para gerar notificações (teste)
app.get("/notificacoes/gerar", async (req, res) => {

  try {
    await gerarNotificacoesAutomaticas();
    res.json({ mensagem: "✅ Notificações automáticas geradas com sucesso!" });
  } catch (err) {
    console.error("Erro ao gerar notificações:", err);
    res.status(500).json({ error: "Erro ao gerar notificações" });
  }
});

// ============================================================================
// 🔄 Quando um empréstimo é criado → notificação imediata ao usuário
// ============================================================================
app.post('/emprestimos', autenticarToken, async (req, res) => {
  const { usuarioId, livros } = req.body;

  if (!usuarioId || !Array.isArray(livros) || livros.length === 0) {
    return res.status(400).json({ error: "Dados inválidos. Informe usuário e ao menos um livro." });
  }

  const instituicaoId = req.user?.FK_instituicao_id || null;

  try {
    // 🧭 1. Busca duração padrão
    const [config] = await pool.query(
      "SELECT duracao_padrao_emprestimo FROM configuracoes_gerais WHERE FK_instituicao_id = ?",
      [instituicaoId]
    );
    const dias = config[0]?.duracao_padrao_emprestimo || 7;

    // 🧭 2. Define datas
    const hoje = new Date();
    const devolucaoPrevista = new Date();
    devolucaoPrevista.setDate(hoje.getDate() + dias);

    // 🧭 3. Cria empréstimo
    const [result] = await pool.query(
      "INSERT INTO emprestimo (data_emprestimo, data_devolucao_prevista, FK_usuario_id, FK_instituicao_id) VALUES (?, ?, ?, ?)",
      [hoje, devolucaoPrevista, usuarioId, instituicaoId]
    );
    const emprestimoId = result.insertId;

    // 🧭 4. Registra livros e histórico
    for (const livroId of livros) {
      await pool.query("INSERT INTO emprestimo_livro (FK_emprestimo_id, FK_livro_id) VALUES (?, ?)", [emprestimoId, livroId]);
      await pool.query("UPDATE livro SET disponivel = 0 WHERE id = ?", [livroId]);
    }

    const [historicoRes] = await pool.query(
      "INSERT INTO historico (data_leitura, FK_instituicao_id) VALUES (?, ?)",
      [hoje, instituicaoId]
    );
    const historicoId = historicoRes.insertId;

    await pool.query(
      "INSERT INTO historico_usuario (FK_usuario_id, FK_historico_id) VALUES (?, ?)",
      [usuarioId, historicoId]
    );

    for (const livroId of livros) {
      await pool.query(
        "INSERT INTO historico_livro (FK_historico_id, FK_livro_id) VALUES (?, ?)",
        [historicoId, livroId]
      );
    }

    // 🧭 5. Busca o usuário completo
    const [usuarios] = await pool.query("SELECT * FROM usuario WHERE id = ?", [usuarioId]);
    const usuario = usuarios[0];

    // 🧭 6. Envia notificação
    const msg = `📘 Empréstimo realizado com sucesso! O prazo para devolução é ${dayjs(devolucaoPrevista).format("DD/MM/YYYY")}.`;
    await enviarNotificacaoUsuario(usuario, msg, "emprestimo");

    console.log("✅ Notificação enviada ao usuário:", usuario.nome);

    // 🧭 7. Resposta final
    res.status(201).json({
      message: "Empréstimo registrado com sucesso, histórico atualizado e notificação enviada!",
      emprestimoId,
      historicoId
    });

  } catch (err) {
    console.error("❌ Erro ao registrar empréstimo:", err);
    res.status(500).json({ error: "Erro ao registrar empréstimo" });
  }
});
// ======= RELATÓRIOS: utilitário de período =======
function periodoParaDatas(period) {
  const hoje = new Date();
  let inicio;
  if (period === 'week' || period === 'ultima_semana') {
    inicio = new Date();
    inicio.setDate(hoje.getDate() - 7);
  } else if (period === 'month' || period === 'ultimo_mes') {
    inicio = new Date();
    inicio.setMonth(hoje.getMonth() - 1);
  } else if (period === 'year' || period === 'ano') {
    inicio = new Date();
    inicio.setFullYear(hoje.getFullYear() - 1);
  } else {
    inicio = new Date(0); // tudo
  }
  // formata YYYY-MM-DD
  const fmt = d => d.toISOString().slice(0, 10);
  return { inicio: fmt(inicio), fim: fmt(hoje) };
}

// ======= /relatorios/atrasos =======
// Retorna empréstimos com atraso + info de usuário, livro, dias e multa calculada
app.get('/relatorios/atrasos', autenticarToken, async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const { inicio, fim } = periodoParaDatas(period);

    // pega multa padrão (configurações_gerais)
    const [cfgRows] = await pool.query("SELECT multa_por_atraso FROM configuracoes_gerais WHERE FK_instituicao_id = ? LIMIT 1", [req.user.FK_instituicao_id]);
    const multaPorDia = cfgRows[0]?.multa_por_atraso ? parseFloat(cfgRows[0].multa_por_atraso) : 0.0;

    const sql = `
      SELECT e.id AS emprestimo_id, e.data_emprestimo, e.data_devolucao_prevista, e.data_real_devolucao,
             u.id AS usuario_id, u.nome AS usuario_nome, u.email, u.telefone, 
             l.id AS livro_id, l.titulo AS livro_titulo, l.isbn
      FROM emprestimo e
      JOIN emprestimo_livro el ON el.FK_emprestimo_id = e.id
      JOIN livro l ON l.id = el.FK_livro_id
      JOIN usuario u ON u.id = e.FK_usuario_id
      WHERE e.data_real_devolucao IS NULL
        AND e.data_devolucao_prevista < CURDATE()
        AND e.FK_instituicao_id = ?
        AND e.data_emprestimo BETWEEN ? AND ?
      ORDER BY e.data_devolucao_prevista ASC
    `;
    const [rows] = await pool.query(sql, [req.user.FK_instituicao_id, inicio, fim]);

    const resultado = rows.map(r => {
      const prev = new Date(r.data_devolucao_prevista);
      const hoje = new Date();
      const diasAtraso = Math.floor((hoje - prev) / (1000 * 60 * 60 * 24));
      const multa = (diasAtraso > 0) ? (diasAtraso * multaPorDia).toFixed(2) : "0.00";
      return {
        emprestimo_id: r.emprestimo_id,
        usuario: { id: r.usuario_id, nome: r.usuario_nome, email: r.email, telefone: r.telefone },
        livro: { id: r.livro_id, titulo: r.livro_titulo, isbn: r.isbn },
        data_devolucao_prevista: r.data_devolucao_prevista,
        dias_atraso: diasAtraso,
        multa: multa
      };
    });

    res.json(resultado);

  } catch (err) {
    console.error("Erro /relatorios/atrasos:", err);
    res.status(500).json({ error: "Erro ao montar relatório de atrasos" });
  }
});

// ======= /relatorios/emprestimos/stats =======
// Retorna contagem por mês (útil para gráfico de empréstimos e devoluções)
app.get('/relatorios/emprestimos/stats', autenticarToken, async (req, res) => {
  try {
    const period = req.query.period || 'year';
    const { inicio, fim } = periodoParaDatas(period);

    // empréstimos por mês
    const sql = `
      SELECT DATE_FORMAT(data_emprestimo, '%Y-%m') AS mes, COUNT(*) AS total
      FROM emprestimo
      WHERE FK_instituicao_id = ? AND data_emprestimo BETWEEN ? AND ?
      GROUP BY mes
      ORDER BY mes ASC
    `;
    const [emprestimos] = await pool.query(sql, [req.user.FK_instituicao_id, inicio, fim]);

    // devoluções por mês (data_real_devolucao not null)
    const sql2 = `
      SELECT DATE_FORMAT(data_real_devolucao, '%Y-%m') AS mes, COUNT(*) AS total
      FROM emprestimo
      WHERE FK_instituicao_id = ? AND data_real_devolucao BETWEEN ? AND ?
      GROUP BY mes
      ORDER BY mes ASC
    `;
    const [devolucoes] = await pool.query(sql2, [req.user.FK_instituicao_id, inicio, fim]);

    res.json({ emprestimos, devolucoes });
  } catch (err) {
    console.error("Erro /relatorios/emprestimos/stats:", err);
    res.status(500).json({ error: "Erro ao montar estatísticas de empréstimos" });
  }
});

// ======= /relatorios/populares =======
// livros mais emprestados (usa emprestimo_livro)
app.get('/relatorios/populares', autenticarToken, async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const limit = parseInt(req.query.limit) || 10;
    const { inicio, fim } = periodoParaDatas(period);

    const sql = `
      SELECT l.id, l.titulo, COUNT(*) AS total_emprestimos
      FROM emprestimo_livro el
      JOIN emprestimo e ON e.id = el.FK_emprestimo_id
      JOIN livro l ON l.id = el.FK_livro_id
      WHERE e.FK_instituicao_id = ? AND e.data_emprestimo BETWEEN ? AND ?
      GROUP BY l.id, l.titulo
      ORDER BY total_emprestimos DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [req.user.FK_instituicao_id, inicio, fim, limit]);
    res.json(rows);
  } catch (err) {
    console.error("Erro /relatorios/populares:", err);
    res.status(500).json({ error: "Erro ao buscar populares" });
  }
});

// ======= /relatorios/usuarios-ativos =======

// Retorna total de empréstimos agrupado por tipo de usuário (Aluno, Professor, Funcionário)
app.get('/relatorios/usuarios-ativos', autenticarToken, async (req, res) => {
  try {
    const sql = `
      SELECT tu.tipo AS tipo_usuario, COUNT(e.id) AS total_emprestimos
      FROM usuario u
      LEFT JOIN emprestimo e ON e.FK_usuario_id = u.id
      LEFT JOIN tipo_usuario tu ON tu.id = u.FK_tipo_usuario_id
      WHERE u.FK_instituicao_id = ?
      GROUP BY tu.tipo
    `;
    const [rows] = await pool.query(sql, [req.user.FK_instituicao_id]);
    res.json(rows);
  } catch (err) {
    console.error("Erro /relatorios/usuarios-ativos:", err);
    res.status(500).json({ error: "Erro ao montar relatório de usuários" });
  }
});


// ======= /relatorios/export/pdf =======
// ======= /relatorios/export/pdf =======
app.post('/relatorios/export/pdf', autenticarToken, async (req, res) => {
  try {
    const { imgEmp, imgUser, period = 'all' } = req.body;
    const { inicio, fim } = periodoParaDatas(period);
  

    // multa padrão
    const [cfgRows] = await pool.query(
      "SELECT multa_por_atraso FROM configuracoes_gerais WHERE FK_instituicao_id = ? LIMIT 1",
      [req.user.FK_instituicao_id]
    );
    const multaPorDia = cfgRows[0]?.multa_por_atraso ? parseFloat(cfgRows[0].multa_por_atraso) : 0.0;

    // cria PDF em memória
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio_completo_${period}.pdf`);
        res.send(pdfBuffer);
      }
    });

    // ========= Cabeçalho e logo =========
    const logoPath = path.join(__dirname, 'public', 'img', 'logo_bibliontec.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 220, 30, { width: 150 });
      doc.moveDown(4);
    }

    doc.fontSize(18).text('Relatório Completo — BibliONtec', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).text(`Período: ${inicio} até ${fim}`);
    doc.moveDown(1);

    // ========= GRÁFICO DE EMPRÉSTIMOS =========
    if (imgEmp && imgEmp.startsWith('data:image/png')) {
      try {
        const empImg = Buffer.from(imgEmp.split(',')[1], 'base64');
        doc.fontSize(14).text('Gráfico de Empréstimos', { underline: true });
        doc.moveDown(0.4);
        doc.image(empImg, { fit: [480, 250], align: 'center' });
        doc.moveDown(1);
      } catch (e) {
        doc.fontSize(10).fillColor('red').text('Erro ao adicionar gráfico de empréstimos.');
      }
    }

    // ========= GRÁFICO DE USUÁRIOS =========
    if (imgUser && imgUser.startsWith('data:image/png')) {
      try {
        const userImg = Buffer.from(imgUser.split(',')[1], 'base64');
        doc.fontSize(14).fillColor('black').text('Gráfico de Usuários', { underline: true });
        doc.moveDown(0.4);
        doc.image(userImg, { fit: [480, 250], align: 'center' });
        doc.moveDown(1);
      } catch (e) {
        doc.fontSize(10).fillColor('red').text('Erro ao adicionar gráfico de usuários.');
      }
    }

    // ========= TABELA DE ATRASOS =========
    doc.addPage();
    doc.fontSize(14).fillColor('black').text('Atrasos', { underline: true });
    doc.moveDown(0.5);

    const [atrasosRows] = await pool.query(`
      SELECT u.nome AS usuario_nome, l.titulo AS livro_titulo, e.data_devolucao_prevista
      FROM emprestimo e
      JOIN emprestimo_livro el ON el.FK_emprestimo_id = e.id
      JOIN livro l ON l.id = el.FK_livro_id
      JOIN usuario u ON u.id = e.FK_usuario_id
      WHERE e.data_real_devolucao IS NULL
        AND e.data_devolucao_prevista < CURDATE()
        AND e.FK_instituicao_id = ?
    `, [req.user.FK_instituicao_id]);

    if (atrasosRows.length === 0) {
      doc.fontSize(11).text('Nenhum atraso registrado neste período.');
    } else {
      atrasosRows.forEach((a, i) => {
        const dias = Math.floor((new Date() - new Date(a.data_devolucao_prevista)) / (1000 * 60 * 60 * 24));
        const multa = (dias > 0) ? (dias * multaPorDia).toFixed(2) : "0.00";
        doc.fontSize(11).text(`${i + 1}. ${a.usuario_nome} — ${a.livro_titulo} — ${dias} dias — multa: R$${multa}`);
      });
    }

    // Finaliza o PDF corretamente
    doc.end();
  } catch (err) {
    console.error("🚨 Erro /relatorios/export/pdf:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});


// ======= /notificacao/contatar =======
// ======= /notificacao/contatar =======
app.post('/notificacao/contatar', autenticarToken, async (req, res) => {
  try {
    const { email, assunto, mensagem } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail não informado" });

    const nodemailer = require("nodemailer");

    // Usa SMTP_USER/SMTP_PASS se não houver EMAIL_USER/EMAIL_PASS
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const host = process.env.EMAIL_HOST || "smtp.hostinger.com";
    const port = Number(process.env.EMAIL_PORT) || 465;
    const secure = process.env.EMAIL_SECURE === "true" || true;

    if (!user || !pass) {
      return res.status(500).json({ error: "Credenciais de e-mail não configuradas no .env" });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      logger: true,
      debug: true
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"BibliONtec - Notificações" <${user}>`,
      to: email,
      subject: assunto || "Aviso - BibliONtec",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>📚 Notificação - BibliONtec</h2>
          <p>${mensagem}</p>
          <p style="font-size:12px;color:#777;">BibliONtec © ${new Date().getFullYear()}</p>
        </div>
      `,
    });

    console.log("📨 E-mail enviado com sucesso:", info.messageId);
    res.json({ ok: true, enviado: info.messageId });
  } catch (err) {
    console.error("🚨 Erro /notificacao/contatar:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/reservas/pendentes', autenticarToken, async (req, res) => {
  try {
    const sql = `
      SELECT COUNT(*) AS total
      FROM reserva
      WHERE FK_instituicao_id = ?
    `;
    const [[{ total }]] = await pool.query(sql, [req.user.FK_instituicao_id]);
    res.json([{ total }]);
  } catch (err) {
    console.error("Erro /reservas/pendentes:", err.message);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
});

// ======= /notificacao/enviar-usuario =======
app.post('/notificacao/enviar-usuario', autenticarToken, async (req, res) => {
  try {
    const { usuarioId, mensagem, tipo } = req.body;
    if (!usuarioId || !mensagem) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Se tiver tabela de notificações, você pode salvar no banco:
    // await pool.query("INSERT INTO notificacao (FK_usuario_id, mensagem, tipo, data_envio) VALUES (?, ?, ?, NOW())", [usuarioId, mensagem, tipo]);

    console.log(`📨 Notificação interna enviada para usuário ${usuarioId}: ${mensagem}`);
    res.json({ ok: true, mensagem: "Notificação registrada com sucesso" });
  } catch (err) {
    console.error("Erro /notificacao/enviar-usuario:", err.message);
    res.status(500).json({ error: "Erro ao enviar notificação" });
  }
});

// ✅ Agora o app.listen() pode ficar no final
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

