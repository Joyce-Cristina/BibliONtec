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


// Detecta ambiete automaticamente
const envFile =
  process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../.env.production')
    : path.resolve(__dirname, '../../.env.local');

console.log("🌍 Carregando variáveis de:", envFile);
require('dotenv').config({ path: envFile });

const SECRET = process.env.JWT_SECRET;

const mmToPt = mm => mm * 2.8346456693;

const ETIQUETA_W_MM = 85;
const ETIQUETA_H_MM = 50;
const ETIQUETA_W_PT = mmToPt(ETIQUETA_W_MM);
const ETIQUETA_H_PT = mmToPt(ETIQUETA_H_MM);

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const mysqlRaw = require("mysql2/promise");

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



const app = express();
// ============ CORS CONFIGURADO ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://bibliontec.com.br',
  'https://bibliontec.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("🚫 Origem bloqueada pelo CORS:", origin);
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true
}));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Servir uploads e HTML
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

//================= MULTER=================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem JPEG, PNG, JPG e WEBP são permitidos.'));
    }
  }
});


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

app.post('/cadastrarAluno', autenticarToken, upload.single('foto'), (req, res) => {
  const { nome, telefone, email, senha, curso_id, serie, tipo_usuario_id, funcionario_id } = req.body;
  const foto = req.file ? req.file.filename : null;

  if (!nome || !telefone || !email || !tipo_usuario_id)
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

  if (!telefoneValido(telefone))
    return res.status(400).json({ error: 'Telefone inválido.' });

  const checkEmailSql = `SELECT id FROM usuario WHERE email = ?`;
  queryCallback(checkEmailSql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
    if (results.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

    const sql = `INSERT INTO usuario 
      (nome, telefone, email, senha, foto, FK_tipo_usuario_id, curso_id, serie, FK_funcionario_id, FK_instituicao_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    queryCallback(sql, [
      nome, telefone, email, senhaFinal, foto, tipo_usuario_id,
      curso_id || null, serie || null,
      funcionario_id || null,
      req.user.FK_instituicao_id   // 👈 sempre pega do token
    ], (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
      return res.status(200).json({ message: 'Usuário cadastrado com sucesso!', senhaGerada: senhaFinal });
    });
  });
});

app.get('/api/buscar-cdd/:isbn', async (req, res) => {
  const isbn = req.params.isbn;

  try {
    const resposta = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!resposta.ok) {
      return res.status(404).json({ error: 'Livro não encontrado' });
    }

    const dados = await resposta.json();

    let cdd = "000";
    if (dados.classifications && dados.classifications.dewey_decimal_class) {
      cdd = dados.classifications.dewey_decimal_class[0] || "000";
    }

    res.json({ cdd });
  } catch (erro) {
    console.error('Erro ao buscar CDD:', erro);
    res.status(500).json({ error: 'Erro ao buscar CDD' });
  }
});

// ==================== ETIQUETAS ====================

app.get('/etiquetas/:id', async (req, res) => {
  const id = Number(req.params.id);
  const livro = await buscarLivroPorId(id);
  if (!livro) return res.status(404).json({ error: 'Livro não encontrado' });

  try {
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
  } catch (err) {
    console.error('Erro ao gerar etiqueta:', err);
    return res.status(500).json({ error: 'Erro ao gerar etiqueta' });
  }
});

app.post('/cadastrarEvento', autenticarToken, upload.single('foto'), (req, res) => {
  const { nome, patrocinio, local, descri, hora, data_evento } = req.body;
  const foto = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO evento (titulo, descricao, data_evento, hora_evento, foto, FK_instituicao_id, FK_funcionario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nome, descri, data_evento, hora, foto,
    req.user.FK_instituicao_id,
    req.user.id
  ];

  queryCallback(sql, values, (err) => {
    if (err) {
      console.error("Erro ao cadastrar evento:", err);
      return res.status(500).json({ error: "Erro ao cadastrar evento" });
    }
    res.status(200).json({ message: "Evento cadastrado com sucesso!" });
  });
});

// ==================== ETIQUETAS MÚLTIPLAS ====================

app.post('/etiquetas/multiple', async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number) : [];
  if (!ids.length) return res.status(400).json({ error: 'Nenhum id fornecido' });

  try {
    const livros = [];
    for (const id of ids) {
      const l = await buscarLivroPorId(id);
      if (l) livros.push(l);
    }
    if (!livros.length) return res.status(404).json({ error: 'Nenhum livro encontrado' });

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

  } catch (err) {
    console.error('Erro ao gerar etiquetas múltiplas:', err);
    return res.status(500).json({ error: 'Erro ao gerar etiquetas' });
  }
});

// === ROTA: criar reserva (adaptada ao seu schema) ===
app.post('/reservas', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.body;
  if (!usuarioId || !livroId) return res.status(400).json({ error: 'usuarioId e livroId são obrigatórios' });

  const instituicaoId = req.user ? req.user.FK_instituicao_id : null;

  // 1) calcular posição na fila (quantas reservas já existem para este livro)
  const sqlCount = `
    SELECT COUNT(*) AS cnt
    FROM reserva_livro
    WHERE FK_livro_id = ?
  `;
  queryCallback(sqlCount, [livroId], (err, rows) => {
    if (err) {
      console.error('Erro ao contar reservas existentes:', err);
      return res.status(500).json({ error: 'Erro ao processar reserva (count)' });
    }
    const posicao = (rows[0].cnt || 0) + 1;

    // 2) inserir na tabela reserva (usa seu schema: reserva, hora_reserva, retirada, posicao, FK_instituicao_id)
    const sqlInsertReserva = `
      INSERT INTO reserva (reserva, hora_reserva, retirada, posicao, FK_instituicao_id)
      VALUES (?, CURDATE(), ?, ?, ?)
    `;
    queryCallback(sqlInsertReserva, [1, 0, String(posicao), instituicaoId], (err2, result) => {
      if (err2) {
        console.error('Erro ao inserir reserva:', err2);
        return res.status(500).json({ error: err2.sqlMessage || 'Erro ao inserir reserva' });
      }
      const reservaId = result.insertId;

      // 3) vincular livro na reserva (tabela reserva_livro já existe no seu dump)
      queryCallback('INSERT INTO reserva_livro (FK_reserva_id, FK_livro_id) VALUES (?, ?)', [reservaId, livroId], (err3) => {
        if (err3) {
          console.error('Erro ao inserir reserva_livro:', err3);
          return res.status(500).json({ error: 'Erro ao vincular livro à reserva' });
        }

        // 4) vincular usuário à reserva (tabela criada por migração acima)
        queryCallback('INSERT INTO reserva_usuario (FK_reserva_id, FK_usuario_id) VALUES (?, ?)', [reservaId, usuarioId], (err4) => {
          if (err4) {
            // se der erro aqui (tabela não existe) apenas logamos, mas a reserva já foi criada
            console.warn('Aviso: erro ao inserir reserva_usuario (pode não existir):', err4.message);
          }

          // 5) criar histórico (usa sua tabela historico existente)
          queryCallback('INSERT INTO historico (data_leitura, FK_instituicao_id) VALUES (NOW(), ?)', [instituicaoId], (err5, histRes) => {
            if (err5) {
              console.error('Erro ao inserir historico:', err5);
              return res.status(500).json({ error: 'Erro ao criar histórico' });
            }
            const historicoId = histRes.insertId;

            // 6) vincular historico ao usuario
            queryCallback('INSERT INTO historico_usuario (FK_usuario_id, FK_historico_id) VALUES (?, ?)', [usuarioId, historicoId], (err6) => {
              if (err6) console.warn('Erro ao inserir historico_usuario:', err6.message);

              // 7) vincular historico ao livro (precisa da tabela historico_livro criada acima)
              queryCallback('INSERT INTO historico_livro (FK_historico_id, FK_livro_id) VALUES (?, ?)', [historicoId, livroId], (err7) => {
                if (err7) console.warn('Erro ao inserir historico_livro (pode não existir):', err7.message);

                // tudo ok
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
});

// ==================== INDICAÇOES ====================

app.post('/indicacoes/multiplas', (req, res) => {
  const { usuarioId, indicacaoId, cursoId, serie } = req.body;

  const sql = `INSERT INTO indicacao_usuario (FK_usuario_id, FK_indicacao_id, FK_curso_id, serie)
               VALUES (?, ?, ?, ?)`;

  queryCallback(sql, [usuarioId, indicacaoId, cursoId, serie], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar indicação.' });
    }
    res.json({ success: true });
  });
});
//=================  Remover indicação =================
app.delete('/indicacoes/:usuarioId/:livroId', (req, res) => {
  const { usuarioId, livroId } = req.params;

  // Primeiro busca o id da indicação correspondente ao livro
  const sqlBusca = `
    SELECT i.id AS indicacao_id
    FROM indicacao i
    JOIN indicacao_usuario iu ON iu.FK_indicacao_id = i.id
    JOIN livro l ON l.id = ?
    WHERE iu.FK_usuario_id = ?;
  `;

  queryCallback(sqlBusca, [livroId, usuarioId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar indicação." });
    }

    if (!rows.length) {
      return res.status(404).json({ error: "Nenhuma indicação encontrada." });
    }

    const indicacaoId = rows[0].indicacao_id;

    const sqlDelete = `DELETE FROM indicacao_usuario WHERE FK_indicacao_id = ? AND FK_usuario_id = ?`;

    queryCallback(sqlDelete, [indicacaoId, usuarioId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao remover indicação." });
      }

      res.json({ success: true });
    });
  });
});

//=================  Indicar livro para múltiplas turmas =================

app.post('/indicacoes/multiplas-turmas', (req, res) => {
  const { usuarioId, livroId, turmas } = req.body;

  if (!usuarioId || !livroId || !Array.isArray(turmas) || turmas.length === 0) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  queryCallback(
    'SELECT FK_tipo_usuario_id FROM usuario WHERE id = ?',
    [usuarioId],
    (err, usuarioResults) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      if (usuarioResults.length === 0 || usuarioResults[0].FK_tipo_usuario_id !== 2) {
        return res.status(403).json({ error: 'Apenas professores podem indicar livros' });
      }

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
                return resolve({ cursoId, serie, status: 'já_existe' });
              }

              queryCallback(
                'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
                [livroId.toString(), 1],
                (err, result) => {
                  if (err) return reject(err);

                  const indicacaoId = result.insertId;

                  queryCallback(
                    'INSERT INTO indicacao_usuario (FK_indicacao_id, FK_usuario_id, FK_curso_id, serie) VALUES (?, ?, ?, ?)',
                    [indicacaoId, usuarioId, cursoId, serie],
                    (err) => {
                      if (err) return reject(err);
                      resolve({ cursoId, serie, status: 'sucesso' });
                    }
                  );
                }
              );
            }
          );
        });
      });

      // Executar todas as indicações
      Promise.all(indicacoesPromises)
        .then(results => {
          const sucessos = results.filter(r => r.status === 'sucesso');
          const jaExistentes = results.filter(r => r.status === 'já_existe');

          res.status(201).json({
            message: `Indicações processadas: ${sucessos.length} novas, ${jaExistentes.length} já existiam`,
            detalhes: results
          });
        })
        .catch(error => {
          console.error('Erro ao processar indicações:', error);
          res.status(500).json({ error: 'Erro ao processar indicações' });
        });
    }
  );
});
//=================  Depurar turmas =================
app.get('/turmas', (req, res) => {
  console.log('=== INICIANDO DEBUG TURMAS ===');

  // 1. Primeiro, verifica todos os cursos
  queryCallback('SELECT id, curso FROM curso', (err, cursos) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
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
          return res.status(500).json({ error: 'Erro na query original', details: err.message });
        }

        console.log('Resultado da query original:', resultadoQuery);

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
app.post('/indicacoes', (req, res) => {
  const { usuarioId, livroId, cursoId, serie } = req.body;

  // 1. Verificar se usuário é professor
  queryCallback(
    'SELECT FK_tipo_usuario_id FROM usuario WHERE id = ?',
    [usuarioId],
    (err, usuarioResults) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      if (usuarioResults.length === 0 || usuarioResults[0].FK_tipo_usuario_id !== 2) {
        return res.status(403).json({ error: 'Apenas professores podem indicar livros' });
      }

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
            return res.status(500).json({ error: 'Erro interno no servidor' });
          }

          if (indicacoesResults.length > 0) {
            return res.status(409).json({ error: 'Você já indicou este livro para esta turma' });
          }

          // 3. Criar indicação
          queryCallback(
            'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
            [livroId.toString(), 1],
            (err, result) => {
              if (err) {
                console.error('Erro ao criar indicação:', err);
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
                    return res.status(500).json({ error: 'Erro interno no servidor' });
                  }

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

app.get('/verificar-indicacao/:usuarioId/:livroId', (req, res) => {
  const { usuarioId, livroId } = req.params;

  // Verifica se o usuário já indicou este livro (em qualquer turma)
  queryCallback(
    `SELECT i.id 
     FROM indicacao i
     JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
     WHERE iu.FK_usuario_id = ? AND i.indicacao = ?`,
    [usuarioId, livroId.toString()],
    (err, results) => {
      if (err) {
        console.error('Erro ao verificar indicação:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      res.json({ indicado: results.length > 0 });
    }
  );
});

app.get('/indicacoes-professor/:usuarioId', (req, res) => {
  const { usuarioId } = req.params;

  queryCallback(
    `SELECT i.indicacao as livro_id, i.id as indicacao_id
     FROM indicacao i
     JOIN indicacao_usuario iu ON i.id = iu.FK_indicacao_id
     WHERE iu.FK_usuario_id = ?`,
    [usuarioId],
    (err, indicacoes) => {
      if (err) {
        console.error('Erro ao buscar indicações:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      res.json(indicacoes);
    }
  );
});



//=================LOGIN DE USUÁRIO E FUNCIONÁRIO=================
// LOGIN USUÁRIO E FUNCIONÁRIO
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1) Login usuário
    const [users] = await pool.query(`
      SELECT id, nome, FK_tipo_usuario_id, foto, FK_instituicao_id, senha, curso_id, serie
      FROM usuario
      WHERE email = ?
    `, [email]);

    if (users.length > 0) {
      const usuario = users[0];

      if (usuario.senha !== senha) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      await pool.query(`UPDATE usuario SET ultimo_login = NOW() WHERE id = ?`, [usuario.id]);

      const token = jwt.sign({
        id: usuario.id,
        tipo_usuario_id: usuario.FK_tipo_usuario_id,
        FK_instituicao_id: usuario.FK_instituicao_id,
        curso_id: usuario.curso_id,
        serie: usuario.serie
      }, SECRET, { expiresIn: '8h' });

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

    // 2) Login funcionário
    const [funcionarios] = await pool.query(`
      SELECT f.id, f.nome, f.email, f.senha, f.telefone, f.foto, 
             f.FK_funcao_id AS funcao_id,
             f.FK_instituicao_id, fn.funcao AS funcao_nome
      FROM funcionario f
      JOIN funcao fn ON f.FK_funcao_id = fn.id
      WHERE f.email = ?
    `, [email]);

    if (funcionarios.length === 0 || funcionarios[0].senha !== senha) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    const funcionario = funcionarios[0];

    const token = jwt.sign({
      id: funcionario.id,
      role: "funcionario",
      funcao: funcionario.funcao_id,
      FK_instituicao_id: funcionario.FK_instituicao_id,
    }, SECRET, { expiresIn: '8h' });

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
    console.error("❌ ERRO NO LOGIN:", err.message);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

// middleware para validar token
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


// ================= ROTAS DE FUNCIONARIO =================

// ==================== CADASTRO FUNCIONÁRIO ====================

app.post('/cadastrarFuncionario', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const { nome, senha, email, telefone, FK_funcao_id } = req.body;
    let permissoes = req.body['permissoes[]'] || [];

    if (typeof permissoes === "string") {
      permissoes = [permissoes];
    }

    let foto = req.file ? req.file.filename : 'padrao.png';

    if (!nome || !email) return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    if (telefone && !telefoneValido(telefone)) return res.status(400).json({ error: 'Telefone inválido.' });

    if (req.file) {
      foto = Date.now() + '.jpg';
      const uploadDir = path.join(__dirname, '..', 'uploads', foto);

      await sharp(req.file.path)
        .resize(300, 300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(uploadDir);

      fs.unlinkSync(req.file.path); // remove original
    }

    const checkEmailSql = `SELECT id FROM funcionario WHERE email = ?`;
    queryCallback(checkEmailSql, [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
      if (results.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado.' });

      const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

      const sql = `INSERT INTO funcionario 
        (nome, senha, email, foto, telefone, FK_funcao_id, FK_instituicao_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      queryCallback(sql, [nome, senhaFinal, email, foto, telefone, FK_funcao_id, req.user.FK_instituicao_id], (err, result) => {
        if (err) {
          console.error("Erro no INSERT:", err);
          return res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
        }

        const funcionarioId = result.insertId;

        if (permissoes.length > 0) {
          const values = permissoes.map(p => [p, funcionarioId]);
          const permSql = `INSERT INTO funcionario_permissao (FK_permissao_id, FK_funcionario_id) VALUES ?`;
          queryCallback(permSql, [values], (err) => {
            if (err) return res.status(500).json({ error: 'Funcionário criado, mas erro nas permissões.', senhaGerada: senhaFinal });
            return res.status(200).json({ message: 'Funcionário cadastrado com sucesso!', senhaGerada: senhaFinal });
          });
        } else {
          return res.status(200).json({ message: 'Funcionário cadastrado com sucesso!', senhaGerada: senhaFinal });
        }
      });
    });
  } catch (error) {
    console.error("Erro inesperado:", error);
    return res.status(500).json({ error: 'Erro inesperado no servidor.' });
  }
});




// Função para validar senha forte
function senhaValida(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(senha);
}

// Buscar funcionário pelo ID (apenas da mesma instituição)
app.get('/api/funcionarios/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT f.*, f.telefone, fu.funcao AS nome_funcao
    FROM funcionario f
    LEFT JOIN funcao fu ON f.FK_funcao_id = fu.id
    WHERE f.id = ? AND f.FK_instituicao_id = ?
  `;

  queryCallback(sql, [id, req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar funcionário:", err);
      return res.status(500).json({ error: "Erro ao buscar funcionário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Funcionário não encontrado ou não pertence à sua instituição" });
    }

    res.json({ funcionario: results[0] });
  });
});

app.get('/indicacoes/:cursoId/:serie', autenticarToken, (req, res) => {
  const { cursoId, serie } = req.params;

  const sql = `
    SELECT l.id, l.titulo, l.capa, l.sinopse, c.curso, iu.serie
    FROM indicacao_usuario iu
    JOIN indicacao i ON iu.FK_indicacao_id = i.id
    JOIN livro l ON i.indicacao = l.id
    JOIN curso c ON iu.FK_curso_id = c.id
    WHERE iu.FK_curso_id = ? AND iu.serie = ?
  `;

  queryCallback(sql, [cursoId, serie], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no servidor' });
    res.json(results);
  });
});

// Apaga funcionário e dependências
app.delete('/api/funcionarios/:id', (req, res) => {
  const id = parseInt(req.params.id);

  // 1. Buscar todos os usuários desse funcionário
  const sqlUsuarios = 'SELECT id FROM usuario WHERE FK_funcionario_id = ?';
  queryCallback(sqlUsuarios, [id], (err, usuarios) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });

    const usuarioIds = usuarios.map(u => u.id);

    if (usuarioIds.length > 0) {
      // 2. Deletar registros em usuario_curso desses usuários
      queryCallback('DELETE FROM usuario_curso WHERE FK_usuario_id IN (?)', [usuarioIds], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar usuario_curso' });

        // 3. Deletar os usuários
        queryCallback('DELETE FROM usuario WHERE id IN (?)', [usuarioIds], (err) => {
          if (err) return res.status(500).json({ error: 'Erro ao deletar usuários' });

          // 4. Deletar o funcionário
          queryCallback('DELETE FROM funcionario WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao excluir funcionário' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
            res.status(200).json({ message: 'Funcionário excluído com sucesso' });
          });
        });
      });
    } else {
      // Nenhum usuário vinculado, pode apagar direto
      queryCallback('DELETE FROM funcionario WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Erro ao excluir funcionário' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
        res.status(200).json({ message: 'Funcionário excluído com sucesso' });
      });
    }
  });
});



// Listar funções
app.get("/funcoes", autenticarToken, (req, res) => {
  const sql = "SELECT id, funcao FROM funcao";
  queryCallback(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar funções:", err);
      return res.status(500).json({ error: "Erro no servidor" });
    }
    res.json(results);
  });
});

// Listar funcionários (apenas da mesma instituição)
app.get('/api/funcionarios', autenticarToken, (req, res) => {
  const sql = `
    SELECT f.id, f.nome, f.email, f.telefone, f.foto, 
           f.FK_funcao_id,
           fun.funcao AS funcao
    FROM funcionario f
    LEFT JOIN funcao fun ON f.FK_funcao_id = fun.id
    WHERE f.FK_instituicao_id = ?
  `;

  queryCallback(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});
// ==================== ATUALIZAR FUNCIONÁRIO (com foto) ====================
// ==================== ATUALIZAR FUNCIONÁRIO (com foto) ====================
app.put('/api/funcionarios/:id', autenticarToken, upload.single("foto"), (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, FK_funcao_id } = req.body;
  const foto = req.file ? req.file.filename : undefined;

  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (telefone !== undefined) { updates.push("telefone = ?"); values.push(telefone); }
  if (FK_funcao_id !== undefined) { updates.push("FK_funcao_id = ?"); values.push(FK_funcao_id); }
  if (foto !== undefined) { updates.push("foto = ?"); values.push(foto); }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  const sql = `UPDATE funcionario SET ${updates.join(", ")} WHERE id = ? AND FK_instituicao_id = ?`;
  values.push(id, req.user.FK_instituicao_id);

  queryCallback(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar funcionário:", err);
      return res.status(500).json({ error: "Erro ao atualizar funcionário" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }
    res.json({ message: "Funcionário atualizado com sucesso!" });
  });
});



// ================= ROTAS DE USUÁRIO =================



// ================= Rota: listar todos usuários da mesma instituição =================
app.get('/api/usuarios', autenticarToken, (req, res) => {
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto,u.senha,
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

// ================= Rota: buscar usuário pelo ID =================
app.get('/api/usuario/:id', autenticarToken, (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto,u.senha,
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
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
    if (results.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json({ usuario: results[0] });
  });
});

// ================= Rota: atualizar usuário =================
app.put('/api/usuarios/:id', autenticarToken, upload.single('foto'), (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, senha, curso_id, serie, FK_tipo_usuario_id } = req.body;
  const foto = req.file ? req.file.filename : undefined;

  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (telefone !== undefined) { updates.push("telefone = ?"); values.push(telefone); }
  if (senha !== undefined) { updates.push("senha = ?"); values.push(senha); } // Pode criptografar se quiser
  if (curso_id !== undefined) { updates.push("curso_id = ?"); values.push(curso_id); }
  if (serie !== undefined) { updates.push("serie = ?"); values.push(serie); }
  if (FK_tipo_usuario_id !== undefined) { updates.push("FK_tipo_usuario_id = ?"); values.push(FK_tipo_usuario_id); }
  if (foto !== undefined) { updates.push("foto = ?"); values.push(foto); }

  if (updates.length === 0) return res.status(400).json({ error: "Nenhum campo para atualizar." });

  const sql = `UPDATE usuario SET ${updates.join(", ")} WHERE id = ? AND FK_instituicao_id = ?`;
  values.push(id, req.user.FK_instituicao_id);

  queryCallback(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
    if (result.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado." });
    res.json({ message: "Usuário atualizado com sucesso!" });
  });
});

// ================= Rota: deletar usuário =================
app.delete('/api/usuarios/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  const sqlDependencias = 'DELETE FROM usuario_curso WHERE FK_usuario_id = ?';
  queryCallback(sqlDependencias, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar dependências' });

    queryCallback('DELETE FROM usuario WHERE id = ? AND FK_instituicao_id = ?', [id, req.user.FK_instituicao_id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.status(200).json({ message: 'Usuário excluído com sucesso' });
    });
  });
});

// ================= Rota: verificar se nome já existe =================
app.get('/verificarNome', (req, res) => {
  const { nome } = req.query;
  if (!nome) return res.status(400).json({ error: 'Nome não informado.' });

  const sqlAluno = 'SELECT id FROM usuario WHERE nome = ? LIMIT 1';
  const sqlFunc = 'SELECT id FROM funcionario WHERE nome = ? LIMIT 1';

  queryCallback(sqlAluno, [nome], (err, alunoResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar aluno.' });

    queryCallback(sqlFunc, [nome], (err2, funcResult) => {
      if (err2) return res.status(500).json({ error: 'Erro ao verificar funcionário.' });

      const exists = (alunoResult.length > 0) || (funcResult.length > 0);
      res.json({ exists });
    });
  });
});

// ================= Rota: listar tipos de usuário =================
app.get("/tipos-usuario", (req, res) => {
  const sql = "SELECT id, tipo FROM tipo_usuario";
  queryCallback(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar tipos de usuário" });
    res.json(results);
  });
});
app.post('/lista-desejos', autenticarToken, (req, res) => {
  const { usuarioId, livroId } = req.body;

  if (!usuarioId || !livroId) {
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
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Livro já está na lista de desejos' });
    }

    // Verificar se o usuário já tem uma lista de desejos
    const sqlFindLista = 'SELECT id FROM lista_desejo WHERE FK_usuario_id = ? LIMIT 1';
    
    queryCallback(sqlFindLista, [usuarioId], (err, listaResults) => {
      if (err) {
        console.error('Erro ao buscar lista de desejos:', err);
        return res.status(500).json({ error: 'Erro interno no servidor' });
      }

      let listaId;

      if (listaResults.length > 0) {
        // Usar lista existente
        listaId = listaResults[0].id;
        adicionarLivroLista(listaId, livroId, res);
      } else {
        // Criar nova lista de desejos
        const sqlCreateLista = `
          INSERT INTO lista_desejo (lista_desejo, FK_usuario_id, FK_instituicao_id) 
          VALUES (?, ?, ?)
        `;
        
        queryCallback(sqlCreateLista, ['Minha Lista', usuarioId, 1], (err, result) => {
          if (err) {
            console.error('Erro ao criar lista de desejos:', err);
            return res.status(500).json({ error: 'Erro interno no servidor' });
          }

          listaId = result.insertId;
          adicionarLivroLista(listaId, livroId, res);
        });
      }
    });
  });
});

function adicionarLivroLista(listaId, livroId, res) {
  const sqlInsert = 'INSERT INTO lista_livro (FK_lista_desejo_id, FK_livro_id) VALUES (?, ?)';
  
  queryCallback(sqlInsert, [listaId, livroId], (err) => {
    if (err) {
      console.error('Erro ao adicionar livro à lista:', err);
      return res.status(500).json({ error: 'Erro ao adicionar livro à lista de desejos' });
    }

    res.status(201).json({ message: 'Livro adicionado à lista de desejos com sucesso!' });
  });
}

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
//=================  Cadastro de Livro =================


// ======================= LISTAR LIVROS DO ACERVO =======================
app.get('/acervo/livros', autenticarToken, (req, res) => {
  const sql = `
    SELECT l.id, l.titulo, l.sinopse, l.capa, l.cdd, l.paginas, l.isbn,
           g.genero, e.editora AS editora,
           GROUP_CONCAT(a.nome SEPARATOR ', ') AS autores,
           f.nome AS funcionario_cadastrou,
           l.disponivel
    FROM livro l
    LEFT JOIN genero g ON l.FK_genero_id = g.id
    LEFT JOIN editora e ON l.FK_editora_id = e.id
    LEFT JOIN livro_autor la ON la.FK_livro_id = l.id
    LEFT JOIN autor a ON la.FK_autor_id = a.id
    LEFT JOIN funcionario f ON l.FK_funcionario_id = f.id
    WHERE l.FK_instituicao_id = ?
    GROUP BY l.id
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

  console.log('Dados recebidos:', req.body); // Para debug
  console.log('Arquivo recebido:', req.file); // Para debug

  const id = parseInt(req.params.id);
  const { titulo, isbn, sinopse, paginas, generoId, editoraId } = req.body;
  const capa = req.file ? req.file.filename : null;

  const sql = `
    UPDATE livro 
    SET titulo=?, isbn=?, sinopse=?, paginas=?, FK_genero_id=?, FK_editora_id=? ${capa ? ', capa=?' : ''}
    WHERE id=?`;

  const values = [titulo, isbn, sinopse, paginas, generoId, editoraId];
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

app.delete('/livros/:id', (req, res) => {
  const { id } = req.params;

  queryCallback('DELETE FROM livro_autor WHERE FK_livro_id = ?', [id], (err) => {
    if (err) {
      console.error('Erro ao deletar autores do livro:', err);
      return res.status(500).json({ error: 'Erro ao deletar autores do livro' });
    }

    // Depois, deletar o livro
    queryCallback('DELETE FROM livro WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Erro ao deletar livro:', err);
        return res.status(500).json({ error: 'Erro ao deletar livro' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.json({ message: 'Livro excluído com sucesso' });
    });
  });
});

// ================= Buscar comentários de um livro =================

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


app.post("/livros/:id/comentarios", async (req, res) => {
  try {
    const { usuarioId, comentario } = req.body;
    const livroId = req.params.id;

    if (!usuarioId || !comentario) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    // Filtra o comentário
    const comentarioFiltrado = await filtrarComentario(comentario);

    // ✅ Usando callback style (consistente com o resto do seu código)
    queryCallback(
      "INSERT INTO comentario (comentario, data_comentario) VALUES (?, NOW())",
      [comentarioFiltrado],
      (err, result) => {
        if (err) {
          console.error("Erro ao salvar comentário:", err);
          return res.status(500).json({ error: "Erro ao salvar comentário." });
        }

        const comentarioId = result.insertId;

        // Vincular comentário ao usuário
        queryCallback(
          "INSERT INTO usuario_comentario (FK_usuario_id, FK_comentario_id) VALUES (?, ?)",
          [usuarioId, comentarioId],
          (err) => {
            if (err) {
              console.error("Erro ao vincular usuário:", err);
              return res.status(500).json({ error: "Erro ao salvar comentário." });
            }

            // Vincular comentário ao livro
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
    SELECT f.id, f.nome, f.email, f.telefone, f.foto, fun.funcao AS funcao, f.FK_funcao_id
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

app.post('/emprestimos', autenticarToken, async (req, res) => {
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
});

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


// ✅ Agora o app.listen() pode ficar no final
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

