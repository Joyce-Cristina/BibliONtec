document.addEventListener("DOMContentLoaded", () => {
    const salvarBtn = document.querySelector(".btn-save");
    const inputsPrazos = document.querySelectorAll("#prazos .form-control");
  
    // 🔹 Carregar dados do banco e preencher os inputs
    async function carregarConfiguracoesGerais() {
      try {
        const resposta = await fetch("http://localhost:3000/configuracoes-gerais");
        const config = await resposta.json();
  
        if (config) {
          inputsPrazos[0].value = config.duracao_padrao_emprestimo || 0;   // Duração empréstimo
          inputsPrazos[1].value = config.numero_maximo_renovacoes || 0;    // Máx. renovações
          inputsPrazos[2].value = config.tempo_retirada_reserva || 0;      // Tempo reserva
          inputsPrazos[3].value = config.numero_maximo_emprestimos || 0;   // Máx. empréstimos
          inputsPrazos[4].value = config.multa_por_atraso || 0;            // Multa atraso
  
          // Guarda o ID no primeiro input para decidir entre POST e PUT
          inputsPrazos[0].dataset.id = config.id;
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações:", erro);
      }
    }
  
    // 🔹 Salvar ou atualizar as configurações
    async function salvarConfiguracoesGerais() {
      const dados = {
        duracao_padrao_emprestimo: inputsPrazos[0].value,
        numero_maximo_renovacoes: inputsPrazos[1].value,
        tempo_retirada_reserva: inputsPrazos[2].value,
        numero_maximo_emprestimos: inputsPrazos[3].value,
        multa_por_atraso: inputsPrazos[4].value,
      };
  
      const id = inputsPrazos[0].dataset.id;
  
      try {
        let resposta;
        if (id) {
          // Atualiza registro existente
          resposta = await fetch(`http://localhost:3000/configuracoes-gerais/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
          });
        } else {
          // Cria novo registro
          resposta = await fetch("http://localhost:3000/configuracoes-gerais", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
          });
        }
  
        const resultado = await resposta.json();
        alert(resultado.mensagem);
        carregarConfiguracoesGerais();
      } catch (erro) {
        console.error("Erro ao salvar configurações:", erro);
        alert("Não foi possível salvar as configurações.");
      }
    }
  
    // 🔹 Eventos
    if (salvarBtn) {
      salvarBtn.addEventListener("click", salvarConfiguracoesGerais);
    }
  
    carregarConfiguracoesGerais();
  });
  