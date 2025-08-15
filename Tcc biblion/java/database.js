const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const fs = require('fs');
const sharp = require('sharp');




const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem JPEG, PNG, JPG e WEBP são permitidos.'));
    }
  } });

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bibliontec'
});

connection.connect(err => {
  if (err) {
    console.error('Erro na conexão com o MySQL:', err);
    return;
  }
  console.log('Conectado ao MySQL');
});
// Função para validar telefone (apenas números, 10 ou 11 dígitos)
function telefoneValido(telefone) {
  return /^\d{10,11}$/.test(telefone);
}

// -------------------- CADASTRO DE ALUNO/PROFESSOR --------------------
app.post('/cadastrarAluno', upload.single('foto'), (req, res) => {
  const { nome, telefone, email, senha, curso_id, serie, tipo_usuario_id, funcionario_id } = req.body;
  const foto = req.file ? req.file.filename : null;

  if (!nome || !telefone || !email || !tipo_usuario_id) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  // 📌 Validação do telefone
  if (!telefoneValido(telefone)) {
    return res.status(400).json({ error: 'Telefone inválido. Use apenas números com DDD (10 ou 11 dígitos).' });
  }

  if (Number(tipo_usuario_id) === 1 && (!curso_id || !serie)) {
    return res.status(400).json({ error: 'Curso e série são obrigatórios para alunos.' });
  }

  // Verifica se o e-mail já existe
  const checkEmailSql = `SELECT id FROM usuario WHERE email = ?`;
  connection.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error('Erro ao verificar e-mail:', err);
      return res.status(500).json({ error: 'Erro no servidor ao verificar e-mail.' });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    // Usa senha enviada ou gera automática
    const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

    // Inserir usuário
    const sql = `INSERT INTO usuario 
      (nome, telefone, email, senha, foto, tipo, curso_id, serie, FK_funcionario_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(
      sql,
      [
        nome,
        telefone,
        email,
        senhaFinal,
        foto,
        tipo_usuario_id,
        curso_id || null,
        serie || null,
        funcionario_id || null
      ],
      (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar usuário:', err);
          return res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        }

        const usuarioId = result.insertId;

        if (curso_id) {
          const sqlUsuarioCurso = `INSERT INTO usuario_curso (FK_usuario_id, FK_curso_id) VALUES (?, ?)`;
          connection.query(sqlUsuarioCurso, [usuarioId, curso_id], (err) => {
            if (err) {
              console.error('Erro ao inserir em usuario_curso:', err);
              return res.status(500).json({ error: 'Erro ao inserir em usuario_curso' });
            }
            return res.status(200).json({ message: 'Usuário cadastrado com sucesso!', senhaGerada: senhaFinal });
          });
        } else {
          return res.status(200).json({ message: 'Usuário cadastrado com sucesso (sem curso).', senhaGerada: senhaFinal });
        }
      }
    );
  });
});

// -------------------- CADASTRO DE FUNCIONÁRIO --------------------
app.post('/cadastrarFuncionario', upload.single('foto'), async (req, res) => {
  try {
    const { nome, senha, email, funcao_id, telefone, permissoes } = req.body;
    let foto = req.file ? req.file.filename : 'padrao.png';

    if (!nome || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios não preenchidos.' });
    }

    // 📌 Validação do telefone
    if (telefone && !telefoneValido(telefone)) {
      return res.status(400).json({ error: 'Telefone inválido. Use apenas números com DDD (10 ou 11 dígitos).' });
    }

    // 📌 Se o usuário enviou uma foto, redimensiona
    if (req.file) {
      foto = Date.now() + '.jpg';
      await sharp(req.file.path)
        .resize(300, 300)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`uploads/${foto}`);
      fs.unlinkSync(req.file.path);
    }

    // ✅ Verifica se o e-mail já existe
    const checkEmailSql = `SELECT id FROM funcionario WHERE email = ?`;
    connection.query(checkEmailSql, [email], (err, results) => {
      if (err) {
        console.error('Erro ao verificar e-mail:', err);
        return res.status(500).json({ error: 'Erro no servidor ao verificar e-mail.' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }

      // Usa senha enviada ou gera automática
      const senhaFinal = senha && senha.trim() !== "" ? senha : gerarSenhaSegura();

      // Insere o funcionário
      const sql = `INSERT INTO funcionario (nome, senha, email, foto, telefone, FK_funcao_id)
                   VALUES (?, ?, ?, ?, ?, ?)`;
      connection.query(sql, [nome, senhaFinal, email, foto, telefone || null, funcao_id || null], (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar funcionário:', err);
          return res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
        }

        const funcionarioId = result.insertId;
        let permissoesFormatadas = permissoes;

        if (typeof permissoesFormatadas === 'string') {
          permissoesFormatadas = [permissoesFormatadas];
        }

        if (permissoesFormatadas && Array.isArray(permissoesFormatadas)) {
          const values = permissoesFormatadas.map(p => [p, funcionarioId]);
          const permSql = `INSERT INTO funcionario_permissao (FK_permissao_id, FK_funcionario_id) VALUES ?`;
          connection.query(permSql, [values], (err) => {
            if (err) {
              console.error('Erro ao cadastrar permissões:', err);
              return res.status(500).json({ error: 'Funcionário criado, mas erro nas permissões.', senhaGerada: senhaFinal });
            }
            return res.status(200).json({ message: 'Funcionário cadastrado com sucesso!', senhaGerada: senhaFinal });
          });
        } else {
          return res.status(200).json({ message: 'Funcionário cadastrado com sucesso!', senhaGerada: senhaFinal });
        }
      });
    });
  } catch (error) {
    console.error('Erro geral no cadastro:', error);
    return res.status(500).json({ error: 'Erro inesperado no servidor.' });
  }
});
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const sqlUsuario = 'SELECT id, nome, tipo, foto FROM usuario WHERE email = ? AND senha = ?';
  connection.query(sqlUsuario, [email, senha], (err, results) => {
    if (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (results.length > 0) {
      const usuario = results[0];
      const fotoFinal = usuario.foto ? usuario.foto : 'padrao.png';

      return res.status(200).json({
        message: 'Login usuário bem-sucedido',
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          tipo: usuario.tipo,
          foto: fotoFinal
        }
      });
    } else {
      // Se não achou como usuário, tenta como funcionário
      const sqlFuncionario = `
        SELECT id, nome, email, senha, telefone, foto, FK_funcao_id AS funcao_id 
        FROM funcionario 
        WHERE email = ? AND senha = ?
      `;

      connection.query(sqlFuncionario, [email, senha], (err, results) => {
        if (err) {
          console.error('Erro no login funcionário:', err);
          return res.status(500).json({ error: 'Erro no servidor' });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: 'Email ou senha inválidos' });
        }

        const funcionario = results[0];
        const fotoFinal = funcionario.foto ? funcionario.foto : '/imagens/padrao.png';

        return res.status(200).json({
          message: 'Login funcionário bem-sucedido',
          funcionario: {
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            senha: funcionario.senha,
            telefone: funcionario.telefone,
            funcao_id: funcionario.funcao_id,
            foto: fotoFinal
          }
        });
      });
    }
  });
});



app.get('/livros', (req, res) => {
  const query = 'SELECT * FROM livro';

  connection.query(query, (err, resultados) => {
    if (err) {
      console.error('Erro ao buscar livros:', err);
      res.status(500).json({ erro: 'Erro ao buscar livros' });
    } else {
      res.json(resultados);
    }
  });
});



// Atualizar dados do usuário
app.put('/usuario/:id', (req, res) => {
  const id = req.params.id;
  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `
    UPDATE usuario
    SET nome = ?, email = ?, telefone = ?, senha = ?
    WHERE id = ?
  `;

  connection.query(sql, [nome, email, telefone, senha, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar usuário:", err);
      return res.status(500).json({ error: "Erro ao atualizar usuário." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  });
});

// Rota para buscar dados do usuário logado
app.get('/usuario/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT u.*, c.curso AS nome_curso
    FROM usuario u
    LEFT JOIN curso c ON u.curso_id = c.id
    WHERE u.id = ?
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ usuario: results[0] });
  });
});
/// Atualizar dados do funcionário
app.put('/funcionario/:id', (req, res) => {
  const id = req.params.id;
  const { nome, email, senha, telefone, funcao_id } = req.body;

  if (!nome || !email || !senha || !telefone || !funcao_id) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const sql = `
    UPDATE funcionario
    SET nome = ?, email = ?, senha = ?, telefone = ?, FK_funcao_id = ?
    WHERE id = ?
  `;

  connection.query(sql, [nome, email, senha, telefone, funcao_id, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar funcionário:", err);
      return res.status(500).json({ error: "Erro ao atualizar funcionário." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Funcionário não encontrado." });
    }

    res.status(200).json({ message: "Funcionário atualizado com sucesso!" });
  });
});


// Rota para buscar dados do funcionário logado
app.get('/funcionario/:id', (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT f.*, f.telefone, fu.funcao AS nome_funcao
    FROM funcionario f
    LEFT JOIN funcao fu ON f.FK_funcao_id = fu.id
    WHERE f.id = ?
  `;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar funcionário:", err);
      return res.status(500).json({ error: "Erro ao buscar funcionário" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Funcionário não encontrado" });
    }

    res.json({ funcionario: results[0] }); // 👈 aqui retorna o objeto certo
  });
});

// Cadastro de Livro
// Cadastro de Livro
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


//carrega genero dos livros 
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

// Lista todos os funcionários

app.get('/api/funcionarios', (req, res) => {
  const sql = `
    SELECT f.id, f.nome, f.email, f.telefone, f.foto, fun.funcao AS funcao
    FROM funcionario f
    LEFT JOIN funcao fun ON f.FK_funcao_id = fun.id
  `;
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erro ao buscar funcionários:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results);
  });
});


// Atualiza funcionário
app.put('/api/funcionarios/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, funcao_id } = req.body;

  const sql = `
    UPDATE funcionario 
    SET nome = ?, email = ?, telefone = ?, FK_funcao_id = ? 
    WHERE id = ?
  `;
  
  connection.query(sql, [nome, email, telefone, funcao_id, id], (err) => {
    if (err) {
      console.error('Erro ao atualizar funcionário:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json({ message: 'Funcionário atualizado com sucesso' });
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

// Rota para verificar nome duplicado
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
// Lista todos os usuários
app.get('/api/usuarios', (req, res) => {
  const sql = `
    SELECT u.id, u.nome, u.email, u.telefone, u.foto, u.tipo AS tipo
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

// Atualiza usuário
app.put('/api/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, tipo } = req.body;

  const sql = `
    UPDATE usuario
    SET nome = ?, email = ?, telefone = ?, tipo = ?
    WHERE id = ?
  `;
  
  connection.query(sql, [nome, email, telefone, tipo, id], (err) => {
    if (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json({ message: 'Usuário atualizado com sucesso' });
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



// ✅ Agora o app.listen() pode ficar no final
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

