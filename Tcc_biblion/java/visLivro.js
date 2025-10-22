function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}
// --- Proteção contra XSS ---
// Converte caracteres perigosos em texto seguro antes de exibir no HTML
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


document.addEventListener("DOMContentLoaded", async () => {
// --- CONFIGURAÇÃO DE EXIBIÇÃO DE BOTÕES --- //
const referrer = document.referrer;
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tipoUsuario = usuario ? Number(usuario.tipo_usuario_id) : null;
const isLivrosProf = referrer.includes('livrosProf.html');

const botoesAluno = document.getElementById("botoesLivro");
const btnIndicar = document.getElementById("btnIndicar");
const btnDesindicar = document.getElementById("btnDesindicar");

console.log('REFERRER:', referrer);
console.log('isLivrosProf:', isLivrosProf);

// CASO 1 — Página aberta a partir de livrosProf.html
if (isLivrosProf) {
  console.log('MODO PROFESSOR - Escondendo botoes aluno, mostrando indicar');
  if (botoesAluno) botoesAluno.style.display = "none";
  if (btnIndicar) {
    btnIndicar.style.display = "block"; // ← ISSO AQUI É O QUE FALTAVA
    btnIndicar.classList.remove("oculto-professor");
  }
  if (btnDesindicar) btnDesindicar.classList.remove("oculto-professor");
}
// CASO 2 — Outros casos
else {
  console.log('MODO NORMAL - Mostrando botoes aluno, escondendo indicar');
  if (botoesAluno) botoesAluno.style.display = "flex";
  if (btnIndicar) {
    btnIndicar.style.display = "none"; // ← GARANTE QUE FICA ESCONDIDO
    btnIndicar.classList.add("oculto-professor");
  }
  if (btnDesindicar) btnDesindicar.classList.add("oculto-professor");
}


  try {
    // --- Carregar usuário logado ---
    const usuarioData = JSON.parse(localStorage.getItem("usuario"));
    const usuarioId = usuarioData ? usuarioData.id : null;
    const usuarioNome = usuarioData ? usuarioData.nome : "Você";
    const usuarioFoto = usuarioData && usuarioData.foto
      ? `${apiBase()}/uploads/${usuarioData.foto}`
      : "../img/avatar.jpg";
    const isProfessor = usuarioData && usuarioData.tipo_usuario_id == 2;

    // --- Carregar livro ---
    const livroId = localStorage.getItem("livroSelecionado");
    if (!livroId) throw new Error("Nenhum livro selecionado.");

    const respLivro = await fetch(`${apiBase()}/livros/${livroId}`);
    if (!respLivro.ok) throw new Error("Erro ao buscar livro.");

    const livro = await respLivro.json();
    console.log("Livro carregado:", livro);

    // Atualizar HTML do livro
    document.querySelector(".livro-detalhe img").src = livro.capa
      ? `${apiBase()}/uploads/${livro.capa}`
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

    // --- BOTÃO LISTA DE DESEJOS ---
    const btnLista = document.querySelector('.btn-lista');
    if (btnLista && usuarioId) {
      const naLista = await verificarListaDesejos(usuarioId, livroId);

      if (naLista) {
        btnLista.innerHTML = '<i class="bi bi-heart-fill"></i> Remover da lista de desejos';
        btnLista.classList.remove('btn-lista');
        btnLista.classList.add('btn-lista-ativo');
      } else {
        btnLista.innerHTML = '<i class="bi bi-heart"></i> Adicionar na lista de desejos';
      }

      btnLista.addEventListener('click', () => {
        toggleListaDesejos(usuarioId, livroId, btnLista);
      });
    } else if (btnLista && !usuarioId) {
      btnLista.addEventListener('click', () => {
        alert('Você precisa estar logado para usar a lista de desejos.');
      });
    }

    // --- SISTEMA DE INDICAÇÃO - VERIFICAÇÃO INICIAL ---
    const btnIndicar = document.getElementById("btnIndicar");
    if (btnIndicar && isProfessor && usuarioId) {
      try {
        const respVerificacao = await fetch(`${apiBase()}/verificar-indicacao/${usuarioId}/${livroId}`);

        if (respVerificacao.ok) {
          const data = await respVerificacao.json();
          if (data.indicado) {
            btnIndicar.style.display = "none";
            const btnDesindicar = document.getElementById("btnDesindicar");
            btnDesindicar.style.display = "inline-block";

            btnDesindicar.addEventListener("click", async () => {
              if (!confirm("Deseja realmente remover a indicação deste livro?")) return;
              try {
                const resp = await fetch(`${apiBase()}/indicacoes/${usuarioId}/${livroId}`, {
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
  <img src="${c.foto ? `${apiBase()}/uploads/${sanitizeHTML(c.foto)}` : '../img/avatar.jpg'}" 
       class="comentario-avatar">
  <div class="comentario-conteudo">
    <strong>${sanitizeHTML(c.nome)}</strong>
    <p>${sanitizeHTML(c.comentario)}</p>
    <small>${new Date(c.data_comentario).toLocaleDateString('pt-BR')}</small>
  </div>
`;

        comentariosContainer.appendChild(div);
      });
    };

    const carregarComentarios = async () => {
      const respComentarios = await fetch(`${apiBase()}/livros/${livroId}/comentarios`);
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
        // Validação simples contra tags perigosas
        const regexXSS = /<[^>]*>|on\w+=|javascript:/gi;
        if (regexXSS.test(texto)) {
          alert("Comentário inválido: não use tags HTML ou código.");
          return;
        }

        const resp = await fetch(`${apiBase()}/livros/${livroId}/comentarios`, {
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
          const respTurmas = await fetch(`${apiBase()}/turmas`);
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

          await fetch(`${apiBase()}/indicacoes`, {
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

// --- BOTÃO LISTA DE DESEJOS ---
async function verificarListaDesejos(usuarioId, livroId, token) {
  try {
    const resp = await fetch(`${apiBase()}/lista-desejos/verificar/${usuarioId}/${livroId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.naLista;
    }
    return false;
  } catch (err) {
    console.error('Erro ao verificar lista de desejos:', err);
    return false;
  }
}

async function toggleListaDesejos(usuarioId, livroId, btnLista, token) {
  try {
    const naLista = await verificarListaDesejos(usuarioId, livroId, token);

    if (naLista) {
      // Remover da lista
      const resp = await fetch(`${apiBase()}/lista-desejos/${usuarioId}/${livroId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resp.ok) {
        btnLista.innerHTML = '<i class="bi bi-heart"></i> Adicionar na lista de desejos';
        btnLista.classList.remove('btn-lista-ativo');
        btnLista.classList.add('btn-lista');
        alert('Livro removido da lista de desejos!');
      } else {
        const erro = await resp.json();
        alert(erro.error || 'Erro ao remover da lista de desejos.');
      }
    } else {
      // Adicionar à lista
      const resp = await fetch(`${apiBase()}/lista-desejos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId, livroId })
      });

      if (resp.ok) {
        btnLista.innerHTML = '<i class="bi bi-heart-fill"></i> Remover da lista de desejos';
        btnLista.classList.remove('btn-lista');
        btnLista.classList.add('btn-lista-ativo');
        alert('Livro adicionado à lista de desejos!');
      } else {
        const erro = await resp.json();
        if (resp.status === 409) alert('Este livro já está na sua lista de desejos.');
        else alert(erro.error || 'Erro ao adicionar à lista de desejos.');
      }
    }
  } catch (err) {
    console.error('Erro ao atualizar lista de desejos:', err);
    alert('Erro de conexão.');
  }
}

// --- SISTEMA DE RESERVA E HISTÓRICO ---
const btnReservar = document.querySelector('.btn-reservar');
if (btnReservar) {
  btnReservar.addEventListener('click', async () => {
    const usuarioData = JSON.parse(localStorage.getItem('usuario'));
    const usuarioId = usuarioData ? usuarioData.id : null;
    const livroId = localStorage.getItem('livroSelecionado');
    const token = localStorage.getItem('token');

    if (!usuarioId) {
      alert("Você precisa estar logado para reservar um livro.");
      return;
    }

    try {
      // --- Enviar reserva ---
      const reservaResp = await fetch(`${apiBase()}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ usuarioId, livroId })
      });

      if (!reservaResp.ok) {
        const erro = await reservaResp.text();
        alert("Erro ao reservar o livro: " + erro);
        return;
      }

      alert("Livro reservado com sucesso!");

      // --- Registrar histórico ---
      await fetch(`${apiBase()}/historico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuarioId,
          livroId,
          acao: "Reserva de livro"
        })
      });

      console.log("Histórico registrado com sucesso.");

    } catch (err) {
      console.error("Erro ao reservar:", err);
      alert("Erro ao processar a reserva.");
    }
  });
}

// --- Inicialização do botão no DOM ---
document.addEventListener("DOMContentLoaded", async () => {
  const usuarioData = JSON.parse(localStorage.getItem("usuario"));
  const usuarioId = usuarioData ? usuarioData.id : null;
  const token = localStorage.getItem('token'); // <- JWT salvo ao logar
  const livroId = localStorage.getItem("livroSelecionado");
  const btnLista = document.querySelector('.btn-lista');

  if (!btnLista) return;

  if (usuarioId && token) {
    // Estado inicial
    const naLista = await verificarListaDesejos(usuarioId, livroId, token);
    if (naLista) {
      btnLista.innerHTML = '<i class="bi bi-heart-fill"></i> Remover da lista de desejos';
      btnLista.classList.remove('btn-lista');
      btnLista.classList.add('btn-lista-ativo');
    } else {
      btnLista.innerHTML = '<i class="bi bi-heart"></i> Adicionar na lista de desejos';
    }

    btnLista.addEventListener('click', () => {
      toggleListaDesejos(usuarioId, livroId, btnLista, token);
    });
  } else {
    // Usuário não logado
    btnLista.addEventListener('click', () => {
      alert('Você precisa estar logado para usar a lista de desejos.');
    });
  }
});
