
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

    try {

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: senha.value
        });

        console.log("LOGIN DATA:", data);
        console.log("LOGIN ERROR:", error);

        if (error) {
            alert("Erro no login: " + error.message);
            return;
        }

        if (!data || !data.user) {
            alert("Login falhou (sem usuário retornado)");
            return;
        }

        user = data.user;

        alert("Login OK!");

        loginOk();

    } catch (err) {
        console.log(err);
        alert("Erro inesperado no login");
    }
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

    try {

        const { data, error } = await supabase.auth.getUser();

        console.log("SESSION:", data, error);

        if (data && data.user) {
            user = data.user;
            loginOk();
        }

    } catch (err) {
        console.log("Erro sessão:", err);
    }
}

function loginOk() {
    loginBox.style.display = "none";
    adminBox.style.display = "block";
    carregarPostsAdmin();
}

// ----------------------
// GERAR CÓDIGO
// ----------------------
function gerarCodigo() {
    return Math.random().toString(36).substring(2, 8);
}

// ----------------------
// CRIAR POST
// ----------------------
document.getElementById("btnSalvar").onclick = async () => {

    if (!nome.value || !link.value) {
        alert("Preencha tudo");
        return;
    }

    const codigo = gerarCodigo();

    const { data, error } = await supabase
        .from("posts")
        .insert([{
            nome: nome.value,
            link: link.value,
            codigo: codigo
        }]);

    console.log("INSERT:", data, error);

    if (error) {
        alert("Erro ao salvar: " + error.message);
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

    console.log("POSTS:", data, error);

    if (error) {
        listaAdmin.innerHTML = "<p>Erro ao carregar</p>";
        return;
    }

    listaAdmin.innerHTML = "";

    data.forEach(post => {

        const div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <h2>${post.nome}</h2>
            <p>${post.codigo}</p>

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
// DELETE
// ----------------------
async function deletarPost(id) {

    const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Erro ao deletar: " + error.message);
        return;
    }

    carregarPostsAdmin();
}

// iniciar
checkUser();
