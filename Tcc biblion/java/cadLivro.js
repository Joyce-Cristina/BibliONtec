document.getElementById('formLivro').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  try {
    const response = await fetch('http://localhost:3000/cadastrarLivro', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      alert('Livro cadastrado com sucesso!');
      form.reset();
    } else {
      alert('Erro ao cadastrar livro: ' + result.error);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    alert('Erro na conexão com o servidor.');
  }
});
