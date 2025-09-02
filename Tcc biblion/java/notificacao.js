document.addEventListener("DOMContentLoaded", () => {
    const salvarBtn = document.querySelector(".btn-save");
  
    const emailCheckbox = document.getElementById("emailNotifications");
    const smsCheckbox = document.getElementById("smsNotifications");
    const reminderDaysInput = document.getElementById("reminderDays");
    const atrasoCheckbox = document.getElementById("overdueNotification");
    const reservaCheckbox = document.getElementById("reservationNotification");
  
    async function carregarNotificacoes() {
      try {
        const res = await fetch("http://localhost:3000/notificacoes");
        const data = await res.json();
  
        if (!data) return;
  
        emailCheckbox.checked = !!data.email;
        smsCheckbox.checked = !!data.sms;
        reminderDaysInput.value = data.dias_antecedencia || 1;
        atrasoCheckbox.checked = !!data.atraso;
        reservaCheckbox.checked = !!data.reserva;
      } catch (e) {
        console.error("Erro ao carregar notificações:", e);
      }
    }
  
    async function salvarNotificacoes() {
      const notificacoes = {
        email: emailCheckbox.checked ? 1 : 0,
        sms: smsCheckbox.checked ? 1 : 0,
        dias_antecedencia: reminderDaysInput.value,
        atraso: atrasoCheckbox.checked ? 1 : 0,
        reserva: reservaCheckbox.checked ? 1 : 0
      };
  
      try {
        const res = await fetch("http://localhost:3000/notificacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificacoes)
        });
        const result = await res.json();
        alert("✅ " + result.mensagem);
      } catch (e) {
        console.error("Erro ao salvar notificações:", e);
      }
    }
  
    if (salvarBtn) salvarBtn.addEventListener("click", salvarNotificacoes);
    carregarNotificacoes();
  });
  