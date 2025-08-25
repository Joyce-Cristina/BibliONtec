// app.js
const express = require("express");
const app = express();

app.use(express.json());

// Rota fake de login apenas para testes
app.post("/login", (req, res) => {
  const { email, senha } = req.body;

  if (email === "teste_ci@teste.com" && senha === "123456") {
    return res.status(200).json({ message: "Login OK" });
  } else {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }
});

module.exports = app;
