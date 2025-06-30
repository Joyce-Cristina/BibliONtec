document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async function (event) {
      event.preventDefault();

      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const tipo = document.getElementById('aluno').checked ? 1 : (document.getElementById('professor').checked ? 2 : null);
      const foto = document.getElementById('foto').files[0];

      if (!nome || !telefone || !email || !senha || !tipo) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('telefone', telefone);
      formData.append('email', email);
      formData.append('senha', senha);
      formData.append('tipo_usuario_id', tipo);
      if (foto) formData.append('foto', foto);

      try {
        const response = await fetch('http://localhost:3000/cadastrarAluno', {
          method: 'POST',
          body: formData
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
  }

  const alunoCheckbox = document.getElementById('aluno');
  const professorCheckbox = document.getElementById('professor');

  if (alunoCheckbox && professorCheckbox) {
    alunoCheckbox.addEventListener('change', () => {
      if (alunoCheckbox.checked) professorCheckbox.checked = false;
    });

    professorCheckbox.addEventListener('change', () => {
      if (professorCheckbox.checked) alunoCheckbox.checked = false;
    });
  }
});
