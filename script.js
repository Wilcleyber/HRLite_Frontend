const API_URL = "https://hrlite-api.onrender.com";
let modoEdicao = false;
let matriculaSelecionada = null;
let dadosOriginais = null;

// 📤 Enviar dados do formulário
document.getElementById("colaborador-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    nome: form.nome.value,
    cpf: form.cpf.value,
    data_nascimento: form.data_nascimento.value,
    telefone: form.telefone.value,
    endereco: form.endereco.value,
    cargo: form.cargo.value,
    salario: parseFloat(form.salario.value),
    status: form.status.value
  };

  try {
    const url = modoEdicao
      ? `${API_URL}/colaboradores/${matriculaSelecionada}`
      : `${API_URL}/colaboradores`;

    const method = modoEdicao ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      const msg = typeof result.detail === "string"
        ? result.detail
        : Array.isArray(result.detail)
          ? result.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join("\n")
          : "Erro ao cadastrar.";
      mostrarMensagem(msg, "erro");
      return;
    }

    mostrarMensagem(modoEdicao ? "Modificação concluída!" : "Colaborador cadastrado com sucesso!", "sucesso");
    resetarFormulario();
    carregarColaboradores();
  } catch (err) {
    console.error("Erro:", err);
    mostrarMensagem("Erro ao conectar com a API.", "erro");
  }
});

// 📥 Buscar e exibir colaboradores
async function carregarColaboradores() {
  const filtro = document.getElementById("campo-busca").value.trim();
  const status = document.getElementById("filtro-status").value;

  const params = new URLSearchParams();
  if (filtro) params.append("filtro", filtro);
  if (status) params.append("status", status);

  try {
    const response = await fetch(`${API_URL}/colaboradores?${params.toString()}`);
    const colaboradores = await response.json();

    const tbody = document.querySelector("#colaboradores-table tbody");
    tbody.innerHTML = "";

    colaboradores.forEach((colab) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${colab.matricula}</td>
        <td>${colab.nome}</td>
        <td>${colab.cargo}</td>
        <td>${colab.status}</td>
      `;
      row.dataset.matricula = colab.matricula;
      row.addEventListener("click", () => {
        document.querySelectorAll("#colaboradores-table tbody tr").forEach(r => r.classList.remove("selecionado"));
        row.classList.add("selecionado");
        selecionarColaborador(colab);
      });
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Erro ao carregar colaboradores:", err);
  }
}

function selecionarColaborador(colab) {
  if (modoEdicao && houveAlteracao()) {
    if (!confirm("Tem certeza que quer trocar de colaborador? As modificações serão perdidas.")) return;
  }

  resetarFormulario(); // antes de preencher com novo colaborador

  modoEdicao = true;
  matriculaSelecionada = colab.matricula;
  dadosOriginais = { ...colab };

  const form = document.getElementById("colaborador-form");
  for (const campo in colab) {
    if (form[campo]) form[campo].value = colab[campo];
  }

  document.getElementById("btn-submit").textContent = "Modificar";
  document.getElementById("btn-cancel").style.display = "inline-block";
}

function houveAlteracao() {
  const form = document.getElementById("colaborador-form");
  for (const campo in dadosOriginais) {
    if (form[campo] && form[campo].value !== String(dadosOriginais[campo])) {
      return true;
    }
  }
  return false;
}

document.getElementById("btn-cancel").addEventListener("click", () => {
  if (houveAlteracao()) {
    if (!confirm("Tem certeza que quer cancelar? As modificações serão perdidas.")) return;
  }
  resetarFormulario();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modoEdicao) {
    document.getElementById("btn-cancel").click();
  }
});

function resetarFormulario() {
  document.getElementById("colaborador-form").reset();
  document.getElementById("btn-submit").textContent = "Modificar";
  document.getElementById("btn-cancel").style.display = "none";
  modoEdicao = false;
  matriculaSelecionada = null;
  dadosOriginais = null;
}

document.getElementById("btn-filtrar").addEventListener("click", carregarColaboradores);

document.getElementById("campo-busca").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault(); // Evita comportamento padrão
    carregarColaboradores(); // Aciona a filtragem
  }
});

function mostrarMensagem(texto, tipo = "sucesso") {
  const msg = document.getElementById("mensagem");
  msg.textContent = texto;
  msg.className = tipo === "erro" ? "erro" : "sucesso";
  msg.classList.remove("oculto");
  setTimeout(() => msg.classList.add("oculto"), 4000);
}

const dataInput = document.querySelector('input[name="data_nascimento"]');
if (dataInput) {
  dataInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número

    if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2);
    if (value.length >= 5) value = value.slice(0, 5) + "/" + value.slice(5);
    if (value.length > 10) value = value.slice(0, 10); // Limita a 10 caracteres

    e.target.value = value;
  });
}

// 🔄 Carregar ao iniciar
carregarColaboradores();