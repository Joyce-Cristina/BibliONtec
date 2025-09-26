// ===================== CARREGAR TODOS OS LIVROS =====================
async function carregarLivros() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return [];
    }

    const resp = await fetch("http://localhost:3000/acervo/livros", {
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
      ? `http://localhost:3000/uploads/${livro.capa}`
      : `http://localhost:3000/uploads/logoquadrada.jpeg`;

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

    card.addEventListener("click", () => {
      localStorage.setItem("livroSelecionado", livro.id);
      window.location.href = "visLivro.html";
    });

    const botoes = card.querySelectorAll("button");
    botoes.forEach(btn => btn.addEventListener("click", e => e.stopPropagation()));

    container.appendChild(card);
  });
}

// ===================== CARREGAR INDICAÇÕES =====================
async function carregarIndicacoes() {
  try {
    const token = localStorage.getItem("token");
    
    // 🔍 CORREÇÃO: Pegar os dados do objeto usuario completo
    const usuarioJSON = localStorage.getItem("usuario");
    if (!usuarioJSON) {
      throw new Error("Dados do usuário não encontrados");
    }
    
    const usuario = JSON.parse(usuarioJSON);
    console.log("👤 DADOS DO USUÁRIO:", usuario);
    
    const cursoId = usuario.curso_id;
    const serie = usuario.serie;
    
    console.log("🎯 BUSCANDO INDICAÇÕES PARA:", { cursoId, serie });

    const resp = await fetch(`http://localhost:3000/indicacoes/${cursoId}/${serie}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error(`Erro: ${resp.status}`);

    const livrosIndicados = await resp.json();
    console.log("📚 LIVROS INDICADOS RECEBIDOS:", livrosIndicados);

    renderizarLivros("gridLivros", livrosIndicados, "Nenhuma indicação disponível.");

  } catch (err) {
    console.error("Erro:", err);
    renderizarLivros("gridLivros", [], "Erro ao carregar indicações.");
  }
}

async function carregarListaDesejos() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "index.html";
      return [];
    }

    const usuarioJSON = localStorage.getItem("usuario");
    if (!usuarioJSON) throw new Error("Dados do usuário não encontrados");
    const usuario = JSON.parse(usuarioJSON);
    const usuarioId = usuario.id;

    const resp = await fetch(`http://localhost:3000/lista-desejos/${usuarioId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resp.ok) throw new Error(`Erro ao buscar lista de desejos: ${resp.status}`);

    const livrosDesejados = await resp.json();
    console.log("📚 LIVROS NA LISTA DESEJOS:", livrosDesejados);

    renderizarLivros("gridLivros", livrosDesejados, "Nenhum livro na lista de desejos.");

  } catch (err) {
    console.error("Erro no carregarListaDesejos:", err);
    renderizarLivros("gridLivros", [], "Erro ao carregar lista de desejos.");
  }
}

// ===================== DETECTAR PÁGINA E CARREGAR =====================
document.addEventListener("DOMContentLoaded", function() {
  console.log("🔍 DETECTANDO PÁGINA...");
  
  // Método mais direto: verifica o nome do arquivo atual
  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  console.log("Página atual:", currentPage);
  
  if (currentPage === 'indicacoes.html') {
    console.log("🚀 CARREGANDO INDICAÇÕES...");
    carregarIndicacoes();
  } else if (currentPage === 'lista.html') {    
    console.log("🚀 CARREGANDO LISTA DESEJOS...");
    carregarListaDesejos();}
  else{
    console.log("📖 CARREGANDO TODOS OS LIVROS...");
    carregarLivros().then(livros => {
      renderizarLivros("gridLivros", livros);
    });
  }
});