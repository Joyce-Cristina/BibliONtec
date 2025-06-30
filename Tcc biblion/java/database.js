const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

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

// Cadastro de Aluno
app.post('/cadastrarAluno', upload.single('foto'), (req, res) => {
  const { nome, telefone, email, senha, curso, serie, tipo_usuario_id } = req.body;
  const foto = req.file ? req.file.filename : null;

  if (!nome || !telefone || !email || !senha || !tipo_usuario_id) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  const sql = `INSERT INTO usuario (nome, telefone, email, senha, foto, tipo) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  connection.query(sql, [nome, telefone, email, senha, foto, tipo_usuario_id], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar usuario:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar usuario' });
    }
    res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const sql = 'SELECT id, nome, tipo FROM usuario WHERE email = ? AND senha = ?';
  connection.query(sql, [email, senha], (err, results) => {
    if (err) {
      console.error('Erro no login:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const usuario = results[0];
    res.status(200).json({
      message: 'Login bem-sucedido',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        tipo: usuario.tipo
      }
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
