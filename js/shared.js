const container = document.getElementById("post");

async function carregarPost() {

    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("post");

    if (!codigo) {
        container.innerHTML = `
            <div class="empty">
                Nenhum código de post foi informado.
            </div>
        `;
        return;
    }

    const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("codigo", codigo)
        .single();

    if (error || !data) {
        container.innerHTML = `
            <div class="empty">
                Post não encontrado.
            </div>
        `;
        console.error(error);
        return;
    }

    document.title = data.nome + " • Coolkid Hub";

    container.innerHTML = `
        <div class="card">

            <h2>${data.nome}</h2>

            <p>${data.link}</p>

            <div class="buttons">

                <a
                    class="btn btn-open"
                    href="${data.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    🔗 Abrir
                </a>

                <button
                    class="btn-share"
                    onclick="compartilhar()"
                >
                    📤 Compartilhar
                </button>

            </div>

        </div>
    `;

    window.linkCompartilhar = window.location.href;
}

async function compartilhar() {

    try {

        await navigator.clipboard.writeText(window.linkCompartilhar);

        alert("Link copiado!");

    } catch {

        prompt("Copie o link:", window.linkCompartilhar);

    }

}

carregarPost();
