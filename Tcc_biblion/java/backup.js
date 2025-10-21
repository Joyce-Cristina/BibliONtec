// ======== BACKUP MANUAL OU DIÁRIO ========
const btnBackup = document.getElementById("btnBackup");
const selectTipo = document.getElementById("tipoBackup"); // select do seu design

if (btnBackup && selectTipo) {
  btnBackup.addEventListener("click", async () => {
    const tipo = selectTipo.value; // "manual" ou "diario"
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Você precisa estar logado para fazer backup.");
      return;
    }

    try {
      const response = await fetch(`${apiBase()}/backup`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ tipo })
      });

      if (tipo === "manual") {
        // Se for manual, o servidor vai mandar um arquivo ZIP
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "backup_bibliontec.zip";
        a.click();
        window.URL.revokeObjectURL(url);
        alert("✅ Backup baixado com sucesso!");
      } else {
        const data = await response.json();
        alert(data.message || "Backup diário configurado!");
      }
    } catch (error) {
      console.error("Erro ao solicitar backup:", error);
      alert("Erro ao gerar backup.");
    }
  });
}
