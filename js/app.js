let posts = [];

async function carregarPosts() {

    const container = document.getElementById("posts");

    container.innerHTML = `
        <div class="loading">
            Carregando posts...
        </div>
    `;

    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("criado_em", { ascending: false });

    if (error) {
        container.innerHTML = `
            <div class="empty">
                Erro ao carregar os posts.
            </div>
        `;
        console.error(error);
        return;
    }

    posts = data || [];

    mostrarPosts(posts);
}

function mostrarPosts(lista) {

    const container = document.getElementById("posts");

    if (lista.length === 0) {

        container.innerHTML = `
            <div class="empty">
                Nenhum post encontrado.
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    lista.forEach(post => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h2>${post.nome}</h2>

            <p>${post.link}</p>

            <div class="buttons">

                <a
                    class="btn btn-open"
                    href="${post.link}"
                    target="_blank"
                >
                    🔗 Abrir
                </a>

                <button
                    class="btn-share"
                    onclick="compartilhar('${post.codigo}')"
                >
                    📤 Compartilhar
                </button>

            </div>
        `;

        container.appendChild(card);

    });

}

async function compartilhar(codigo){

    const link =
        window.location.origin +
        "/Coolkid-Hub/shared?post=" +
        codigo;

    try{

        await navigator.clipboard.writeText(link);

        alert("Link copiado!\n\n" + link);

    }catch{

        prompt("Copie o link:", link);

    }

}

document
.getElementById("search")
.addEventListener("input", function(){

    const texto = this.value.toLowerCase();

    const filtrados = posts.filter(post =>
        post.nome.toLowerCase().includes(texto)
    );

    mostrarPosts(filtrados);

});

carregarPosts();
