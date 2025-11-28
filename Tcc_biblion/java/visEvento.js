document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("eventosContainer") || document.body;
    const token = localStorage.getItem("token");
  
    try {
      const resp = await fetch("http://localhost:3000/eventos", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
  
      if (!resp.ok) throw new Error("Erro ao carregar eventos.");
  
      const eventos = await resp.json();
  
      // Remove placeholders antigos, se existirem
      document.querySelectorAll(".evento-detalhe").forEach(e => e.remove());
  
      if (eventos.length === 0) {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhum evento disponível no momento.";
        aviso.classList.add("text-center", "mt-5");
        container.appendChild(aviso);
        return;
      }
  
      // Renderiza os eventos
      eventos.forEach(evento => {
        const section = document.createElement("section");
        section.className = "page-section text-black mb-0 evento-detalhe";
  
        section.innerHTML = `
          <div class="evento-card">
            <img src="http://localhost:3000/uploads/${evento.foto || 'padrao.jpg'}" alt="Imagem do evento">
          </div>
  
          <div class="evento-texto">
            <h2><strong class="titulo">${evento.titulo}</strong></h2>
            <p><strong>Data:</strong> ${new Date(evento.data_evento).toLocaleDateString('pt-BR')} 
               ${evento.hora_evento ? ` - ${evento.hora_evento.slice(0,5)}` : ""}</p>
            <p><strong>Descrição:</strong> ${evento.descricao || "Sem descrição"}</p>
            <p><strong>Organizador:</strong> Equipe BibliONtec</p>
          </div>
        `;
  
        container.appendChild(section);
        container.appendChild(document.createElement("br"));
      });
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      const erroMsg = document.createElement("p");
      erroMsg.textContent = "Erro ao carregar eventos.";
      erroMsg.style.color = "red";
      erroMsg.classList.add("text-center", "mt-5");
      container.appendChild(erroMsg);
    }
  });