const token = localStorage.getItem("token"); // token do login
const backendURL = "http://localhost:3000"; // 🔹 URL do backend

// 🔹 Pesquisar usuário
async function pesquisarUsuario() {
  try {
    const termo = document.querySelector("#inputUsuario").value;

    const resp = await fetch(`${backendURL}/usuarios?busca=${encodeURIComponent(termo)}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    const usuarios = await resp.json();

    if (!resp.ok || !usuarios || usuarios.length === 0) {
      alert("Nenhum usuário encontrado");
      return;
    }

    const u = usuarios[0]; // pega o primeiro usuário
    document.getElementById("usuarioId").value = u.id;

    // Preencher os dados no HTML
    document.getElementById("usuarioNome").textContent = u.nome;
    document.getElementById("usuarioTipo").textContent = u.tipo || "Não informado";
    document.getElementById("usuarioStatus").textContent = u.status || "Ativo";
    document.getElementById("usuarioLogin").textContent = u.ultimo_login || "-";
    document.getElementById("usuarioAtrasos").textContent = u.atrasos || "0";
    document.getElementById("usuarioLivros").textContent = u.qtd_emprestimos || "0";
    document.getElementById("usuarioFoto").src = u.foto ? `${backendURL}${u.foto}` : "../img/user.png";

    // Exibir a seção
    document.getElementById("usuarioResultado").style.display = "flex";
  } catch (err) {
    console.error("Erro ao pesquisar usuário:", err);
    alert("Erro ao pesquisar usuário.");
  }
}

// 🔹 Pesquisar livro
async function pesquisarLivro() {
  try {
    const termo = document.querySelector("#inputLivro").value;

    const resp = await fetch(`${backendURL}/emprestimo/livros?busca=${encodeURIComponent(termo)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const livros = await resp.json();

    if (!resp.ok || !livros || livros.length === 0) {
      alert("Nenhum livro encontrado");
      return;
    }

    const l = livros[0]; // pega o primeiro resultado
    document.getElementById("livroId").value = l.id; // guardar ID

    // Capa do livro
 const capaSrc = l.capa ? `${backendURL}${l.capa}` : "../img/pinkk.jpg";
  // guarda ID do livro
    document.getElementById("livroId").value = l.id || "";

    // Guarda o ID do empréstimo (se existir) — ESSENCIAL para devolver
    document.getElementById("emprestimoId").value = l.emprestimo_id || "";

    if (l.disponibilidade === "disponivel") {
      // Preenche informações de livro disponível
      document.getElementById("livroTitulo").textContent = l.titulo || "-";
      document.getElementById("livroAutor").textContent = l.autor || "-";
      document.getElementById("livroEditora").textContent = l.editora || "-";
      document.getElementById("livroLocalizacao").textContent = l.localizacao || "-";
      document.getElementById("livroDisponibilidade").textContent = "Disponível";
      document.getElementById("livroFila").textContent = l.fila || "0";

      document.getElementById("livroCapa").src = capaSrc;
      document.getElementById("livroCapa").style.opacity = "1";

      document.getElementById("livroResultado").style.display = "flex";
      document.getElementById("livroIndisponivel").style.display = "none";
      document.getElementById("livroIndisponivelInfo").style.display = "none";
    } else {
      // Preenche informações de livro emprestado
      document.getElementById("livroEmprestadoNome").textContent = l.titulo || "-";
      document.getElementById("livroEmprestadoUsuario").textContent = l.usuario || "Usuário não informado";
      document.getElementById("livroEmprestadoStatus").textContent = "Emprestado";
      document.getElementById("livroEmprestadoData").textContent = l.data_emprestimo || "-";
      document.getElementById("livroEmprestadoDevolucao").textContent = l.data_devolucao_prevista || "-";
      document.getElementById("livroEmprestadoFila").textContent = l.fila || "0";

      document.getElementById("livroIndisponivelCapa").src = capaSrc;
      document.getElementById("livroIndisponivelCapa").style.opacity = "0.5";

      document.getElementById("livroIndisponivel").style.display = "block";
      document.getElementById("livroIndisponivelInfo").style.display = "flex";
      document.getElementById("livroResultado").style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao pesquisar livro:", err);
    alert("Erro ao pesquisar livro.");
  }
}

// 🔹 Fazer o empréstimo
async function emprestarLivro() {
  try {
    const usuarioId = document.getElementById("usuarioId").value;
    const livroId = document.getElementById("livroId").value;

    if (!usuarioId || !livroId) {
      alert("Selecione um usuário e um livro primeiro!");
      return;
    }

    const resp = await fetch(`${backendURL}/emprestimos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        usuarioId: usuarioId,
        livros: [livroId] // manda o ID real do livro
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Erro ao emprestar:", data);
      alert(data.error || "Erro ao registrar empréstimo.");
      return;
    }

    alert(data.message || "Empréstimo realizado com sucesso!");
  } catch (err) {
    console.error("Erro ao emprestar livro:", err);
    alert("Erro ao emprestar livro.");
  }
}
// 🔹 Devolver livro
async function devolverLivro() {
  try {
    const emprestimoId = document.getElementById("emprestimoId").value;

    if (!emprestimoId) {
      alert("Nenhum empréstimo selecionado!");
      return;
    }

    const resp = await fetch(`${backendURL}/emprestimos/${emprestimoId}/devolver`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await resp.json();

    if (!resp.ok) {
      alert(data.error || "Erro ao devolver livro.");
      return;
    }

    alert(data.message || "Livro devolvido com sucesso!");
    location.reload(); // atualiza a tela para refletir a devolução
  } catch (err) {
    console.error("Erro ao devolver livro:", err);
    alert("Erro ao devolver livro.");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const btnDevolver = document.querySelector(".btn-devolver");
  if (btnDevolver) {
    btnDevolver.addEventListener("click", devolverLivro);
  }
   // opcional: também logar ao carregar para garantir token etc.
  console.log("emprestimo.js carregado. token:", !!token);

});
