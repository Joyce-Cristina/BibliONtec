const request = require("supertest");
const mysql = require("mysql2/promise");
const app = require("../app.js"); // apenas exportar o Express

jest.setTimeout(40000); // tempo maior para CI

let pool;
let conn;
let userId;

beforeAll(async () => {
  // Criar pool de conexões apontando para o container MySQL
  pool = mysql.createPool({
    host: process.env.DB_HOST || "mysql",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "bibliontec",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
  });

  conn = await pool.getConnection();

  // Inserir usuário de teste
  const [result] = await conn.query(
    "INSERT INTO usuario (nome, email, senha, FK_tipo_usuario_id) VALUES (?, ?, ?, ?)",
    ["Aluno CI", "teste_ci@teste.com", "123456", 1]
  );
  userId = result.insertId;
});

afterAll(async () => {
  // Limpar usuário de teste
  if (conn) {
    await conn.query("DELETE FROM usuario WHERE id = ?", [userId]);
    await conn.release();
  }
  if (pool) await pool.end();
});

describe("Teste de Login real no banco", () => {
  it("Deve logar com credenciais válidas", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "teste_ci@teste.com", senha: "123456" });

    expect(res.statusCode).toBe(200);
  });

  it("Não deve logar com senha errada", async () => {
    const res = await request(app)
      .post("/login")
      .send({ email: "teste_ci@teste.com", senha: "errada" });

    expect(res.statusCode).toBe(401);
  });
});
