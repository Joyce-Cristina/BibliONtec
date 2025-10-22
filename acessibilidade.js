// ===============================
// ACESSIBILIDADE - Filtros de Daltonismo + Modo Escuro
// Mantém header e botões fixos
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  
  // HTML do botão e menu
  const accessibilityHTML = `
    <div class="accessibility-container">
      <button class="accessibility-btn" id="accessibilityToggle" title="Opções de acessibilidade">
        <i class="bi bi-universal-access"></i>
      </button>

      <div class="accessibility-menu" id="accessibilityMenu">
        <button data-filter="none">Padrão</button>
        <button data-filter="protanopia">Protanopia</button>
        <button data-filter="deuteranopia">Deuteranopia</button>
        <button data-filter="tritanopia">Tritanopia</button>
        <button data-filter="modo-escuro">Baixo Contraste</button>
      </div>
    </div>

    <div id="accessibilityOverlay"></div>
  `;

  // Inserir no body
  document.body.insertAdjacentHTML("beforeend", accessibilityHTML);

  // Seletores
  const toggleBtn = document.getElementById("accessibilityToggle");
  const menu = document.getElementById("accessibilityMenu");
  const overlay = document.getElementById("accessibilityOverlay");

  // CSS dinâmico
  const style = document.createElement("style");
  style.textContent = `
    /* Container e botão */
    .accessibility-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10001;
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

    /* Menu */
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
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .accessibility-menu.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .accessibility-menu button {
      display: block;
      width: 160px;
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

    /* Overlay que aplica filtro sem quebrar layout */
    #accessibilityOverlay {
      position: fixed;
      inset: 0;
      z-index: 9998;
      pointer-events: none;
      backdrop-filter: none;
      transition: backdrop-filter 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Mostrar/ocultar menu
  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("show");
  });

  // Aplicar filtro
  function applyFilter(filter) {
    switch(filter) {
      case 'protanopia':
        overlay.style.backdropFilter = 'saturate(0.6) hue-rotate(-25deg)';
        break;
      case 'deuteranopia':
        overlay.style.backdropFilter = 'saturate(0.6) hue-rotate(25deg)';
        break;
      case 'tritanopia':
        overlay.style.backdropFilter = 'saturate(0.7) hue-rotate(170deg)';
        break;
      case 'modo-escuro':
        overlay.style.backdropFilter = 'brightness(0.6) contrast(120%)';
        break;
      default:
        overlay.style.backdropFilter = 'none';
    }
    localStorage.setItem('accessibilityFilter', filter);
  }

  // Recuperar filtro salvo
  const savedFilter = localStorage.getItem('accessibilityFilter');
  if (savedFilter) applyFilter(savedFilter);

  // Clique nos botões do menu
  menu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      applyFilter(btn.dataset.filter);
      menu.classList.remove("show");
    });
  });

  // Fecha menu ao clicar fora
  document.addEventListener("click", e => {
    if (!e.target.closest(".accessibility-container")) {
      menu.classList.remove("show");
    }
  });

});
