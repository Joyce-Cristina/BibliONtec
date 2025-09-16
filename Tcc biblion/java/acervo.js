let todosOsLivros = [];

document.addEventListener('DOMContentLoaded', () => {
  // Só carrega livros se o container existir
  if (document.getElementById('cardsContainer')) {
    carregarLivros();
  }

  // Só carrega gêneros se a lista existir
  if (document.getElementById('listaGeneros')) {
    carregarGeneros();
  }

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

    todosOsLivros = data;
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

  let row;
  livros.forEach((livro, index) => {
    if (index % 3 === 0) {
      row = document.createElement('div');
      row.className = 'row mb-4';
      container.appendChild(row);
    }

    // Criar coluna
    const col = document.createElement('div');
    col.className = 'col-md-4';

    // Definir capa
    const capaSrc = livro.capa ? `http://localhost:3000/uploads/${livro.capa}` : 'img/livro-placeholder.png';

    // Definir disponibilidade (quando tiver sistema de empréstimo, ajustar essa lógica)
    const disponivel = livro.emprestado ? false : true;

    // Montar card
    col.innerHTML = `
      <div class="card h-100 d-flex flex-column" style="background-color: #d6c9b4;">
        <div style="height: 300px; overflow: hidden;">
          <img src="${capaSrc}" class="card-img-top w-100" alt="${(livro.titulo || '')}" style="height:100%; object-fit:cover;">
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold mb-1" style="font-size:1.05rem;">${livro.titulo || ''}</h5>
          <p class="card-text text-truncate mb-1" title="${livro.autores || ''}">${livro.autores || ''}</p>
          <p class="card-text text-muted mb-2" style="font-size:0.9rem;">${livro.editora || ''} ${livro.isbn ? '• ISBN: ' + livro.isbn : ''}</p>
          <p class="card-text flex-grow-1 text-truncate" style="font-size:0.95rem;">${livro.sinopse || ''}</p>
        </div>
        <div class="card-footer bg-transparent border-0 pt-0">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <button class="btn btn-danger btn-sm me-2" data-id="${livro.id}">Excluir</button>
              <button class="btn btn-dark btn-sm me-2" data-id="${livro.id}">Editar</button>
              <button class="btn btn-primary btn-sm btn-imprimir" data-id="${livro.id}">Imprimir Etiqueta</button>
            </div>
            <div>
              <span class="badge ${disponivel ? 'bg-success' : 'bg-danger'}">
                ${disponivel ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    row.appendChild(col);
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

// Abrir modal de edição
async function abrirModalEdicaoLivro(id) {
  const livro = todosOsLivros.find(l => l.id === id);
  if (!livro) return;

  // Carrega gêneros
  let generos = [];
  try {
    const token = getToken();
    const resposta = await fetch('http://localhost:3000/generos', {
      headers: { "Authorization": `Bearer ${token}` }
    });
    generos = await resposta.json();
  } catch (erro) {
    console.error('Erro ao carregar gêneros:', erro);
  }

  // Preenche select de gêneros
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

  // Preenche os outros campos do modal
 const campos = {
  'id-livro': 'id',
  'titulo-livro': 'titulo',
  'isbn-livro': 'isbn',
  'autores-livro': 'autores',
  'editora-livro': 'editora',
  'funcionario-livro': 'funcionario_cadastrou',
  'sinopse-livro': 'sinopse',
  'paginas-livro': 'paginas'
};

for (const campoId in campos) {
  const el = document.getElementById(campoId);
  if (el) {
    el.value = livro[campos[campoId]] || '';
  }
}


  // Abre modal
  const modalEl = document.getElementById('modal-editar-livro');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
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