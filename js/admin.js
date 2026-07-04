
let user = null;

// elementos
const loginBox = document.getElementById("loginBox");
const adminBox = document.getElementById("adminBox");

const email = document.getElementById("email");
const senha = document.getElementById("senha");

const nome = document.getElementById("nome");
const link = document.getElementById("link");

const listaAdmin = document.getElementById("listaAdmin");

// ----------------------
// LOGIN
// ----------------------
document.getElementById("btnLogin").onclick = async () => {

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: senha.value
    });

    if (error) {
        alert("Erro no login");
        console.log(error);
        return;
    }

    user = data.user;
    loginOk();
};

// ----------------------
// LOGOUT
// ----------------------
document.getElementById("btnLogout").onclick = async () => {

    await supabase.auth.signOut();

    user = null;

    loginBox.style.display = "block";
    adminBox.style.display = "none";
};

// ----------------------
// CHECAR SESSÃO
// ----------------------
async function checkUser() {

    const { data } = await supabase.auth.getUser();

    if (data.user) {
        user = data.user;
        loginOk();
    }
}

function loginOk() {
    loginBox.style.display = "none";
    adminBox.style.display = "block";
    carregarPostsAdmin();
}

// ----------------------
// GERAR CÓDIGO 6 CHARS
// ----------------------
function gerarCodigo() {
    return Math.random().toString(36).substring(2, 8);
}

// ----------------------
// ADICIONAR POST
// ----------------------
document.getElementById("btnSalvar").onclick = async () => {

    if (!nome.value || !link.value) {
        alert("Preencha tudo");
        return;
    }

    const codigo = gerarCodigo();

    const { error } = await supabase
        .from("posts")
        .insert([{
            nome: nome.value,
            link: link.value,
            codigo: codigo
        }]);

    if (error) {
        alert("Erro ao salvar");
        console.log(error);
        return;
    }

    nome.value = "";
    link.value = "";

    carregarPostsAdmin();
};

// ----------------------
// LISTAR POSTS
// ----------------------
async function carregarPostsAdmin() {

    listaAdmin.innerHTML = "<p>Carregando...</p>";

    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("criado_em", { ascending: false });

    if (error) {
        listaAdmin.innerHTML = "<p>Erro ao carregar</p>";
        console.log(error);
        return;
    }

    listaAdmin.innerHTML = "";

    data.forEach(post => {

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <h2>${post.nome}</h2>
            <p>Código: ${post.codigo}</p>

            <div class="buttons">

                <a class="btn btn-open" href="${post.link}" target="_blank">
                    Abrir
                </a>

                <button class="btn-delete" onclick="deletarPost('${post.id}')">
                    Apagar
                </button>

            </div>
        `;

        listaAdmin.appendChild(div);
    });
}

// ----------------------
// DELETAR POST
// ----------------------
async function deletarPost(id) {

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao deletar");
        console.log(error);
        return;
    }

    carregarPostsAdmin();
}

// iniciar sistema
checkUser();
