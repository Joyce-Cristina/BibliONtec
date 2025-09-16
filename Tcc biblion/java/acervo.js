let todosOsLivros = [];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cardsContainer')) {
    carregarLivros();
  }

  if (document.getElementById('listaGeneros')) {
    carregarGeneros();
  }

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

// 🔑 Pega token
function getToken() {
  return localStorage.getItem("token");
}

// 📚 Carregar livros do backend
async function carregarLivros() {
  try {
    const token = getToken();
    const response = await fetch("http://localhost:3000/acervo/livros", {
<<<<<<< Updated upstream
  headers: { "Authorization": `Bearer ${token}` }
});

   
    const data = await resposta.json();
=======
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await response.json();
>>>>>>> Stashed changes

    if (!response.ok) {
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

// 🎴 Exibir livros
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
// dentro do forEach (substituir innerHTML atual)
const disponivel = livro.disponibilidade === "disponivel";
livros.forEach(livro => {
  const col = document.createElement("div");   // 👈 cria a div col
  col.className = "col";

<<<<<<< Updated upstream
  const disponivel = livro.disponibilidade === "disponivel";

  col.innerHTML = `
    <div class="card h-100" style="background-color: #d6c9b4;">
      <img src="http://localhost:3000/uploads/${livro.capa || ''}" class="card-img-top" alt="${livro.titulo || ''}" style="height: 300px; object-fit: cover;">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${livro.titulo || ''}</h5>
        <h6 class="card-subtitle">${livro.sinopse || ''}</h6>
      </div>
      <div class="card-footer text-center">
        <button class="btn btn-danger me-2" data-id="${livro.id}">Excluir</button>
        <button class="btn btn-dark" data-id="${livro.id}">Editar</button>
        <div class="mt-2">
          <span class="badge ${disponivel ? 'bg-success' : 'bg-danger'}">
            ${disponivel ? 'Disponível' : 'Indisponível'}
          </span>
        </div>
      </div>
    </div>
  `;

  container.appendChild(col);  // 👈 adiciona na tela
});
});
=======
    const col = document.createElement("div");
    col.className = "col";

    const disponivel = livro.disponibilidade === "disponivel";

    col.innerHTML = `
      <div class="card h-100" style="background-color: #d6c9b4;">
        <img src="http://localhost:3000/uploads/${livro.capa || ''}" class="card-img-top" alt="${livro.titulo || ''}" style="height: 300px; object-fit: cover;">
        <div class="card-body text-center">
          <h5 class="card-title fw-bold">${livro.titulo || ''}</h5>
          <h6 class="card-subtitle">${livro.sinopse || ''}</h6>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-danger me-2" data-id="${livro.id}">Excluir</button>
          <button class="btn btn-dark" data-id="${livro.id}">Editar</button>
          <div class="mt-2">
            <span class="badge ${disponivel ? 'bg-success' : 'bg-danger'}">
              ${disponivel ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
        </div>
      </div>
    `;

    row.appendChild(col);
  });
>>>>>>> Stashed changes
}

// 🎭 Carregar gêneros
async function carregarGeneros() {
  const lista = document.getElementById('listaGeneros');
  if (!lista) return;

  try {
    const token = getToken();
    const response = await fetch('http://localhost:3000/generos', {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const generos = await response.json();

    if (!response.ok) {
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

// ❌ Excluir livro
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

// ✏️ Abrir modal de edição
async function abrirModalEdicaoLivro(id) {
  const livro = todosOsLivros.find(l => l.id === id);
  if (!livro) return;

  let generos = [];
  try {
    const token = getToken();
    const response = await fetch('http://localhost:3000/generos', {
      headers: { "Authorization": `Bearer ${token}` }
    });
    generos = await response.json();
  } catch (erro) {
    console.error('Erro ao carregar gêneros:', erro);
  }

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

  const modalEl = document.getElementById('modal-editar-livro');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}
