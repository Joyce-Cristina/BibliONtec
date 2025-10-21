const apiBase = () => "http://localhost:3000"; // ajuste se necessário

// ===== BACKUP MANUAL =====
const btnBackupManual = document.getElementById("btnBackupManual");
if (btnBackupManual) {
  btnBackupManual.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Você precisa estar logado para fazer backup!");

    try {
      const res = await fetch(`${apiBase()}/backup`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tipo: "manual" })
      });

      if (!res.ok) throw new Error("Erro ao gerar backup");
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "backup_bibliontec.zip";
      a.click();
      window.URL.revokeObjectURL(url);

      alert("✅ Backup manual concluído!");
      carregarHistorico();
    } catch (err) {
      console.error(err);
      alert("❌ Falha ao fazer backup.");
    }
  });
}

// ===== RESTAURAR BACKUP =====
const btnRestaurar = document.getElementById("btnRestaurar");
if (btnRestaurar) {
  btnRestaurar.addEventListener("click", async () => {
    const arquivo = prompt("Digite o nome do arquivo de backup (ex: backup_1734656298123.zip):");
    if (!arquivo) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase()}/backup/restaurar`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ arquivo })
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch (err) {
      alert("Erro ao restaurar backup.");
    }
  });
}

// ===== HISTÓRICO =====
const btnListar = document.getElementById("btnListar");
const tabela = document.querySelector(".history-section table tbody");

async function carregarHistorico() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${apiBase()}/backup/historico`, {
      headers: { "Authorization": "Bearer " + token }
    });
    const backups = await res.json();

    tabela.innerHTML = backups
      .map(b => `
        <tr>
          <td>${new Date(b.data_criacao).toLocaleString()}</td>
          <td>${b.tipo}</td>
          <td>--</td>
          <td><span class="badge bg-${b.status === "concluido" ? "success" : "danger"}">${b.status}</span></td>
          <td>
            <button class="btn btn-outline btn-preto w-20" onclick="baixarBackup('${b.caminho_arquivo}')">
              <i class="bi bi-save" style="font-size: 20px;"></i>
            </button>
          </td>
        </tr>
      `)
      .join("");
  } catch (err) {
    console.error(err);
  }
}

window.baixarBackup = (arquivo) => {
  window.location.href = `${apiBase()}/backups/${arquivo}`;
};

if (btnListar) btnListar.addEventListener("click", carregarHistorico);
document.addEventListener("DOMContentLoaded", carregarHistorico);
