document.addEventListener('DOMContentLoaded', () => {
  console.log("script.js carregado!");

  // Cadastro de usuário
  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async function (event) {
      event.preventDefault();

      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      try {
        const response = await fetch('http://localhost:3000/cadastrarAluno', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nome, telefone, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Aluno cadastrado com sucesso!");
          formCadastro.reset();
        } else {
          alert("Erro ao cadastrar aluno: " + data.error);
        }
      } catch (error) {
        console.error("Erro ao enviar dados:", error);
        alert("Erro de rede ou servidor!");
      }
    });
  } else {
    console.warn("Formulário de cadastro não encontrado!");
  }

  // Login
  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      try {
        const response = await fetch('http://localhost:3000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message);

          switch (data.usuario.tipo) {
            case 1:
              window.location.href = './homepageAluno.html';
              break;
            case 2:
              window.location.href = './homepageAdm.html';
              break;
            default:
              alert('Tipo de usuário não reconhecido.');
          }
        } else {
          alert('Erro: ' + data.error);
        }
      } catch (err) {
        console.error('Erro ao fazer login:', err);
        alert('Erro de rede ou servidor.');
      }
    });
  }

  // Controle de checkbox: apenas uma marcada
  const alunoCheckbox = document.getElementById('aluno');
  const professorCheckbox = document.getElementById('professor');

  if (alunoCheckbox && professorCheckbox) {
    alunoCheckbox.addEventListener('change', () => {
      if (alunoCheckbox.checked) {
        professorCheckbox.checked = false;
        console.log("Aluno marcado.");
      }
    });

    professorCheckbox.addEventListener('change', () => {
      if (professorCheckbox.checked) {
        alunoCheckbox.checked = false;
        console.log("Professor marcado.");
      }
    });
  } else {
    console.warn("Checkboxes 'aluno' e 'professor' não encontrados.");
  }
});
