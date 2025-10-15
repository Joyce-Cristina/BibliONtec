function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

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

    const resp = await fetch(`${apiBase()}/reservar/${livroId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error("Erro ao reservar livro");

    alert("Livro reservado com sucesso!");
  } catch (err) {
    console.error("Erro ao reservar livro:", err);
    alert("Não foi possível reservar o livro.");
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
      renderizarLivros("gridLivrosBiblioteca", livros);
    });
  }
});