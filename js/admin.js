window.addEventListener("DOMContentLoaded", () => {

    let user = null;

    const loginBox = document.getElementById("loginBox");
    const adminBox = document.getElementById("adminBox");

    const email = document.getElementById("email");
    const senha = document.getElementById("senha");

    const nome = document.getElementById("nome");
    const link = document.getElementById("link");

    const listaAdmin = document.getElementById("listaAdmin");

    document.getElementById("btnLogin").onclick = async () => {

        console.log("clicou login");

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: senha.value
        });

        console.log(data, error);

        if (error) {
            alert("Erro: " + error.message);
            return;
        }

        user = data.user;

        alert("LOGIN OK");

        loginOk();
    };

    document.getElementById("btnLogout").onclick = async () => {
        await supabase.auth.signOut();
        loginBox.style.display = "block";
        adminBox.style.display = "none";
    };

    function loginOk() {
        loginBox.style.display = "none";
        adminBox.style.display = "block";
        carregarPostsAdmin();
    }

    function gerarCodigo() {
        return Math.random().toString(36).substring(2, 8);
    }

    document.getElementById("btnSalvar").onclick = async () => {

        const codigo = gerarCodigo();

        const { error } = await supabase
            .from("posts")
            .insert([{
                nome: nome.value,
                link: link.value,
                codigo: codigo
            }]);

        if (error) {
            alert(error.message);
            return;
        }

        carregarPostsAdmin();
    };

    async function carregarPostsAdmin() {

        const { data, error } = await supabase
            .from("posts")
            .select("*");

        listaAdmin.innerHTML = "";

        data.forEach(post => {

            const div = document.createElement("div");
            div.className = "card";

            div.innerHTML = `
                <h2>${post.nome}</h2>
                <p>${post.codigo}</p>

                <button onclick="deletarPost('${post.id}')">
                    Apagar
                </button>
            `;

            listaAdmin.appendChild(div);
        });
    }

    async function deletarPost(id) {

        await supabase
            .from("posts")
            .delete()
            .eq("id", id);

        carregarPostsAdmin();
    }

    carregarPostsAdmin();
});
