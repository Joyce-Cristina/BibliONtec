document.addEventListener("DOMContentLoaded", () => {
    const salvarBtn = document.querySelector(".btn-save");
    const blocos = document.querySelectorAll("#permissoes .user-role");
  
    let ids = {}; // vai guardar { aluno: id, professor: id, funcionario: id }
  
    async function carregarPermissoes() {
      try {
        const res = await fetch("http://localhost:3000/permissoes");
        const data = await res.json();
        if (!data || data.length === 0) return;
  
        data.forEach(row => {
          ids[row.tipo_usuario] = row.id;
  
          if (row.tipo_usuario === "aluno") preencherBloco(blocos[0], row);
          if (row.tipo_usuario === "professor") preencherBloco(blocos[1], row);
          if (row.tipo_usuario === "funcionario") preencherBloco(blocos[2], row);
        });
      } catch (e) {
        console.error("Erro ao carregar permissões:", e);
      }
    }
  
    function preencherBloco(bloco, dados) {
      const inputs = bloco.querySelectorAll(".form-control, input[type=checkbox]");
      inputs[0].value = dados.max_emprestimos;
      inputs[1].value = dados.duracao_emprestimo;
      inputs[2].checked = !!dados.pode_reservar;
      inputs[3].checked = !!dados.pode_renovar;
    }
  
    function coletarBloco(bloco, tipo) {
      const inputs = bloco.querySelectorAll(".form-control, input[type=checkbox]");
      return {
        id: ids[tipo] || null,
        tipo_usuario: tipo,
        max_emprestimos: inputs[0].value,
        duracao_emprestimo: inputs[1].value,
        pode_reservar: inputs[2].checked ? 1 : 0,
        pode_renovar: inputs[3].checked ? 1 : 0
      };
    }
  
    async function salvarPermissoes() {
      const permissoes = [
        coletarBloco(blocos[0], "aluno"),
        coletarBloco(blocos[1], "professor"),
        coletarBloco(blocos[2], "funcionario")
      ];
  
      for (const p of permissoes) {
        try {
          let resposta;
          if (p.id) {
            resposta = await fetch(`http://localhost:3000/permissoes/${p.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(p),
            });
          } else {
            resposta = await fetch("http://localhost:3000/permissoes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(p),
            });
          }
          const result = await resposta.json();
          console.log(result.mensagem);
        } catch (e) {
          console.error("Erro ao salvar permissões:", e);
        }
      }
  
      alert("✅ Permissões salvas com sucesso!");
      carregarPermissoes();
    }
  
    if (salvarBtn) salvarBtn.addEventListener("click", salvarPermissoes);
    carregarPermissoes();
  });
  