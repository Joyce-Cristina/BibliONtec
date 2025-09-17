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
  headers: {
    "Authorization": `Bearer ${token}`
  }
});


    if (!resp.ok) throw new Error("Erro ao buscar livros");
    return await resp.json();
  } catch (err) {
    console.error("Erro no carregarLivros:", err);
    return [];
  }
}

function renderizarLivros(containerId, livros) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  livros.forEach(livro => {
    const capaSrc = livro.capa
      ? `http://localhost:3000/uploads/${livro.capa}`
      : `http://localhost:3000/uploads/logoquadrada.jpeg`;

    const card = document.createElement('div');
    card.className = 'card mb-4 mx-auto'; // CSS igual ao acervo
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

    // Clicar no card leva para a página do livro
    card.addEventListener("click", () => {
      localStorage.setItem("livroSelecionado", livro.id);
      window.location.href = "visLivro.html";
    });

    // Evita que clicar no botão dispare o click do card
    const botoes = card.querySelectorAll("button");
    botoes.forEach(btn => btn.addEventListener("click", (e) => e.stopPropagation()));

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const livros = await carregarLivros();
  renderizarLivros("gridLivros", livros);
});
