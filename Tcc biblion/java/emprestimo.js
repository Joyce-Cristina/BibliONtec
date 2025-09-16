const token = localStorage.getItem("token"); // token do login
const backendURL = "http://localhost:3000"; // 🔹 URL do backend

// 🔹 Pesquisar usuário
async function pesquisarUsuario() {
  const termo = document.querySelector("#inputUsuario").value;

  const resp = await fetch(`http://localhost:3000/usuarios?busca=${encodeURIComponent(termo)}`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const usuarios = await resp.json();

if (!usuarios || usuarios.length === 0) {
  alert("Nenhum usuário encontrado");
  return;
}

const u = usuarios[0]; // agora só executa se existe
document.getElementById("usuarioId").value = u.id;

  

  // Preencher os dados no HTML
  document.getElementById("usuarioNome").textContent = u.nome;
  document.getElementById("usuarioTipo").textContent = u.tipo || "Não informado";
  document.getElementById("usuarioStatus").textContent = u.status || "Ativo";
  document.getElementById("usuarioLogin").textContent = u.ultimo_login || "-";
  document.getElementById("usuarioAtrasos").textContent = u.atrasos || "0";
  document.getElementById("usuarioLivros").textContent = u.qtd_emprestimos || "0";
document.getElementById("usuarioFoto").src = `${backendURL}${u.foto}`;


  // Exibir a seção
  document.getElementById("usuarioResultado").style.display = "flex";
}
// 🔹 Pesquisar livro
async function pesquisarLivro() {
  const termo = document.querySelector("#inputLivro").value;

  const resp = await fetch(`http://localhost:3000/livros?busca=${encodeURIComponent(termo)}`, {
    headers: { "Authorization": "Bearer " + token }
  });
  const livros = await resp.json();

  if (livros.length === 0) {
    alert("Nenhum livro encontrado");
    return;
  }

  const l = livros[0]; // pega o primeiro resultado
  document.getElementById("livroId").value = l.id; // guardar ID

  // Capa do livro (mesma lógica pros dois casos)
  const capaSrc = l.capa ? `${backendURL}/uploads/${l.capa}` : "../img/pinkk.jpg";

  // Se o livro estiver disponível
   if (l.disponibilidade === "disponivel")  {
 
    document.getElementById("livroTitulo").textContent = l.titulo;
    document.getElementById("livroAutor").textContent = l.autor || "-";
    document.getElementById("livroEditora").textContent = l.editora || "-";
    document.getElementById("livroLocalizacao").textContent = l.localizacao || "-";
    document.getElementById("livroDisponibilidade").textContent = "Disponível";
    document.getElementById("livroFila").textContent = l.fila || "0";

    // capa normal
    document.getElementById("livroCapa").src = capaSrc;
    document.getElementById("livroCapa").style.opacity = "1";

    document.getElementById("livroResultado").style.display = "flex";
    document.getElementById("livroIndisponivel").style.display = "none";
    document.getElementById("livroIndisponivelInfo").style.display = "none";
  } 
  // Se estiver emprestado
  else {
    document.getElementById("livroEmprestadoNome").textContent = l.usuario_nome || "-";
    document.getElementById("livroEmprestadoUsuario").textContent = l.usuario_tipo || "-";
    document.getElementById("livroEmprestadoStatus").textContent = "Emprestado";
    document.getElementById("livroEmprestadoData").textContent = l.data_emprestimo || "-";
    document.getElementById("livroEmprestadoDevolucao").textContent = l.data_devolucao_prevista || "-";
    document.getElementById("livroEmprestadoFila").textContent = l.fila || "0";

    // capa apagada
    document.getElementById("livroIndisponivelCapa").src = capaSrc;
    document.getElementById("livroIndisponivelCapa").style.opacity = "0.5";

    document.getElementById("livroIndisponivel").style.display = "block";
    document.getElementById("livroIndisponivelInfo").style.display = "flex";
    document.getElementById("livroResultado").style.display = "none";
  }
}


// 🔹 Fazer o empréstimo
async function emprestarLivro() {
  const usuarioId = document.getElementById("usuarioId").value;
  const livroId = document.getElementById("livroId").value;

  if (!usuarioId || !livroId) {
    alert("Selecione um usuário e um livro primeiro!");
    return;
  }

  const resp = await fetch("http://localhost:3000/emprestimos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      usuarioId: usuarioId,
      livros: [livroId] // agora manda o ID real
    })
  });

  const data = await resp.json();
  alert(data.message || JSON.stringify(data));
}