// Função auxiliar para criar/usar caixa de erro
function getOrCreateErrorBox(id, form) {
  let box = document.getElementById(id);
  if (!box) {
    box = document.createElement('div');
    box.id = id;
    box.style.color = 'red';
    box.style.marginTop = '10px';
    form.appendChild(box);
  }
  return box;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Script JS carregado!");

  // ----------- LÓGICA DE CADASTRO DE ALUNO ------------
  const formCadastro = document.getElementById('formCadastro');

  if (formCadastro) {
    const professorCheckbox = document.getElementById('professor');
    const alunoCheckbox = document.getElementById('aluno');
    const cursoSelect = document.getElementById('curso');
    const serieSelect = document.getElementById('serie');
    const cursoGroup = document.getElementById('cursoGroup');
    const serieGroup = document.getElementById('serieGroup');
    const previewBox = document.querySelector("div[style*='background-color: #5d3b1a']");
    const fotoInput = document.getElementById("foto");
    const funcionarioLogado = JSON.parse(localStorage.getItem("funcionario"));
    const funcionario_id = funcionarioLogado ? funcionarioLogado.id : null;

    function atualizarCampos() {
      const isProfessor = professorCheckbox.checked;

      if (isProfessor) {
        cursoGroup.classList.add('oculto');
        serieGroup.classList.add('oculto');
        cursoSelect.removeAttribute('required');
        serieSelect.removeAttribute('required');
        cursoSelect.value = "";
        serieSelect.value = "";
      } else {
        cursoGroup.classList.remove('oculto');
        serieGroup.classList.remove('oculto');
        cursoSelect.setAttribute('required', 'required');
        serieSelect.setAttribute('required', 'required');
      }
    }

    alunoCheckbox.addEventListener("change", () => {
      if (alunoCheckbox.checked) professorCheckbox.checked = false;
      atualizarCampos();
    });

    professorCheckbox.addEventListener("change", () => {
      if (professorCheckbox.checked) alunoCheckbox.checked = false;
      atualizarCampos();
    });

    fotoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        previewBox.style.backgroundImage = `url('${event.target.result}')`;
        previewBox.style.backgroundSize = "cover";
        previewBox.style.backgroundPosition = "center";
      };
      reader.readAsDataURL(file);
    });

    atualizarCampos(); // Executa ao carregar a página

    formCadastro.addEventListener('submit', async function (event) {
      event.preventDefault();

      const nome = document.getElementById('nome').value;
      const telefone = document.getElementById('telefone').value;
      const email = document.getElementById('email').value;
      const senhaInput = document.getElementById('senha');
      let senha = senhaInput.value;

      if (!senha) {
        senha = gerarSenhaSegura();
        senhaInput.value = senha;
        alert(`Senha gerada automaticamente: ${senha}`);
      } else if (!validarSenha(senha)) {
        alert("Senha inválida! A senha deve conter exatamente 8 caracteres, com pelo menos:\n- 1 letra maiúscula (A-Z)\n- 1 letra minúscula (a-z)\n- 1 número (0-9)");
        return;
      }

      const tipo = alunoCheckbox.checked ? 1 : (professorCheckbox.checked ? 2 : null);
      const foto = fotoInput.files[0];

      if (!nome || !telefone || !email || !senha || !tipo) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }

      const cursoTexto = cursoSelect.value;
      const serieTexto = serieSelect.value;

      const cursoMap = {
        "Desenvolvimento de Sistemas": 1,
        "Administração": 2,
        "Automação Industrial": 3
      };
      const serieMap = {
        "1º": 1,
        "2º": 2,
        "3º": 3
      };

      const curso_id = cursoMap[cursoTexto];
      const serie = serieMap[serieTexto];

      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('telefone', telefone);
      formData.append('email', email);
      formData.append('senha', senha);
      formData.append('tipo_usuario_id', tipo);
      formData.append('curso_id', curso_id || "");
      formData.append('serie', serie || "");
      formData.append('funcionario_id', funcionario_id || "");
      if (foto) formData.append('foto', foto);

      try {
        const response = await fetch('http://localhost:3000/cadastrarAluno', {
          method: 'POST',
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
          },
          body: formData
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const erroDiv = getOrCreateErrorBox('mensagemErroAluno', formCadastro);
          erroDiv.innerText = data.error || 'Erro ao cadastrar aluno.';
          erroDiv.style.display = 'block';
          return;
        }

        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          alert(data.message || "Usuário cadastrado!");
          formCadastro.reset();
          atualizarCampos();
          previewBox.style.backgroundImage = '';
        } else {
          const text = await response.text();
          console.warn("Resposta inesperada:", text);
          alert("Resposta inesperada do servidor.");
        }
      } catch (error) {
        console.error("Erro ao enviar dados:", error);
        alert("Erro de rede ou servidor!");
      }
    });
  }

  document.querySelectorAll('.apenasTexto').forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    });
  });

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

        if (!response.ok) {
          alert("Erro ao fazer login: " + (data.error || "desconhecido"));
          return;
        }

        if (!data.token) {
          alert("Login falhou: token não recebido.");
          return;
        }

        // Salva o token
        localStorage.setItem("token", data.token);

        // Decide o redirecionamento de acordo com role
        if (data.usuario) {
          const tipo = Number(data.usuario.tipo_usuario_id);
          if (tipo === 1) {
            window.location.href = './homepageAluno.html';
          } else if (tipo === 2) {
            window.location.href = './homepageProf.html';
          } else {
            alert('Tipo de usuário não reconhecido.');
          }
        } else if (data.funcionario) {
          const funcao = Number(data.funcionario.funcao_id);
          localStorage.setItem("funcionario", JSON.stringify(data.funcionario));
          switch (funcao) {
            case 1:
              window.location.href = './homepageAdm2.html'; // Administrador
              break;
            case 2:
            case 3:
            case 4:
              window.location.href = './homepageAdm.html'; // Bibliotecário, Circulação, Catalogação
              break;
            default:
              alert("Função não reconhecida! funcao_id: " + funcao);
          }
        } else {
          alert("Resposta inesperada do servidor.");
        }

      } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert("Erro de rede ou servidor!");
      }
    });
  }

  // ----------- VALIDAÇÃO DE TOKEN E ACESSO ------------
  (function () {
    const pagina = window.location.pathname.split("/").pop();

    if (pagina === "index.html") return;

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "index.html";
      return;
    }

    function parseJwt(t) {
      try {
        return JSON.parse(atob(t.split('.')[1]));
      } catch (e) {
        return null;
      }
    }

    const payload = parseJwt(token);
    if (!payload) {
      alert("Sessão inválida. Faça login novamente.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
      return;
    }

  })();

// ----------- LÓGICA DE CADASTRO DE FUNCIONÁRIO ------------
const formFunc = document.getElementById('formFuncionario');
if (formFunc) {
  formFunc.addEventListener('submit', async function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const senhaInput = document.getElementById('senha');
    let senha = senhaInput.value;

    if (!senha) {
      senha = gerarSenhaSegura();
      senhaInput.value = senha;
      alert(`Senha gerada automaticamente: ${senha}`);
    } else if (!validarSenha(senha)) {
      alert("Senha inválida! A senha deve conter pelo menos 8 caracteres, com pelo menos:\n- 1 letra maiúscula\n- 1 letra minúscula\n- 1 número");
      return;
    }

    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const foto = document.getElementById('foto').files[0];

    // funções múltiplas
    const funcaoSelect = document.getElementById('funcao');
    const funcoesSelecionadas = [...funcaoSelect.selectedOptions].map(opt => opt.value);

    if (!nome || !senha || !email) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('senha', senha);
    formData.append('email', email);
    formData.append('telefone', telefone);
    if (foto) formData.append('foto', foto);
    funcoesSelecionadas.forEach(f => formData.append('FK_funcao_id[]', f));

    try {
      const response = await fetch('http://localhost:3000/cadastrarFuncionario', {
        method: 'POST',
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: formData
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const erroDiv = getOrCreateErrorBox('mensagemErroFuncionario', formFunc);
        erroDiv.innerText = data.error || 'Erro ao cadastrar funcionário.';
        erroDiv.style.display = 'block';
        return;
      }

      alert(data.message || 'Funcionário cadastrado com sucesso!');
      formFunc.reset();
      atualizarTextoFuncoes();
    } catch (error) {
      alert('Erro ao enviar o formulário. Tente novamente.');
    }
  });
}


// Funções auxiliares
function gerarSenhaSegura() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
}

function validarSenha(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(senha);
}

function getOrCreateErrorBox(id, form) {
  let box = document.getElementById(id);
  if (!box) {
    box = document.createElement("div");
    box.id = id;
    box.style.color = "red";
    form.prepend(box);
  }
  return box;
}

});
// Atualiza o texto dentro do botão quando marcar/desmarcar funções
document.querySelectorAll(".chk-funcao").forEach(chk => {
  chk.addEventListener("change", () => {
    const selecionadas = [...document.querySelectorAll(".chk-funcao:checked")]
      .map(el => el.parentElement.innerText.trim());

    const span = document.getElementById("selectedFuncoes");
    if (selecionadas.length > 0) {
      span.innerText = selecionadas.join(", ");
      span.classList.remove("text-muted");
    } else {
      span.innerText = " ";
      span.classList.add("text-muted");
    }
  });
});

  // ----------- ANIMAÇÃO AO CARREGAR O SITE ------------
  const frameImg = document.getElementById("frame");
  const animDiv = document.getElementById("animacao-logo");
  const loginBox = document.querySelector(".login-box");

  if (frameImg && animDiv && loginBox) {
    const totalFrames = 11;
    const delay = 200;
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
    setTimeout(animar, 300);
  }
//================================ Função genérica para carregar dados e preencher campos ====================================

async function carregarDados(id, tipo) {
  try {
   const endpoint = tipo === "funcionario" ? "funcionarios" : "usuario";

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:3000/api/${endpoint}/${id}`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
      throw new Error(`Erro HTTP! status: ${res.status}`);
    }

    const data = await res.json();
    const user = tipo === "funcionario" ? data.funcionario : data.usuario;

    if (!user) throw new Error("Usuário não encontrado");

    document.getElementById("fname").value = user.nome || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.telefone || "";
    document.getElementById("senha").value = user.senha || "";

    if (tipo === "usuario") {
      const tipoUsuario = Number(user.tipo); // 👈 1 = aluno, 2 = professor

      if (tipoUsuario === 1) {
        const cursoEl = document.getElementById("curso");
        const serieEl = document.getElementById("serie");

        if (cursoEl) cursoEl.value = user.nome_curso || "";
        if (serieEl) serieEl.value = user.serie || "";
      }
    }

    if (tipo === "funcionario") {
      const funcaoEl = document.getElementById("funcao");
      if (funcaoEl) funcaoEl.value = user.FK_funcao_id || user.funcao_id || "";
    }

  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    alert("Erro ao carregar dados do usuário: " + err.message);
  }
}

const path = window.location.pathname;

if (path.includes("areaAluno.html") || path.includes("areaProf.html")) {
  const usuarioSalvo = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioSalvo) {
    alert("Usuário não logado!");
    window.location.href = "./index.html";
  } else {
    carregarDados(usuarioSalvo.id, "usuario");
  }
}

if (path.includes("areaAdm.html") || path.includes("areaAdm2.html")) {
  const funcionarioSalvo = JSON.parse(localStorage.getItem("funcionario"));
  if (!funcionarioSalvo) {
    alert("Usuário não logado!");
    window.location.href = "./index.html";
  } else {
    carregarDados(funcionarioSalvo.id, "funcionario");
    // Desabilita o campo função para funcionário (mostra só para visualização)
    const funcaoCampo = document.getElementById("funcao");
    if (funcaoCampo) {
      funcaoCampo.disabled = true; // campo visível, mas não editável
    }
  }
}

// Salvar alterações - atualiza usuário ou funcionário conforme quem está logado
const editarBtn = document.getElementById('btnEditar');

if (editarBtn) {
  editarBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const funcionario = JSON.parse(localStorage.getItem("funcionario"));

    let id, tipo;
    if (usuario) {
      id = usuario.id;
      tipo = "usuario";
    } else if (funcionario) {
      id = funcionario.id;
      tipo = "funcionario";
    } else {
      alert("Usuário não logado!");
      window.location.href = "./login.html";
      return;
    }

    const dadosAtualizados = {};

    // Sempre pega telefone e senha se tiverem valores
    const telefoneEl = document.getElementById("phone");
    const senhaEl = document.getElementById("senha");

    if (telefoneEl && telefoneEl.value.trim() !== "") {
      dadosAtualizados.telefone = telefoneEl.value.trim();
    }
    if (senhaEl && senhaEl.value.trim() !== "") {
      dadosAtualizados.senha = senhaEl.value.trim();
    }

    // Só adiciona nome e email se não for aluno/professor (ex: funcionário)
    const nomeEl = document.getElementById("fname");
    const emailEl = document.getElementById("email");
    if (nomeEl) dadosAtualizados.nome = nomeEl.value.trim();
    if (emailEl) dadosAtualizados.email = emailEl.value.trim();

    // Só adiciona função se o campo existir na tela (funcionário)
    const funcaoEl = document.getElementById("funcao");
    if (funcaoEl) dadosAtualizados.FK_funcao_id = funcaoEl.value;

   try {
  const token = localStorage.getItem("token");

  const url = tipo === "funcionario"
    ? `http://localhost:3000/api/funcionarios/${id}`
    : `http://localhost:3000/api/usuario/${id}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(dadosAtualizados),
  });

  const data = await response.json();
  alert(data.message || "Atualizado com sucesso!");
} catch (err) {
  console.error("Erro ao atualizar:", err);
  alert("Erro ao atualizar dados.");
}
  });
}
// Função para gerar senha segura (8 dígitos: A-Z, a-z, 0-9)
function gerarSenhaSegura() {
  const letrasMaiusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letrasMinusculas = "abcdefghijklmnopqrstuvwxyz";
  const numeros = "0123456789";
  const todos = letrasMaiusculas + letrasMinusculas + numeros;

  let senha = "";
  senha += letrasMaiusculas[Math.floor(Math.random() * letrasMaiusculas.length)];
  senha += letrasMinusculas[Math.floor(Math.random() * letrasMinusculas.length)];
  senha += numeros[Math.floor(Math.random() * numeros.length)];

  for (let i = senha.length; i < 8; i++) {
    senha += todos[Math.floor(Math.random() * todos.length)];
  }

  return senha.split('').sort(() => Math.random() - 0.5).join('');
}

// Validação de senha (exatamente 8 dígitos com A-Z, a-z e número)
function validarSenha(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8}$/;
  return regex.test(senha);
}

// Mostrar aviso ao editar a senha 
const senhaInput = document.getElementById('senha');

if (senhaInput) {
  let avisoSenha = document.getElementById('avisoSenha');
  if (!avisoSenha) {
    avisoSenha = document.createElement('div');
    avisoSenha.id = 'avisoSenha';
    avisoSenha.style.color = 'red';
    avisoSenha.style.fontSize = '0.9em';
    avisoSenha.style.marginTop = '4px';
    avisoSenha.style.display = 'none';
    senhaInput.insertAdjacentElement('afterend', avisoSenha);
  }

  senhaInput.addEventListener('focus', () => {
    avisoSenha.textContent = "A senha deve conter exatamente 8 caracteres, incluindo:\n 1 letra maiúscula (A-Z)\n 1 letra minúscula (a-z)\n 1 número (0-9)";
    avisoSenha.style.display = 'block';
  });

  senhaInput.addEventListener('blur', () => {
    avisoSenha.style.display = 'none';
  });
}



//EVENTO PARA VER A SENHA
function toggleSenha() {
  const senhaInput = document.getElementById('senha');
  const icon = document.getElementById('toggleSenha');
  if (senhaInput.type === "password") {
    senhaInput.type = "text";
    icon.classList.remove("bi-eye-slash");
    icon.classList.add("bi-eye");
  } else {
    senhaInput.type = "password";
    icon.classList.remove("bi-eye");
    icon.classList.add("bi-eye-slash");
  }
}

//Abre o menu ao clicar na foto
const avatar = document.getElementById('avatarPerfil'); // <- navbar
const dropdown = document.getElementById('menuPerfil');
const avatarGrande = document.getElementById('avatarPerfilGrande'); // <- imagem grande

// Mostra/oculta o menu do avatar
if (avatar && dropdown) {
  avatar.addEventListener('click', (event) => {
    event.stopPropagation(); // Evita que o clique feche o menu
    dropdown.classList.toggle('show');
  });

  // Fecha o menu se clicar fora
  window.addEventListener('click', (event) => {
    if (!avatar.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  });
}

// Troca a imagem do avatar com base no localStorage
const usuario = JSON.parse(localStorage.getItem('usuario'));
if (usuario && usuario.foto) {
  const novaSrc = `http://localhost:3000/uploads/${usuario.foto}`;

  if (avatar) avatar.src = novaSrc;
  if (avatarGrande) avatarGrande.src = novaSrc;
}
// Troca a imagem do avatar com base no localStorage para funcionário
const funcionario = JSON.parse(localStorage.getItem('funcionario'));
if (funcionario && funcionario.foto) { // ← CORRETO
  const novaSrc = `http://localhost:3000/uploads/${funcionario.foto}`;

  if (avatar) avatar.src = novaSrc;

}
document.addEventListener("DOMContentLoaded", function () {
  const fotoInput = document.getElementById("foto");
  const previewBox = document.getElementById("previewBox"); // 👈 pega o quadrado

  if (!fotoInput || !previewBox) return;

  fotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) {
      // volta para imagem padrão
      previewBox.style.backgroundImage = "url('http://localhost:3000/uploads/padrao.jpg')";
      previewBox.style.backgroundSize = "cover";
      previewBox.style.backgroundPosition = "center";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      previewBox.style.backgroundImage = `url('${event.target.result}')`;
      previewBox.style.backgroundSize = "cover";
      previewBox.style.backgroundPosition = "center";
    };
    reader.readAsDataURL(file);
  });
});

//mensagem de erro
// Helpers para mensagens
function getOrCreateErrorBox(id, form) {
  let box = document.getElementById(id);
  if (!box) {
    box = document.createElement('div');
    box.id = id;
    box.style.cssText = 'display:none;color:red;margin-bottom:10px;';
    form.parentNode.insertBefore(box, form); // insere a caixa logo acima do form
  }
  return box;
}
function showError(box, msg) {
  box.textContent = msg || 'Ocorreu um erro.';
  box.style.display = 'block';
}
function clearError(box) {
  box.textContent = '';
  box.style.display = 'none';
}
async function extractErrorMessage(response) {
  // tenta JSON; se não rolar, tenta texto bruto
  try {
    const data = await response.clone().json();
    if (data?.error || data?.message) return data.error || data.message;
  } catch { }
  try {
    const text = await response.text();
    if (text) return text;
  } catch { }
  return 'Erro ao processar a solicitação.';
}



// Função de logout
function logout() {
  localStorage.removeItem('usuario');
  window.location.href = './login.html';
}
