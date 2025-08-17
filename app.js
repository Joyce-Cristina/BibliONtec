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


// Rota de teste
app.get("/", (req, res) => {
  res.send("Servidor rodando 🚀");
});

module.exports = app;
