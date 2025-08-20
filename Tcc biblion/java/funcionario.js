document.addEventListener('DOMContentLoaded', carregarFuncionarios);
const API_URL = 'http://localhost:3000/api/funcionarios';
let todosOsFuncionarios = [];

// Só carrega funcionários se o elemento existir
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('lista-funcionarios')) {
    carregarFuncionarios();
  }
});

async function carregarFuncionarios() {
  try {
    const resposta = await fetch(API_URL);
    todosOsFuncionarios = await resposta.json();
    exibirFuncionarios(todosOsFuncionarios);
  } catch (erro) {
    console.error("Erro ao carregar funcionários:", erro);
  }
}

function exibirFuncionarios(funcionarios) {
  const container = document.getElementById('lista-funcionarios');
  if (!container) return; // Se não existir na página, não faz nada

  container.innerHTML = '';
  let row;

  funcionarios.forEach((f, index) => {
    if (index % 3 === 0) {
      row = document.createElement('div');
      row.className = 'row mb-4';
      container.appendChild(row);
    }

    const foto = f.foto 
      ? `http://localhost:3000/uploads/${f.foto}`
      : `http://localhost:3000/uploads/padrao.jpg`;

    const col = document.createElement('div');
    col.className = 'col-md-4 d-flex align-items-stretch';

    col.innerHTML = `
      <div class="card h-100" style="background-color: #d6c9b4;">
        <img src="${foto}" class="card-img-top" alt="${f.nome}" style="height: 300px; object-fit: cover;">
        <div class="card-body text-center">
          <h5 class="card-title fw-bold">${f.nome}</h5>
          <p><strong>Função:</strong> ${f.funcao || 'Não definida'}</p>
          <p><strong>Email:</strong> ${f.email}</p>
          <p><strong>Telefone:</strong> ${f.telefone || '—'}</p>
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

function abrirModalEdicao(id) {
  const funcionario = todosOsFuncionarios.find(f => f.id === id);
  if (!funcionario) return;

  // Só preenche se os campos existirem
  const idField = document.getElementById('id-funcionario');
  if (idField) idField.value = funcionario.id;

  const nomeField = document.getElementById('nome-funcionario');
  if (nomeField) nomeField.value = funcionario.nome;

  const emailField = document.getElementById('email-funcionario');
  if (emailField) emailField.value = funcionario.email;

  const telefoneField = document.getElementById('telefone-funcionario');
  if (telefoneField) telefoneField.value = funcionario.telefone || '';

  const funcaoField = document.getElementById('funcao-funcionario');
  if (funcaoField) funcaoField.value = funcionario.funcao || '';

  const modalElement = document.getElementById('modal-editar');
  if (modalElement) {
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }
}

function fecharModal() {
  const modalElement = document.getElementById('modal-editar');
  if (modalElement) {
    modalElement.style.display = 'none';
  }
}

// Só adiciona evento no formulário se ele existir
const formEditar = document.getElementById('form-editar');
if (formEditar) {
  formEditar.addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('id-funcionario')?.value;
    const dados = {
      nome: document.getElementById('nome-funcionario')?.value,
      email: document.getElementById('email-funcionario')?.value,
      telefone: document.getElementById('telefone-funcionario')?.value,
      funcao: document.getElementById('funcao-funcionario')?.value
    };
    
    fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    }).then(() => {
      fecharModal();
      carregarFuncionarios();
    });
  });
}

// Função para excluir funcionário
function excluirFuncionario(id) {
  if (confirm('Tem certeza que deseja excluir este funcionário?')) {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          carregarFuncionarios(); // Recarrega lista
        }
      })
      .catch(err => console.error('Erro ao excluir funcionário:', err));
  }
}
