// ========================== API BASE ==========================
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com";
}

// ========================== BACKUP MANUAL ==========================
btnBackupManual.addEventListener("click", () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Você precisa estar logado para fazer backup!");

  // Abre em nova aba com token na query
  window.open(`${apiBase()}/backup?token=${token}`, "_blank");
});

// ========================== RESTAURAR BACKUP ==========================
const btnRestaurar = document.getElementById("btnRestaurar");

if (btnRestaurar) {
  btnRestaurar.addEventListener("click", async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.click();

    input.onchange = async () => {
      const arquivo = input.files[0];
      if (!arquivo) return;

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${apiBase()}/backup/restaurar`, {
          method: "POST",
          headers: { "Authorization": "Bearer " + token },
          body: formData
        });

        const data = await res.json();
        alert(data.message || data.error || "Resposta inesperada.");
      } catch (err) {
        console.error(err);
        alert("Erro ao restaurar backup.");
      }
    };
  });
}


// ========================== HISTÓRICO DE BACKUPS ==========================
const btnListar = document.getElementById("btnListar");
const tabela = document.querySelector(".history-section table tbody");

async function carregarHistorico() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${apiBase()}/backup/historico`, {
      headers: { "Authorization": "Bearer " + token }
    });

    // Converte a resposta em JSON
    const backups = await res.json();

    console.log("Backups recebidos:", backups); // ✅ Agora a variável existe

    tabela.innerHTML = backups.map(b => `
      <tr>
        <td>${new Date(b.data_criacao).toLocaleString()}</td>
        <td>${b.tipo}</td>
     <td>${b.tamanho ? b.tamanho : '--'}</td>


        <td>
          <span class="badge bg-${b.status === "concluido" ? "success" : "danger"}">
            ${b.status}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-preto w-20" onclick="baixarBackup('${b.caminho_arquivo}')">
            <i class="bi bi-save" style="font-size: 20px;"></i>
          </button>
        </td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Erro ao carregar histórico de backups:", err);
  

  }
}
// ========================== CONFIGURAÇÃO DE BACKUP AUTOMÁTICO ==========================
const btnSalvarConfig = document.getElementById("btnSalvarConfig");
const horaBackup = document.getElementById("horaBackup");
const diasRetencao = document.getElementById("diasRetencao");
const compressaoAtiva = document.getElementById("compressaoAtiva");
const retencaoLabel = document.getElementById("retencaoLabel");
const statusBackup = document.getElementById("statusBackup");
const ultimoBackup = document.getElementById("ultimoBackup");

// Atualiza o texto do rótulo de retenção
if (diasRetencao && retencaoLabel) {
  diasRetencao.addEventListener("input", () => {
    retencaoLabel.textContent = `${diasRetencao.value} dias`;
  });
}

// ========================== SALVAR CONFIGURAÇÃO ==========================
if (btnSalvarConfig) {
  btnSalvarConfig.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Você precisa estar logado!");

    const hora = horaBackup.value;
    const dias_retencao = diasRetencao.value;
    const compressao = compressaoAtiva.checked;

    try {
      const res = await fetch(`${apiBase()}/backup/configurar`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ hora, dias_retencao, compressao })
      });

      const data = await res.json();
      alert(data.message || data.error || "Erro desconhecido ao salvar configuração.");
      await carregarConfigBackup(); // recarrega informações
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
      alert("Erro ao salvar configuração de backup automático.");
    }
  });
}

// ========================== CARREGAR CONFIGURAÇÃO E STATUS ==========================
async function carregarConfigBackup() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${apiBase()}/backup/configurar`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();
    console.log("📦 Configuração recebida:", data);

    // Configuração
    if (data.configuracao) {
      const cfg = data.configuracao;
      horaBackup.value = cfg.hora || "02:00";
      diasRetencao.value = cfg.dias_retencao || 30;
      compressaoAtiva.checked = !!cfg.compressao;
      retencaoLabel.textContent = `${diasRetencao.value} dias`;
    }

    // Status do backup diário
    if (data.configuracao?.hora) {
      statusBackup.className = "alert alert-success mt-3";
      statusBackup.innerHTML = `<i class="bi bi-check-circle"></i> Backup diário ativo às <b>${data.configuracao.hora}</b>`;
    } else {
      statusBackup.className = "alert alert-warning mt-3";
      statusBackup.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Backup diário inativo`;
    }

    // Último backup
    if (data.ultimo_backup) {
      const dt = new Date(data.ultimo_backup.data_criacao).toLocaleString("pt-BR");
      const tipo = data.ultimo_backup.tipo;
      const status = data.ultimo_backup.status;
      const icone = status === "concluido" ? "bi-check-circle text-success" : "bi-x-circle text-danger";
      ultimoBackup.innerHTML = `
        <i class="bi ${icone}"></i> Último backup (${tipo}) em <b>${dt}</b> — Status: <b>${status}</b>
      `;
    } else {
      ultimoBackup.innerHTML = `<i class="bi bi-clock-history"></i> Nenhum backup registrado ainda.`;
    }

  } catch (err) {
    console.error("Erro ao carregar configuração:", err);
    statusBackup.className = "alert alert-danger mt-3";
    statusBackup.innerHTML = `<i class="bi bi-x-circle"></i> Erro ao carregar informações de backup.`;
  }
}

document.addEventListener("DOMContentLoaded", carregarConfigBackup);

// Função global para baixar backups do histórico
window.baixarBackup = (arquivo) => {
  window.open(`${apiBase()}/backups/${arquivo}`, "_blank");
};

if (btnListar) btnListar.addEventListener("click", carregarHistorico);
document.addEventListener("DOMContentLoaded", carregarHistorico);
