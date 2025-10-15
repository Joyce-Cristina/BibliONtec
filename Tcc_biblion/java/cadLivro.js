
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}
document.addEventListener('DOMContentLoaded', async () => {
  const loadingIsbn = document.getElementById('loadingIsbn');
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('usuarioId'); // Id do funcionário logado
  if (!token) {
    alert('Você precisa estar logado para cadastrar livros.');
    return;
  }

  // Inputs principais
  const form = document.getElementById('formLivro');
  const inputGeneroTexto = document.getElementById('generoTexto');
  const inputGeneroId = document.getElementById('FK_genero_id');
  const isbnInput = document.getElementById('isbnInput');
  const autorInput = document.getElementById('autorTexto');
  const editoraInput = document.getElementById('editoraTexto');

  let autoresExistentes = [];
  let editorasExistentes = [];
  let generosExistentes = await carregarGeneros();

  function mostrarLoading() { if (loadingIsbn) loadingIsbn.style.display = 'inline-block'; }
  function esconderLoading() { if (loadingIsbn) loadingIsbn.style.display = 'none'; }

  // Associar input de gênero ao ID
  inputGeneroTexto.addEventListener('input', () => {
    const texto = inputGeneroTexto.value.trim().toLowerCase();
    const encontrado = generosExistentes.find(g => g.genero.toLowerCase() === texto);
    if (inputGeneroId) inputGeneroId.value = encontrado ? encontrado.id : '';
  });

  // Autocomplete autor
  autorInput.addEventListener('input', () => {
    const texto = autorInput.value.trim().toLowerCase();
    const encontrado = autoresExistentes.find(a => a.nome.toLowerCase() === texto);
    const inputAutorId = document.getElementById('FK_autor_id');
    if (inputAutorId) inputAutorId.value = encontrado ? encontrado.id : '';
  });

  // Autocomplete editora
  editoraInput.addEventListener('input', () => {
    const texto = editoraInput.value.trim().toLowerCase();
    const encontrado = editorasExistentes.find(e => e.editora.toLowerCase() === texto);
    const inputEditoraId = document.getElementById('FK_editora_id');
    if (inputEditoraId) inputEditoraId.value = encontrado ? encontrado.id : '';
  });

  // Preenchimento via ISBN
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
          } catch { return texto; }
        };

        // Preenche campos
        const tituloInput = document.querySelector('input[name="titulo"]');
        if (tituloInput) tituloInput.value = await traduzir(livro.title);

        const subtituloInput = document.querySelector('input[name="subtitulo"]');
        if (subtituloInput) subtituloInput.value = await traduzir(livro.subtitle);

        const descricaoPT = await traduzir(livro.description);
        const editoraPT = await traduzir(livro.publisher);
        const generoPT = await traduzir(livro.categories?.join(', ') || '');

        if (autorInput) autorInput.value = livro.authors?.join(', ') || '';
        if (editoraInput) editoraInput.value = editoraPT;
        if (inputGeneroTexto) inputGeneroTexto.value = generoPT;

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

        // Buscar ID do gênero se existir
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
      const resp = await fetch(`${apiBase()}/generos`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ genero: textoGenero })
        });

        if (!resp.ok) throw new Error('Erro ao salvar novo gênero');

        generosExistentes = await carregarGeneros();
        const novo = generosExistentes.find(g => g.genero.toLowerCase() === textoGenero.toLowerCase());
        inputGeneroId.value = novo?.id || '';
      } catch (err) {
        alert('Erro ao salvar gênero: ' + err.message);
        return;
      }
    }

    // Se autor não existe, cadastra
    let autorId = document.getElementById('FK_autor_id').value;
    if (!autorId && autorInput.value.trim() !== '') {
      try {
     const resp = await fetch(`${apiBase()}/autores`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ nome: autorInput.value.trim() })
        });
        if (!resp.ok) throw new Error('Erro ao salvar autor');
        autoresExistentes = await carregarAutores();
        const novo = autoresExistentes.find(a => a.nome.toLowerCase() === autorInput.value.trim().toLowerCase());
        autorId = novo?.id;
      } catch (err) {
        alert('Erro ao salvar autor: ' + err.message);
        return;
      }
    }

    // Se editora não existe, cadastra
    let editoraId = document.getElementById('FK_editora_id').value;
    if (!editoraId && editoraInput.value.trim() !== '') {
      try {
       const resp = await fetch(`${apiBase()}/editoras`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ nome: editoraInput.value.trim() })
        });
        if (!resp.ok) throw new Error('Erro ao salvar editora');
        editorasExistentes = await carregarEditoras();
        const novo = editorasExistentes.find(e => e.editora.toLowerCase() === editoraInput.value.trim().toLowerCase());
        editoraId = novo?.id;
      } catch (err) {
        alert('Erro ao salvar editora: ' + err.message);
        return;
      }
    }

    // Envia formulário do livro
    const formData = new FormData(form);
    // adiciona manualmente os IDs
    formData.set('FK_genero_id', idGenero);
    formData.set('FK_autor_id', autorId);
    formData.set('FK_editora_id', editoraId);
    formData.set('FK_funcionario_id', usuarioId);

    try {
     const resposta = await fetch(`${apiBase()}/cadastrarLivro`, {

        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });

      const resultado = await resposta.json();

      if (resposta.ok) {
        alert('Livro cadastrado com sucesso!');
        form.reset();
        inputGeneroId.value = '';
        document.getElementById('FK_autor_id').value = '';
        document.getElementById('FK_editora_id').value = '';
      } else {
        alert('Erro ao cadastrar livro: ' + resultado.error);
      }
    } catch (erro) {
      console.error('Erro na requisição:', erro);
      alert('Erro na conexão com o servidor.');
    }
  });

  // Carrega autores e editoras
  autoresExistentes = await carregarAutores();
  editorasExistentes = await carregarEditoras();
});

// Ajusta data para yyyy-mm-dd
function ajustarData(data) {
  if (!data) return '';
  if (/^\d{4}$/.test(data)) return '';
  if (/^\d{4}-\d{2}$/.test(data)) return data + '-01';
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return data;
  return '';
}

// Carregar gêneros
async function carregarGeneros() {
  try {
    const response = await fetch(`${apiBase()}/generos`);

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
  const token = localStorage.getItem('token');
  try {
const response = await fetch(`${apiBase()}/autores`, {

      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Não autorizado');
    const autores = await response.json();

    // Preencher datalist
    const datalist = document.getElementById('listaAutores');
    datalist.innerHTML = ''; // limpa antes
    autores.forEach(a => {
      const option = document.createElement('option');
      option.value = a.nome;
      datalist.appendChild(option);
    });

    return autores;
  } catch (err) {
    console.error('Erro ao carregar autores:', err);
    return [];
  }
}

async function carregarEditoras() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${apiBase()}/editoras`, {

      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!response.ok) throw new Error('Não autorizado');
    const editoras = await response.json();

    // Preencher datalist
    const datalist = document.getElementById('listaEditoras');
    datalist.innerHTML = '';
    editoras.forEach(e => {
      const option = document.createElement('option');
      option.value = e.editora;
      datalist.appendChild(option);
    });

    return editoras;
  } catch (err) {
    console.error('Erro ao carregar editoras:', response);
    return [];
  }
}

