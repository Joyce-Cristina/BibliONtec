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

    if (res.status === 304) {
      console.log("[Logs] 304 Not Modified - usando cache local se houver");
      renderizarLogs(filtroAtual);
      return;
    }

    const data = await res.json();
    totalLogs = data.total || 0;
    const logs = data.logs || [];

    // normalizar timestamps (alguns logs antigos podem ter 'data' em vez de 'timestamp')
    const normalizados = logs.map(l => {
      // garantir que exista timestamp
      if (!l.timestamp && l.data) l.timestamp = l.data;

      // NORMALIZAR tipo para valores padronizados: 'erro', 'aviso', 'info'
      const tl = (l.tipo || "").toString().toLowerCase().trim();

      // mapa com possíveis variações (pt/en/minúsculas)
      const tipoMap = {
        "error": "erro",
        "erro": "erro",
        "err": "erro",
        "e": "erro",

        "warn": "aviso",
        "warning": "aviso",
        "aviso": "aviso",
        "atenção": "aviso",
        "atencao": "aviso",

        "info": "info",
        "sucesso": "info",
        "success": "info",
        "ok": "info"
      };

      l.tipo = tipoMap[tl] || (tl === "" ? "info" : tipoMap[tl] || tl);

      return l;
    });

    // dedupe por timestamp + título + mensagem
    const novos = normalizados.filter(l => {
      // se não tiver timestamp, considera novo
      if (!l.timestamp) return true;
      return !logsCache.some(existing =>
        existing.timestamp === l.timestamp &&
        existing.titulo === l.titulo &&
        existing.mensagem === l.mensagem
      );
    });

    if (novos.length) {
      console.log(`[Logs] adicionando ${novos.length} novos logs ao cache.`);
      logsCache = logsCache.concat(novos);
    } else {
      console.log("[Logs] nenhum novo log encontrado nesta página.");
    }

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

// ======= Função para impedir XSS e caracteres quebrados =======
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// -------------------- renderizarLogs --------------------
function renderizarLogs(filtro = "Todos") {
  const lista = document.getElementById("logs-list");
  if (!lista) return;

  lista.innerHTML = "";

  // mapa do select (texto exibido) para tipo interno
  const mapaFiltro = {
    "todos": "todos",
    "sucesso": "info",
    "atenção": "aviso",
    "atencao": "aviso",
    "aviso": "aviso",
    "erro": "erro"
  };

  const filtroNormalizado = mapaFiltro[(filtro || "todos").toString().toLowerCase()] || "todos";

  const logsFiltrados = logsCache.filter(log => {
    if (!log || !log.tipo) return filtroNormalizado === "todos";
    if (filtroNormalizado === "todos") return true;
    return log.tipo.toLowerCase() === filtroNormalizado;
  });

  if (logsFiltrados.length === 0) {
    lista.innerHTML = `<p class="text-center text-muted">Nenhum log encontrado para o filtro selecionado.</p>`;
    return;
  }

  logsFiltrados.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const fragment = document.createDocumentFragment();

  logsFiltrados.forEach(log => {
    const dataFormatada = new Date(log.timestamp)
      .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });

    const card = document.createElement("div");
    card.className = "log-card mb-3 shadow-sm rounded p-2 border";

    let tipoLower = (log.tipo || "").toLowerCase();
    let icone = "";
    let badge = "";

    // SUCESSO
    if (tipoLower === "info") {
      icone = "bi-check-circle text-success";
      badge = "bg-success";
    }
    // AVISO
    else if (tipoLower === "aviso") {
      icone = "bi-exclamation-triangle text-warning";
      badge = "bg-warning text-dark";
    }
    // ERRO
    else if (tipoLower === "erro") {
      icone = "bi-x-circle text-danger";
      badge = "bg-danger";
    }
    // fallback (caso venha algo estranho)
    else {
      icone = "bi-question-circle text-secondary";
      badge = "bg-secondary";
    }

    card.innerHTML = `
      <div class="d-flex align-items-center gap-2 mb-1">
        <i class="bi ${icone} fs-4"></i>
        <div>
          <strong>${escapeHtml(log.titulo || "Evento do sistema")}</strong>
          <span class="badge ${badge}">${escapeHtml(log.tipo || "info")}</span>
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
      // força normalização visual (ex: "Atenção" -> "atenção")
      renderizarLogs(filtroAtual);
    });
  }

  // Carrega logs (primeira página)
  paginaAtual = 1;
  logsCache = []; // limpa cache na inicialização para evitar dados antigos corrompidos
  carregarLogs(1);

  // Delegation: captura APENAS o botão de exportar logs
  document.addEventListener("click", (ev) => {
    const target = ev.target;
    const botaoExport = target.closest && target.closest("#btnExportLogs");

    // se não for o botão de exportar logs → IGNORA
    if (!botaoExport) return;

    console.log("[Delegation] BOTÃO DE EXPORTAÇÃO CLICADO (correto).");
    exportarLogsPDF();
  });
})();

