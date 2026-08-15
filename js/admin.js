const client = window.supabaseClient;
const elements = {
    loginBox: document.getElementById("loginBox"),
    adminBox: document.getElementById("adminBox"),
    loginForm: document.getElementById("loginForm"),
    email: document.getElementById("email"),
    senha: document.getElementById("senha"),
    loginMessage: document.getElementById("loginMessage"),
    sessionLabel: document.getElementById("sessionLabel"),
    postForm: document.getElementById("postForm"),
    nome: document.getElementById("nome"),
    link: document.getElementById("link"),
    categoria: document.getElementById("categoria"),
    descricao: document.getElementById("descricao"),
    btnSalvar: document.getElementById("btnSalvar"),
    btnCancelarEdicao: document.getElementById("btnCancelarEdicao"),
    formEyebrow: document.getElementById("formEyebrow"),
    adminTitle: document.getElementById("adminTitle"),
    formMessage: document.getElementById("formMessage"),
    btnLogout: document.getElementById("btnLogout"),
    btnRefresh: document.getElementById("btnRefresh"),
    adminSummary: document.getElementById("adminSummary"),
    listaAdmin: document.getElementById("listaAdmin"),
    toast: document.getElementById("toast")
};

let adminPosts = [];
let editingId = null;
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
        return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
    } catch {
        return null;
    }
}

function setMessage(element, text = "", type = "") {
    element.textContent = text;
    element.className = `form-message${type ? ` ${type}` : ""}`;
}

function showToast(message, type = "success") {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast visible${type === "error" ? " error" : ""}`;
    toastTimer = window.setTimeout(() => {
        elements.toast.className = "toast";
    }, 3200);
}

function formatDate(date) {
    if (!date) return "data não informada";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "data não informada";
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(parsed).replace(" de ", " ");
}

function getCategory(post) {
    return post.categoria || post.category || post.tipo || "Categoria automática";
}

function getPostId(post) {
    return String(post.id ?? post.codigo ?? "");
}

function setLoading(button, loading, loadingText, defaultText) {
    button.disabled = loading;
    button.innerHTML = loading ? `<span class="loader" style="width:14px;height:14px;margin:0;border-width:1px"></span> ${loadingText}` : defaultText;
}

function setAuthenticated(user) {
    const authenticated = Boolean(user);
    elements.loginBox.hidden = authenticated;
    elements.adminBox.hidden = !authenticated;
    if (authenticated) {
        elements.sessionLabel.textContent = `Sessão ativa: ${user.email || "administrador"}`;
        setMessage(elements.loginMessage, "");
        carregarPostsAdmin();
    }
}

async function checkUser() {
    if (!client) {
        setMessage(elements.loginMessage, "O cliente Supabase não foi carregado. Atualize a página e tente novamente.", "error");
        return;
    }
    try {
        const { data, error } = await withTimeout(client.auth.getSession());
        if (error) throw error;
        setAuthenticated(data.session?.user || null);
    } catch (error) {
        console.error("Erro ao validar sessão:", error);
        setMessage(elements.loginMessage, "Não foi possível validar a sessão agora.", "error");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    setMessage(elements.loginMessage, "");
    if (!client) {
        setMessage(elements.loginMessage, "O cliente Supabase não está disponível neste momento.", "error");
        return;
    }
    const email = elements.email.value.trim();
    const password = elements.senha.value;
    if (!email || !password) {
        setMessage(elements.loginMessage, "Informe e-mail e senha para continuar.", "error");
        return;
    }
    setLoading(elements.loginForm.querySelector("button[type=submit]"), true, "Autenticando...", "Entrar no control room ↗");
    try {
        const { data, error } = await withTimeout(client.auth.signInWithPassword({ email, password }));
        if (error) throw error;
        setAuthenticated(data.user);
        showToast("Login realizado. Bem-vindo ao control room.");
    } catch (error) {
        console.error("Erro no login:", error);
        setMessage(elements.loginMessage, "Não foi possível entrar. Confira suas credenciais.", "error");
    } finally {
        setLoading(elements.loginForm.querySelector("button[type=submit]"), false, "", "Entrar no control room ↗");
    }
}

function generateCode() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID().replaceAll("-", "").slice(0, 8);
    return Math.random().toString(36).slice(2, 10);
}

function getFormPayload() {
    const name = elements.nome.value.trim();
    const link = safeUrl(elements.link.value.trim());
    if (!name) throw new Error("Informe o nome do recurso.");
    if (!link) throw new Error("Informe um link válido começando com http:// ou https://.");

    const payload = {
        nome: name,
        link,
        categoria: elements.categoria.value.trim(),
        descricao: elements.descricao.value.trim()
    };
    return payload;
}

function canRetryWithoutOptionalFields(error, payload) {
    const message = String(error?.message || "").toLowerCase();
    const hasOptionalFields = "categoria" in payload || "descricao" in payload;
    return hasOptionalFields && /column|schema cache|does not exist|could not find/.test(message);
}

async function savePost(payload) {
    if (editingId) {
        let result = await withTimeout(client.from("posts").update(payload).eq("id", editingId));
        if (result.error && canRetryWithoutOptionalFields(result.error, payload)) {
            const fallback = { nome: payload.nome, link: payload.link };
            result = await withTimeout(client.from("posts").update(fallback).eq("id", editingId));
        }
        return result;
    }

    const createPayload = { ...payload, codigo: generateCode() };
    let result = await withTimeout(client.from("posts").insert([createPayload]));
    if (result.error && canRetryWithoutOptionalFields(result.error, createPayload)) {
        result = await withTimeout(client.from("posts").insert([{ nome: payload.nome, link: payload.link, codigo: createPayload.codigo }]));
    }
    return result;
}

async function handlePostSubmit(event) {
    event.preventDefault();
    setMessage(elements.formMessage, "");
    let payload;
    try {
        payload = getFormPayload();
    } catch (error) {
        setMessage(elements.formMessage, error.message, "error");
        return;
    }

    const defaultButtonText = editingId ? "Salvar alterações ↗" : "Publicar recurso ↗";
    setLoading(elements.btnSalvar, true, editingId ? "Salvando..." : "Publicando...", defaultButtonText);
    try {
        const { error } = await savePost(payload);
        if (error) throw error;
        resetForm();
        await carregarPostsAdmin();
        setMessage(elements.formMessage, editingId ? "Alterações salvas." : "Recurso publicado com sucesso.", "success");
        showToast(editingId ? "Recurso atualizado." : "Novo recurso publicado.");
    } catch (error) {
        console.error("Erro ao salvar post:", error);
        setMessage(elements.formMessage, error.message || "Não foi possível salvar o recurso.", "error");
    } finally {
        setLoading(elements.btnSalvar, false, "", defaultButtonText);
    }
}

async function carregarPostsAdmin() {
    elements.listaAdmin.setAttribute("aria-busy", "true");
    elements.listaAdmin.innerHTML = `<div class="state-card loading-state"><span class="loader"></span><p>Carregando recursos publicados...</p></div>`;
    try {
        const { data, error } = await withTimeout(client.from("posts").select("*").order("criado_em", { ascending: false }));
        if (error) throw error;
        adminPosts = Array.isArray(data) ? data : [];
        renderAdminPosts();
    } catch (error) {
        console.error("Erro ao carregar painel:", error);
        elements.adminSummary.textContent = "Falha ao carregar os recursos.";
        elements.listaAdmin.innerHTML = `<div class="state-card"><div class="state-icon">!</div><h3>Não foi possível carregar</h3><p>Verifique as políticas do Supabase ou tente novamente.</p><button class="btn btn-outline" type="button" data-admin-action="refresh">Tentar novamente</button></div>`;
    } finally {
        elements.listaAdmin.setAttribute("aria-busy", "false");
    }
}

function renderAdminPosts() {
    elements.adminSummary.textContent = `${adminPosts.length} ${adminPosts.length === 1 ? "recurso publicado" : "recursos publicados"}`;
    if (!adminPosts.length) {
        elements.listaAdmin.innerHTML = `<div class="state-card"><div class="state-icon">✦</div><h3>Seu vault está esperando o primeiro drop</h3><p>Use o formulário acima para publicar o primeiro recurso.</p></div>`;
        return;
    }
    elements.listaAdmin.innerHTML = adminPosts.map((post) => {
        const id = escapeHtml(getPostId(post));
        const link = escapeHtml(post.link || "");
        return `
            <article class="admin-row" data-post-id="${id}">
                <div class="admin-row-main">
                    <h3 class="admin-row-title">${escapeHtml(post.nome || "Recurso sem nome")}</h3>
                    <p class="admin-row-meta">${escapeHtml(getCategory(post))} · ${escapeHtml(formatDate(post.criado_em || post.created_at))} · ${link}</p>
                </div>
                <div class="admin-row-actions">
                    <button class="btn btn-outline" type="button" data-admin-action="edit">Editar</button>
                    <button class="btn danger-button" type="button" data-admin-action="delete">Apagar</button>
                </div>
            </article>
        `;
    }).join("");
}

function startEditing(post) {
    editingId = post.id;
    elements.nome.value = post.nome || "";
    elements.link.value = post.link || "";
    elements.categoria.value = post.categoria || post.category || "";
    elements.descricao.value = post.descricao || post.description || "";
    elements.formEyebrow.textContent = "EDIT DROP";
    elements.adminTitle.textContent = "Editar recurso";
    elements.btnSalvar.innerHTML = 'Salvar alterações <span aria-hidden="true">↗</span>';
    elements.btnCancelarEdicao.hidden = false;
    elements.formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    elements.nome.focus();
}

function resetForm() {
    editingId = null;
    elements.postForm.reset();
    elements.formEyebrow.textContent = "NEW DROP";
    elements.adminTitle.textContent = "Publicar um recurso";
    elements.btnSalvar.innerHTML = 'Publicar recurso <span aria-hidden="true">↗</span>';
    elements.btnCancelarEdicao.hidden = true;
}

async function deletarPost(id) {
    if (!id || !window.confirm("Apagar este recurso? Essa ação não pode ser desfeita.")) return;
    try {
        const { error } = await withTimeout(client.from("posts").delete().eq("id", id));
        if (error) throw error;
        if (String(editingId) === String(id)) resetForm();
        await carregarPostsAdmin();
        showToast("Recurso apagado.");
    } catch (error) {
        console.error("Erro ao apagar post:", error);
        showToast("Não foi possível apagar o recurso.", "error");
    }
}

elements.loginForm.addEventListener("submit", handleLogin);
elements.postForm.addEventListener("submit", handlePostSubmit);
elements.btnCancelarEdicao.addEventListener("click", () => {
    resetForm();
    setMessage(elements.formMessage, "");
});
elements.btnRefresh.addEventListener("click", carregarPostsAdmin);
elements.btnLogout.addEventListener("click", async () => {
    await client.auth.signOut();
    resetForm();
    setAuthenticated(null);
    showToast("Sessão encerrada.");
});
elements.listaAdmin.addEventListener("click", (event) => {
    const action = event.target.closest("[data-admin-action]")?.dataset.adminAction;
    if (!action) return;
    if (action === "refresh") return carregarPostsAdmin();
    const row = event.target.closest("[data-post-id]");
    const post = adminPosts.find((item) => getPostId(item) === row?.dataset.postId);
    if (!post) return;
    if (action === "edit") startEditing(post);
    if (action === "delete") deletarPost(post.id);
});

window.deletarPost = deletarPost;

if (client?.auth) {
    client.auth.onAuthStateChange((_event, session) => setAuthenticated(session?.user || null));
}
checkUser();
