// tests/jest/app.test.js
const app = require("../../app"); // caminho correto para o app
const mysql = require("mysql2/promise"); // importa MySQL corretamente
const request = require("supertest");

jest.setTimeout(20000);

let pool;
let conn;
let userId;

beforeAll(async () => {
  // cria pool de conexão
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bibliontec",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
  });

  // pega conexão do pool
  conn = await pool.getConnection();

  // cria usuário de teste
  const [result] = await conn.query(
    "INSERT INTO usuario (nome, email, senha, FK_tipo_usuario_id) VALUES (?, ?, ?, ?)",
    ["Aluno CI", "teste_ci@teste.com", "123456", 1]
  );
  userId = result.insertId;
});

afterAll(async () => {
  // remove usuário de teste
  if (userId) {
    try {
      await conn.query("DELETE FROM usuario WHERE id = ?", [userId]);
      console.log(`Usuário de teste ID ${userId} removido com sucesso.`);
    } catch (err) {
      console.error("Erro ao excluir usuário de teste:", err);
    }
  }

  // libera conexão e fecha pool
  if (conn) await conn.release();
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

describe("Teste de desempenho do banco", () => {
  it("Deve executar SELECT rápido em usuario", async () => {
    const start = Date.now();
    const [rows] = await pool.query("SELECT * FROM usuario LIMIT 1000");
    const duration = Date.now() - start;

    console.log(`⏱ Query SELECT usuario levou ${duration}ms, retornou ${rows.length} registros.`);
    expect(duration).toBeLessThan(500);
  });

  it("Deve responder rápido na rota /livros", async () => {
    const start = Date.now();
    const res = await request(app).get("/livros");
    const duration = Date.now() - start;

    console.log(`⚡ Rota /livros respondeu em ${duration}ms.`);
    expect(res.statusCode).toBe(200);
    expect(duration).toBeLessThan(800);
  });
});
