// ===============================
// BOTÃO DE ACESSIBILIDADE GLOBAL
// ===============================

// Cria o HTML base do botão e menu
const accessibilityHTML = `
  <div class="accessibility-container">
    <button class="accessibility-btn" id="accessibilityToggle">
      <i class="bi bi-universal-access"></i>
    </button>

    <div class="accessibility-menu" id="accessibilityMenu">
      <button data-filter="none">Padrão</button>
      <button data-filter="protanopia">Protanopia</button>
      <button data-filter="deuteranopia">Deuteranopia</button>
      <button data-filter="tritanopia">Tritanopia</button>
    </div>
  </div>

  <!-- SVG Filters -->
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <filter id="protanopia">
      <feColorMatrix type="matrix"
        values="0.567,0.433,0,0,0
                0.558,0.442,0,0,0
                0,0.242,0.758,0,0
                0,0,0,1,0"/>
    </filter>
    <filter id="deuteranopia">
      <feColorMatrix type="matrix"
        values="0.625,0.375,0,0,0
                0.7,0.3,0,0,0
                0,0.3,0.7,0,0
                0,0,0,1,0"/>
    </filter>
    <filter id="tritanopia">
      <feColorMatrix type="matrix"
        values="0.95,0.05,0,0,0
                0,0.433,0.567,0,0
                0,0.475,0.525,0,0
                0,0,0,1,0"/>
    </filter>
  </svg>
`;

// Injeta o HTML no final do body
document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("beforeend", accessibilityHTML);

  // Injeta estilos
  const style = document.createElement("style");
  style.textContent = `
    .accessibility-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
    }
    .accessibility-btn {
      width: 50px;
      height: 50px;
      border: none;
      border-radius: 12px;
      background-color: #212529;
      color: white;
      font-size: 1.6rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .accessibility-btn:hover {
      background-color: #343a40;
    }
    .accessibility-menu {
      position: absolute;
      bottom: 60px;
      right: 0;
      background: #212529;
      border-radius: 10px;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .accessibility-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .accessibility-menu button {
      display: block;
      width: 140px;
      background: transparent;
      color: white;
      border: none;
      text-align: left;
      padding: 10px 15px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .accessibility-menu button:hover {
      background: #343a40;
    }
    body[data-filter="protanopia"] { filter: url("#protanopia"); }
    body[data-filter="deuteranopia"] { filter: url("#deuteranopia"); }
    body[data-filter="tritanopia"] { filter: url("#tritanopia"); }
  `;
  document.head.appendChild(style);

  // Função para aplicar filtro e salvar
  function applyFilter(filter) {
    if (filter === "none") {
      document.body.removeAttribute("data-filter");
      localStorage.removeItem("accessibilityFilter");
    } else {
      document.body.setAttribute("data-filter", filter);
      localStorage.setItem("accessibilityFilter", filter);
    }
  }

  // Recupera filtro salvo
  const savedFilter = localStorage.getItem("accessibilityFilter");
  if (savedFilter) document.body.setAttribute("data-filter", savedFilter);

  // Seleciona elementos
  const toggleBtn = document.getElementById("accessibilityToggle");
  const menu = document.getElementById("accessibilityMenu");

  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("show");
  });

  // Eventos de clique nas opções
  menu.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter);
      menu.classList.remove("show");
    });
  });

  // Fecha o menu se clicar fora
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".accessibility-container")) {
      menu.classList.remove("show");
    }
  });
});
