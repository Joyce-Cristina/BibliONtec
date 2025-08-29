document.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Carregar usuário logado ---
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    const usuarioId = usuarioData ? usuarioData.id : null;
    const usuarioNome = usuarioData ? usuarioData.nome : "Você";
    const usuarioFoto = usuarioData && usuarioData.foto 
      ? `http://localhost:3000/uploads/${usuarioData.foto}` 
      : "../img/avatar.jpg";
  
      // --- Carregar livro ---
      const livroId = localStorage.getItem("livroSelecionado");
      if (!livroId) throw new Error("Nenhum livro selecionado.");
  
      const respLivro = await fetch(`http://localhost:3000/livros/${livroId}`);
      if (!respLivro.ok) throw new Error("Erro ao buscar livro.");
  
      const livro = await respLivro.json();
      console.log("Livro carregado:", livro);
  
      // Atualizar HTML do livro
      document.querySelector(".livro-detalhe img").src = livro.capa
        ? `http://localhost:3000/uploads/${livro.capa}`
        : "https://via.placeholder.com/320x450";
      document.querySelector(".livro-info h4:nth-of-type(1) + p").textContent = livro.titulo || "Título não disponível";
      document.querySelector(".livro-info h4:nth-of-type(2) + p").textContent = livro.autores || "Autor não informado";
      document.querySelector(".livro-info h4:nth-of-type(3) + p").textContent = livro.sinopse || "Descrição não disponível";
  
      const disponibilidadeElem = document.querySelector(".livro-info .disponibilidade");
      if (livro.dias_faltando && livro.dias_faltando > 0) {
        disponibilidadeElem.textContent = `Indisponível - Faltam ${livro.dias_faltando} dias`;
        disponibilidadeElem.style.color = "red";
      } else {
        disponibilidadeElem.textContent = "Disponível";
        disponibilidadeElem.style.color = "green";
      }
  
      // --- Comentários ---
      const comentariosContainer = document.getElementById("comentariosContainer");
      const novoComentarioInput = document.getElementById("novoComentario");
      const btnEnviarComentario = document.getElementById("btnEnviarComentario");
  
      const renderComentarios = (comentarios) => {
        comentariosContainer.innerHTML = "";
        comentarios.forEach(c => {
          const div = document.createElement("div");
          div.classList.add("comentario");
          div.innerHTML = `
            <img src="${c.foto ? `http://localhost:3000/uploads/${c.foto}` : '../img/avatar.jpg'}" 
                 class="comentario-avatar">
            <div class="comentario-conteudo">
              <strong>${c.nome}</strong>
              <p>${c.comentario}</p>
              <small>${new Date(c.data_comentario).toLocaleDateString('pt-BR')}</small>
            </div>
          `;
          comentariosContainer.appendChild(div);
        });
      };
  
      // Buscar comentários
      const carregarComentarios = async () => {
        const respComentarios = await fetch(`http://localhost:3000/livros/${livroId}/comentarios`);
        if (!respComentarios.ok) throw new Error("Erro ao buscar comentários");
        const comentarios = await respComentarios.json();
        renderComentarios(comentarios);
      };
  
      await carregarComentarios();
  
      // Enviar comentário
      if (btnEnviarComentario) {
        btnEnviarComentario.addEventListener("click", async () => {
          if (!usuarioId) return alert("Você precisa estar logado para comentar.");
          const texto = novoComentarioInput.value.trim();
          if (!texto) return alert("Digite um comentário.");
  
          const resp = await fetch(`http://localhost:3000/livros/${livroId}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuarioId, comentario: texto })
          });
  
          if (!resp.ok) return alert("Erro ao enviar comentário.");
          novoComentarioInput.value = "";
          await carregarComentarios(); // Atualiza lista de comentários
        });
      }
  
    } catch (err) {
      console.error("Erro no visLivro.js:", err);
      alert("Erro ao carregar detalhes do livro.");
    }
  });
  