function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

document.addEventListener("DOMContentLoaded", () => {
  const salvarBtn = document.querySelector(".btn-save");
  const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionarioLogado) return console.error("Nenhum funcionário logado.");
  const instituicaoId = funcionarioLogado.FK_instituicao_id;
  // ---------------- CARREGAR CONFIGURAÇÕES ----------------
  async function carregarTipoUsuario() {
    try {
  const res = await fetch(`${apiBase()}/configuracoes-tipo-usuario/${instituicaoId}`);

      const configs = await res.json();

      const blocos = document.querySelectorAll(".user-role"); // todos os blocos: Aluno, Professor, Funcionários

      configs.forEach(cfg => {
        const index = cfg.FK_tipo_usuario_id - 1; // 1=aluno, 2=professor, 3=funcionários
        const bloco = blocos[index];
        if (!bloco) return;

        const inputs = bloco.querySelectorAll("input[type=number]");
        const checks = bloco.querySelectorAll("input[type=checkbox]");

        if (inputs.length >= 2) {
          inputs[0].value = cfg.maximo_emprestimos || 0;
          inputs[1].value = cfg.duracao_emprestimo || 0;
        }
        if (checks.length >= 2) {
          checks[0].checked = cfg.pode_reservar === 1;
          checks[1].checked = cfg.pode_renovar === 1;
        }

        bloco.dataset.id = cfg.id;
      });
    } catch (err) {
      console.error("Erro ao carregar tipo usuário:", err);
    }
  }
  console.log(localStorage.getItem("funcionario"));
  // ---------------- SALVAR CONFIGURAÇÕES ----------------
  async function salvarTipoUsuario() {
    const blocos = document.querySelectorAll(".user-role"); // todos os blocos
    const tipos = [1, 2, 3]; // mapeia: 1=Aluno, 2=Professor, 3=Funcionários

    for (let idx = 0; idx < blocos.length; idx++) {
      const el = blocos[idx];
      const inputs = el.querySelectorAll("input[type=number]");
      const checks = el.querySelectorAll("input[type=checkbox]");

      const dados = {
        FK_tipo_usuario_id: tipos[idx],
        maximo_emprestimos: parseInt(inputs[0]?.value) || 0,
        duracao_emprestimo: parseInt(inputs[1]?.value) || 0,
        pode_reservar: checks[0]?.checked ? 1 : 0,
        pode_renovar: checks[1]?.checked ? 1 : 0,
        FK_instituicao_id: instituicaoId
      };

      const id = el.dataset.id;

      try {
        const resposta = await fetch(
        id
  ? `${apiBase()}/configuracoes-tipo-usuario/${id}`
  : `${apiBase()}/configuracoes-tipo-usuario`,

          {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
          }
        );

        const resultado = await resposta.json();
        console.log("🔹", resultado.mensagem);
      } catch (erro) {
        console.error("Erro ao salvar tipo usuário:", erro);
      }
    }

    alert("✅ Configurações de tipos de usuário salvas!");
    carregarTipoUsuario();
  }

  // ---------------- INICIALIZA ----------------
  carregarTipoUsuario();
  if (salvarBtn) salvarBtn.addEventListener("click", salvarTipoUsuario);
});
