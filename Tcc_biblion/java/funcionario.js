
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}
document.addEventListener("DOMContentLoaded", () => {
  carregarFuncionarios();
  carregarFuncoes(); // já carrega funções no select
});
const API_URL_FUNCIONARIOS = `${apiBase()}/api/funcionarios`;

let todosOsFuncionarios = [];
let todasAsFuncoes = [];

// ------------------ CARREGAR FUNCIONÁRIOS ------------------
async function carregarFuncionarios() {
  try {
    const token = localStorage.getItem("token");
    const resposta = await fetch(API_URL_FUNCIONARIOS, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!resposta.ok) {
      throw new Error("Erro HTTP " + resposta.status);
    }

    todosOsFuncionarios = await resposta.json();

    if (document.getElementById("lista-funcionarios")) {
      exibirFuncionariosCards(todosOsFuncionarios);
    }
    if (document.querySelector("#lista-bibliotecarios tbody")) {
      exibirFuncionariosTabela(todosOsFuncionarios);
    }
  } catch (erro) {
    console.error("Erro ao carregar funcionários:", erro);
  }
}

// ------------------ CARREGAR FUNÇÕES (cargos) ------------------
async function carregarFuncoes() {
  try {
    const token = localStorage.getItem("token");
   const res = await fetch(`${apiBase()}/funcoes`, {

      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      throw new Error("Erro HTTP " + res.status);
    }

    todasAsFuncoes = await res.json();

    const select = document.getElementById("funcao-funcionario");
    if (!select) return;

    select.innerHTML = "";
    todasAsFuncoes.forEach(f => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.funcao;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar funções:", err);
  }
}

// ------------------ EXIBIR EM CARDS ------------------
function exibirFuncionariosCards(funcionarios) {
  const container = document.getElementById("lista-funcionarios");
  if (!container) return;

  container.innerHTML = ""; // limpa o container

  funcionarios.forEach(f => {
    const foto = f.foto
      ? `${apiBase()}/uploads/${f.foto}`
: `${apiBase()}/uploads/padrao.jpg`;

    const card = document.createElement("div");
    card.className = "card"; // usa a mesma classe de usuário para uniformidade
    card.style.maxWidth = "300px"; // opcional: garante tamanho máximo

    card.innerHTML = `
      <img src="${foto}" class="card-img-top" alt="${f.nome}" style="height: 180px; object-fit: cover;">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${f.nome}</h5>
        <p><strong>Função:</strong> ${f.funcao || "Não definida"}</p>
        <p><strong>Email:</strong> ${f.email}</p>
        <p><strong>Telefone:</strong> ${f.telefone || "—"}</p>
      </div>
      <div class="card-footer text-center">
        <button class="btn btn-danger me-2" onclick="excluirFuncionario(${f.id})">Excluir</button>
        <button class="btn btn-dark" onclick="abrirModalEdicao(${f.id})">Editar</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// ------------------ EXIBIR EM TABELA ------------------
function exibirFuncionariosTabela(funcionarios) {
  const tbody = document.querySelector("#lista-bibliotecarios tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  funcionarios.forEach(f => {
    const statusBadge =
      f.status === "Ativo"
        ? '<span class="badge bg-success">Ativo</span>'
        : '<span class="badge bg-danger">Inativo</span>';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${f.nome}</td>
      <td>${f.email}</td>
      <td>${statusBadge}</td>
      <td>${f.telefone || "—"}</td>
      <td>${f.funcao || "—"}</td>
      <td>
        <button class="btn btn-outline-warning btn-sm" onclick="abrirModalEdicao(${f.id})"><i class="bi bi-pencil"></i> Editar</button>
        <button class="btn btn-outline-danger btn-sm" onclick="excluirFuncionario(${f.id})"><i class="bi bi-trash"></i> Excluir</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ------------------ ABRIR MODAL DE EDIÇÃO ------------------
async function abrirModalEdicao(id) {
  const funcionario = todosOsFuncionarios.find(f => f.id === id);
  if (!funcionario) return;

  // Carrega todas as funções
  await carregarFuncoes();

  document.getElementById("id-funcionario").value = funcionario.id;
  document.getElementById("nome-funcionario").value = funcionario.nome;
  document.getElementById("email-funcionario").value = funcionario.email;
  document.getElementById("telefone-funcionario").value = funcionario.telefone || "";

  // Preenche o select de funções
  const selectFuncao = document.getElementById("funcao-funcionario");
  if (selectFuncao) {
    selectFuncao.innerHTML = ""; // limpa opções
    todasAsFuncoes.forEach(f => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.funcao;
      if (f.id === funcionario.FK_funcao_id) option.selected = true; // marca função atual
      selectFuncao.appendChild(option);
    });
  }

  // Prepara preview da foto
  const preview = document.getElementById("previewBox");
  const fotoAtual = funcionario.foto
  ? `${apiBase()}/uploads/${funcionario.foto}`
  : `${apiBase()}/uploads/padrao.jpg`;

  preview.style.backgroundImage = `url('${fotoAtual}')`;

  // Abre modal
  const modal = new bootstrap.Modal(document.getElementById("modal-editar"));
  modal.show();
}

// ------------------ SALVAR EDIÇÃO ------------------
const formEditar = document.getElementById("form-editar");
if (formEditar) {
  formEditar.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = document.getElementById("id-funcionario").value;

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome-funcionario").value);
    formData.append("email", document.getElementById("email-funcionario").value);
    formData.append("telefone", document.getElementById("telefone-funcionario").value);
    formData.append("FK_funcao_id", document.getElementById("funcao-funcionario").value);

    const fotoInput = document.getElementById("foto-funcionario");
    if (fotoInput && fotoInput.files.length > 0) {
      formData.append("foto", fotoInput.files[0]);
    }

    fetch(`${API_URL_FUNCIONARIOS}/${id}`, {
      method: "PUT",
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
      body: formData
    })
    .then(async res => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao atualizar funcionário");
      }
      carregarFuncionarios();
      const modalEl = document.getElementById("modal-editar");
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal.hide();
    })
    .catch(err => console.error("Erro ao editar funcionário:", err));
  });
}

// ------------------ EXCLUIR ------------------
function excluirFuncionario(id) {
  if (confirm("Tem certeza que deseja excluir este funcionário?")) {
    fetch(`${API_URL_FUNCIONARIOS}/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
      .then(res => {
        if (res.ok) carregarFuncionarios();
      })
      .catch(err => console.error("Erro ao excluir funcionário:", err));
  }
}

// 🔥 Deixar funções acessíveis ao HTML inline
window.abrirModalEdicao = abrirModalEdicao;
window.excluirFuncionario = excluirFuncionario;
