// hash_senhas.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'
});

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await conn.execute('SELECT id, senha FROM usuario WHERE senha IS NOT NULL');
   for (const r of rows) {
  const plain = String(r.senha || '').trim();
  if (plain.startsWith('$2a$') || plain.startsWith('$2b$') || plain.startsWith('$2y$')) {
    console.log(`⏩ pular id=${r.id} (já hash)`);
    continue;
  }
  console.log(`🔄 Atualizando id=${r.id} senha antiga=${plain}`);
  const hash = await bcrypt.hash(plain, 12);
  await conn.execute('UPDATE usuario SET senha = ? WHERE id = ?', [hash, r.id]);
  console.log(`✅ hashed usuario id=${r.id}`);
}


    // mesmo para funcionarios
    const [frows] = await conn.execute('SELECT id, senha FROM funcionario WHERE senha IS NOT NULL');
    for (const r of frows) {
      const plain = String(r.senha || '');
      if (plain.startsWith('$2a$') || plain.startsWith('$2b$') || plain.startsWith('$2y$')) {
        console.log(`pular func id=${r.id} (já hash)`);
        continue;
      }
      const hash = await bcrypt.hash(plain, 12);
      await conn.execute('UPDATE funcionario SET senha = ? WHERE id = ?', [hash, r.id]);
      console.log(`hashed funcionario id=${r.id}`);
    }

    console.log('migração finalizada.');
  } catch (err) {
    console.error('Erro na migração:', err);
  } finally {
    await conn.end();
  }
})();
