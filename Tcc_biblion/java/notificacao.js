document.addEventListener("DOMContentLoaded", () => {
  const salvarBtn = document.querySelector(".btn-save");
  const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionarioLogado) return console.error("Nenhum funcionário logado.");

  const instituicaoId = funcionarioLogado.FK_instituicao_id;

  async function carregarNotificacoes() {
    try {
      const res = await fetch(`http://localhost:3000/configuracoes-notificacao/${instituicaoId}`);
      const config = await res.json();

      const email = document.getElementById("emailNotifications");
      const sms = document.getElementById("smsNotifications");
      const dias = document.getElementById("reminderDays"); // corrigido
      const atraso = document.getElementById("overdueNotification"); // corrigido
      const reserva = document.getElementById("reservationNotification"); // corrigido

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
      return alert("⚠️ Não encontrei os campos de notificação no HTML.");
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
          ? `http://localhost:3000/configuracoes-notificacao/${id}`
          : "http://localhost:3000/configuracoes-notificacao",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados)
        }
      );

      const resultado = await resposta.json();
      alert(resultado.mensagem || "✅ Notificações salvas!");
      carregarNotificacoes();
    } catch (erro) {
      console.error("Erro ao salvar notificações:", erro);
      alert("❌ Não foi possível salvar as notificações.");
    }
  }

  carregarNotificacoes();
  if (salvarBtn) salvarBtn.addEventListener("click", salvarNotificacoes);
});
