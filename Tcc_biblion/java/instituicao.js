function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

// Carregar os tipos de instituição no select
async function carregarTiposInstituicao() {
    try {
      const resposta = await fetch(`${apiBase()}/tipos-instituicao`);
      if (!resposta.ok) throw new Error("Falha ao buscar tipos de instituição");
  
      const tipos = await resposta.json();
  
      const select = document.getElementById("institutionType");
      select.innerHTML = '<option value="">Selecione o tipo</option>';
  
      tipos.forEach(t => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.tipo;
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Erro ao carregar tipos de instituição:", error);
      alert("Não foi possível carregar os tipos de instituição.");
    }
  }
  
  // Carregar instituição existente
  async function carregarInstituicao() {
    try {
      const resposta = await fetch(`${apiBase()}/instituicao`);
      const instituicao = await resposta.json();
  
      if (instituicao) {
        document.getElementById("institutionName").value = instituicao.nome || "";
        document.getElementById("email").value = instituicao.email || "";
        document.getElementById("workingHours").value = instituicao.horario_funcionamento || "";
        document.getElementById("phone").value = instituicao.telefone || "";
        document.getElementById("website").value = instituicao.website || "";
        document.getElementById("address").value = instituicao.endereco || "";
        document.getElementById("institutionType").value = instituicao.FK_tipo_instituicao_id || "";
  
        // 🔹 Guarda o ID diretamente no SELECT (já que não temos form)
        document.getElementById("institutionType").dataset.id = instituicao.id;
      }
    } catch (error) {
      console.error("Erro ao carregar instituição:", error);
    }
  }
  
  // Quando a página carregar
  document.addEventListener("DOMContentLoaded", () => {
    carregarTiposInstituicao().then(() => carregarInstituicao());
  
    const btnSalvar = document.querySelector(".btn-save"); // seu botão já existe no HTML
    btnSalvar.addEventListener("click", async () => {
      const dados = {
        nome: document.getElementById("institutionName").value,
        email: document.getElementById("email").value,
        horario_funcionamento: document.getElementById("workingHours").value,
        telefone: document.getElementById("phone").value,
        website: document.getElementById("website").value,
        endereco: document.getElementById("address").value,
        FK_tipo_instituicao_id: document.getElementById("institutionType").value
      };
  
      // Recupera o id salvo no select (se já existir instituição)
      const id = document.getElementById("institutionType").dataset.id;
  
      try {
        let resposta;
        if (id) {
          // Atualizar
          resposta = await fetch(`${apiBase()}/instituicao/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
          });
        } else {
          // Cadastrar
          resposta = await fetch(`${apiBase()}/instituicao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
          });
        }
  
        const resultado = await resposta.json();
        alert(resultado.mensagem);
  
        // Recarrega os dados
        carregarInstituicao();
  
      } catch (erro) {
        console.error("Erro ao salvar instituição:", erro);
        alert("Não foi possível salvar a instituição.");
      }
    });
  });
  