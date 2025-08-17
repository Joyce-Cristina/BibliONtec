const request = require("supertest");
const app = require("../Tcc biblion/java/app"); // aqui deve ser o Express
const connection = require("../Tcc biblion/java/database");

jest.setTimeout(20000);

let pool;
let conn;
let userId;

beforeAll(async () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bibliontec",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  conn = await pool.getConnection();

  const [result] = await conn.query(
    "INSERT INTO usuario (nome, email, senha, FK_tipo_usuario_id) VALUES (?, ?, ?, ?)",
    ["Aluno CI", "teste_ci@teste.com", "123456", 1]
  );
  userId = result.insertId;
});

afterAll(async () => {
  try {
    await conn.query("DELETE FROM usuario WHERE id = ?", [userId]);
    conn.release(); // devolve a conexão para o pool
    await pool.end(); // encerra todas conexões ativas
  } catch (err) {
    console.error("Erro ao finalizar conexão:", err);
  }
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

afterAll(async () => {
  if (connection && connection.end) connection.end();
});