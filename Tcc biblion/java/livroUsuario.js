async function carregarLivros() {
    try {
      const resp = await fetch("http://localhost:3000/livros");
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

  let row;
  livros.forEach((livro, index) => {
    if (index % 3 === 0) {
      row = document.createElement("div");
      row.className = "row mb-4";
      container.appendChild(row);
    }

    const col = document.createElement("div");
    col.className = "col-md-4 d-flex";

    col.innerHTML = `
      <div class="card card-livro d-flex flex-column w-100" style="cursor: pointer;">
        <div class="card-img-container" style="height: 250px; overflow: hidden; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5;">
          <img src="http://localhost:3000/uploads/${livro.capa || 'logoquadrada.jpeg'}"
               alt="${livro.titulo}"
               style="object-fit: contain; max-width: 100%; max-height: 100%;">
        </div>
        <div class="card-body d-flex flex-column justify-content-center text-center">
          <h5 class="card-title fw-bold mb-0">${livro.titulo}</h5>
        </div>
        <div class="card-footer text-center mt-auto">
          ${livro.disponivel
            ? `<button class="botao-disponivel">Reservar</button>`
            : `<p>Faltam <span class="dias">${livro.dias_faltando || '?'} </span> dias</p>
               <button class="botao-indisponivel">Indisponível</button>`}
        </div>
      </div>
    `;

    // 🔗 redirecionar para visLivro.html com o id do livro
    col.querySelector(".card").addEventListener("click", () => {
      window.location.href = `visLivro.html?id=${livro.id}`;
    });

    row.appendChild(col);
  });

  console.log("Número de rows criadas:", document.querySelectorAll("#" + containerId + " > .row").length);
}

  
  
  
  // Executa ao carregar a página
  document.addEventListener("DOMContentLoaded", async () => {
    const livros = await carregarLivros();
    renderizarLivros("gridLivros", livros);
  });
  