const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.post('/cadastrarAluno', (req, res) => {
  const { nome, telefone, email, senha} = req.body;
  const foto = "temp";
  const tipo_usuario_id = 1;

  const sql = 'INSERT INTO usuario (nome, telefone, email, senha, foto, FK_tipo_usuario_id) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [nome, telefone, email, senha, foto, tipo_usuario_id], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar usuario:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar usuario' });
    }
    res.status(200).json({ message: 'Usuario cadastrado com sucesso!' });
  });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const sql = 'SELECT id, nome, FK_tipo_usuario_id FROM usuario WHERE email = ? AND senha = ?';
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
        tipo: usuario.FK_tipo_usuario_id
      }
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});