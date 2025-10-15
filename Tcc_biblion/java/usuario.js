function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}

document.addEventListener('DOMContentLoaded', () => {
  carregarUsuarios();
  carregarTiposUsuario(); // carrega os tipos logo ao abrir
});

let todosOsUsuarios = [];

// ------------------ CARREGAR USUÁRIOS ------------------
async function carregarUsuarios() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/api/usuarios`, {

      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      throw new Error("Erro HTTP " + res.status);
    }

    todosOsUsuarios = await res.json();
    exibirUsuarios(todosOsUsuarios);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

function exibirUsuarios(usuarios) {
  const container = document.getElementById('lista-usuarios');
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

// ------------------ CARREGAR TIPOS DE USUÁRIO ------------------
async function carregarTiposUsuario() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${apiBase()}/tipos-usuario`, {

      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      throw new Error("Erro HTTP " + res.status);
    }

    const tipos = await res.json();
    const select = document.getElementById('tipo-usuario');
    select.innerHTML = ''; // limpa antes

    tipos.forEach(t => {
      const option = document.createElement('option');
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

// ------------------ ABRIR MODAL ------------------
async function abrirModalEdicao(id) {
  const usuario = todosOsUsuarios.find(u => u.id === id);
  if (!usuario) return;

  await carregarTiposUsuario();

  document.getElementById('id-usuario').value = usuario.id;
  document.getElementById('nome-usuario').value = usuario.nome;
  document.getElementById('email-usuario').value = usuario.email;
  document.getElementById('telefone-usuario').value = usuario.telefone || '';
  document.getElementById('tipo-usuario').value = usuario.FK_tipo_usuario_id || '';

  // 👇 seta a imagem atual no preview
  const previewBox = document.getElementById('previewBox');
  const fotoAtual = usuario.foto
    ? `${apiBase()}/uploads/${usuario.foto}`
    : `${apiBase()}/uploads/padrao.jpg`;

  previewBox.style.backgroundImage = `url('${fotoAtual}')`;

  const modal = new bootstrap.Modal(document.getElementById('modal-editar'));
  modal.show();
}

// ------------------ FECHAR MODAL ------------------
function fecharModal() {
  const modalEl = document.getElementById('modal-editar');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

// ------------------ SALVAR EDIÇÃO ------------------
const API_URL_USUARIOS = `${apiBase()}/api/usuarios`;


document.getElementById('form-editar').addEventListener('submit', function (e) {
  e.preventDefault();
  const id = document.getElementById('id-usuario').value;

  const formData = new FormData();
  formData.append("nome", document.getElementById('nome-usuario').value);
  formData.append("email", document.getElementById('email-usuario').value);
  formData.append("telefone", document.getElementById('telefone-usuario').value);
  formData.append("FK_tipo_usuario_id", document.getElementById('tipo-usuario').value);

  const fotoInput = document.getElementById('foto');
  if (fotoInput && fotoInput.files.length > 0) {
    formData.append("foto", fotoInput.files[0]);
  }

  fetch(`${API_URL_USUARIOS}/${id}`, {
    method: 'PUT',
    headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
    body: formData
  })
    .then(res => {
      if (res.ok) {
        fecharModal();
        carregarUsuarios();
      }
    })
    .catch(err => console.error('Erro ao editar usuário:', err));
});

// ------------------ EXCLUIR USUÁRIO ------------------
function excluirUsuario(id) {
  if (confirm('Tem certeza que deseja excluir este usuário?')) {
    fetch(`${API_URL_USUARIOS}/${id}`, {
      method: 'DELETE',
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    })
      .then(res => {
        if (res.ok) {
          carregarUsuarios(); // Recarrega lista de usuários
        }
      })
      .catch(err => console.error('Erro ao excluir usuário:', err));
  }
}

