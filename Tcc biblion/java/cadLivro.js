document.addEventListener('DOMContentLoaded', async () => {
  const generosExistentes = await carregarGeneros(); // já retorna [{ id, genero }]
  const form = document.getElementById('formLivro');
  const inputGeneroTexto = document.getElementById('generoTexto');
  const inputGeneroId = document.getElementById('FK_genero_id');
  const isbnInput = document.querySelector('input[name="isbn"]');

  // Associar input com id
  inputGeneroTexto.addEventListener('input', () => {
    const texto = inputGeneroTexto.value.trim().toLowerCase();
    const encontrado = generosExistentes.find(g => g.genero.toLowerCase() === texto);
    inputGeneroId.value = encontrado ? encontrado.id : '';
  });

  // Autocompletar dados do livro
  isbnInput.addEventListener('blur', async () => {
    const isbn = isbnInput.value.trim();
    if (!isbn) return;

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&langRestrict=pt&country=BR`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const livro = data.items[0].volumeInfo;

        const traduzir = async (texto) => {
          if (!texto) return '';
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
            const response = await fetch(url);
            const data = await response.json();
            return data[0][0][0];
          } catch {
            return texto;
          }
        };

        const tituloPT = await traduzir(livro.title);
        const subtituloPT = await traduzir(livro.subtitle);
        const descricaoPT = await traduzir(livro.description);
        const editoraPT = await traduzir(livro.publisher);
        const generoPT = await traduzir(livro.categories?.join(', ') || '');

        document.querySelector('input[name="titulo"]').value = tituloPT;
        document.querySelector('input[name="subtitulo"]').value = subtituloPT;
        document.querySelector('input[name="autor"]').value = livro.authors?.join(', ') || '';
        document.querySelector('input[name="editora"]').value = editoraPT;
        document.querySelector('input[name="data_publicacao"]').value = ajustarData(livro.publishedDate);
        document.querySelector('input[name="sinopse"]').value = descricaoPT;
        document.querySelector('input[name="paginas"]').value = livro.pageCount || '';
        document.querySelector('input[name="assunto_discutido"]').value = generoPT;
        document.querySelector('input[name="volume"]').value = '1';
        document.querySelector('input[name="edicao"]').value = '1ª';
        inputGeneroTexto.value = generoPT;

        // tenta encontrar o ID do gênero
        const generoEncontrado = generosExistentes.find(g => g.genero.toLowerCase() === generoPT.toLowerCase());
        inputGeneroId.value = generoEncontrado ? generoEncontrado.id : '';
      } else {
        alert('Livro não encontrado na API.');
      }
    } catch (error) {
      console.error('Erro ao consultar API do Google Books:', error);
      alert('Erro ao consultar API.');
    }
  });

  // Submissão do formulário
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const textoGenero = inputGeneroTexto.value.trim();
    let idGenero = inputGeneroId.value;

    // Se gênero digitado ainda não tem ID, tenta cadastrar
    if (!idGenero && textoGenero !== '') {
      try {
        const resp = await fetch('http://localhost:3000/generos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ genero: textoGenero })
        });

        if (!resp.ok) throw new Error('Erro ao salvar novo gênero');

        // atualiza lista e campo hidden
        const novosGeneros = await carregarGeneros();
        const novo = novosGeneros.find(g => g.genero.toLowerCase() === textoGenero.toLowerCase());
        inputGeneroId.value = novo?.id || '';
      } catch (err) {
        alert('Erro ao salvar gênero: ' + err.message);
        return;
      }
    }

    // Envia o formulário
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
        inputGeneroId.value = '';
      } else {
        alert('Erro ao cadastrar livro: ' + resultado.error);
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      alert('Erro na conexão com o servidor.');
    }
  });
});

// Ajusta data para formato yyyy-mm-dd
function ajustarData(data) {
  if (!data) return '';
  if (/^\d{4}$/.test(data)) return '';
  if (/^\d{4}-\d{2}$/.test(data)) return data + '-01';
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  return '';
}

// Carrega gêneros com ID e nome
async function carregarGeneros() {
  try {
    const response = await fetch('http://localhost:3000/generos');
    const generos = await response.json();

    generos.sort((a, b) => a.genero.localeCompare(b.genero, 'pt', { sensitivity: 'base' }));

    const datalist = document.getElementById('listaGeneros');
    datalist.innerHTML = '';
    generos.forEach(g => {
      const option = document.createElement('option');
      option.value = g.genero;
      datalist.appendChild(option);
    });

    return generos; // com id e genero
  } catch (error) {
    console.error('Erro ao carregar gêneros:', error);
    return [];
  }
}
