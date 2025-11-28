async function carregarMeusLivros() {
    const token = localStorage.getItem("token");

    const resp = await fetch(`${apiBase()}/meus-livros`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const livros = await resp.json();
    mostrarLivros(livros);
}

function mostrarLivros(livros) {
    const container = document.getElementById("lista-meus-livros");
    container.innerHTML = "";

    livros.forEach(l => {
        const podeEstender = l.extensoes < 2;
container.innerHTML += `
<section class="page-section text-black mb-0" 
    style="background:#f2f2f2; border:2px solid #c5a86e; border-radius:10px; 
    padding:20px; max-width:1000px; margin:30px auto;">

    <div class="d-flex flex-row flex-wrap" style="gap:20px;">

        <!-- ESQUERDA -->
        <div style="
            flex: 1; 
            min-width: 260px; 
            background:#d3d3d3; 
            padding:15px; 
            border-radius:8px; 
            text-align:center;">
            
            <img src="${apiBase()}/uploads/${l.capa || 'padrao.jpg'}" 
                style="width:200px; height:260px; object-fit:cover; border-radius:6px;">
            
            <p style="margin-top:10px; font-weight:bold;">${l.titulo}</p>

            <p style="margin:5px 0;">Devolver até: 
                <strong>${l.data_devolucao_prevista}</strong>
            </p>

            ${podeEstender 
                ? `<button class="btn btn-danger" onclick="estender(${l.id})">Estender uso</button>`
                : `<p style="color:red; font-weight:bold;">Limite atingido</p>`}

        </div>

        <!-- DIREITA -->
        <div style="flex:2; min-width:280px;">
            <p><strong style="color:red;">Autor:</strong> ${l.autores || "Não informado"}</p>

            <p><strong style="color:red;">Descrição:</strong> 
                ${l.sinopse || "Sem sinopse disponível"}
            </p>
        </div>

    </div>
</section>
`;

    });
}

async function estender(livroId) {
    const token = localStorage.getItem("token");

    const resp = await fetch(`${apiBase()}/estender`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ livroId })
    });

    const data = await resp.json();

    alert(data.message || data.error);
    carregarMeusLivros();
}

carregarMeusLivros();
