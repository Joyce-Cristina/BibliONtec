// ============================
// 🔧 Função base da API
// ============================
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

// ============================
// ⚙️ CONFIGURAÇÕES DE NOTIFICAÇÃO
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const salvarBtn = document.querySelector(".btn-save");
  const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionarioLogado) return console.warn("Nenhum funcionário logado.");

  const instituicaoId = funcionarioLogado.FK_instituicao_id;

  async function carregarConfiguracoes() {
    try {
      const res = await fetch(`${apiBase()}/configuracoes-notificacao/${instituicaoId}`);
      const config = await res.json();

      const email = document.getElementById("emailNotifications");
      const sms = document.getElementById("smsNotifications");
      const dias = document.getElementById("reminderDays");
      const atraso = document.getElementById("overdueNotification");
      const reserva = document.getElementById("reservationNotification");

      if (!email || !sms || !dias || !atraso || !reserva) {
        console.warn("⚠️ Campos de notificação não encontrados no HTML.");
        return;
      }

      if (config) {
        email.checked = config.lembrete_vencimento === 1;
        sms.checked = config.sms_notificacao === 1;
        dias.value = config.dias_antes_vencimento || 0;
        atraso.checked = config.notificacao_atraso === 1;
        reserva.checked = config.notificacao_reserva === 1;
        email.dataset.id = config.id;
      }
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  }

  async function salvarNotificacoes() {
    const email = document.getElementById("emailNotifications");
    const sms = document.getElementById("smsNotifications");
    const dias = document.getElementById("reminderDays");
    const atraso = document.getElementById("overdueNotification");
    const reserva = document.getElementById("reservationNotification");

    if (!email || !sms || !dias || !atraso || !reserva) {
      return alert("⚠️ Campos de configuração não encontrados no HTML.");
    }

    const dados = {
      lembrete_vencimento: email.checked ? 1 : 0,
      sms_notificacao: sms.checked ? 1 : 0,
      dias_antes_vencimento: parseInt(dias.value) || 0,
      notificacao_atraso: atraso.checked ? 1 : 0,
      notificacao_reserva: reserva.checked ? 1 : 0,
      notificacao_livro_disponivel: 1,
      FK_instituicao_id: instituicaoId
    };

    const id = email.dataset.id;

    try {
      const resposta = await fetch(
        id
          ? `${apiBase()}/configuracoes-notificacao/${id}`
          : `${apiBase()}/configuracoes-notificacao`,
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        }
      );

      const resultado = await resposta.json();
      alert(resultado.mensagem || "✅ Configurações de notificação salvas!");
      carregarConfiguracoes();
    } catch (erro) {
      console.error("Erro ao salvar notificações:", erro);
      alert("❌ Não foi possível salvar as notificações.");
    }
  }

  carregarConfiguracoes();
  if (salvarBtn) salvarBtn.addEventListener("click", salvarNotificacoes);
});
