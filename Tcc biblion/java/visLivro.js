document.addEventListener("DOMContentLoaded", async () => {
  try {
    // --- Carregar usuário logado ---
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    const usuarioId = usuarioData ? usuarioData.id : null;
    const usuarioNome = usuarioData ? usuarioData.nome : "Você";
    const usuarioFoto = usuarioData && usuarioData.foto 
      ? `http://localhost:3000/uploads/${usuarioData.foto}` 
      : "../img/avatar.jpg";
    const isProfessor = usuarioData && usuarioData.tipo_usuario_id == 2;

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

    // --- SISTEMA DE INDICAÇÃO - VERIFICAÇÃO INICIAL ---
    const btnIndicar = document.getElementById("btnIndicar");
    if (btnIndicar && isProfessor && usuarioId) {
      try {
        const respVerificacao = await fetch(`http://localhost:3000/verificar-indicacao/${usuarioId}/${livroId}`);
        
        if (respVerificacao.ok) {
          const data = await respVerificacao.json();
          if (data.indicado) {
            btnIndicar.style.display = "none";
            const btnDesindicar = document.getElementById("btnDesindicar");
            btnDesindicar.style.display = "inline-block";
          
            btnDesindicar.addEventListener("click", async () => {
              if (!confirm("Deseja realmente remover a indicação deste livro?")) return;
          
              try {
                const resp = await fetch(`http://localhost:3000/indicacoes/${usuarioId}/${livroId}`, {
                  method: "DELETE"
                });
          
                if (resp.ok) {
                  alert("Indicação removida com sucesso!");
                  btnDesindicar.style.display = "none";
                  btnIndicar.style.display = "inline-block";
                  btnIndicar.disabled = false;
                  btnIndicar.innerHTML = "Indicar";
                  btnIndicar.style.backgroundColor = "#7A1600";
                  btnIndicar.style.cursor = "pointer";
                } else {
                  const erro = await resp.text();
                  console.error("Erro ao remover indicação:", erro);
                  alert("Erro ao remover indicação.");
                }
              } catch (err) {
                console.error("Erro de conexão:", err);
                alert("Erro ao tentar remover indicação.");
              }
            });
          }
        } else if (respVerificacao.status === 500) {
          console.warn("Servidor retornou erro 500 na verificação de indicação");
        }
      } catch (err) {
        console.error("Erro ao verificar indicação:", err);
      }
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

    const carregarComentarios = async () => {
      const respComentarios = await fetch(`http://localhost:3000/livros/${livroId}/comentarios`);
      if (!respComentarios.ok) throw new Error("Erro ao buscar comentários");
      const comentarios = await respComentarios.json();
      renderComentarios(comentarios);
    };

    await carregarComentarios();

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
        await carregarComentarios();
      });
    }

    // --- SISTEMA DE INDICAÇÃO COM MODAL (MULTI TURMAS) ---
    const modalTurma = new bootstrap.Modal(document.getElementById('modalTurma'));
    let turmasGlobais = [];

    if (btnIndicar && isProfessor) {
      btnIndicar.addEventListener("click", async () => {
        if (!usuarioId) return alert("Você precisa estar logado para indicar um livro.");

        try {
          const respTurmas = await fetch('http://localhost:3000/turmas');
          if (!respTurmas.ok) throw new Error("Erro ao buscar turmas");

          const data = await respTurmas.json();

          turmasGlobais = data.turmas_agrupadas.map(turma => {
            const curso = data.cursos.find(c => c.id === turma.curso_id);
            return {
              curso_id: turma.curso_id,
              curso: curso ? curso.curso : "Curso desconhecido",
              serie: turma.serie
            };
          });

          if (!turmasGlobais.length) {
            alert("Nenhuma turma encontrada.");
            return;
          }

          preencherSelectTurmas(turmasGlobais);
          modalTurma.show();

        } catch (err) {
          console.error("Erro ao carregar turmas:", err);
          alert("Erro ao carregar turmas.");
        }
      });
    }

    function preencherSelectTurmas(turmas) {
      const select = document.getElementById('selectTurmas');
      select.innerHTML = "";

      turmas.forEach(t => {
        const option = document.createElement('option');
        option.value = `${t.curso_id}-${t.serie}`;
        option.textContent = `${t.curso} - ${t.serie}ª série`;
        select.appendChild(option);
      });
    }

    document.getElementById('btnConfirmarIndicacao').addEventListener('click', async () => {
      const select = document.getElementById('selectTurmas');
      const selecionadas = Array.from(select.selectedOptions).map(opt => opt.value);

      if (!selecionadas.length) {
        alert('Por favor, selecione pelo menos uma turma');
        return;
      }

      try {
        for (const item of selecionadas) {
          const [cursoId, serie] = item.split('-');

          await fetch("http://localhost:3000/indicacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              usuarioId,
              livroId,
              cursoId,
              serie
            })
          });
        }

        btnIndicar.innerHTML = "✓ Já Indicado";
        btnIndicar.disabled = true;
        btnIndicar.style.backgroundColor = "#28a745";
        btnIndicar.style.cursor = "not-allowed";

        modalTurma.hide();
        alert("Livro indicado com sucesso para todas as turmas selecionadas!");
      } catch (err) {
        console.error("Erro ao indicar livro:", err);
        alert("Erro ao salvar indicação.");
      }
    });

  } catch (err) {
    console.error("Erro no visLivro.js:", err);
    alert("Erro ao carregar detalhes do livro.");
  }
});
