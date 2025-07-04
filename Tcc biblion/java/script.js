document.addEventListener('DOMContentLoaded', () => {
  // ----------- LÓGICA DE CADASTRO ------------
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
// Checar checkbox
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
// ----------- LÓGICA DE LOGIN ------------
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
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();
    console.log('Resposta do login:', data);

    if (response.ok) {
      // Declarando a variável aqui dentro para estar no escopo correto
      const usuario = data.usuario;
      console.log('Tipo do usuário:', usuario.tipo);

      const tipoUsuario = Number(usuario.tipo);

      if (tipoUsuario === 1) {
        window.location.href = './areaAluno.html';
      } else if (tipoUsuario === 2) {
        window.location.href = './areaProfessor.html';
      } else {
        console.log('Tipo de usuário não reconhecido:', usuario.tipo);
      }

    } else {
      alert("Erro ao fazer login: " + data.error);
    }

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert("Erro de rede ou servidor!");
  }
});
}
  // ----------- ANIMAÇÃO AO CARREGAR O SITE ------------
const frameImg = document.getElementById("frame");
  const animDiv = document.getElementById("animacao-logo");
  const loginBox = document.querySelector(".login-box");

  const totalFrames = 11;
  const delay = 200; // ms entre os frames
  let atual = 1;

  const preloadImages = () => {
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `../img/animacao/${i}.png`;
    }
  };

  const animar = () => {
    if (atual > totalFrames) {
      animDiv.style.display = "none";
      loginBox.style.display = "block";
      document.body.style.overflow = "auto";
      return;
    }

    frameImg.src = `../img/animacao/${atual}.png`;
    atual++;
    setTimeout(animar, delay);
  };

  preloadImages();
  setTimeout(animar, 300); // aguarda o carregamento e inicia após 300ms
});
