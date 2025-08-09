// app.test.js - Testes básicos para o projeto BibliONtec

// Teste 1: Apenas para validar que o sistema está funcionando
test('Sistema BibliONtec está funcionando', () => {
  expect(true).toBe(true);
});

// Teste 2: Exemplo de função que falha se alterada
function soma(a, b) {
  return a + b; // Se mudar para "-" o teste vai falhar
}

test('Função soma funciona corretamente', () => {
  expect(soma(2, 3)).toBe(5);
});

// Teste 3: Teste fictício de conexão ao banco
function conectarBanco() {
  return "Conectado";
}

test('Conexão ao banco de dados', () => {
  expect(conectarBanco()).toBe("Conectado");
});
