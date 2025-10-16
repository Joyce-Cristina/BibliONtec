document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formFuncionario");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const nome = document.getElementById("nome").value.trim();
      const patrocinio = document.getElementById("patrocinio").value.trim();
      const local = document.getElementById("local").value.trim();
      const descri = document.getElementById("descri").value.trim();
      const hora = document.getElementById("hora").value;
      const data = document.getElementById("data-evento").value;
      const foto = document.getElementById("foto").files[0];
  
      if (!nome || !local || !hora || !data) {
        alert("Preencha todos os campos obrigatórios!");
        return;
      }
  
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("patrocinio", patrocinio);
      formData.append("local", local);
      formData.append("descri", descri);
      formData.append("hora", hora);
      formData.append("data", data);
      if (foto) formData.append("foto", foto);
  
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch("http://localhost:3000/eventos", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
  
        if (!resp.ok) {
          const erro = await resp.text();
          throw new Error(erro);
        }
  
        alert("Evento cadastrado com sucesso!");
        form.reset();
      } catch (err) {
        console.error("Erro ao cadastrar evento:", err);
        alert("Erro ao cadastrar evento. Tente novamente.");
      }
    });
  });