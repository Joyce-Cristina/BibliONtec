function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

document.addEventListener("DOMContentLoaded", () => {
  const salvarBtn = document.querySelector(".btn-save");
  const inputsPrazos = document.querySelectorAll("#prazos .form-control");

  const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionarioLogado) {
    console.error("Nenhum funcionário logado.");
    return;
  }

  const instituicaoId = funcionarioLogado.FK_instituicao_id;

  async function carregarConfiguracoesGerais() {
    try {
    const resposta = await fetch(`${apiBase()}/configuracoes-gerais/${instituicaoId}`);

      if (!resposta.ok) throw new Error("Erro ao carregar configurações gerais");
      const config = await resposta.json();

      if (config) {
        inputsPrazos[0].value = config.duracao_padrao_emprestimo || 0;
        inputsPrazos[1].value = config.numero_maximo_renovacoes || 0;
        inputsPrazos[2].value = config.tempo_retirada_reserva || 0;
        inputsPrazos[3].value = config.numero_maximo_emprestimos || 0;
        inputsPrazos[4].value = config.multa_por_atraso || 0;
      }
    } catch (erro) {
      console.error("Erro ao carregar configurações:", erro);
    }
  }

  async function salvarConfiguracoesGerais() {
    const dados = {
      duracao_padrao_emprestimo: parseInt(inputsPrazos[0].value) || 0,
      numero_maximo_renovacoes: parseInt(inputsPrazos[1].value) || 0,
      tempo_retirada_reserva: parseInt(inputsPrazos[2].value) || 0,
      numero_maximo_emprestimos: parseInt(inputsPrazos[3].value) || 0,
      multa_por_atraso: parseFloat(inputsPrazos[4].value) || 0,
      FK_instituicao_id: instituicaoId
    };

    try {
     const resposta = await fetch(`${apiBase()}/configuracoes-gerais`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();
      alert(resultado.mensagem || "Configurações salvas com sucesso!");
      carregarConfiguracoesGerais();
    } catch (erro) {
      console.error("Erro ao salvar configurações:", erro);
      alert("Não foi possível salvar as configurações.");
    }
  }

  if (salvarBtn) salvarBtn.addEventListener("click", salvarConfiguracoesGerais);
  carregarConfiguracoesGerais();
});
