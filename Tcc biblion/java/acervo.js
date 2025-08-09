
  let todosOsLivros = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarLivros();
  carregarGeneros(); 

  document.getElementById('buscaLivro').addEventListener('input', function () {
    const termo = this.value.toLowerCase();

    const filtrados = todosOsLivros.filter(livro =>
      livro.titulo && livro.titulo.toLowerCase().includes(termo)
    );

    exibirLivros(filtrados);
  });
});

async function carregarLivros() {
  try {
    const resposta = await fetch('http://localhost:3000/livros');
    todosOsLivros = await resposta.json();
    exibirLivros(todosOsLivros); // Exibe todos os livros inicialmente
  } catch (erro) {
    console.error('Erro ao carregar livros:', erro);
  }
}

function exibirLivros(livros) {
  const container = document.getElementById('cardsContainer');
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
          <h6 class="card-subtitle">${livro.sinopse}</h6>
        </div>
        <div class="card-footer text-center">
          <button class="btn btn-danger me-2">Excluir</button>
          <button class="btn btn-dark">Editar</button>
          <div class="mt-2">
            <span class="badge bg-danger">Indisponível</span>
          </div>
        </div>
      </div>
    `;

    row.appendChild(col);
  });
}

async function carregarGeneros() {
    try {
        const resposta = await fetch('http://localhost:3000/generos');
        const generos = await resposta.json();
        const lista = document.getElementById('listaGeneros');
    
        lista.innerHTML = '';
    
        // Opção "Todos" para remover filtro
        const itemTodos = document.createElement('li');
        itemTodos.innerHTML = `<a class="dropdown-item item-com-linha" href="#" data-id="0">Todos</a>`;
        lista.appendChild(itemTodos);
    
        generos.forEach(genero => {
          const item = document.createElement('li');
          item.innerHTML = `
            <a class="dropdown-item item-com-linha" href="#" data-id="${genero.id}">${genero.genero}</a>
          `;
          lista.appendChild(item);
        });
    
        lista.addEventListener('click', e => {
          if (e.target && e.target.matches('a[data-id]')) {
            e.preventDefault();
            const idGenero = parseInt(e.target.dataset.id);
    
            if (idGenero === 0) {
              exibirLivros(todosOsLivros);
            } else {
              const filtrados = todosOsLivros.filter(livro =>
                livro.FK_genero_id === idGenero
              );
              exibirLivros(filtrados);
            }
          }
        });
      } catch (erro) {
        console.error('Erro ao carregar gêneros:', erro);
      }
  }