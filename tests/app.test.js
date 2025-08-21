const request = require("supertest");
const mysql = require("mysql2/promise"); // Import necessário
const app = require("../app.js"); // app.js deve apenas exportar o Express


jest.setTimeout(20000);

let pool;
let conn;
let userId;

beforeAll(async () => {
  // Criar pool de conexões
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

  conn = await pool.getConnection();

  // Inserir usuário de teste
  const [result] = await conn.query(
    "INSERT INTO usuario (nome, email, senha, FK_tipo_usuario_id) VALUES (?, ?, ?, ?)",
    ["Aluno CI", "teste_ci@teste.com", "123456", 1]
  );
  userId = result.insertId;
});

afterAll(async () => {
  // Liberar conexão e encerrar pool
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
  
    // propositalmente esperando 200 em vez de 401
    expect(res.statusCode).toBe(401); 
  });
});
