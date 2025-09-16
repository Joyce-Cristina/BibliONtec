document.addEventListener('DOMContentLoaded', async () => {
  const loadingIsbn = document.getElementById('loadingIsbn');

  function mostrarLoading() {
    if (loadingIsbn) loadingIsbn.style.display = 'inline-block';
  }
  function esconderLoading() {
    if (loadingIsbn) loadingIsbn.style.display = 'none';
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado para cadastrar livros.');
    return;
  }

  const generosExistentes = await carregarGeneros();

  const form = document.getElementById('formLivro');
  const inputGeneroTexto = document.getElementById('generoTexto');
  const inputGeneroId = document.getElementById('FK_genero_id');
  const isbnInput = document.getElementById('isbnInput');
  const autorInput = document.getElementById('autorTexto');
  const editoraInput = document.getElementById('editoraTexto');

  // Associa input de gênero ao ID
  inputGeneroTexto.addEventListener('input', () => {
    const texto = inputGeneroTexto.value.trim().toLowerCase();
    const encontrado = generosExistentes.find(g => g.genero.toLowerCase() === texto);
    if (inputGeneroId) inputGeneroId.value = encontrado ? encontrado.id : '';
  });

  // Autocompletar dados do livro via ISBN
  isbnInput.addEventListener('blur', async () => {
    const isbn = isbnInput.value.trim();
    if (!isbn) return;
    mostrarLoading();

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&langRestrict=pt&country=BR`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const livro = data.items[0].volumeInfo;

        const traduzir = async (texto) => {
          if (!texto) return '';
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(texto)}`;
            const resp = await fetch(url);
            const traduzido = await resp.json();
            return traduzido[0][0][0];
          } catch {
            return texto;
          }
        };

        const tituloPT = await traduzir(livro.title);
        const subtituloPT = await traduzir(livro.subtitle);
        const descricaoPT = await traduzir(livro.description);
        const editoraPT = await traduzir(livro.publisher);
        const generoPT = await traduzir(livro.categories?.join(', ') || '');

        // Preenche campos do formulário
        const tituloInput = document.querySelector('input[name="titulo"]');
        if (tituloInput) tituloInput.value = tituloPT;

        const subtituloInput = document.querySelector('input[name="subtitulo"]');
        if (subtituloInput) subtituloInput.value = subtituloPT;

        if (autorInput) autorInput.value = livro.authors?.join(', ') || '';
        if (editoraInput) editoraInput.value = editoraPT;

        const dataInput = document.querySelector('input[name="data_publicacao"]');
        if (dataInput) dataInput.value = ajustarData(livro.publishedDate);

        const sinopseInput = document.querySelector('input[name="sinopse"]');
        if (sinopseInput) sinopseInput.value = descricaoPT;

        const paginasInput = document.querySelector('input[name="paginas"]');
        if (paginasInput) paginasInput.value = livro.pageCount || '';

        const volumeInput = document.querySelector('input[name="volume"]');
        if (volumeInput) volumeInput.value = '1';

        const edicaoInput = document.querySelector('input[name="edicao"]');
        if (edicaoInput) edicaoInput.value = '1ª';

        if (inputGeneroTexto) inputGeneroTexto.value = generoPT;
        const generoEncontrado = generosExistentes.find(g => g.genero.toLowerCase() === generoPT.toLowerCase());
        if (inputGeneroId) inputGeneroId.value = generoEncontrado ? generoEncontrado.id : '';

      } else {
        alert('Livro não encontrado na API.');
      }
    } catch (error) {
      console.error('Erro ao consultar API do Google Books:', error);
      alert('Erro ao consultar API.');
    } finally {
      esconderLoading();
    }
  });

  // Submissão do formulário
  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const textoGenero = inputGeneroTexto.value.trim();
    let idGenero = inputGeneroId.value;

    // Se gênero não existe, cadastra
    if (!idGenero && textoGenero !== '') {
      try {
        const resp = await fetch('http://localhost:3000/generos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ genero: textoGenero })
        });

        if (!resp.ok) throw new Error('Erro ao salvar novo gênero');

        const novosGeneros = await carregarGeneros();
        const novo = novosGeneros.find(g => g.genero.toLowerCase() === textoGenero.toLowerCase());
        inputGeneroId.value = novo?.id || '';
      } catch (err) {
        alert('Erro ao salvar gênero: ' + err.message);
        return;
      }
    }

    // Envia formulário do livro
    const formData = new FormData(form);
    try {
      const resposta = await fetch('http://localhost:3000/cadastrarLivro', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert('Livro cadastrado com sucesso!');
        form.reset();
        if (inputGeneroId) inputGeneroId.value = '';
      } else {
        alert('Erro ao cadastrar livro: ' + resultado.error);
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      alert('Erro na conexão com o servidor.');
    }
  });
});

// Ajusta data para yyyy-mm-dd
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

    return generos;
  } catch (error) {
    console.error('Erro ao carregar gêneros:', error);
    return [];
  }
}
async function carregarAutores() {
  try {
    const token = localStorage.getItem('token');
    const resp = await fetch('http://localhost:3000/autores', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const autores = await resp.json();
    
    const datalistAutores = document.getElementById('listaAutores');
    datalistAutores.innerHTML = '';
    
    autores.forEach(a => {
      const option = document.createElement('option');
      option.value = a.nome;  // mostra o nome no input
      datalistAutores.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar autores:', err);
  }
}

async function carregarEditoras() {
  try {
    const token = localStorage.getItem('token');
    const resp = await fetch('http://localhost:3000/editoras', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const editoras = await resp.json();
    
    const datalistEditoras = document.getElementById('listaEditoras');
    datalistEditoras.innerHTML = '';
    
    editoras.forEach(e => {
      const option = document.createElement('option');
      option.value = e.nome;  // mostra o nome no input
      datalistEditoras.appendChild(option);
    });
  } catch (err) {
    console.error('Erro ao carregar editoras:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarAutores();
  carregarEditoras();
});

