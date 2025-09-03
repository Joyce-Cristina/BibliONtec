document.addEventListener("DOMContentLoaded", () => {
  carregarNotificacoes();

  const btnSalvar = document.querySelector(".btn-save");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarNotificacoes);
  }
});

// Pega funcionário logado
const funcionario = JSON.parse(localStorage.getItem("funcionario"));
const funcionarioId = funcionario ? funcionario.id : null;

if (!funcionarioId) {
  console.error("Nenhum funcionário logado encontrado no localStorage.");
}

// Buscar notificações do funcionário
async function carregarNotificacoes() {
  try {
    const res = await fetch(`http://localhost:3000/notificacoes/${funcionarioId}`);
    const data = await res.json();
    if (!data || data.length === 0) return;

    document.getElementById("emailNotifications").checked =
      data.some(n => n.tipo === "email");
    document.getElementById("smsNotifications").checked =
      data.some(n => n.tipo === "sms");
    document.getElementById("overdueNotification").checked =
      data.some(n => n.tipo === "atraso");
    document.getElementById("reservationNotification").checked =
      data.some(n => n.tipo === "reserva");

    if (data[0].dias_antes_vencimento !== undefined) {
      document.getElementById("reminderDays").value = data[0].dias_antes_vencimento;
    }
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
  }
}

// Salvar preferências do funcionário
async function salvarNotificacoes() {
  try {
    const payload = { notificacoes: [] };

    if (document.getElementById("emailNotifications").checked)
      payload.notificacoes.push("email");
    if (document.getElementById("smsNotifications").checked)
      payload.notificacoes.push("sms");
    if (document.getElementById("overdueNotification").checked)
      payload.notificacoes.push("atraso");
    if (document.getElementById("reservationNotification").checked)
      payload.notificacoes.push("reserva");

    payload.dias_antes_vencimento =
      parseInt(document.getElementById("reminderDays").value) || 1;

    const res = await fetch(`http://localhost:3000/notificacoes/${funcionarioId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("✅ Notificações atualizadas com sucesso!");
    } else {
      alert("❌ Erro ao salvar notificações!");
    }
  } catch (error) {
    console.error("Erro ao salvar notificações:", error);
  }
}
