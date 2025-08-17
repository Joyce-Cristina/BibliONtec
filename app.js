// app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importa rotas
const usuarioRoutes = require("./routes/usuario");
const funcionarioRoutes = require("./routes/funcionario");
const livroRoutes = require("./routes/livro");
const generoRoutes = require("./routes/genero");

// Usa rotas
app.use("/usuario", usuarioRoutes);
app.use("/funcionario", funcionarioRoutes);
app.use("/livro", livroRoutes);
app.use("/genero", generoRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

module.exports = app;
