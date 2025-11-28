function apiBase() {
  return (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:3000"
    : "https://bibliontec.onrender.com";
}

// Mensagens temporárias na interface
function showTempMessage(msg, type = "info", timeout = 4000) {
  let el = document.getElementById("backupResult");
  if (!el) {
    el = document.createElement("div");
    el.id = "backupResult";
    const container = document.querySelector(".section-box") || document.body;
    container.prepend(el);
  }

  el.textContent = msg;
  el.className = `backup-msg backup-${type}`;

  // Remover DEPOIS do timeout
  if (timeout) {
    setTimeout(() => {
      if (el) el.remove();  // 🔥 remove o quadrado azul
    }, timeout);
  }
}

// =================
document.addEventListener("DOMContentLoaded", () => {
const btnBackupManual = document.getElementById("btnBackupManual");

if (btnBackupManual) {
    btnBackupManual.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Você precisa estar logado para fazer backup!");
            return;
        }

        showTempMessage("Iniciando download...", "info", 3000);

        // DOWNLOAD IMEDIATO (SEM fetch, SEM blob)
        const link = document.createElement("a");
        link.href = `${apiBase()}/backup?token=${token}`;
        link.download = `backup-${Date.now()}.zip`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}



  // === RESTAURAR BACKUP ===
  const btnRestaurar = document.getElementById("btnRestaurar");

  if (!btnRestaurar) {
    console.warn("btnRestaurar não encontrado no DOM");
  } else {

    btnRestaurar.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopImmediatePropagation();

      // Criar input controlado dinamicamente
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);

      input.addEventListener("change", async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (!input.files || !input.files[0]) {
          input.remove();
          return;
        }

        const file = input.files[0];
        showTempMessage("Enviando backup para restauração...", "info", 10000);

        try {
          const token = localStorage.getItem("token") || "";
          const fd = new FormData();
          fd.append("arquivo", file);

          btnRestaurar.disabled = true;

          const res = await fetch(`${apiBase()}/backup/restaurar`, {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + token
            },
            body: fd,
          });

          const rawText = await res.text();
          console.log("Resposta do servidor (restaurar):", rawText);

          try {
            const json = JSON.parse(rawText);
            if (res.ok) {
              alert(json.message || "Backup restaurado com sucesso!");
              showTempMessage("Restauração concluída.", "success");
            } else {
              alert(json.error || JSON.stringify(json));
              showTempMessage("Erro na restauração — veja console.", "error");
            }
          } catch {
            // Não era JSON
            if (res.ok) {
              alert(rawText || "Backup restaurado com sucesso!");
              showTempMessage("Restauração concluída.", "success");
            } else {
              alert(rawText || "Erro ao restaurar backup.");
              showTempMessage("Erro na restauração — veja console.", "error");
            }
          }

        } catch (err) {
          console.error("Erro ao enviar/restaurar backup:", err);
          alert("Erro de rede — veja console.");
          showTempMessage("Erro de rede ao restaurar.", "error");
        } finally {
          btnRestaurar.disabled = false;
          input.remove();
        }
      });

      input.click();
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

      if (!res.ok) {
        let txt = await res.text().catch(() => null);
        console.error("Erro ao carregar histórico:", txt || res.statusText);
        showTempMessage("Erro ao carregar histórico.", "error");
        return;
      }

      let backups;
      try {
        backups = await res.json();
      } catch (e) {
        console.error("Não foi possível parsear histórico (não JSON)", e);
        showTempMessage("Resposta inválida do servidor.", "error");
        return;
      }

      console.log("📜 Backups recebidos:", backups);

      if (tabela) {
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
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de backups:", err);
      showTempMessage("Erro ao carregar histórico.", "error");
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

  if (diasRetencao && retencaoLabel) {
    diasRetencao.addEventListener("input", () => {
      retencaoLabel.textContent = `${diasRetencao.value} dias`;
    });
  }

  if (btnSalvarConfig) {
    btnSalvarConfig.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      if (!token) return alert("Você precisa estar logado!");

      const hora = horaBackup.value;
      const dias_retencao = diasRetencao.value;
      const compressao = compressaoAtiva.checked;

      try {
        btnSalvarConfig.disabled = true;
        const res = await fetch(`${apiBase()}/backup/configurar`, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ hora, dias_retencao, compressao })
        });

        let data;
        try {
          data = await res.json();
        } catch (e) {
          const txt = await res.text().catch(() => null);
          console.error("Resposta inválida ao salvar config:", txt);
          alert("Erro ao salvar configuração.");
          return;
        }

        alert(data.message || data.error || "Configuração processada.");
        await carregarConfigBackup();
      } catch (err) {
        console.error("Erro ao salvar configuração:", err);
        alert("Erro ao salvar configuração de backup automático.");
      } finally {
        btnSalvarConfig.disabled = false;
      }
    });
  }

  async function carregarConfigBackup() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${apiBase()}/backup/configurar`, {
        headers: { "Authorization": "Bearer " + token }
      });

      if (!res.ok) {
        let txt = await res.text().catch(() => null);
        console.error("Erro ao carregar config:", txt || res.statusText);
        statusBackup.className = "alert alert-danger mt-3";
        statusBackup.innerHTML = `<i class="bi bi-x-circle"></i> Erro ao carregar informações de backup.`;
        return;
      }

      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Resposta não-JSON:", e);
        statusBackup.className = "alert alert-danger mt-3";
        statusBackup.innerHTML = `<i class="bi bi-x-circle"></i> Resposta inválida ao carregar configuração.`;
        return;
      }

      console.log("📦 Configuração recebida:", data);

      if (data.configuracao) {
        const cfg = data.configuracao;
        horaBackup.value = cfg.hora || "02:00";
        diasRetencao.value = cfg.dias_retencao || 30;
        compressaoAtiva.checked = !!cfg.compressao;
        retencaoLabel.textContent = `${diasRetencao.value} dias`;
      }

      if (data.configuracao?.hora) {
        statusBackup.className = "alert alert-success mt-3";
        statusBackup.innerHTML = `<i class="bi bi-check-circle"></i> Backup diário ativo às <b>${data.configuracao.hora}</b>`;
      } else {
        statusBackup.className = "alert alert-warning mt-3";
        statusBackup.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Backup diário inativo`;
      }

      if (data.ultimo_backup) {
        const dt = new Date(data.ultimo_backup.data_criacao).toLocaleString("pt-BR");
        const tipo = data.ultimo_backup.tipo;
        const status = data.ultimo_backup.status;
        const icone = status === "concluido" ? "bi-check-circle text-success" : "bi-x-circle text-danger";
        ultimoBackup.innerHTML = `<i class="bi ${icone}"></i> Último backup (${tipo}) em <b>${dt}</b> — Status: <b>${status}</b>`;
      } else {
        ultimoBackup.innerHTML = `<i class="bi bi-clock-history"></i> Nenhum backup registrado ainda.`;
      }

    } catch (err) {
      console.error("Erro ao carregar configuração:", err);
      statusBackup.className = "alert alert-danger mt-3";
      statusBackup.innerHTML = `<i class="bi bi-x-circle"></i> Erro ao carregar informações de backup.`;
    }
  }

  // ========================== Inicializações ==========================
  window.baixarBackup = (arquivo) => {
    if (!arquivo) return alert("Arquivo inválido");
    window.open(`${apiBase()}/backups/${arquivo}`, "_blank");
  };

  if (btnListar) btnListar.addEventListener("click", carregarHistorico);
  carregarConfigBackup();
  carregarHistorico();
});
