const express = require("express");
const connection = require("./Tcc biblion/java/database");

const app = express();
app.use(express.json());

// exemplo de rota de teste
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

module.exports = app;
