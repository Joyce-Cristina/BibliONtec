document.addEventListener("DOMContentLoaded", () => {
  carregarFuncionarios();
  carregarFuncoes(); // já carrega funções no select
});

const API_URL = "http://localhost:3000/api/funcionarios";
let todosOsFuncionarios = [];
let todasAsFuncoes = [];

// ------------------ CARREGAR FUNCIONÁRIOS ------------------
async function carregarFuncionarios() {
  try {
    const token = localStorage.getItem("token");
    const resposta = await fetch(API_URL, {
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
    const res = await fetch("http://localhost:3000/funcoes", {
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

  container.innerHTML = "";
  let row;

  funcionarios.forEach((f, index) => {
    if (index % 3 === 0) {
      row = document.createElement("div");
      row.className = "row mb-4";
      container.appendChild(row);
    }

    const foto = f.foto
      ? `http://localhost:3000/uploads/${f.foto}`
      : `http://localhost:3000/uploads/padrao.jpg`;

    const col = document.createElement("div");
    col.className = "col-md-4 d-flex align-items-stretch";

    col.innerHTML = `
      <div class="card h-100" style="background-color: #d6c9b4;">
        <img src="${foto}" class="card-img-top" alt="${f.nome}" style="height: 300px; object-fit: cover;">
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
      </div>
    `;
    row.appendChild(col);
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

  await carregarFuncoes(); // garante que o select está populado

  document.getElementById("id-funcionario").value = funcionario.id;
  document.getElementById("nome-funcionario").value = funcionario.nome;
  document.getElementById("email-funcionario").value = funcionario.email;
  document.getElementById("telefone-funcionario").value = funcionario.telefone || "";
  document.getElementById("funcao-funcionario").value = funcionario.FK_funcao_id || "";

  const modal = new bootstrap.Modal(document.getElementById("modal-editar"));
  modal.show();
}

// ------------------ SALVAR EDIÇÃO ------------------
document.getElementById("form-editar").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = document.getElementById("id-funcionario").value;
  const dados = {
    nome: document.getElementById("nome-funcionario").value,
    email: document.getElementById("email-funcionario").value,
    telefone: document.getElementById("telefone-funcionario").value,
    funcao_id: document.getElementById("funcao-funcionario").value
  };

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify(dados)
  })
    .then(res => {
      if (res.ok) {
        carregarFuncionarios();
        const modalEl = document.getElementById("modal-editar");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
      }
    })
    .catch(err => console.error("Erro ao editar funcionário:", err));
});

// ------------------ EXCLUIR ------------------
function excluirFuncionario(id) {
  if (confirm("Tem certeza que deseja excluir este funcionário?")) {
    fetch(`${API_URL}/${id}`, { 
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
