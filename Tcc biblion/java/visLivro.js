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
            btnIndicar.innerHTML = "✓ Já Indicado";
            btnIndicar.disabled = true;
            btnIndicar.style.backgroundColor = "#28a745";
            btnIndicar.style.cursor = "not-allowed";
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

    // --- SISTEMA DE INDICAÇÃO COM MODAL ---
    const modalTurma = new bootstrap.Modal(document.getElementById('modalTurma'));
    
    let turmasGlobais = [];
    
    if (btnIndicar && isProfessor) {
      btnIndicar.addEventListener("click", async () => {
        if (!usuarioId) return alert("Você precisa estar logado para indicar um livro.");
      
        try {
          const respTurmas = await fetch('http://localhost:3000/turmas');
          if (!respTurmas.ok) throw new Error("Erro ao buscar turmas");
      
          const data = await respTurmas.json();
      
          // Combina turmas_agrupadas com cursos para ter nome legível
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
      
          // Preenche os selects do modal
          preencherSelectCursos(turmasGlobais);
      
          modalTurma.show();
        } catch (err) {
          console.error("Erro ao carregar turmas:", err);
          alert("Erro ao carregar turmas.");
        }
      });
      
      function preencherSelectCursos(turmas) {
        const selectCurso = document.getElementById('selectCurso');
        const selectSerie = document.getElementById('selectSerie');
      
        selectCurso.innerHTML = '<option value="">Selecione um curso</option>';
        selectSerie.innerHTML = '<option value="">Selecione uma série</option>';
      
        // Cursos únicos
        const cursosUnicos = {};
        turmas.forEach(t => {
          cursosUnicos[t.curso_id] = t.curso;
        });
      
        Object.entries(cursosUnicos).forEach(([id, nome]) => {
          const option = document.createElement('option');
          option.value = id;
          option.textContent = nome;
          selectCurso.appendChild(option);
        });
      
        selectCurso.addEventListener('change', function() {
          const cursoId = this.value;
          preencherSeries(cursoId, turmas);
        });
      }
      
      function preencherSeries(cursoId, turmas) {
        const selectSerie = document.getElementById('selectSerie');
        selectSerie.innerHTML = '<option value="">Selecione a série</option>';
        if (!cursoId) return;
      
        const seriesDoCurso = turmas
          .filter(t => t.curso_id == cursoId)
          .map(t => t.serie);
      
        const seriesUnicas = [...new Set(seriesDoCurso)];
        seriesUnicas.forEach(serie => {
          const option = document.createElement('option');
          option.value = serie;
          option.textContent = `${serie}ª série`;
          selectSerie.appendChild(option);
        });
      }
    }

    document.getElementById('btnConfirmarIndicacao').addEventListener('click', async () => {
      const cursoId = document.getElementById('selectCurso').value;
      const serie = document.getElementById('selectSerie').value;
      
      if (!cursoId || !serie) {
        alert('Por favor, selecione um curso e uma série');
        return;
      }

      try {
        const resp = await fetch("http://localhost:3000/indicacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            usuarioId, 
            livroId,
            cursoId,
            serie 
          })
        });

        if (resp.ok) {
          const result = await resp.json();
          btnIndicar.innerHTML = "✓ Já Indicado";
          btnIndicar.disabled = true;
          btnIndicar.style.backgroundColor = "#28a745";
          btnIndicar.style.cursor = "not-allowed";
          
          modalTurma.hide();
          alert("Livro indicado com sucesso para a turma selecionada!");
        } else {
          const errorText = await resp.text();
          console.error("Erro do servidor:", errorText);
          alert("Erro ao indicar livro. Verifique o console para detalhes.");
        }
      } catch (err) {
        console.error("Erro ao indicar livro:", err);
        alert("Erro de conexão com o servidor.");
      }
    });

  } catch (err) {
    console.error("Erro no visLivro.js:", err);
    alert("Erro ao carregar detalhes do livro.");
  }
});
