const container = document.getElementById("post");
const toast = document.getElementById("toast");
let toastTimer;

function withTimeout(promise, milliseconds = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("A conexão demorou mais do que o esperado.")), milliseconds))
    ]);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function safeUrl(value = "") {
    try {
        const parsed = new URL(String(value).trim());
        if (!["http:", "https:"].includes(parsed.protocol)) return null;
        return parsed.href;
    } catch {
        return null;
    }
}

function showToast(message, type = "success") {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast visible${type === "error" ? " error" : ""}`;
    toastTimer = window.setTimeout(() => {
        toast.className = "toast";
    }, 3200);
}

function getCategory(post) {
    if (post.categoria || post.category || post.tipo) return post.categoria || post.category || post.tipo;
    const text = `${post.nome || ""} ${post.link || ""}`.toLowerCase();
    if (/minecraft|addon|texture|shader/.test(text)) return "Minecraft";
    if (/roblox|blox/.test(text)) return "Roblox";
    if (/mod|plugin/.test(text)) return "Mods";
    if (/mapa|map|world/.test(text)) return "Mapas";
    if (/app|android|apk|software/.test(text)) return "Apps";
    return "Outros";
}

function getDescription(post) {
    return post.descricao || post.description || post.resumo || "Recurso compartilhado pela comunidade Coolkid.";
}

function renderState(title, message, action = "") {
    container.innerHTML = `
        <div class="state-card">
            <div class="state-icon" aria-hidden="true">!</div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            ${action}
        </div>
    `;
}

function renderPost(data) {
    const link = safeUrl(data.link);
    const shareUrl = window.location.href;
    document.title = `${data.nome || "Recurso"} — Coolkid Hub`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", getDescription(data));
    container.innerHTML = `
        <article class="post-card shared-card${data.destaque ? " featured" : ""}">
            <div class="card-topline">
                <span class="card-category">${escapeHtml(getCategory(data))}</span>
                <span class="card-code">SHARED / ${escapeHtml(data.codigo || "DISCOVERY")}</span>
            </div>
            <div class="card-icon" aria-hidden="true">✦</div>
            <h3>${escapeHtml(data.nome || "Recurso sem nome")}</h3>
            <p class="card-description">${escapeHtml(getDescription(data))}</p>
            <span class="shared-link">${escapeHtml(data.link || "Link indisponível")}</span>
            <div class="card-actions">
                ${link ? `<a class="card-action open-action" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir recurso <span aria-hidden="true">↗</span></a>` : `<span class="card-action open-action" aria-disabled="true">Link indisponível</span>`}
                <button class="card-action share-action" id="shareButton" type="button" aria-label="Copiar link desta página">↗</button>
            </div>
        </article>
    `;

    document.getElementById("shareButton").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showToast("Link compartilhado copiado.");
        } catch {
            window.prompt("Copie o link desta descoberta:", shareUrl);
        }
    });
}

async function carregarPost() {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get("post");
    if (!codigo) {
        renderState("Código não informado", "O link recebido não contém um código de recurso válido.");
        return;
    }

    try {
        if (!window.supabaseClient) throw new Error("Cliente Supabase indisponível");
        const { data, error } = await withTimeout(window.supabaseClient
            .from("posts")
            .select("*")
            .eq("codigo", codigo)
            .maybeSingle());
        if (error) throw error;
        if (!data) {
            renderState("Recurso não encontrado", "Ele pode ter sido removido ou o link pode estar desatualizado.", '<a class="btn btn-outline" href="../">Explorar biblioteca</a>');
            return;
        }
        renderPost(data);
    } catch (error) {
        console.error("Erro ao carregar recurso compartilhado:", error);
        renderState("Não foi possível abrir esta descoberta", "Verifique sua conexão e tente novamente.", '<a class="btn btn-outline" href="../">Voltar para a biblioteca</a>');
    }
}

window.compartilhar = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link compartilhado copiado.");
    } catch {
        window.prompt("Copie o link:", window.location.href);
    }
};

carregarPost();
