// ==================== CONFIGURAÇÃO DE API ====================
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

// ==================== VARIÁVEIS GLOBAIS ====================
const API_URL_FUNCIONARIOS = `${apiBase()}/api/funcionarios`;
let todosOsFuncionarios = [];
let todasAsFuncoes = [];

// ==================== AO CARREGAR A PÁGINA ====================
document.addEventListener("DOMContentLoaded", () => {
  carregarFuncionarios();
  carregarFuncoes();
});

// ==================== CARREGAR FUNCIONÁRIOS ====================
async function carregarFuncionarios() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(API_URL_FUNCIONARIOS, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

    todosOsFuncionarios = await res.json();

    // Ajusta o status com base no último login
  // Ajusta o status com base no último login
todosOsFuncionarios = todosOsFuncionarios.map((f) => {
  const ultimoLogin = f.ultimo_login ? new Date(f.ultimo_login) : null;
  const agora = new Date();

  // Calcula quantos dias desde o último login
  const diasSemLogin = ultimoLogin
    ? Math.floor((agora - ultimoLogin) / (1000 * 60 * 60 * 24))
    : Infinity;

  // Regras corretas:
  // - Se nunca logou → Inativo
  // - Se logou há menos de 15 dias → Ativo
  // - Se logou há 15 dias ou mais → Inativo
  const status =
    ultimoLogin && diasSemLogin < 15 ? "Ativo" : "Inativo";

  return { ...f, status };
});


if (document.getElementById("lista-funcionarios")) {
  exibirFuncionariosCards(todosOsFuncionarios);
} else {
  exibirFuncionarios(todosOsFuncionarios); // versão tabela
}
    atualizarContadores();
  } catch (err) {
    console.error("Erro ao carregar funcionários:", err);
  }
}

// ------------------ EXIBIR FUNCIONÁRIOS EM CARDS ------------------

function exibirFuncionariosCards(funcionarios) {
  console.log("Renderizando cards:", funcionarios.length);
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
    console.log("Card criado para:", f.nome);
  });
}
// ==================== EXIBIR FUNCIONÁRIOS EM TABELA ====================
function exibirFuncionarios(funcionarios) {
  const tbody = document.getElementById("tbody-funcionarios");
  if (!tbody) return;

  tbody.innerHTML = "";

  funcionarios.forEach((f) => {
    const foto = f.foto
      ? `${apiBase()}/uploads/${f.foto}`
      : `${apiBase()}/uploads/padrao.jpg`;

    const corStatus = f.status === "Ativo" ? "text-success" : "text-danger";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${foto}" alt="foto" style="width:50px; height:50px; object-fit:cover; border-radius:50%;"></td>
      <td>${f.nome}</td>
      <td>${f.funcao || "—"}</td>
      <td>${f.email}</td>
      <td>${f.telefone || "—"}</td>
      <td class="${corStatus} fw-bold">${f.status}</td>
      <td class="text-center">
        <button class="btn btn-dark btn-sm me-2" onclick="abrirModalEdicao(${f.id})">
          Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="excluirFuncionario(${f.id})">
          Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==================== CARREGAR FUNÇÕES (PARA SELECT) ====================
async function carregarFuncoes() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/funcoes`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

    todasAsFuncoes = await res.json();

    const select = document.getElementById("funcao-funcionario");
    if (!select) return;

    select.innerHTML = "";
    todasAsFuncoes.forEach((f) => {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.funcao;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Erro ao carregar funções:", err);
  }
}

// ==================== ABRIR MODAL DE EDIÇÃO ====================
async function abrirModalEdicao(id) {
  const funcionario = todosOsFuncionarios.find((f) => f.id === id);
  if (!funcionario) return;

  await carregarFuncoes();

  document.getElementById("id-funcionario").value = funcionario.id;
  document.getElementById("nome-funcionario").value = funcionario.nome;
  document.getElementById("email-funcionario").value = funcionario.email;
  document.getElementById("telefone-funcionario").value =
    funcionario.telefone || "";
  document.getElementById("funcao-funcionario").value =
    funcionario.FK_funcao_id || "";

  const previewBox = document.getElementById("previewBox");
  const fotoAtual = funcionario.foto
    ? `${apiBase()}/uploads/${funcionario.foto}`
    : `${apiBase()}/uploads/padrao.jpg`;
  previewBox.style.backgroundImage = `url('${fotoAtual}')`;

  const modalEl = document.getElementById("modal-editar");
  if (!modalEl) return;
  const modal = new bootstrap.Modal(modalEl, {
    backdrop: "static",
    keyboard: false,
  });
  modal.show();
}

function fecharModal() {
  const modalEl = document.getElementById("modal-editar");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

// ==================== EDITAR FUNCIONÁRIO ====================

document
  .getElementById("form-editar")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const id = document.getElementById("id-funcionario").value;

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome-funcionario").value);
    formData.append("email", document.getElementById("email-funcionario").value);
    formData.append(
      "telefone",
      document.getElementById("telefone-funcionario").value
    );
    formData.append(
      "FK_funcao_id",
      document.getElementById("funcao-funcionario").value
    );

    const fotoInput = document.getElementById("foto-funcionario");
    if (fotoInput && fotoInput.files.length > 0) {
      formData.append("foto", fotoInput.files[0]);
    }

    fetch(`${API_URL_FUNCIONARIOS}/${id}`, {
      method: "PUT",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          fecharModal();
          carregarFuncionarios();
        } else {
          alert("Erro ao atualizar funcionário!");
        }
      })
      .catch((err) => console.error("Erro ao editar funcionário:", err));
  });

// ==================== EXCLUIR FUNCIONÁRIO ====================
function excluirFuncionario(id) {
  if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

  fetch(`${API_URL_FUNCIONARIOS}/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  })
    .then((res) => {
      if (res.ok) carregarFuncionarios();
    })
    .catch((err) => console.error("Erro ao excluir funcionário:", err));
}

// ==================== CONTADORES ====================
function atualizarContadores() {
  const totalEl = document.getElementById("total-funcionarios");
  const ativosEl = document.getElementById("ativos-funcionarios");
  const inativosEl = document.getElementById("inativos-funcionarios");

  if (!totalEl || !ativosEl || !inativosEl) return;

  const total = todosOsFuncionarios.length;
  const ativos = todosOsFuncionarios.filter((f) => f.status === "Ativo").length;
  const inativos = todosOsFuncionarios.filter((f) => f.status === "Inativo").length;

  totalEl.textContent = total;
  ativosEl.textContent = ativos;
  inativosEl.textContent = inativos;
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
// ==================== FILTROS E BUSCA ====================

// 🔍 Campo de busca
const campoBusca = document.getElementById("buscar-usuario");
if (campoBusca) {
    campoBusca.addEventListener("input", aplicarFiltros);
}

// 🟩⬜ Filtro de status
const filtroStatus = document.getElementById("filtro-status");
if (filtroStatus) {
    filtroStatus.addEventListener("change", aplicarFiltros);
}

// 🔤 Ordenar por ordem alfabética
const checkOrdem = document.getElementById("ordenar-alfabetica");
if (checkOrdem) {
    checkOrdem.addEventListener("change", aplicarFiltros);
}

// -------------------- FUNÇÃO PRINCIPAL DE FILTRAGEM --------------------
function aplicarFiltros() {
    let lista = [...todosOsFuncionarios];

    // 🔍 FILTRO DE BUSCA
    const termo = campoBusca ? campoBusca.value.toLowerCase() : "";
    if (termo.trim() !== "") {
        lista = lista.filter(f =>
            f.nome.toLowerCase().includes(termo) ||
            (f.email && f.email.toLowerCase().includes(termo))
        );
    }

    // 🟩⬜ FILTRO DE STATUS
    const statusSelecionado = filtroStatus ? filtroStatus.value : "Todos";
    if (statusSelecionado !== "Todos") {
        lista = lista.filter(f => f.status === statusSelecionado);
    }

    // 🔤 ORDENAR
    if (checkOrdem && checkOrdem.checked) {
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    // Renderiza corretamente para Tabela ou Cards
    if (document.getElementById("lista-funcionarios")) {
        exibirFuncionariosCards(lista);
    } else {
        exibirFuncionarios(lista);
    }
}
