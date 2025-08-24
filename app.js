// app.js
const express = require("express");
const app = express();

app.use(express.json());

// exemplo de rota /login
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (email === "teste_ci@teste.com" && senha === "123456") {
    return res.status(200).json({ message: "Login OK" });
  }
  return res.status(401).json({ message: "Credenciais inválidas" });
});

// exemplo de rota /livros
app.get("/livros", (req, res) => {
  res.status(200).json([{ id: 1, titulo: "Livro teste" }]);
});

module.exports = app;
