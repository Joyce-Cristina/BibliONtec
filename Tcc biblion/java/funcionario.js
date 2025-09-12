document.addEventListener("DOMContentLoaded", carregarFuncionarios);
const API_URL = "http://localhost:3000/api/funcionarios";
let todosOsFuncionarios = [];

// Carregar
async function carregarFuncionarios() {
  try {
    const resposta = await fetch(API_URL);
    todosOsFuncionarios = await resposta.json();

    // Decide o tipo de exibição pela tela
    if (document.getElementById("lista-funcionarios")) {
      // Caso seja a tela de FUNCIONÁRIOS (bibliotecário vê) → cards
      exibirFuncionariosCards(todosOsFuncionarios);
    }
    if (document.querySelector("#lista-bibliotecarios tbody")) {
      // Caso seja a tela de BIBLIOTECÁRIOS (admin vê) → tabela
      exibirFuncionariosTabela(todosOsFuncionarios);
    }

  } catch (erro) {
    console.error("Erro ao carregar funcionários:", erro);
  }
}

// Exibir em CARDS (funcionarios.html → bibliotecário vê)
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

// Exibir em TABELA (bibliotecarios.html → admin vê)
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
        <button class="btn btn-outline-primary btn-sm"><i class="bi bi-eye"></i> Visualizar</button>
        <button class="btn btn-outline-warning btn-sm" onclick="abrirModalEdicao(${f.id})"><i class="bi bi-pencil"></i> Editar</button>
        <button class="btn btn-outline-danger btn-sm" onclick="excluirFuncionario(${f.id})"><i class="bi bi-trash"></i> Excluir</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
