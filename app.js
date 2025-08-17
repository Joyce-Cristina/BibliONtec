// app.js
const express = require("express");
const app = express();

app.use(express.json());

// Rotas
const usuarioRoutes = require("./routes/usuario");
app.use("/usuario", usuarioRoutes);

// outras rotas...

module.exports = app;
