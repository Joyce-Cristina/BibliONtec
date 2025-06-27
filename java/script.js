//cadastro de usuario
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCadastro');

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault(); 

      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const tipo_usuario_id = document.getElementById('categoriaUsuario').value;

      if (!tipo_usuario_id) {
        alert("Por favor, selecione uma categoria de usuário.");
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/cadastrarAluno', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nome, telefone, email, senha, tipo_usuario_id })
        });

        const data = await response.json();

        if (response.ok) {
          alert(data.message || "Aluno cadastrado com sucesso!");
          form.reset(); // limpa os campos
        } else {
          alert("Erro ao cadastrar aluno: " + data.error);
        }
      } catch (error) {
        console.error("Erro ao enviar dados:", error);
        alert("Erro de rede ou servidor!");
      }
    });
  } else {
    console.warn("Formulário não encontrado!");
  }
});

  //login
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
  
    if (form) {
      form.addEventListener('submit', async (event) => {
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
  });

  document.addEventListener('DOMContentLoaded', () => {
    const alunoCheckbox = document.getElementById('aluno');
    const professorCheckbox = document.getElementById('professor');
  
    if (alunoCheckbox && professorCheckbox) {
      alunoCheckbox.addEventListener('change', () => {
        if (alunoCheckbox.checked) {
          professorCheckbox.checked = false;
        }
      });
  
      professorCheckbox.addEventListener('change', () => {
        if (professorCheckbox.checked) {
          alunoCheckbox.checked = false;
        }
      });
    }
  });
  