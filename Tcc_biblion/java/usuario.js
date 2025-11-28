// ------------------ CONFIGURAÇÃO DE API ------------------
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarios();
  carregarTiposUsuario();
});

let todosOsUsuarios = [];

// ------------------ CARREGAR USUÁRIOS ------------------
async function carregarUsuarios() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/api/usuarios`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

    // 1️⃣ Aqui você ESQUECEU — isso carrega os usuários do banco
    todosOsUsuarios = await res.json();

    // 2️⃣ Agora sim podemos transformar o status corretamente
    todosOsUsuarios = todosOsUsuarios.map((u) => {
      const ultimoLogin = u.ultimo_login ? new Date(u.ultimo_login) : null;
      const agora = new Date();

      const diasSemLogin = ultimoLogin
        ? Math.floor((agora - ultimoLogin) / (1000 * 60 * 60 * 24))
        : Infinity;

      // mesma regra dos funcionários
      const status = ultimoLogin && diasSemLogin < 15 ? "Ativo" : "Inativo";

      return { ...u, status };
    });

    exibirUsuarios(todosOsUsuarios);
    atualizarContadores(todosOsUsuarios);

  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

// ------------------ EXIBIR USUÁRIOS EM CARDS ------------------
function exibirUsuariosCards(usuarios) {
  const container = document.getElementById('lista-usuarios');
  if (!container) return; // se não existe, sai (talvez a página use tabela)
  container.innerHTML = '';

  usuarios.forEach(u => {
    const foto = u.foto
      ? `${apiBase()}/uploads/${u.foto}`
      : `${apiBase()}/uploads/padrao.jpg`;

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${foto}" class="card-img-top" alt="${u.nome}" style="height:180px; object-fit:cover;">
      <div class="card-body text-center">
        <h5 class="card-title fw-bold">${u.nome}</h5>
        <p><strong>Tipo:</strong> ${u.tipo || 'Não definido'}</p>
        <p><strong>Email:</strong> ${u.email}</p>
        <p><strong>Telefone:</strong> ${u.telefone || '—'}</p>
      </div>
      <div class="card-footer text-center">
        <button class="btn btn-danger me-2" onclick="excluirUsuario(${u.id})">Excluir</button>
        <button class="btn btn-dark" onclick="abrirModalEdicao(${u.id})">Editar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// ------------------ EXIBIR EM TABELA ------------------
function exibirUsuariosTabela(usuarios) {
  const tbody = document.getElementById("tbody-usuarios");
  if (!tbody) return;
  tbody.innerHTML = "";

  usuarios.forEach((u) => {
    const foto = u.foto
      ? `${apiBase()}/uploads/${u.foto}`
      : `${apiBase()}/uploads/padrao.jpg`;

    const tr = document.createElement("tr");
    const corStatus = u.status === "Ativo" ? "text-success" : "text-danger";

    tr.innerHTML = `
      <td><img src="${foto}" alt="foto" style="width:50px; height:50px; object-fit:cover; border-radius:50%;"></td>
      <td>${u.nome}</td>
      <td>${u.tipo || "Não definido"}</td>
      <td>${u.email}</td>
      <td>${u.telefone || "—"}</td>
      <td class="${corStatus} fw-bold">${u.status}</td>
      <td class="text-center">
        <button class="btn btn-dark btn-sm me-2" onclick="abrirModalEdicao(${u.id})">
          Editar
        </button>
        <button class="btn btn-danger btn-sm" onclick="excluirUsuario(${u.id})">
          Excluir
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------ CARREGAR TIPOS DE USUÁRIO ------------------
async function carregarTiposUsuario() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/tipos-usuario`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) throw new Error("Erro HTTP " + res.status);

    const tipos = await res.json();
    const select = document.getElementById("tipo-usuario");
    if (!select) return tipos;

    select.innerHTML = "";

    tipos.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.tipo;
      select.appendChild(option);
    });

    return tipos;
  } catch (err) {
    console.error("Erro ao carregar tipos de usuário:", err);
    return [];
  }
}

// ------------------ MODAL DE EDIÇÃO ------------------
async function abrirModalEdicao(id) {
  const usuario = todosOsUsuarios.find((u) => u.id === id);
  if (!usuario) return;

  await carregarTiposUsuario();

  document.getElementById("id-usuario").value = usuario.id;
  document.getElementById("nome-usuario").value = usuario.nome;
  document.getElementById("email-usuario").value = usuario.email;
  document.getElementById("telefone-usuario").value = usuario.telefone || "";
  document.getElementById("tipo-usuario").value =
    usuario.FK_tipo_usuario_id || "";

  const previewBox = document.getElementById("previewBox");
  const fotoAtual = usuario.foto
    ? `${apiBase()}/uploads/${usuario.foto}`
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

// ------------------ EDITAR USUÁRIO ------------------
const API_URL_USUARIOS = `${apiBase()}/api/usuarios`;

document
  .getElementById("form-editar")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const id = document.getElementById("id-usuario").value;

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome-usuario").value);
    formData.append("email", document.getElementById("email-usuario").value);
    formData.append("telefone", document.getElementById("telefone-usuario").value);
    formData.append("FK_tipo_usuario_id", document.getElementById("tipo-usuario").value);

    const fotoInput = document.getElementById("foto");
    if (fotoInput && fotoInput.files.length > 0) {
      formData.append("foto", fotoInput.files[0]);
    }

    fetch(`${API_URL_USUARIOS}/${id}`, {
      method: "PUT",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: formData,
    })
      .then((res) => {
        if (res.ok) {
          fecharModal();
          carregarUsuarios();
        }
      })
      .catch((err) => console.error("Erro ao editar usuário:", err));
  });

// ------------------ EXCLUIR ------------------
function excluirUsuario(id) {
  if (confirm("Tem certeza que deseja excluir este usuário?")) {
    fetch(`${API_URL_USUARIOS}/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((res) => {
        if (res.ok) carregarUsuarios();
      })
      .catch((err) => console.error("Erro ao excluir usuário:", err));
  }
}
// ==================== EXIBIR USUÁRIOS (AUTO — tabela ou cards) ====================
function exibirUsuarios(lista) {

    // Se existir lista em formato de cards
    if (document.getElementById("lista-usuarios")) {
        exibirUsuariosCards(lista);
        return;
    }

    // Caso contrário, use a tabela
    if (document.getElementById("tbody-usuarios")) {
        exibirUsuariosTabela(lista);
        return;
    }

    console.warn("Nenhum container encontrado para exibir usuários.");
}

// ------------------ FUNÇÃO PRINCIPAL DE FILTRAGEM ------------------
function filtrarUsuarios() {
    let lista = [...todosOsUsuarios];

    // 🔎 Busca
    const termo = document.getElementById("busca")?.value.toLowerCase() || "";
    if (termo !== "") {
        lista = lista.filter(u =>
            u.nome.toLowerCase().includes(termo) ||
            u.email.toLowerCase().includes(termo)
        );
    }

    // ✔ Filtro de status
    const statusFiltro = document.getElementById("filtro-status")?.value || "todos";
    if (statusFiltro !== "todos") {
        lista = lista.filter(u => u.status === statusFiltro);
    }

    // 🔤 Ordem Alfabética
    const ordenar = document.getElementById("organizeAlphabetically")?.checked;
    if (ordenar) {
        lista.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    exibirUsuarios(lista);
    atualizarContadores();
}

// ------------------ EVENTOS DOS FILTROS ------------------
document.getElementById("busca")?.addEventListener("input", filtrarUsuarios);
document.getElementById("filtro-status")?.addEventListener("change", filtrarUsuarios);
document.getElementById("organizeAlphabetically")?.addEventListener("change", filtrarUsuarios);

// ------------------ CONTADORES AJUSTADOS (ACEITA LISTA OPCIONAL) ------------------
function atualizarContadores(lista = null) {
  // usa lista passada ou o array global
  const items = Array.isArray(lista) ? lista :
                (Array.isArray(todosOsUsuarios) ? todosOsUsuarios : []);

  // tenta obter os elementos (se não existirem, apenas ignora em vez de lançar)
  const totalEl = document.getElementById("total-usuarios");
  const ativosEl = document.getElementById("ativos-usuarios");
  const inativosEl = document.getElementById("inativos-usuarios");

  const total = items.length;
  const ativos = items.filter(u => u.status === "Ativo").length;
  const inativos = items.filter(u => u.status === "Inativo").length;

  if (totalEl) totalEl.textContent = total;
  if (ativosEl) ativosEl.textContent = ativos;
  if (inativosEl) inativosEl.textContent = inativos;
}

// ----------------------- FILTRO POR CURSO (suporta "Professores") -----------------------
document.querySelectorAll("#filtro-turma .dropdown-item")?.forEach(item => {
  item.addEventListener("click", () => {
    const raw = item.getAttribute("data-turma") || item.textContent || "";
    const cursoSelecionado = raw.trim().toLowerCase();
    let lista = Array.isArray(todosOsUsuarios) ? [...todosOsUsuarios] : [];

    if (cursoSelecionado === "todos") {
      exibirUsuarios(lista);
      atualizarContadores(lista);
      document.getElementById("filtro-turma-btn").textContent = item.textContent;
      return;
    }

    // Caso especial: Professores
    if (cursoSelecionado === "professores" || cursoSelecionado === "professor" || cursoSelecionado === "prof") {
      lista = lista.filter(u => {
        const tipo = (u.tipo || u.FK_tipo_usuario_id || "").toString().toLowerCase();
        // aceita tanto "Professor" quanto FK_tipo_usuario_id === 2
        return tipo.includes("prof") || tipo === "2" || Number(tipo) === 2;
      });
    } else {
      // filtro normal por nome_curso (caso-insensível)
      lista = lista.filter(u => {
        const nomeCurso = (u.nome_curso || "").toString().toLowerCase();
        return nomeCurso.includes(cursoSelecionado);
      });
    }

    exibirUsuarios(lista);
    atualizarContadores(lista);
    document.getElementById("filtro-turma-btn").textContent = item.textContent;
  });
});

