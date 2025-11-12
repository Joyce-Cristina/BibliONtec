// Recupera o token do login salvo no navegador
const token = localStorage.getItem('token') || sessionStorage.getItem('token');

// Se não houver token, redireciona para o login
if (!token) {
  alert("Sessão expirada! Faça login novamente.");
  window.location.href = "./index.html";
}
function apiBase() {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "http://localhost:3000";
  }
  return "https://bibliontec.onrender.com"; // backend hospedado
}
async function fetchJson(url, opts={}) {
  opts.headers = { ...(opts.headers||{}), 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  const resp = await fetch(url, opts);
  if (!resp.ok) throw new Error('Erro ' + resp.status);
  return resp.json();
}

// preencher tabela de atrasos
async function carregarAtrasos(period='all') {
  try {
    const dados = await fetchJson(`${apiBase()}/relatorios/atrasos?period=${period}`);
    const tbody = document.querySelector('#atrasos table tbody');
    tbody.innerHTML = '';
    dados.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.usuario.nome}</td>
        <td>${a.livro.titulo}</td>
        <td><span class="badge bg-danger text-white">${a.dias_atraso} dias</span></td>
        <td>R$${Number(a.multa).toFixed(2)}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm" onclick='notificar(${a.usuario.id},"Seu livro está em atraso")'>Notificar</button>
          <button class="btn btn-outline-dark btn-sm" onclick='contatar("${a.usuario.email || ''}", "${a.usuario.telefone || ''}")'>Contatar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar atrasos');
  }
}
async function contatar(email, tel) {
  if (!email) {
    alert('Usuário sem e-mail, tente contato por telefone: ' + (tel || 'não informado'));
    return;
  }
  try {
    await fetchJson(`${apiBase()}/notificacao/contatar`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        assunto: 'Aviso de atraso - BibliONtec',
        mensagem: 'Olá! Há um livro em atraso em seu nome. Por favor, realize a devolução o quanto antes.'
      })
    });
    alert('E-mail enviado com sucesso!');
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar e-mail automático');
  }
}


async function notificar(usuarioId, mensagem) {
  try {
    await fetchJson(`${apiBase()}/notificacao/enviar-usuario`, {
      method: 'POST',
      body: JSON.stringify({ usuarioId, mensagem, tipo: 'atraso' })
    });
    alert('Notificação enviada');
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar notificação');
  }
}

// gráfico de empréstimos
let chartEmp;
async function carregarGraficoEmprestimos(period='year') {
  try {
    const dados = await fetchJson(`${apiBase()}/relatorios/emprestimos/stats?period=${period}`);
    const labels = [];
    const empMap = {};
    dados.emprestimos.forEach(r => empMap[r.mes] = r.total);
    dados.devolucoes.forEach(r => {}); // se quiser mostrar devoluções também

    // monta rótulos do período (meses entre inicio/fim) — simplificação: usa as chaves retornadas
    const meses = dados.emprestimos.map(r => r.mes);
    const valores = dados.emprestimos.map(r => r.total);

    const ctx = document.getElementById('graficoEmprestimos').getContext('2d');
    if (chartEmp) chartEmp.destroy();
    chartEmp = new Chart(ctx, {
      type: 'bar',
      data: { labels: meses, datasets: [{ label: 'Empréstimos', data: valores }] },
      options: { plugins: { legend: { display: true } }, responsive:true }
    });
  } catch (err) {
    console.error(err);
  }
}

// gráfico usuários mais ativos
let chartUsers;
async function carregarGraficoUsuarios() {
  try {
    const dados = await fetchJson(`${apiBase()}/relatorios/usuarios-ativos`);
    const labels = dados.map(d => d.tipo_usuario || "Indefinido");
    const values = dados.map(d => d.total_emprestimos);

    const ctx = document.getElementById('graficoUsuarios').getContext('2d');
    if (chartUsers) chartUsers.destroy();
    chartUsers = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#007bff', '#ffc107', '#28a745']
        }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        responsive: true
      }
    });
  } catch (err) { console.error(err); }
}

// populares (ranking)
async function carregarPopulares() {
  try {
    const dados = await fetchJson(`${apiBase()}/relatorios/populares?limit=10`);
    const ol = document.querySelector('.ranking-list');
    ol.innerHTML = '';
    dados.forEach((d,i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="ranking-number">${i+1}</span> ${d.titulo} <span class="badge">${d.total_emprestimos} empréstimos</span>`;
      ol.appendChild(li);
    });
  } catch (err) { console.error(err); }
}

// exportar relatório completo em PDF (com gráficos)
async function exportarPdf(period = 'all') {
  const empCanvas = document.getElementById('graficoEmprestimos');
  const userCanvas = document.getElementById('graficoUsuarios');

  // força PNG (compatível com PDFKit)
  const imgEmp = empCanvas ? empCanvas.toDataURL('image/png') : null;
  const imgUser = userCanvas ? userCanvas.toDataURL('image/png') : null;

  try {
    const resp = await fetch(`${apiBase()}/relatorios/export/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imgEmp, imgUser, period })
    });

    if (!resp.ok) throw new Error('Erro ao gerar PDF');
    const blob = await resp.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_completo_${period}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error(err);
    alert('Erro ao exportar PDF');
  }
}

// carregar resumo estatístico
async function carregarResumo() {
  try {
    const emprestimos = await fetchJson(`${apiBase()}/relatorios/emprestimos/stats?period=year`);
    const usuarios = await fetchJson(`${apiBase()}/relatorios/usuarios-ativos`);
    const atrasos = await fetchJson(`${apiBase()}/relatorios/atrasos`);
    const reservas = await fetchJson(`${apiBase()}/reservas/pendentes`);

    document.querySelector('.card:nth-child(1) .info span').textContent = usuarios.length;
    document.querySelector('.card:nth-child(2) .info span').textContent =
      emprestimos.emprestimos.reduce((s, e) => s + e.total, 0);
    document.querySelector('.card:nth-child(3) .info span').textContent = reservas[0]?.total || 0;
    document.querySelector('.card:nth-child(4) .info span').textContent = atrasos.length;
  } catch (err) {
    console.error("Erro ao carregar resumo:", err);
  }
}


// inicialização
document.addEventListener('DOMContentLoaded', () => {
  carregarAtrasos('all');
  carregarGraficoEmprestimos('year');
  carregarGraficoUsuarios();
  carregarPopulares();
carregarResumo();

  // ligar select de período
  document.querySelector('#status').addEventListener('change', (e) => {
    const val = e.target.value;
    const map = { 'Esta semana':'week', 'Última semana':'week', 'Último mês':'month', 'Ano inteiro':'year' };
    const period = map[val] || 'all';
    carregarAtrasos(period);
    carregarGraficoEmprestimos(period);
    carregarPopulares(period);
  });

  // botão exportar PDF
  document.querySelector('.btn-new-user').addEventListener('click', () => exportarPdf('all'));
});