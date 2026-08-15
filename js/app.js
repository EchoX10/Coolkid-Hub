const demoMode = new URLSearchParams(window.location.search).get("demo") === "1";

const demoPosts = [
    { id: "demo-1", codigo: "neon001", nome: "Neon Texture Pack", link: "https://example.com/neon-textures", categoria: "Minecraft", descricao: "Um visual vibrante para deixar seu mundo com outra energia.", criado_em: "2026-08-15T12:00:00Z", destaque: true },
    { id: "demo-2", codigo: "mapa002", nome: "Skyline Adventure Map", link: "https://example.com/skyline-map", categoria: "Mapas", descricao: "Uma aventura vertical cheia de caminhos escondidos e desafios.", criado_em: "2026-08-12T12:00:00Z" },
    { id: "demo-3", codigo: "tool003", nome: "Creator Toolkit", link: "https://example.com/creator-toolkit", categoria: "Ferramentas", descricao: "Pequenas ferramentas para organizar e acelerar seus projetos.", criado_em: "2026-08-08T12:00:00Z" },
    { id: "demo-4", codigo: "mod004", nome: "Community Mod Pack", link: "https://example.com/community-mod", categoria: "Mods", descricao: "Uma seleção comunitária para experimentar novas possibilidades.", criado_em: "2026-08-03T12:00:00Z" },
    { id: "demo-5", codigo: "app005", nome: "Pocket Companion", link: "https://example.com/pocket-companion", categoria: "Apps", descricao: "Um companheiro simples para levar suas referências com você.", criado_em: "2026-07-29T12:00:00Z" }
];

const state = {
    posts: [],
    query: "",
    category: "Todos",
    sort: "recent",
    onlyFavorites: false,
    favorites: loadFavorites(),
    loading: true,
    error: null
};

const elements = {
    posts: document.getElementById("posts"),
    search: document.getElementById("search"),
    clearSearch: document.getElementById("clearSearch"),
    sortSelect: document.getElementById("sortSelect"),
    favoritesToggle: document.getElementById("favoritesToggle"),
    categoryChips: document.getElementById("categoryChips"),
    resultSummary: document.getElementById("resultSummary"),
    retryButton: document.getElementById("retryButton"),
    toast: document.getElementById("toast"),
    statPosts: document.getElementById("statPosts"),
    statCategories: document.getElementById("statCategories"),
    statFavorites: document.getElementById("statFavorites"),
    heroStatus: document.getElementById("heroStatus")
};

let toastTimer;

function withTimeout(promise, milliseconds = 10000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("A conexão demorou mais do que o esperado.")), milliseconds))
    ]);
}

function loadFavorites() {
    try {
        return new Set(JSON.parse(localStorage.getItem("coolkid-favorites") || "[]"));
    } catch {
        return new Set();
    }
}

function saveFavorites() {
    localStorage.setItem("coolkid-favorites", JSON.stringify([...state.favorites]));
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

function postKey(post) {
    return String(post.id ?? post.codigo ?? post.link ?? post.nome);
}

function getCategory(post) {
    const explicit = post.categoria || post.category || post.tipo || post.tema;
    if (explicit) return String(explicit).trim();

    const text = `${post.nome || ""} ${post.link || ""}`.toLowerCase();
    if (/minecraft|addon|texture|shader|bedrock/.test(text)) return "Minecraft";
    if (/roblox|blox/.test(text)) return "Roblox";
    if (/mod|modpack|plugin/.test(text)) return "Mods";
    if (/mapa|map|world/.test(text)) return "Mapas";
    if (/app|aplicativo|android|apk|software/.test(text)) return "Apps";
    if (/site|web|tool|ferramenta/.test(text)) return "Ferramentas";
    return "Outros";
}

function getDescription(post) {
    return post.descricao || post.description || post.resumo || "Recurso compartilhado pela comunidade Coolkid.";
}

function getDomain(link) {
    try {
        return new URL(link).hostname.replace(/^www\./, "");
    } catch {
        return "link externo";
    }
}

function formatDate(date) {
    if (!date) return "recentemente";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "recentemente";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(parsed).replace(" de ", " ");
}

function showToast(message, type = "success") {
    if (!elements.toast) return;
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast visible${type === "error" ? " error" : ""}`;
    toastTimer = window.setTimeout(() => {
        elements.toast.className = "toast";
    }, 3200);
}

function buildShareUrl(post) {
    const url = new URL("shared/", window.location.href);
    url.searchParams.set("post", post.codigo || postKey(post));
    return url.href;
}

function updateStats() {
    const categories = new Set(state.posts.map(getCategory));
    const favoriteCount = state.posts.filter((post) => state.favorites.has(postKey(post))).length;
    elements.statPosts.textContent = state.posts.length;
    elements.statCategories.textContent = categories.size;
    elements.statFavorites.textContent = favoriteCount;
    elements.heroStatus.textContent = state.posts.length ? `${state.posts.length} recursos sincronizados` : "Biblioteca pronta para novas descobertas";
}

function renderCategoryChips() {
    const categories = [...new Set(state.posts.map(getCategory))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const allCategories = ["Todos", ...categories];
    elements.categoryChips.innerHTML = allCategories.map((category) => `
        <button class="category-chip${state.category === category ? " active" : ""}" type="button" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">
            ${escapeHtml(category)}
        </button>
    `).join("");
}

function getVisiblePosts() {
    const searchText = state.query.trim().toLowerCase();
    const filtered = state.posts.filter((post) => {
        const haystack = `${post.nome || ""} ${getDescription(post)} ${getCategory(post)} ${post.link || ""}`.toLowerCase();
        const matchesQuery = !searchText || haystack.includes(searchText);
        const matchesCategory = state.category === "Todos" || getCategory(post) === state.category;
        const matchesFavorite = !state.onlyFavorites || state.favorites.has(postKey(post));
        return matchesQuery && matchesCategory && matchesFavorite;
    });

    return filtered.sort((a, b) => {
        if (state.sort === "name") return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
        if (state.sort === "favorites") {
            const favoriteOrder = Number(state.favorites.has(postKey(b))) - Number(state.favorites.has(postKey(a)));
            if (favoriteOrder !== 0) return favoriteOrder;
        }
        if (a.destaque !== b.destaque) return Number(Boolean(b.destaque)) - Number(Boolean(a.destaque));
        const dateA = new Date(a.criado_em || a.created_at || 0).getTime();
        const dateB = new Date(b.criado_em || b.created_at || 0).getTime();
        return dateB - dateA;
    });
}

function renderCard(post) {
    const link = safeUrl(post.link);
    const key = escapeHtml(postKey(post));
    const isFavorite = state.favorites.has(postKey(post));
    const title = escapeHtml(post.nome || "Recurso sem nome");
    const category = escapeHtml(getCategory(post));
    const description = escapeHtml(getDescription(post));
    const domain = escapeHtml(link ? getDomain(link) : "link inválido");
    const openAction = link
        ? `<a class="card-action open-action" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Abrir <span aria-hidden="true">↗</span></a>`
        : `<span class="card-action open-action" aria-disabled="true" title="Este link não é válido">Indisponível</span>`;

    return `
        <article class="post-card${post.destaque ? " featured" : ""}" data-post-key="${key}">
            <div class="card-topline">
                <span class="card-category">${category}</span>
                <span class="card-code">${escapeHtml(formatDate(post.criado_em || post.created_at))}</span>
            </div>
            <div class="card-icon" aria-hidden="true">✦</div>
            <h3>${title}</h3>
            <p class="card-description">${description}</p>
            <span class="card-domain" title="${domain}">${domain}</span>
            <div class="card-actions">
                ${openAction}
                <button class="card-action favorite-action${isFavorite ? " active" : ""}" type="button" data-action="favorite" aria-label="${isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}" aria-pressed="${isFavorite}">${isFavorite ? "★" : "☆"}</button>
                <button class="card-action share-action" type="button" data-action="share" aria-label="Copiar link de compartilhamento">↗</button>
            </div>
        </article>
    `;
}

function renderState(title, message, action = "") {
    elements.posts.innerHTML = `
        <div class="state-card">
            <div class="state-icon" aria-hidden="true">${state.error ? "!" : "⌕"}</div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
            ${action}
        </div>
    `;
}

function renderPosts() {
    const visiblePosts = getVisiblePosts();
    elements.posts.setAttribute("aria-busy", "false");
    elements.clearSearch.hidden = !state.query;
    elements.favoritesToggle.classList.toggle("active", state.onlyFavorites);
    elements.favoritesToggle.setAttribute("aria-pressed", String(state.onlyFavorites));
    elements.favoritesToggle.innerHTML = `<span aria-hidden="true">${state.onlyFavorites ? "★" : "☆"}</span> Salvos${state.favorites.size ? ` (${state.favorites.size})` : ""}`;

    if (state.loading) {
        elements.posts.setAttribute("aria-busy", "true");
        elements.posts.innerHTML = `<div class="state-card loading-state"><span class="loader"></span><p>Carregando os achados da comunidade...</p></div>`;
        elements.resultSummary.textContent = "Carregando biblioteca...";
        return;
    }

    if (state.error) {
        renderState("Não foi possível carregar a biblioteca", "Confira a conexão com o Supabase e tente novamente.", `<button type="button" class="btn btn-primary" data-action="retry">Tentar novamente</button>`);
        elements.resultSummary.textContent = "A biblioteca está temporariamente indisponível.";
        return;
    }

    if (!state.posts.length) {
        renderState("A biblioteca ainda está vazia", "Os primeiros recursos publicados aparecerão aqui em breve.");
        elements.resultSummary.textContent = "Nenhum recurso publicado ainda.";
        return;
    }

    if (!visiblePosts.length) {
        renderState("Nada encontrado por aqui", "Tente remover um filtro ou pesquisar por outro termo.", `<button type="button" class="btn btn-outline" data-action="clear-filters">Limpar filtros</button>`);
        elements.resultSummary.textContent = "0 resultados para os filtros atuais.";
        return;
    }

    elements.posts.innerHTML = visiblePosts.map(renderCard).join("");
    elements.resultSummary.textContent = `${visiblePosts.length} ${visiblePosts.length === 1 ? "resultado encontrado" : "resultados encontrados"}`;
}

async function carregarPosts() {
    state.loading = true;
    state.error = null;
    renderPosts();

    try {
        if (demoMode) {
            state.posts = demoPosts;
            updateStats();
            renderCategoryChips();
            return;
        }
        if (!window.supabaseClient) throw new Error("Cliente Supabase indisponível");
        const { data, error } = await withTimeout(window.supabaseClient
            .from("posts")
            .select("*")
            .order("criado_em", { ascending: false }));
        if (error) throw error;
        state.posts = Array.isArray(data) ? data : [];
        updateStats();
        renderCategoryChips();
    } catch (error) {
        console.error("Erro ao carregar posts:", { message: error?.message, details: error?.details, hint: error?.hint, code: error?.code });
        state.error = error;
        state.posts = [];
        elements.heroStatus.textContent = demoMode ? "Modo de demonstração ativo" : "Não foi possível sincronizar agora";
    } finally {
        state.loading = false;
        renderPosts();
    }
}

async function compartilhar(post) {
    const link = buildShareUrl(post);
    try {
        await navigator.clipboard.writeText(link);
        showToast("Link de compartilhamento copiado.");
    } catch {
        window.prompt("Copie o link de compartilhamento:", link);
    }
}

function toggleFavorite(post) {
    const key = postKey(post);
    if (state.favorites.has(key)) state.favorites.delete(key);
    else state.favorites.add(key);
    saveFavorites();
    updateStats();
    renderPosts();
    showToast(state.favorites.has(key) ? "Recurso salvo nos favoritos." : "Recurso removido dos favoritos.");
}

function clearFilters() {
    state.query = "";
    state.category = "Todos";
    state.onlyFavorites = false;
    elements.search.value = "";
    renderCategoryChips();
    renderPosts();
}

elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderPosts();
});

elements.clearSearch.addEventListener("click", () => {
    elements.search.value = "";
    state.query = "";
    elements.search.focus();
    renderPosts();
});

elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderPosts();
});

elements.favoritesToggle.addEventListener("click", () => {
    state.onlyFavorites = !state.onlyFavorites;
    renderPosts();
});

elements.categoryChips.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    state.category = chip.dataset.category;
    renderCategoryChips();
    renderPosts();
});

elements.posts.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "retry") return carregarPosts();
    if (action === "clear-filters") return clearFilters();

    const card = event.target.closest("[data-post-key]");
    const post = state.posts.find((item) => postKey(item) === card?.dataset.postKey);
    if (!post) return;
    if (action === "favorite") toggleFavorite(post);
    if (action === "share") await compartilhar(post);
});

elements.retryButton.addEventListener("click", carregarPosts);

window.compartilhar = compartilhar;
carregarPosts();
