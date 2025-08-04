document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLivro');
  const isbnInput = document.querySelector('input[name="isbn"]');

  function ajustarData(data) {
    if (!data) return '';
    if (/^\d{4}$/.test(data)) return '';
    if (/^\d{4}-\d{2}$/.test(data)) return data + '-01';
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
    return '';
  }

  // Tradução gratuita usando LibreTranslate
  async function traduzirTexto(texto, de = 'en', para = 'pt') {
    try {
      const response = await fetch('http://localhost:3000/traduzir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texto, de, para })
      });
  
      const data = await response.json();
      return data.traducao || texto;
    } catch (err) {
      console.warn('Erro na tradução, retornando texto original');
      return texto;
    }
  }
  
  isbnInput.addEventListener('blur', async () => {
    const isbn = isbnInput.value.trim();
    if (!isbn) return;

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&langRestrict=pt&country=BR`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const livro = data.items[0].volumeInfo;

        // Tradução dos campos relevantes
        const tituloPT = await traduzirTexto(livro.title || '');
        const subtituloPT = await traduzirTexto(livro.subtitle || '');
        const descricaoPT = await traduzirTexto(livro.description || '');

        document.querySelector('input[name="titulo"]').value = tituloPT;
        document.querySelector('input[name="subtitulo"]').value = subtituloPT;
        document.querySelector('input[name="autor"]').value = livro.authors?.join(', ') || '';
        document.querySelector('input[name="editora"]').value = livro.publisher || '';
        document.querySelector('input[name="data_publicacao"]').value = ajustarData(livro.publishedDate);
        document.querySelector('input[name="sinopse"]').value = descricaoPT;
        document.querySelector('input[name="paginas"]').value = livro.pageCount || '';
        document.querySelector('input[name="genero"]').value = livro.categories?.join(', ') || '';
        document.querySelector('input[name="assunto_discutido"]').value = livro.categories?.join(', ') || '';
        document.querySelector('input[name="volume"]').value = '1';
        document.querySelector('input[name="edicao"]').value = '1ª';
      } else {
        alert('Livro não encontrado na API.');
      }
    } catch (error) {
      console.error('Erro ao buscar o livro:', error);
      alert('Erro ao consultar a API do Google Books.');
    }
  });

  // Envio do formulário
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const formData = new FormData(form);

    try {
      const resposta = await fetch('http://localhost:3000/cadastrarLivro', {
        method: 'POST',
        body: formData
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert('Livro cadastrado com sucesso!');
        form.reset();
      } else {
        alert('Erro ao cadastrar livro: ' + resultado.error);
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      alert('Erro na conexão com o servidor.');
    }
  });
});
