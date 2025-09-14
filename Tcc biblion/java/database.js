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


require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
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
  queueLimit: 0,
  charset: "utf8mb4"
});

module.exports = pool;

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Servir a pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Servir arquivos HTML (supondo que estejam na pasta acima)
app.use(express.static(path.join(__dirname, '..')));

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

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

// ================= MYSQL=================

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '', // usa 'root' se não existir
  database: process.env.DB_NAME || 'bibliontec'
});


connection.connect(err => {
  if (err) {
    console.error('Erro na conexão com o MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL');
});

async function buscarLivroPorId(id) {
  try {
    const [rows] = await pool.query('SELECT id, titulo, autores, isbn, editora FROM livro WHERE id = ?', [id]);
    return rows[0] || null;
  } catch (err) {
    console.error('Erro ao buscar livro:', err);
    return null;
  }
}

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
  connection.query(checkEmailSql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
    if (results.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

    const sql = `INSERT INTO usuario 
      (nome, telefone, email, senha, foto, FK_tipo_usuario_id, curso_id, serie, FK_funcionario_id, FK_instituicao_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(sql, [
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

// ==================== INDICAÇOES ====================

app.post('/indicacoes/multiplas', (req, res) => {
  const { usuarioId, indicacaoId, cursoId, serie } = req.body;

  const sql = `INSERT INTO indicacao_usuario (FK_usuario_id, FK_indicacao_id, FK_curso_id, serie)
               VALUES (?, ?, ?, ?)`;

  connection.query(sql, [usuarioId, indicacaoId, cursoId, serie], (err, result) => {
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

  connection.query(sqlBusca, [livroId, usuarioId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Erro ao buscar indicação." });
    }

    if (!rows.length) {
      return res.status(404).json({ error: "Nenhuma indicação encontrada." });
    }

    const indicacaoId = rows[0].indicacao_id;

    const sqlDelete = `DELETE FROM indicacao_usuario WHERE FK_indicacao_id = ? AND FK_usuario_id = ?`;

    connection.query(sqlDelete, [indicacaoId, usuarioId], (err) => {
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

  connection.query(
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

          connection.query(
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

              connection.query(
                'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
                [livroId.toString(), 1],
                (err, result) => {
                  if (err) return reject(err);

                  const indicacaoId = result.insertId;

                  connection.query(
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
  connection.query('SELECT id, curso FROM curso', (err, cursos) => {
    if (err) {
      console.error('Erro ao buscar cursos:', err);
      return res.status(500).json({ error: 'Erro ao buscar cursos', details: err.message });
    }

    console.log('Cursos encontrados:', cursos);

    // 2. Verifica usuários com curso e série
    connection.query(`
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
      connection.query(`
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
  connection.query(
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
      connection.query(
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
          connection.query(
            'INSERT INTO indicacao (indicacao, FK_instituicao_id) VALUES (?, ?)',
            [livroId.toString(), 1],
            (err, result) => {
              if (err) {
                console.error('Erro ao criar indicação:', err);
                return res.status(500).json({ error: 'Erro interno no servidor' });
              }

              const indicacaoId = result.insertId;

              // 4. Vincular usuário e turma à indicação
              connection.query(
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
  connection.query(
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

  connection.query(
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

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // 1) tenta login de usuário
  const sqlUsuario = `
    SELECT id, nome, FK_tipo_usuario_id AS tipo, foto, FK_instituicao_id, senha
    FROM usuario 
    WHERE email = ?
  `;

  connection.query(sqlUsuario, [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no servidor' });

    if (results.length > 0) {
      const usuario = results[0];
      if (usuario.senha !== senha) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      // Token do usuário agora leva a instituição
      const token = jwt.sign({
        id: usuario.id,
        tipo_usuario_id: usuario.tipo,              // ✅ corrigido (era undefined antes)
        FK_instituicao_id: usuario.FK_instituicao_id
      }, SECRET, { expiresIn: '8h' });

      return res.status(200).json({
        message: 'Login usuário bem-sucedido',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          tipo_usuario_id: usuario.tipo,
          FK_instituicao_id: usuario.FK_instituicao_id,
          foto: usuario.foto || 'padrao.png'
        }
      });
    }

    // 2) tenta login de funcionário
    const sqlFuncionario = `
      SELECT f.id, f.nome, f.email, f.senha, f.telefone, f.foto, 
             f.FK_funcao_id AS funcao_id,
             f.FK_instituicao_id, fn.funcao AS funcao_nome
      FROM funcionario f
      JOIN funcao fn ON f.FK_funcao_id = fn.id
      WHERE f.email = ?
    `;

    connection.query(sqlFuncionario, [email], (err, results) => {
      if (err) return res.status(500).json({ error: "Erro no servidor" });

      if (results.length === 0 || results[0].senha !== senha) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      const funcionario = results[0];

      // Token do funcionário agora leva a instituição também
      const token = jwt.sign(
        {
          id: funcionario.id,
          role: "funcionario",
          funcao: funcionario.funcao_id,
          FK_instituicao_id: funcionario.FK_instituicao_id   // ✅ incluído
        },
        SECRET,
        { expiresIn: "8h" }
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
    });
  });
});
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado" });

    console.log("🔑 Payload do token:", payload); // 👈 LOGA O QUE VEM NO TOKEN
    req.user = payload;
    next();
  });
}


// Função de autenticação
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado" });

    req.user = payload; // 👈 dados do usuário
    next();
  });
}



// ==================== CADASTRO LIVRO ====================
app.post('/cadastrarLivro', autenticarToken, upload.single('capa'), (req, res) => {
  const {
    titulo, edicao, paginas, quantidade, local_publicacao, data_publicacao,
    sinopse, isbn, assunto_discutido, subtitulo, volume,
    FK_genero_id, FK_funcionario_id, FK_classificacao_id, FK_status_id,
    FK_editora_id // 👈 adicionar aqui
  } = req.body;


  const capa = req.file ? req.file.filename : null;

  const sql = `
INSERT INTO livro (
  edicao,
  capa,
  paginas,
  quantidade,
  local_publicacao,
  data_publicacao,
  sinopse,
  isbn,
  titulo,
  assunto_discutido,
  subtitulo,
  volume,
  FK_funcionario_id,
  FK_classificacao_id,
  FK_status_id,
  FK_instituicao_id,
  FK_genero_id,
  FK_editora_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
  const values = [
    edicao || null,
    capa || null,
    paginas ? parseInt(paginas) : null,
    quantidade ? parseInt(quantidade) : null,
    local_publicacao || null,
    data_publicacao || null,
    sinopse || null,
    isbn || null,
    titulo || null,
    assunto_discutido || null,
    subtitulo || null,
    volume || null,
    req.user.id, // 👈 FK_funcionario_id
    FK_classificacao_id ? parseInt(FK_classificacao_id) : null,
    FK_status_id ? parseInt(FK_status_id) : null,
    req.user?.FK_instituicao_id || 1,
    FK_genero_id ? parseInt(FK_genero_id) : null,
    FK_editora_id ? parseInt(FK_editora_id) : null
  ];


  connection.query(sql, values, (err) => {
    if (err) {
      console.error('Erro ao cadastrar livro:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar livro' });
    }
    res.status(200).json({ message: 'Livro cadastrado com sucesso!' });
  });
});

// ======================= LISTAR LIVROS =======================
app.get('/livros', autenticarToken, (req, res) => {
  const sql = `
    SELECT l.id, l.titulo, l.sinopse, l.capa, l.paginas, l.isbn,
           g.genero, e.editora AS editora,
           GROUP_CONCAT(a.nome SEPARATOR ', ') AS autores,
           f.nome AS funcionario_cadastrou
    FROM livro l
    LEFT JOIN genero g ON l.FK_genero_id = g.id
    LEFT JOIN editora e ON l.FK_editora_id = e.id
    LEFT JOIN livro_autor la ON la.FK_livro_id = l.id
    LEFT JOIN autor a ON la.FK_autor_id = a.id
    LEFT JOIN funcionario f ON l.FK_funcionario_id = f.id
    WHERE l.FK_instituicao_id = ?
    GROUP BY l.id
  `;
  connection.query(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar livros' });
    res.json(results);
  });
});


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
    connection.query(checkEmailSql, [email], (err, results) => {
      if (err) return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
      if (results.length > 0) return res.status(400).json({ error: 'E-mail já cadastrado.' });

      const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

      const sql = `INSERT INTO funcionario 
        (nome, senha, email, foto, telefone, FK_funcao_id, FK_instituicao_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      connection.query(sql, [nome, senhaFinal, email, foto, telefone, FK_funcao_id, req.user.FK_instituicao_id], (err, result) => {
        if (err) {
          console.error("Erro no INSERT:", err);
          return res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
        }

        const funcionarioId = result.insertId;

        if (permissoes.length > 0) {
          const values = permissoes.map(p => [p, funcionarioId]);
          const permSql = `INSERT INTO funcionario_permissao (FK_permissao_id, FK_funcionario_id) VALUES ?`;
          connection.query(permSql, [values], (err) => {
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
app.get('/funcionario/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT f.*, f.telefone, fu.funcao AS nome_funcao
    FROM funcionario f
    LEFT JOIN funcao fu ON f.FK_funcao_id = fu.id
    WHERE f.id = ? AND f.FK_instituicao_id = ?
  `;

  connection.query(sql, [id, req.user.FK_instituicao_id], (err, results) => {
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




// Apaga funcionário e dependências
app.delete('/api/funcionarios/:id', (req, res) => {
  const id = parseInt(req.params.id);

  // 1. Buscar todos os usuários desse funcionário
  const sqlUsuarios = 'SELECT id FROM usuario WHERE FK_funcionario_id = ?';
  connection.query(sqlUsuarios, [id], (err, usuarios) => {
    if (err) return res.status(500).json({ error: 'Erro ao buscar usuários' });

    const usuarioIds = usuarios.map(u => u.id);

    if (usuarioIds.length > 0) {
      // 2. Deletar registros em usuario_curso desses usuários
      connection.query('DELETE FROM usuario_curso WHERE FK_usuario_id IN (?)', [usuarioIds], (err) => {
        if (err) return res.status(500).json({ error: 'Erro ao deletar usuario_curso' });

        // 3. Deletar os usuários
        connection.query('DELETE FROM usuario WHERE id IN (?)', [usuarioIds], (err) => {
          if (err) return res.status(500).json({ error: 'Erro ao deletar usuários' });

          // 4. Deletar o funcionário
          connection.query('DELETE FROM funcionario WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao excluir funcionário' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Funcionário não encontrado' });
            res.status(200).json({ message: 'Funcionário excluído com sucesso' });
          });
        });
      });
    } else {
      // Nenhum usuário vinculado, pode apagar direto
      connection.query('DELETE FROM funcionario WHERE id = ?', [id], (err, result) => {
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
  connection.query(sql, (err, results) => {
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

  connection.query(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});


// ================= ROTAS DE USUÁRIO =================


// Buscar usuário pelo ID (apenas da mesma instituição)
app.get('/usuario/:id', autenticarToken, (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.senha, 
           u.curso_id, u.serie, 
           u.FK_tipo_usuario_id, 
           tu.tipo AS tipo,
           c.curso AS nome_curso
    FROM usuario u
    LEFT JOIN curso c ON u.curso_id = c.id
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    WHERE u.id = ? AND u.FK_instituicao_id = ?
  `;

  connection.query(sql, [id, req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado ou não pertence à sua instituição" });
    }

    res.json({ usuario: results[0] });
  });
});


//  =================  Rota para buscar dados do usuário logado pelo ID =================


// Listar todos os usuários (apenas da mesma instituição)
app.get('/api/usuarios', autenticarToken, (req, res) => {
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto,
           tu.tipo AS tipo,
           u.FK_tipo_usuario_id,
           c.curso AS nome_curso,
           u.serie
    FROM usuario u
    LEFT JOIN tipo_usuario tu ON u.FK_tipo_usuario_id = tu.id
    LEFT JOIN curso c ON u.curso_id = c.id
    WHERE u.FK_instituicao_id = ?
  `;

  connection.query(sql, [req.user.FK_instituicao_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuários:", err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }
    res.json(results);
  });
});
// ================= Rota para verificar se o nome já existe em usuário ou funcionário =================

app.get('/verificarNome', (req, res) => {
  const { nome } = req.query;
  if (!nome) return res.status(400).json({ error: 'Nome não informado.' });

  const sqlAluno = 'SELECT id FROM usuario WHERE nome = ? LIMIT 1';
  const sqlFunc = 'SELECT id FROM funcionario WHERE nome = ? LIMIT 1';

  connection.query(sqlAluno, [nome], (err, alunoResult) => {
    if (err) return res.status(500).json({ error: 'Erro ao verificar aluno.' });

    connection.query(sqlFunc, [nome], (err2, funcResult) => {
      if (err2) return res.status(500).json({ error: 'Erro ao verificar funcionário.' });

      if ((alunoResult && alunoResult.length > 0) || (funcResult && funcResult.length > 0)) {
        return res.json({ exists: true });
      } else {
        return res.json({ exists: false });
      }
    });
  });
});

// ================= Atualizar dados do usuário =================

app.put('/usuario/:id', (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, senha, curso_id, serie, FK_tipo_usuario_id } = req.body;

  // Monta dinamicamente só os campos que vieram
  const updates = [];
  const values = [];

  if (nome !== undefined) { updates.push("nome = ?"); values.push(nome); }
  if (email !== undefined) { updates.push("email = ?"); values.push(email); }
  if (telefone !== undefined) { updates.push("telefone = ?"); values.push(telefone); }
  if (senha !== undefined) { updates.push("senha = ?"); values.push(senha); }
  if (curso_id !== undefined) { updates.push("curso_id = ?"); values.push(curso_id); }
  if (serie !== undefined) { updates.push("serie = ?"); values.push(serie); }
  if (FK_tipo_usuario_id !== undefined) {
    updates.push("FK_tipo_usuario_id = ?");
    values.push(FK_tipo_usuario_id);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar." });
  }

  const sql = `UPDATE usuario SET ${updates.join(", ")} WHERE id = ?`;
  values.push(id);

  connection.query(sql, values, (err, result) => {
    if (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro ao atualizar usuário." });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json({ message: "Usuário atualizado com sucesso!" });
  });
});

// =================  Rota para buscar todos os tipos de usuário=================

app.get("/tipos-usuario", (req, res) => {
  const sql = "SELECT id, tipo FROM tipo_usuario";
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar tipos de usuário" });
    res.json(results);
  });
});
// Lista todos os usuários
app.get('/api/usuarios', (req, res) => {
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto, u.FK_tipo_usuario_id AS tipo
    FROM usuario u
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});


// Apaga usuário
app.delete('/api/usuarios/:id', (req, res) => {
  const id = parseInt(req.params.id);

  // Se houver tabelas dependentes (como usuario_curso), deletar antes
  const sqlDependencias = 'DELETE FROM usuario_curso WHERE FK_usuario_id = ?';
  connection.query(sqlDependencias, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Erro ao deletar dependências' });

    // Deletar o usuário
    connection.query('DELETE FROM usuario WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Erro ao excluir usuário' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
      res.status(200).json({ message: 'Usuário excluído com sucesso' });
    });
  });
});


//=================  Cadastro de Livro =================


app.post('/cadastrarLivro', upload.single('capa'), (req, res) => {
  const {
    titulo,
    edicao,
    paginas,
    quantidade,
    local_publicacao,
    data_publicacao,
    sinopse,
    isbn,
    assunto_discutido,
    subtitulo,
    volume,
    FK_genero_id,          // <-- aqui pega o id do gênero
    FK_funcionario_id,
    FK_classificacao_id,
    FK_status_id
  } = req.body;

  const capa = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO livro (
      titulo, edicao, paginas, quantidade, local_publicacao,
      data_publicacao, sinopse, isbn, assunto_discutido,
      subtitulo, volume, FK_genero_id, FK_funcionario_id,
      FK_classificacao_id, FK_status_id, capa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    titulo || null,
    edicao || null,
    paginas || null,
    quantidade || null,
    local_publicacao || null,
    data_publicacao || null,
    sinopse || null,
    isbn || null,
    assunto_discutido || null,
    subtitulo || null,
    volume || null,
    FK_genero_id || null,      // <-- id do gênero aqui
    FK_funcionario_id || null,
    FK_classificacao_id || null,
    FK_status_id || null,
    capa || null
  ];

  connection.query(sql, values, (err, result) => {
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

  connection.query(sql, (err, results) => {
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
  connection.query(sqlCheck, [genero], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erro no banco' });
    if (results.length > 0) return res.status(409).json({ error: 'Gênero já existe' });

    const sqlInsert = 'INSERT INTO genero (genero) VALUES (?)';
    connection.query(sqlInsert, [genero], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erro ao salvar gênero' });
      res.status(201).json({ message: 'Gênero salvo com sucesso' });
    });
  });
});
//=================  Rota para buscar gêneros ordenados (para filtro)=================

app.get('/generosFiltro', (req, res) => {
  const sql = 'SELECT * FROM genero ORDER BY genero ASC';
  connection.query(sql, (err, result) => {
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

  connection.query(sql, [id], (err, results) => {
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

app.put('/livros/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, isbn, autoresIds, editoraId, generoId, funcionarioId, sinopse, paginas } = req.body;

  const sqlLivro = `
    UPDATE livro
    SET titulo = ?, isbn = ?, FK_editora_id = ?, FK_genero_id = ?, FK_funcionario_id = ?, sinopse = ?, paginas = ?
    WHERE id = ?
  `;

  connection.query(
    sqlLivro,
    [titulo, isbn, editoraId, generoId, funcionarioId, sinopse, paginas, id],
    (err, result) => {
      if (err) {
        console.error('Erro ao atualizar livro:', err);
        return res.status(500).json({ error: 'Erro no servidor' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }

      // Atualiza os autores (livro_autor)
      if (Array.isArray(autoresIds)) {
        // Primeiro, deleta os autores antigos
        connection.query('DELETE FROM livro_autor WHERE FK_livro_id = ?', [id], (err) => {
          if (err) {
            console.error('Erro ao deletar autores antigos:', err);
            return res.status(500).json({ error: 'Erro ao atualizar autores' });
          }

          // Insere os novos autores
          if (autoresIds.length > 0) {
            const valoresAutores = autoresIds.map(autorId => [id, autorId]);
            connection.query('INSERT INTO livro_autor (FK_livro_id, FK_autor_id) VALUES ?', [valoresAutores], (err) => {
              if (err) {
                console.error('Erro ao inserir autores:', err);
                return res.status(500).json({ error: 'Erro ao atualizar autores' });
              }
              return res.json({ message: 'Livro atualizado com sucesso' });
            });
          } else {
            return res.json({ message: 'Livro atualizado com sucesso' });
          }
        });
      } else {
        return res.json({ message: 'Livro atualizado com sucesso' });
      }
    }
  );
});
// Deletar livro com dependências
app.delete('/livros/:id', (req, res) => {
  const { id } = req.params;

  // Primeiro, deletar os autores associados
  connection.query('DELETE FROM livro_autor WHERE FK_livro_id = ?', [id], (err) => {
    if (err) {
      console.error('Erro ao deletar autores do livro:', err);
      return res.status(500).json({ error: 'Erro ao deletar autores do livro' });
    }

    // Depois, deletar o livro
    connection.query('DELETE FROM livro WHERE id = ?', [id], (err, result) => {
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

  connection.query(sql, [id], (err, results) => {
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
    connection.query(
      "INSERT INTO comentario (comentario, data_comentario) VALUES (?, NOW())",
      [comentarioFiltrado],
      (err, result) => {
        if (err) {
          console.error("Erro ao salvar comentário:", err);
          return res.status(500).json({ error: "Erro ao salvar comentário." });
        }

        const comentarioId = result.insertId;

        // Vincular comentário ao usuário
        connection.query(
          "INSERT INTO usuario_comentario (FK_usuario_id, FK_comentario_id) VALUES (?, ?)",
          [usuarioId, comentarioId],
          (err) => {
            if (err) {
              console.error("Erro ao vincular usuário:", err);
              return res.status(500).json({ error: "Erro ao salvar comentário." });
            }

            // Vincular comentário ao livro
            connection.query(
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



// ================= Lista tipos de instituição =================

app.get("/tipos-instituicao", (req, res) => {
  const sql = "SELECT * FROM tipo_instituicao";
  connection.query(sql, (err, results) => {
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
  connection.query(sql, (err, results) => {
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

  connection.query(sql, [nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id], (err, result) => {
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

  connection.query(sql, [nome, email, horario_funcionamento, telefone, website, endereco, FK_tipo_instituicao_id, id], (err) => {
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
  connection.query(sql, [instituicaoId], (err, results) => {
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

  connection.query(sql, [
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
  connection.query(sql, [instituicaoId], (err, results) => {
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

  connection.query(sql, [lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, FK_instituicao_id], (err, result) => {
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

  connection.query(sql, [lembrete_vencimento, dias_antes_vencimento, notificacao_atraso, notificacao_reserva, notificacao_livro_disponivel, sms_notificacao, id], (err) => {
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
  connection.query(sql, [instituicaoId], (err, results) => {
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
  connection.query(sql, [FK_tipo_usuario_id, maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, FK_instituicao_id], (err) => {
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
  connection.query(sql, [maximo_emprestimos, duracao_emprestimo, pode_reservar, pode_renovar, id], (err) => {
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

  connection.query(sql, [instituicaoId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});

// ✅ Agora o app.listen() pode ficar no final
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

