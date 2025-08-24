// Carregar os tipos de instituição no select
async function carregarTiposInstituicao() {
    try {
        const resposta = await fetch("http://localhost:3000/tipos-instituicao");
        if (!resposta.ok) throw new Error("Falha ao buscar tipos de instituição");

        const tipos = await resposta.json();

        const select = document.getElementById("institutionType");
        select.innerHTML = '<option value="">Selecione o tipo</option>';

        tipos.forEach(t => {
            const option = document.createElement("option");
            option.value = t.id;       // ID do tipo de instituição
            option.textContent = t.tipo; // Nome do tipo
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao carregar tipos de instituição:", error);
        alert("Não foi possível carregar os tipos de instituição.");
    }
}

// Executa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    carregarTiposInstituicao();

    const btnSalvar = document.querySelector(".btn-save"); // botão que já existe
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

        try {
            const resposta = await fetch("http://localhost:3000/instituicao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();
            alert(resultado.mensagem);

        } catch (erro) {
            console.error("Erro ao cadastrar instituição:", erro);
            alert("Não foi possível cadastrar a instituição.");
        }
    });
});
