document.addEventListener('DOMContentLoaded', carregarUsuarios);
  let todosOsUsuarios = [];

async function carregarUsuarios() {
  try {
    const res = await fetch('http://localhost:3000/api/usuarios');
    todosOsUsuarios = await res.json();
    exibirUsuarios(todosOsUsuarios);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

function exibirUsuarios(usuarios) {
  const container = document.getElementById('lista-usuarios');
  container.innerHTML = '';

  let row;
  usuarios.forEach((u, index) => {
    if (index % 3 === 0) {
      row = document.createElement('div');
      row.className = 'row mb-4';
      container.appendChild(row);
    }

    const foto = u.foto 
      ? `http://localhost:3000/uploads/${u.foto}`
      : `http://localhost:3000/uploads/padrao.jpg`;

    const col = document.createElement('div');
    col.className = 'col-md-4 d-flex align-items-stretch';
    col.innerHTML = `
      <div class="card h-100" style="background-color: #d6c9b4;">
        <img src="${foto}" class="card-img-top" alt="${u.nome}" style="height: 300px; object-fit: cover;">
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
      </div>
    `;
    row.appendChild(col);
  });
}

// Torna a função global para uso no onclick inline
function abrirModalEdicao(id) {
  const usuario = todosOsUsuarios.find(u => u.id === id);
  if (!usuario) return;

  document.getElementById('id-usuario').value = usuario.id;
  document.getElementById('nome-usuario').value = usuario.nome;
  document.getElementById('email-usuario').value = usuario.email;
  document.getElementById('telefone-usuario').value = usuario.telefone || '';
  document.getElementById('tipo-usuario').value = usuario.FK_tipo_usuario_id || '';
  
  const modal = new bootstrap.Modal(document.getElementById('modal-editar'));
  modal.show();
}
const API_URL = 'http://localhost:3000/api/usuarios'; // Atualizado para usuários

function fecharModal() {
  const modalEl = document.getElementById('modal-editar');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

// Evento de submit do formulário de edição
document.getElementById('form-editar').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('id-usuario').value;
  const dados = {
    nome: document.getElementById('nome-usuario').value,
    email: document.getElementById('email-usuario').value,
    telefone: document.getElementById('telefone-usuario').value,
    tipo: document.getElementById('tipo-usuario').value
  };
  
  fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
  .then(res => {
    if (res.ok) {
      fecharModal();
      carregarUsuarios(); // Recarrega a lista de usuários
    }
  })
  .catch(err => console.error('Erro ao editar usuário:', err));
});

// Função para excluir usuário
function excluirUsuario(id) {
  if (confirm('Tem certeza que deseja excluir este usuário?')) {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          carregarUsuarios(); // Recarrega lista de usuários
        }
      })
      .catch(err => console.error('Erro ao excluir usuário:', err));
  }
}
