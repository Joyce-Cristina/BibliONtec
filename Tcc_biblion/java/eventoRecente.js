// ===================== EVENTO MAIS RECENTE (Homepage) =====================
document.addEventListener("DOMContentLoaded", async () => {
    const eventoSection = document.querySelector(".evento-detalhe");
    const token = localStorage.getItem("token");
  
    if (!eventoSection) return;
  
    try {
      const resp = await fetch("http://localhost:3000/eventos/recente", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
  
      if (!resp.ok) throw new Error("Erro ao buscar evento mais recente.");
  
      const evento = await resp.json();
      if (!evento) {
        eventoSection.innerHTML = `
          <div class="evento-texto">
            <h2><strong>Nenhum evento disponível no momento.</strong></h2>
          </div>`;
        return;
      }
  
      // Função para limitar texto em ~5 linhas (aprox. 300 caracteres)
      const limitarDescricao = (texto) => {
        if (!texto) return "Sem descrição.";
        return texto.length > 300 ? texto.substring(0, 300) + "..." : texto;
      };
  
      eventoSection.innerHTML = `
        <div class="evento-card">
          <img src="http://localhost:3000/uploads/${evento.foto || 'padrao.jpg'}" 
               alt="Imagem do evento" 
               style="max-height: 350px; object-fit: cover;">
        </div>
  
        <div class="evento-texto">
          <h2><strong>${evento.titulo}</strong></h2>
          <p><strong>Data:</strong> ${new Date(evento.data_evento).toLocaleDateString('pt-BR')} 
             ${evento.hora_evento ? ` - ${evento.hora_evento.slice(0,5)}` : ""}</p>
          <p><strong>Patrocínio:</strong> ${evento.patrocinio || "Não informado"}</p>
          <p>${limitarDescricao(evento.descricao)}</p>
  
          <div class="text-center mt-4">
            <a href="./eventos.html" 
               class="btn btn-outline-dark" 
               style="font-weight:bold; background-color:#7A1600; color:#fff;">
              Veja todos os comunicados
            </a>
          </div>
        </div>
      `;
    } catch (err) {
      console.error("Erro ao carregar evento mais recente:", err);
      eventoSection.innerHTML = `
        <div class="evento-texto">
          <h2><strong>Erro ao carregar evento mais recente.</strong></h2>
        </div>`;
    }
  });
  