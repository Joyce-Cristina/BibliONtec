let todosOsLivros = [];


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cardsContainer')) carregarLivros();
  if (document.getElementById('listaGeneros')) carregarGeneros();
  if (document.getElementById('listaAutores')) carregarAutores();
  if (document.getElementById('listaEditoras')) carregarEditoras();
  // Busca por título
  const buscaInput = document.getElementById('buscaLivro');
  if (buscaInput) {
    buscaInput.addEventListener('input', function () {
      const termo = this.value.toLowerCase();
      const filtrados = todosOsLivros.filter(livro =>
        livro.titulo && livro.titulo.toLowerCase().includes(termo)
      );
      exibirLivros(filtrados);
    });
  }

  // Delegação de eventos para Editar e Excluir
  const container = document.getElementById('cardsContainer');
  if (container) {
    container.addEventListener('click', e => {
      if (e.target.classList.contains('btn-imprimir')) {
        const id = Number(e.target.dataset.id);
        imprimirEtiqueta(id);
      }
      if (e.target.classList.contains('btn-danger')) {
        const id = Number(e.target.dataset.id);
        excluirLivro(id);
      }
      if (e.target.classList.contains('btn-dark')) {
        const id = Number(e.target.dataset.id);
        abrirModalEdicaoLivro(id);
      }
    });
  }
});

// 🔑 Pega token do localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Carregar livros do backend
async function carregarLivros() {
  try {
    const token = getToken();
    const resposta = await fetch('http://localhost:3000/acervo/livros', {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await resposta.json();
    if (!resposta.ok) {
      console.error("Erro do servidor:", data);
      alert("Erro ao carregar livros: " + (data.error || "Não autorizado"));
      return;
    }

    // Atualiza lista global
    todosOsLivros = data.map(livro => ({
      ...livro,
      autores: livro.autores || '—',
      editora: livro.editora || '—',
      funcionario_cadastrou: livro.funcionario_cadastrou || '—'
    }));

    exibirLivros(todosOsLivros);
  } catch (erro) {
    console.error('Erro ao carregar livros:', erro);
  }
}


// Exibir livros na tela
// Exibir livros na tela
function exibirLivros(livros) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;
  container.innerHTML = '';

  livros.forEach(livro => {
    const capaSrc = livro.capa
      ? `http://localhost:3000/uploads/${livro.capa}`
      : `http://localhost:3000/uploads/padrao.jpg`;

    // Garantir que campos não fiquem nulos
    const autores = livro.autores && livro.autores.trim() !== '' ? livro.autores : '—';
    const editora = livro.editora && livro.editora.trim() !== '' ? livro.editora : '—';
    const funcionario = livro.funcionario_cadastrou && livro.funcionario_cadastrou.trim() !== '' ? livro.funcionario_cadastrou : '—';

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${capaSrc}" class="card-img-top" alt="${livro.titulo || ''}">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${livro.titulo || ''}</h5>
        <p><strong>Autores:</strong> ${autores}</p>
        <p><strong>Editora:</strong> ${editora}</p>
        <p><strong>ISBN:</strong> ${livro.isbn || '—'}</p>
        <p><strong>Cadastrado por:</strong> ${funcionario}</p>
        <p class="text-truncate">${livro.sinopse || ''}</p>
      </div>
      <div class="card-footer text-center">
        <button class="btn btn-danger me-2" data-id="${livro.id}">Excluir</button>
        <button class="btn btn-dark me-2" data-id="${livro.id}">Editar</button>
        <button class="btn btn-primary btn-imprimir" data-id="${livro.id}">Imprimir</button>
      </div>
    `;

    container.appendChild(card);
  });
}


// Carregar gêneros
async function carregarGeneros() {
  const lista = document.getElementById('listaGeneros');
  if (!lista) return;

  try {
    const token = getToken();
    const resposta = await fetch('http://localhost:3000/generos', {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const generos = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao carregar gêneros:", generos);
      return;
    }

    lista.innerHTML = '';

    const itemTodos = document.createElement('li');
    itemTodos.innerHTML = `<a class="dropdown-item item-com-linha" href="#" data-id="0">Todos</a>`;
    lista.appendChild(itemTodos);

    generos.forEach(genero => {
      const item = document.createElement('li');
      item.innerHTML = `<a class="dropdown-item item-com-linha" href="#" data-id="${genero.id}">${genero.genero}</a>`;
      lista.appendChild(item);
    });

    lista.addEventListener('click', e => {
      if (e.target && e.target.matches('a[data-id]')) {
        e.preventDefault();
        const idGenero = parseInt(e.target.dataset.id);
        if (idGenero === 0) {
          exibirLivros(todosOsLivros);
        } else {
          const filtrados = todosOsLivros.filter(livro => livro.FK_genero_id === idGenero);
          exibirLivros(filtrados);
        }
      }
    });
  } catch (erro) {
    console.error('Erro ao carregar gêneros:', erro);
  }
}

// Excluir livro
function excluirLivro(id) {
  if (confirm('Tem certeza que deseja excluir este livro?')) {
    const token = getToken();
    fetch(`http://localhost:3000/livros/${id}`, {
      method: 'DELETE',
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) {
          carregarLivros();
        } else {
          alert('Erro ao excluir livro');
        }
      })
      .catch(err => console.error('Erro ao excluir livro:', err));
  }
}

// Abrir modal de edição com preview da capa
async function abrirModalEdicaoLivro(id) {
  const livro = todosOsLivros.find(l => l.id === id);
  if (!livro) return;

  const token = getToken();

  // Carregar gêneros
  const respostaGeneros = await fetch('http://localhost:3000/generos', { headers: { Authorization: `Bearer ${token}` } });
  const generos = await respostaGeneros.json();

  const selectGenero = document.getElementById('genero-livro');
  if (selectGenero) {
    selectGenero.innerHTML = '';
    generos.forEach(g => {
      const option = document.createElement('option');
      option.value = g.id;
      option.textContent = g.genero;
      if (g.id === livro.FK_genero_id) option.selected = true;
      selectGenero.appendChild(option);
    });
  }

  // Carregar autores
  const respostaAutores = await fetch('http://localhost:3000/autores', { headers: { Authorization: `Bearer ${token}` } });
  const autores = await respostaAutores.json();

  const selectAutores = document.getElementById('autores-livro');
  if (selectAutores) {
    selectAutores.innerHTML = '';
    autores.forEach(a => {
      const option = document.createElement('option');
      option.value = a.id;
      option.textContent = a.nome;
      if (a.nome === livro.autores) option.selected = true;
      selectAutores.appendChild(option);
    });
  }

  // Carregar editoras
  const respostaEditoras = await fetch('http://localhost:3000/editoras', { headers: { Authorization: `Bearer ${token}` } });
  const editoras = await respostaEditoras.json();

  const selectEditoras = document.getElementById('editora-livro');
  if (selectEditoras) {
    selectEditoras.innerHTML = '';
    editoras.forEach(e => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.editora;
      if (e.editora === livro.editora) option.selected = true;
      selectEditoras.appendChild(option);
    });
  }

  // Preenche os outros campos
  const campos = {
    'id-livro': 'id',
    'titulo-livro': 'titulo',
    'isbn-livro': 'isbn',
    'sinopse-livro': 'sinopse',
    'paginas-livro': 'paginas',
    'funcionario-livro': 'funcionario_cadastrou'
  };

  for (const campoId in campos) {
    const el = document.getElementById(campoId);
    if (el) el.value = livro[campos[campoId]] || '';
  }

  // 🖼️ Preview da capa atual
  const preview = document.getElementById('preview-capa');
  if (preview) {
    const capaSrc = livro.capa
      ? `http://localhost:3000/uploads/${livro.capa}`
      : `http://localhost:3000/uploads/padrao.jpg`;
    preview.src = capaSrc;
    preview.style.display = 'block';
  }

  // 🖼️ Atualizar preview ao escolher nova imagem
  const inputCapa = document.getElementById('capa-livro');
  if (inputCapa) {
    inputCapa.value = '';
    inputCapa.onchange = () => {
      const file = inputCapa.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // Abre modal
  const modalEl = document.getElementById('modal-editar-livro');
  if (modalEl) new bootstrap.Modal(modalEl).show();
}


// Atualizar preview quando escolher nova imagem
const inputCapa = document.getElementById('capa-livro');
if (inputCapa) {
  inputCapa.value = ''; // limpa campo anterior
  inputCapa.onchange = () => {
    const file = inputCapa.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  };
}

// Event listener para o formulário de edição
const formEditarLivro = document.getElementById('form-editar-livro');
if (formEditarLivro) {
  formEditarLivro.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const id = document.getElementById('id-livro').value;
    const formData = new FormData();
    
    // Adicionar campos manualmente para ter controle total
    formData.append('titulo', document.getElementById('titulo-livro').value);
    formData.append('isbn', document.getElementById('isbn-livro').value);
    formData.append('sinopse', document.getElementById('sinopse-livro').value);
    formData.append('paginas', document.getElementById('paginas-livro').value);
    formData.append('generoId', document.getElementById('genero-livro').value);
    formData.append('editoraId', document.getElementById('editora-livro').value);
    
    // Processar autores selecionados
    const autoresSelect = document.getElementById('autores-livro');
    const autoresSelecionados = Array.from(autoresSelect.selectedOptions).map(option => option.value);
    autoresSelecionados.forEach(autorId => {
      formData.append('FK_autor_id', autorId);
    });
    
    // Adicionar arquivo de capa se existir
    const capaInput = document.getElementById('capa-livro');
    if (capaInput.files[0]) {
      formData.append('capa', capaInput.files[0]);
    }
    
    try {
      const token = getToken();
      const resposta = await fetch(`http://localhost:3000/livros/${id}`, {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${token}`
          // Não definir Content-Type - o browser fará isso automaticamente com boundary
        },
        body: formData
      });
      
      if (resposta.ok) {
        alert('Livro atualizado com sucesso!');
        // Fechar modal
        const modalEl = document.getElementById('modal-editar-livro');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        // Recarregar lista de livros
        carregarLivros();
      } else {
        const erro = await resposta.json();
        alert('Erro ao atualizar livro: ' + (erro.error || 'Erro desconhecido'));
        console.error('Detalhes do erro:', erro);
      }
    } catch (erro) {
      console.error('Erro ao atualizar livro:', erro);
      alert('Erro ao conectar com o servidor');
    }
  });
}

function imprimirEtiqueta(id) {
  const livro = todosOsLivros.find(l => l.id === id);
  if (!livro) return;

  // Função para buscar CDD do seu backend
  async function buscarCDD(isbn) {
    try {
      // Fazer requisição para sua própria API
      const response = await fetch(`/api/buscar-cdd/${isbn}`);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.cdd || "000"; // Assume que a resposta é { cdd: "123" }
      
    } catch (error) {
      console.error("Erro ao buscar CDD:", error);
      return "000"; // Fallback em caso de erro
    }
  }

  // Função para gerar o conteúdo da etiqueta
  async function gerarConteudoEtiqueta() {
    // Obter CDD da sua API
    const cdd = await buscarCDD(livro.isbn || "0000000000000");
    
    // Três primeiras letras do título (em maiúsculas)
    const iniciaisTitulo = livro.titulo.substring(0, 3).toUpperCase();
    
    // Primeira letra do gênero (em maiúscula)
    const genero = livro.genero || livro.FK_genero_id || "";
    const primeiraLetraGenero = genero ? genero.substring(0, 1).toUpperCase() : "G";
    
    // Nome da instituição
    const instituicao = localStorage.getItem('instituicao_nome') || 'BibliOnTec';
    
    // ID formatado para código de barras
    const idFormatado = livro.id.toString().padStart(6, '0');
    
    return `
      <html>
      <head>
        <title>Etiqueta do Livro</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 10px;
            background-color: white;
          }
          .etiqueta {
            border: 1px solid #000;
            padding: 10px;
            width: 300px;
            height: 180px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .cabecalho {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          .cdd {
            font-weight: bold;
            font-size: 16px;
            border: 1px solid #000;
            padding: 2px 5px;
          }
          .iniciais {
            font-weight: bold;
            font-size: 14px;
          }
          .genero {
            font-weight: bold;
            font-size: 14px;
            border: 1px solid #000;
            padding: 2px 5px;
            display: inline-block;
          }
          .titulo {
            font-weight: bold;
            font-size: 14px;
            margin: 5px 0;
            max-height: 40px;
            overflow: hidden;
          }
          .codigo-barras {
            margin: 5px 0;
            height: 40px;
          }
          .instituicao {
            font-size: 10px;
            margin-top: 5px;
          }
          .id {
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="etiqueta">
          <div class="cabecalho">
            <div class="cdd">${cdd}</div>
            <div class="iniciais">${iniciaisTitulo}</div>
            <div class="genero">${primeiraLetraGenero}</div>
          </div>
          <div class="titulo">${livro.titulo}</div>
          <div class="codigo-barras">
            <svg id="barcode-${id}"></svg>
          </div>
          <div class="instituicao">${instituicao}</div>
          <div class="id">ID: ${idFormatado}</div>
        </div>
        <script>
          // Gerar código de barras
          JsBarcode("#barcode-${id}", "${idFormatado}", {
            format: "CODE128",
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 0
          });
          window.print();
        </script>
      </body>
      </html>
    `;
  }

  // Abrir janela e escrever o conteúdo
  const janela = window.open('', '_blank', 'width=400,height=300');
  
  gerarConteudoEtiqueta().then(conteudo => {
    janela.document.write(conteudo);
    janela.document.close();
  });

}
