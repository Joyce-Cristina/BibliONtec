/**********************
  logs.js (substitua/cole no final)
**********************/

function apiBase() {
  return (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:3000"
    : "https://bibliontec.onrender.com";
}

// Variáveis
let paginaAtual = 1;
const limite = 30;
let totalLogs = 0;
let logsCache = [];
let filtroAtual = "Todos";

// -------------------- carregarLogs --------------------
async function carregarLogs(pagina = 1) {
  const lista = document.getElementById("logs-list");
  if (!lista) return;

  if (pagina === 1) lista.innerHTML = `<p class="text-center text-muted">Carregando logs...</p>`;

  const token = localStorage.getItem("token") || "";

  try {
    console.log(`[Logs] solicitando página ${pagina} ...`);
    const res = await fetch(`${apiBase()}/logs?page=${pagina}&limit=${limite}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 304) throw new Error("Erro ao buscar logs: " + res.status);

    // Mesmo 304, tentar ler JSON pode falhar; só processar se 200
    if (res.status === 304) {
      console.log("[Logs] 304 Not Modified - usando cache local se houver");
      // não substitui cache; renderiza com o que já tem
      renderizarLogs(filtroAtual);
      return;
    }

    const data = await res.json();
    totalLogs = data.total || 0;
    const logs = data.logs || [];

    const novos = logs.filter(l =>
      !logsCache.some(existing =>
        existing.data === l.data &&
        existing.titulo === l.titulo &&
        existing.mensagem === l.mensagem
      )
    );
    logsCache = logsCache.concat(novos);

    renderizarLogs(filtroAtual);

    const btnMaisAntigo = document.getElementById("btnMaisLogs");
    if (btnMaisAntigo) btnMaisAntigo.remove();

    if (pagina * limite < totalLogs) {
      const botao = document.createElement("button");
      botao.id = "btnMaisLogs";
      botao.className = "btn btn-outline-secondary d-block mx-auto mt-3";
      botao.textContent = "Carregar mais logs";
      botao.onclick = () => {
        paginaAtual++;
        carregarLogs(paginaAtual);
      };
      lista.appendChild(botao);
    }
  } catch (err) {
    console.error("Erro ao carregar logs:", err);
    const listaEl = document.getElementById("logs-list");
    if (listaEl) listaEl.innerHTML = `<p class="text-center text-danger">Erro ao carregar logs.</p>`;
  }
}

// -------------------- renderizarLogs --------------------
function renderizarLogs(filtro = "Todos") {
  const lista = document.getElementById("logs-list");
  if (!lista) return;

  lista.innerHTML = "";

  const logsFiltrados = logsCache.filter(log => {
    if (!log || !log.tipo) return filtro === "Todos";
    if (filtro === "Todos") return true;
    return log.tipo.toLowerCase() === filtro.toLowerCase();
  });

  if (logsFiltrados.length === 0) {
    lista.innerHTML = `<p class="text-center text-muted">Nenhum log encontrado para o filtro selecionado.</p>`;
    return;
  }

  logsFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

  const fragment = document.createDocumentFragment();

  logsFiltrados.forEach(log => {
    const dataFormatada = new Date(log.data)
      .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });

    const card = document.createElement("div");
    card.className = "log-card mb-3 shadow-sm rounded p-2 border";

    let tipoLower = (log.tipo || "").toLowerCase();
    let icone = "bi-check-circle text-success";
    if (tipoLower === "erro") icone = "bi-x-circle text-danger";
    else if (tipoLower === "atenção" || tipoLower === "aviso") icone = "bi-exclamation-triangle text-warning";

    let badge = "bg-success";
    if (tipoLower === "erro") badge = "bg-danger";
    else if (tipoLower === "atenção" || tipoLower === "aviso") badge = "bg-warning text-dark";

    card.innerHTML = `
      <div class="d-flex align-items-center gap-2 mb-1">
        <i class="bi ${icone} fs-4"></i>
        <div>
          <strong>${escapeHtml(log.titulo || "Evento do sistema")}</strong>
          <span class="badge ${badge}">${escapeHtml(log.tipo || "Sucesso")}</span>
        </div>
      </div>
      <p class="mb-1">${escapeHtml(log.mensagem || "")}</p>
      <small class="text-muted">
        <i class="bi bi-clock"></i> ${dataFormatada} &nbsp;
        <i class="bi bi-person"></i> ${escapeHtml(log.usuario || "Sistema")}
      </small>
    `;
    fragment.appendChild(card);
  });

  lista.appendChild(fragment);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// -------------------- exportarLogsPDF --------------------
async function exportarLogsPDF() {
  const token = localStorage.getItem("token") || "";
  console.log("[Export] iniciando requisição de PDF para", `${apiBase()}/logs/export/pdf`);

  try {
    const res = await fetch(`${apiBase()}/logs/export/pdf`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf"
      }
    });

    console.log("[Export] status:", res.status, res.statusText);

    if (!res.ok) {
      // tenta ler texto de erro para log
      let text = "";
      try { text = await res.text(); } catch (e) { /* noop */ }
      throw new Error(`Erro ao gerar PDF: ${res.status} ${res.statusText} ${text}`);
    }

    const blob = await res.blob();

    // valida tamanho
    if (!blob || blob.size === 0) {
      throw new Error("PDF retornou vazio");
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logs_sistema.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    console.log("[Export] download iniciado com sucesso.");
  } catch (err) {
    console.error("[Export] falha:", err);
    alert("Erro ao exportar logs. Veja o console para mais detalhes.");
  }
}

// -------------------- Inicialização (única) --------------------
(function initLogsModule() {
  // Adiciona listener de filtro (se existir)
  const select = document.querySelector("#logs .status-select");
  if (select) {
    select.addEventListener("change", () => {
      filtroAtual = select.value || "Todos";
      renderizarLogs(filtroAtual);
    });
  }

  // Carrega logs (primeira página)
  carregarLogs(1);

  // ==== Event delegation: captura clique em qualquer momento, mesmo se o botão for gerado depois ====
  document.addEventListener("click", (ev) => {
    const target = ev.target;
    // procura botão com classe btn-save na árvore de ancestrais
    const botao = target.closest && target.closest(".btn-save");
    if (botao) {
      // evita clique se o botão estiver desabilitado
      if (botao.disabled) {
        console.log("[Delegation] botão export desabilitado.");
        return;
      }
      console.log("[Delegation] botão Exportar clicado (delegation).");
      exportarLogsPDF();
    }
  });


})();
