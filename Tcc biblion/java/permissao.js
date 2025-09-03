document.addEventListener("DOMContentLoaded", () => {
  const salvarBtn = document.querySelector(".btn-save");

  const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
  const funcionarioId = funcionarioLogado ? funcionarioLogado.id : null;

  if (!funcionarioId) {
    console.error("Nenhum funcionário logado encontrado no localStorage.");
    return;
  }

  async function carregarPermissoes() {
    try {
      const res = await fetch(`http://localhost:3000/permissoes/${funcionarioId}`);
      const data = await res.json();

      if (!data || data.length === 0) return;

      // Marca os checkboxes que o funcionário já possui
      data.forEach(p => {
        const input = document.querySelector(`#permissoes input[data-id="${p.FK_permissao_id}"]`);
        if (input) input.checked = true;
      });
    } catch (e) {
      console.error("Erro ao carregar permissões:", e);
    }
  }

  async function salvarPermissoes() {
    const checks = document.querySelectorAll("#permissoes input[type=checkbox]");
    const selecionadas = [];

    checks.forEach(ch => {
      if (ch.checked) {
        selecionadas.push(parseInt(ch.dataset.id)); // só ID
      }
    });

    try {
      const resposta = await fetch(`http://localhost:3000/permissoes/${funcionarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissoes: selecionadas }),
      });

      const result = await resposta.json();
      console.log(result.message);
      alert("✅ Permissões salvas com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar permissões:", e);
      alert("❌ Erro ao salvar permissões!");
    }
  }

  if (salvarBtn) salvarBtn.addEventListener("click", salvarPermissoes);
  carregarPermissoes();
});
