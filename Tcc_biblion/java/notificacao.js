function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com";
}

async function carregarNotificacoes() {
  const usuario = JSON.parse(localStorage.getItem("usuario")) || JSON.parse(localStorage.getItem("funcionario"));
  if (!usuario) return;

const tipo = localStorage.getItem("funcionario") ? "funcionario" : "usuario";


  try {
    const res = await fetch(`${apiBase()}/notificacoes/${tipo}/${usuario.id}`);
const todasNotificacoes = await res.json();
const notificacoes = todasNotificacoes.filter(n => !n.lida); // mostra só não lidas

    console.log("👤 Usuário carregado:", usuario, "Tipo detectado:", tipo);

    console.log("📬 Retorno da API:", notificacoes);

    const badge = document.getElementById("notificacaoBadge");
    const lista = document.getElementById("listaNotificacoes");
    const som = document.getElementById("somNotificacao");

    if (!lista) return;

    lista.innerHTML = "";
    if (notificacoes.length === 0) {
      if (badge) badge.style.display = "none";
      lista.innerHTML = "<li class='dropdown-item notification-empty'>Sem novas notificações</li>";
      return;
    }

    console.log("🔔 Chamando carregarNotificacoes()");
    if (badge) badge.style.display = "inline-block";

    notificacoes.slice(0, 8).forEach(n => {
      const li = document.createElement("li");
      li.className = "dropdown-item small";
      li.innerHTML = `<b>${n.tipo.toUpperCase()}</b>: ${n.mensagem} <br><small>${n.data_envio}</small>`;
      lista.appendChild(li);
    });

    if (!window.__notificacaoCount || notificacoes.length > window.__notificacaoCount) {
      if (som) som.play().catch(() => {});
    }
    window.__notificacaoCount = notificacoes.length;

    // ===============================
    // 🆕 CARDS DINÂMICOS
    // ===============================
    const entregaHojeDiv = document.getElementById("entregaHoje");
    const livrosAtrasoDiv = document.getElementById("livrosAtraso");

    if (entregaHojeDiv) entregaHojeDiv.innerHTML = "";
    if (livrosAtrasoDiv) livrosAtrasoDiv.innerHTML = "";

    notificacoes.forEach(n => {
      const div = document.createElement("div");
      div.className = "d-flex align-items-center mb-3 border rounded p-2 shadow-sm";
      div.style.backgroundColor = "#f8f8f8";
      div.innerHTML = `
        <img src="../img/logoquadrada.jpeg" alt="Livro" class="me-3"
            style="inline-size: 60px; block-size: auto; border-radius: 5px;" />
        <div><strong>${n.mensagem}</strong><br><small>${n.data_envio}</small></div>
      `;

      if (n.tipo === "atraso" && livrosAtrasoDiv) {
        livrosAtrasoDiv.appendChild(div);
      } else if (n.tipo === "lembrete" && entregaHojeDiv) {
        entregaHojeDiv.appendChild(div);
      }
    });

  } catch (err) {
    console.error("Erro ao carregar notificações:", err);
  }
  
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 DOM carregado, buscando notificações...");
  carregarNotificacoes();
  setInterval(carregarNotificacoes, 60000);

  document.querySelector(".dropdown-toggle")?.addEventListener("click", async () => {
    const usuario = JSON.parse(localStorage.getItem("usuario")) || JSON.parse(localStorage.getItem("funcionario"));
    if (!usuario) return;
    const tipo = localStorage.getItem("funcionario") ? "funcionario" : "usuario";

    try {
      await fetch(`${apiBase()}/notificacoes/marcarLidas/${tipo}/${usuario.id}`, { method: "PUT" });
      const badge = document.getElementById("notificacaoBadge");
      if (badge) badge.style.display = "none";

      // 🔁 Recarrega notificações para atualizar visualmente todas as páginas
      setTimeout(() => carregarNotificacoes(), 300);
    } catch (err) {
      console.error("Erro ao marcar notificações como lidas:", err);
    }
  });
});
