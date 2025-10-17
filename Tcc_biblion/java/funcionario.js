// ------------------ CONFIGURAÇÃO DE API ------------------
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

const API_URL_FUNCIONARIOS = `${apiBase()}/api/funcionarios`;
let todosOsFuncionarios = [];
let todasAsFuncoes = [];

// ------------------ AO CARREGAR A PÁGINA ------------------
document.addEventListener("DOMContentLoaded", () => {
  carregarFuncionarios();
  carregarFuncoes();
  atualizarAvatarPerfil();
});

// ------------------ CARREGAR FUNCIONÁRIOS ------------------
async function carregarFuncionarios() {
  try {
    const token = localStorage.getItem("token");
    const resposta = await fetch(API_URL_FUNCIONARIOS, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);

    todosOsFuncionarios = await resposta.json();
    atualizarContadores(todosOsFuncionarios);

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

// ------------------ CONTADORES (opcional) ------------------
function atualizarContadores(funcionarios) {
  const total = funcionarios.length;
  const ativos = funcionarios.filter(f => f.status === "Ativo").length;
  const inativos = funcionarios.filter(f => f.status === "Inativo").length;

  const totalEl = document.getElementById("total-bibliotecarios");
  const ativosEl = document.getElementById("ativos-bibliotecarios");
  const inativosEl = document.getElementById("inativos-bibliotecarios");

  // Só atualiza se os elementos existirem no HTML
  if (totalEl) totalEl.textContent = total;
  if (ativosEl) ativosEl.textContent = ativos;
  if (inativosEl) inativosEl.textContent = inativos;
}

// ------------------ CARREGAR FUNÇÕES (CARGOS) ------------------
async function carregarFuncoes() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/funcoes`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

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

// ------------------ EXIBIR FUNCIONÁRIOS EM CARDS ------------------
function exibirFuncionariosCards(funcionarios) {
  const container = document.getElementById("lista-funcionarios");
  if (!container) return;

  container.innerHTML = "";

  funcionarios.forEach(f => {
    const foto = f.foto
      ? `${apiBase()}/uploads/${f.foto}`
      : `${apiBase()}/uploads/padrao.jpg`;

    const card = document.createElement("div");
    card.className = "card";
    card.style.maxWidth = "300px";

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

// ------------------ ATUALIZAR AVATAR PERFIL ------------------
function atualizarAvatarPerfil() {
  const avatar = document.getElementById("avatarPerfil");
  if (!avatar) return;

  const usuario =
    JSON.parse(localStorage.getItem("usuario")) ||
    JSON.parse(localStorage.getItem("funcionario"));

  const foto = usuario?.foto
    ? `${apiBase()}/uploads/${usuario.foto}`
    : `${apiBase()}/uploads/padrao.jpg`;

  avatar.src = foto;
}

// ------------------ EXIBIR FUNCIONÁRIOS EM TABELA ------------------
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
        <button class="btn btn-outline-warning btn-sm" onclick="abrirModalEdicao(${f.id})">
          <i class="bi bi-pencil"></i> Editar
        </button>
        <button class="btn btn-outline-danger btn-sm" onclick="excluirFuncionario(${f.id})">
          <i class="bi bi-trash"></i> Excluir
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ------------------ ABRIR MODAL DE EDIÇÃO ------------------
async function abrirModalEdicao(id) {
  const funcionario = todosOsFuncionarios.find(f => f.id === id);
  if (!funcionario) return;

  await carregarFuncoes();

  document.getElementById("id-funcionario").value = funcionario.id;
  document.getElementById("nome-funcionario").value = funcionario.nome;
  document.getElementById("email-funcionario").value = funcionario.email;
  document.getElementById("telefone-funcionario").value = funcionario.telefone || "";

  const selectFuncao = document.getElementById("funcao-funcionario");
  if (selectFuncao) {
    selectFuncao.innerHTML = "";
    todasAsFuncoes.forEach(f => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.funcao;
      if (f.id === funcionario.FK_funcao_id) option.selected = true;
      selectFuncao.appendChild(option);
    });
  }

  const preview = document.getElementById("previewBox");
  const fotoAtual = funcionario.foto
    ? `${apiBase()}/uploads/${funcionario.foto}`
    : `${apiBase()}/uploads/padrao.jpg`;

  preview.style.backgroundImage = `url('${fotoAtual}')`;

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
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: formData
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Erro ao atualizar funcionário");
        }
        carregarFuncionarios();
        bootstrap.Modal.getInstance(document.getElementById("modal-editar")).hide();
      })
      .catch(err => console.error("Erro ao editar funcionário:", err));
  });
}

// ------------------ EXCLUIR FUNCIONÁRIO ------------------
function excluirFuncionario(id) {
  if (confirm("Tem certeza que deseja excluir este funcionário?")) {
    fetch(`${API_URL_FUNCIONARIOS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    })
      .then(res => {
        if (res.ok) carregarFuncionarios();
      })
      .catch(err => console.error("Erro ao excluir funcionário:", err));
  }
}

// ------------------ MODAL NOVO FUNCIONÁRIO ------------------
async function abrirModalNovo() {
  await carregarFuncoes();
  const select = document.getElementById("funcao-novo");
  select.innerHTML = "";
  todasAsFuncoes.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.id;
    opt.textContent = f.funcao;
    select.appendChild(opt);
  });

  document.getElementById("form-novo").reset();
  new bootstrap.Modal(document.getElementById("modal-novo")).show();
}

// ------------------ SALVAR NOVO FUNCIONÁRIO ------------------
const formNovo = document.getElementById("form-novo");
if (formNovo) {
  formNovo.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome-novo").value);
    formData.append("email", document.getElementById("email-novo").value);
    formData.append("telefone", document.getElementById("telefone-novo").value);
    formData.append("FK_funcao_id", document.getElementById("funcao-novo").value);
    formData.append("status", "Ativo");
    formData.append("senha", gerarSenhaAutomatica());

    const foto = document.getElementById("foto-novo").files[0];
    if (foto) formData.append("foto", foto);

    try {
      const res = await fetch(API_URL_FUNCIONARIOS, {
        method: "POST",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        body: formData
      });

      if (!res.ok) throw new Error("Erro ao cadastrar funcionário");

      bootstrap.Modal.getInstance(document.getElementById("modal-novo")).hide();
      carregarFuncionarios();
      alert("Bibliotecário cadastrado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar funcionário.");
    }
  });
}

// ------------------ GERAR SENHA AUTOMÁTICA ------------------
function gerarSenhaAutomatica() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let senha = "";
  for (let i = 0; i < 8; i++) senha += chars.charAt(Math.floor(Math.random() * chars.length));
  return senha;
}

// 🔥 Deixar funções acessíveis globalmente
window.abrirModalNovo = abrirModalNovo;
window.abrirModalEdicao = abrirModalEdicao;
window.excluirFuncionario = excluirFuncionario;
