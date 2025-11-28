function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}
let todosLivros = [];
let livrosFiltrados = [];

// ===================== CARREGAR TODOS OS LIVROS =====================
async function carregarLivros() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return [];
    }

    const resp = await fetch(`${apiBase()}/acervo/livros`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error("Erro ao buscar livros");
    const livros = await resp.json();
    console.log("Todos os livros carregados:", livros);
    return livros;
  } catch (err) {
    console.error("Erro no carregarLivros:", err);
    return [];
  }
}

// ===================== RENDERIZAR LIVROS =====================
function renderizarLivros(containerId, livros, mensagemVazia = "Nenhum livro encontrado.") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!livros || livros.length === 0) {
    container.innerHTML = `<p class='text-white text-center mt-3'>${mensagemVazia}</p>`;
    return;
  }

  livros.forEach(livro => {
    const capaSrc = livro.capa
      ? `${apiBase()}/uploads/${livro.capa}`
      : `${apiBase()}/uploads/logoquadrada.jpeg`;


    const card = document.createElement('div');
    card.className = 'card mb-4 mx-auto';
    card.style.maxWidth = "320px";

    card.innerHTML = `
      <img src="${capaSrc}" class="card-img-top" alt="${livro.titulo || ''}">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${livro.titulo || ''}</h5>
      </div>
      <div class="card-footer text-center">
        ${livro.disponivel
        ? `<button class="btn btn-success reservar-btn" data-id="${livro.id}">Reservar</button>`
        : `<button class="btn btn-secondary" disabled>Indisponível</button>`}
      </div>
    `;

// Clique no card abre página de detalhes
card.addEventListener("click", () => {
  localStorage.setItem("livroSelecionado", livro.id);



  window.location.href = "visLivro.html";
});

    // Evitar que o clique no botão dispare o clique do card
    const botoes = card.querySelectorAll("button");
    botoes.forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        if (btn.classList.contains("reservar-btn")) {
          reservarLivro(livro.id);
        }
      });
    });

    container.appendChild(card);
  });
}

// ===================== RESERVAR LIVRO =====================
async function reservarLivro(livroId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Sessão expirada");

    const usuarioJSON = localStorage.getItem("usuario");
    if (!usuarioJSON) throw new Error("Dados do usuário não encontrados");
    
    const usuario = JSON.parse(usuarioJSON);
    const usuarioId = usuario.id;

    const resp = await fetch(`${apiBase()}/reservas`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuarioId: usuarioId,
        livroId: livroId
      })
    });

    if (!resp.ok) {
      const errorData = await resp.json();
      throw new Error(errorData.error || "Erro ao reservar livro");
    }

    const result = await resp.json();
    alert(`Livro reservado com sucesso! Sua posição na fila: ${result.posicao}`);
    
    // Recarregar a página para atualizar o status do livro
    window.location.reload();
    
  } catch (err) {
    console.error("Erro ao reservar livro:", err);
    alert("Não foi possível reservar o livro: " + err.message);
  }
}

// ===================== CARREGAR INDICAÇÕES =====================
async function carregarIndicacoes() {
  try {
    const token = localStorage.getItem("token");
    const usuarioJSON = localStorage.getItem("usuario");
    if (!usuarioJSON) throw new Error("Dados do usuário não encontrados");
    const usuario = JSON.parse(usuarioJSON);

    const cursoId = usuario.curso_id;
    const serie = usuario.serie;

    const resp = await fetch(`${apiBase()}/indicacoes/${cursoId}/${serie}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error(`Erro: ${resp.status}`);
    const livrosIndicados = await resp.json();

    renderizarLivros("gridLivrosIndicacoes", livrosIndicados, "Nenhuma indicação disponível.");
  } catch (err) {
    console.error("Erro ao carregar indicações:", err);
    renderizarLivros("gridLivrosIndicacoes", [], "Erro ao carregar indicações.");
  }
}

// ===================== CARREGAR LISTA DESEJOS =====================
async function carregarListaDesejos() {
  try {
    const token = localStorage.getItem("token");
    const usuarioJSON = localStorage.getItem("usuario");
    if (!usuarioJSON) throw new Error("Dados do usuário não encontrados");
    const usuario = JSON.parse(usuarioJSON);
    const usuarioId = usuario.id;

    const resp = await fetch(`${apiBase()}/lista-desejos/${usuarioId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error(`Erro ao buscar lista de desejos: ${resp.status}`);
    const livrosDesejados = await resp.json();

    renderizarLivros("gridLivrosListaDesejos", livrosDesejados, "Nenhum livro na lista de desejos.");
  } catch (err) {
    console.error("Erro no carregarListaDesejos:", err);
    renderizarLivros("gridLivrosListaDesejos", [], "Erro ao carregar lista de desejos.");
  }
}

// ===================== DETECTAR PÁGINA E CARREGAR =====================
document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split('/').pop().toLowerCase();

  if (document.getElementById("gridLivrosListaDesejos")) {
    carregarListaDesejos();
  }
  if (document.getElementById("gridLivrosIndicacoes")) {
    carregarIndicacoes();
  }
  if (document.getElementById("gridLivrosBiblioteca")) {
    carregarLivros().then(livros => {
    todosLivros = livros;
    livrosFiltrados = livros;
    preencherFiltros(livros);
    renderizarLivros("gridLivrosBiblioteca", livrosFiltrados);
});

  
  }
});
// ======================= FILTROS E PESQUISA =======================

// aplica a filtragem no array de livros já carregados
function filtrarLivros(livros, termoBusca, autor, editora, categoria) {
    termoBusca = termoBusca.toLowerCase();

    return livros.filter(livro => {
        const matchBusca =
            livro.titulo.toLowerCase().includes(termoBusca) ||
            (livro.autores && livro.autores.toLowerCase().includes(termoBusca));

        const matchAutor = autor ? livro.autores === autor : true;
        const matchEditora = editora ? livro.editora === editora : true;
        const matchCategoria = categoria ? livro.genero === categoria : true;

        return matchBusca && matchAutor && matchEditora && matchCategoria;
    });
}

// cria dinamicamente o comportamento igual ao bibliotecário
function iniciarFiltros(livros) {
    const inputBusca = document.getElementById("inputBusca");
    const filtroAutor = document.getElementById("filtroAutor");
    const filtroEditora = document.getElementById("filtroEditora");
    const filtroCategoria = document.getElementById("filtroCategoria");

    function atualizar() {
        const filtrados = filtrarLivros(
            livros,
            inputBusca.value,
            filtroAutor.value,
            filtroEditora.value,
            filtroCategoria.value
        );
        renderizarLivros("gridLivrosBiblioteca", filtrados);
    }

    inputBusca.addEventListener("input", atualizar);
    filtroAutor.addEventListener("change", atualizar);
    filtroEditora.addEventListener("change", atualizar);
    filtroCategoria.addEventListener("change", atualizar);
}

// Chamar após carregarLivros()
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("gridLivrosBiblioteca")) {
        carregarLivros().then(livros => {
            renderizarLivros("gridLivrosBiblioteca", livros);
            iniciarFiltros(livros); // ativa filtro e pesquisa
        });
    }
});
function preencherFiltros(livros) {
    const autores = new Set();
    const editoras = new Set();
    const categorias = new Set();

    livros.forEach(l => {
        if (l.autores) autores.add(l.autores);
        if (l.editora) editoras.add(l.editora);
        if (l.genero) categorias.add(l.genero);
    });

    const addOptions = (selectId, valores) => {
        const sel = document.getElementById(selectId);
        valores.forEach(v => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            sel.appendChild(opt);
        });
    };

    addOptions("filtroAutor", autores);
    addOptions("filtroEditora", editoras);
    addOptions("filtroCategoria", categorias);
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("gridLivrosBiblioteca")) {
        carregarLivros().then(livros => {
            renderizarLivros("gridLivrosBiblioteca", livros);
            preencherFiltros(livros);
            iniciarFiltros(livros);
        });
    }
});
function aplicarFiltro(tipo, valor) {
    livrosFiltrados = todosLivros.filter(l => {
        return String(l[tipo]).toLowerCase().includes(valor.toLowerCase());
    });

    renderizarLivros("gridLivrosBiblioteca", livrosFiltrados);
}
document.getElementById("pesquisaLivros").addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();

    const resultado = livrosFiltrados.filter(l =>
        l.titulo.toLowerCase().includes(texto) ||
        l.autores?.toLowerCase().includes(texto) ||
        l.genero?.toLowerCase().includes(texto)
    );

    renderizarLivros("gridLivrosBiblioteca", resultado);
});
