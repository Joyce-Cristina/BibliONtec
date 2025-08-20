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

// Carregar livros do backend
async function carregarLivros() {
  try {
    const resposta = await fetch('http://localhost:3000/livros');
    todosOsLivros = await resposta.json();
    exibirLivros(todosOsLivros);
  } catch (erro) {
    console.error('Erro ao carregar livros:', erro);
  }
}

// Exibir livros na tela
function exibirLivros(livros) {
  const container = document.getElementById('cardsContainer');
  if (!container) return; // Proteção
  container.innerHTML = '';

  let row;
  livros.forEach((livro, index) => {
    if (index % 3 === 0) {
      row = document.createElement('div');
      row.className = 'row mb-4';
      container.appendChild(row);
    }

    const col = document.createElement('div');
    col.className = 'col-md-4 d-flex align-items-stretch';
    col.innerHTML = `
      <div class="card h-100" style="background-color: #d6c9b4;">
        <img src="http://localhost:3000/uploads/${livro.capa}" class="card-img-top" alt="${livro.titulo}" style="height: 300px; object-fit: cover;">
        <div class="card-body text-center">
          <h5 class="card-title fw-bold">${livro.titulo}</h5>
          <h6 class="card-subtitle">${livro.sinopse || ''}</h6>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-danger me-2" data-id="${livro.id}">Excluir</button>
          <button class="btn btn-dark" data-id="${livro.id}">Editar</button>
          <div class="mt-2">
            <span class="badge bg-danger">Indisponível</span>
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
  if (!lista) return; // Proteção

  try {
    const resposta = await fetch('http://localhost:3000/generos');
    const generos = await resposta.json();

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
    fetch(`http://localhost:3000/livros/${id}`, { method: 'DELETE' })
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
function abrirModalEdicaoLivro(id) {
  const livro = todosOsLivros.find(l => l.id === id);
  if (!livro) return;

  const campos = ['id-livro','titulo-livro','isbn-livro','autores-livro','editora-livro','genero-livro','funcionario-livro','sinopse-livro','paginas-livro'];
  campos.forEach(campo => {
    const el = document.getElementById(campo);
    if (el) {
      if (campo === 'id-livro') el.value = livro.id;
      else el.value = livro[campo.replace('-livro','')] || '';
    }
  });

  const modalEl = document.getElementById('modal-editar-livro');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

// Fechar modal
function fecharModalLivro() {
  const modalEl = document.getElementById('modal-editar-livro');
  const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
  if (modal) modal.hide();
}

// Salvar alterações do modal
const formEditar = document.getElementById('form-editar-livro');
if (formEditar) {
  formEditar.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('id-livro')?.value;
    const dados = {
      titulo: document.getElementById('titulo-livro')?.value,
      isbn: document.getElementById('isbn-livro')?.value,
      autores: document.getElementById('autores-livro')?.value,
      editora: document.getElementById('editora-livro')?.value,
      genero: document.getElementById('genero-livro')?.value,
      funcionario: document.getElementById('funcionario-livro')?.value,
      sinopse: document.getElementById('sinopse-livro')?.value,
      paginas: document.getElementById('paginas-livro')?.value
    };

    fetch(`http://localhost:3000/livros/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
    .then(res => {
      if (res.ok) {
        fecharModalLivro();
        carregarLivros();
      } else {
        alert('Erro ao editar livro');
      }
    })
    .catch(err => console.error('Erro ao editar livro:', err));
  });
}
