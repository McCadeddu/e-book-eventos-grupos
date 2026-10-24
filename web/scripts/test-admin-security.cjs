// Uses the existing TypeScript dependency; no server or database is contacted.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const { createHmac, webcrypto } = require("node:crypto");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const secret = "security-test-secret-only";
process.env.ADMIN_SESSION_SECRET = secret;

function load(relativePath, mocks = {}, globals = {}) {
    const filename = path.join(root, relativePath);
    const localRequire = createRequire(filename);
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2017 },
    }).outputText;
    vm.runInNewContext(source, {
        module, exports: module.exports, process, Buffer, console, TextEncoder,
        crypto: webcrypto, atob, btoa, URLSearchParams,
        require(id) {
            if (id in mocks) return mocks[id];
            if (id.startsWith("@/")) {
                const file = [id.slice(2) + ".ts", id.slice(2) + ".tsx"].find((name) => fs.existsSync(path.join(root, name)));
                return load(file, mocks);
            }
            if (id.startsWith(".")) {
                const candidate = [".ts", ".tsx"].map((ext) => path.resolve(path.dirname(filename), id) + ext).find(fs.existsSync);
                if (candidate) return load(path.relative(root, candidate), mocks);
            }
            return localRequire(id);
        },
        ...globals,
    }, { filename });
    return module.exports;
}

const auth = load("lib/adminAuth.ts");
const { withAdminPage } = load("lib/adminPage.ts");
function context(cookie) {
    const headers = new Map();
    return {
        req: { headers: { cookie } },
        res: { setHeader: (name, value) => headers.set(name, value) },
        params: { slug: "grupo", id: "encontro" },
        query: {}, resolvedUrl: "/grupos/grupo", headers,
    };
}
function signedToken(exp) {
    const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
    return payload + "." + createHmac("sha256", secret).update(payload).digest("base64url");
}

test("accepts signed sessions and rejects invalid, expired and malformed sessions", () => {
    const valid = auth.createAdminSession("admin@example.org", secret);
    assert.equal(auth.verifyAdminSessionToken(valid, secret), true);
    for (const token of ["", valid + ".extra", valid + "x", signedToken(Date.now() - 1), signedToken(String(Date.now() + 10000))]) {
        assert.equal(auth.verifyAdminSessionToken(token, secret), false);
    }
    assert.equal(auth.isAdminAuthenticated({ headers: { cookie: "adminAuth=%ZZ" } }), false);
    assert.equal(auth.verifyAdminSessionToken(valid, ""), false);
});

test("private props are never loaded without authentication and cannot be cached", async () => {
    let calls = 0;
    const page = withAdminPage(async () => { calls++; return { props: { private: true } }; });
    for (const cookie of [undefined, "adminAuth=%ZZ", "adminAuth=forged", "adminAuth=" + signedToken(Date.now() - 1)]) {
        const ctx = context(cookie);
        const result = await page(ctx);
        assert.equal(result.redirect.destination, "/admin/login");
        assert.equal(ctx.headers.get("Cache-Control"), "private, no-store, max-age=0");
    }
    assert.equal(calls, 0);
    const ctx = context("adminAuth=" + auth.createAdminSession("admin@example.org", secret));
    assert.equal((await page(ctx)).props.private, true);
    assert.equal(calls, 1);
    assert.match(ctx.headers.get("Cache-Control"), /no-store/);
});

test("group and event administration reject unauthenticated data requests before database access", async () => {
    function forbiddenRead() { throw new Error("Private data read before authentication"); }
    const db = { getGrupoPorSlug: forbiddenRead, getGruposOrdenados: forbiddenRead, getEncontrosPorGrupo: forbiddenRead, getEventos: forbiddenRead };
    const mocks = {};
    for (const prefix of ["../../", "../../../", "../../../../", "../../../../../"]) {
        for (const name of ["grupos", "encontros", "eventos"]) mocks[prefix + "lib/db/" + name] = db;
        mocks[prefix + "lib/supabaseClient"] = { supabase: { from: forbiddenRead } };
        mocks[prefix + "lib/supabaseAdmin"] = { getSupabaseAdminClient: forbiddenRead };
        mocks[prefix + "lib/admin-redirecionamentos"] = { redirecionarCadastro: forbiddenRead };
    }
    mocks["@/lib/supabaseAdmin"] = { getSupabaseAdminClient: forbiddenRead };
    mocks["../../lib/admin-ano"] = { carregarAgendaAdministrativa: forbiddenRead };
    for (const file of ["pages/grupos/[slug].tsx", "pages/grupos/novo.tsx", "pages/grupos/[slug]/editar.tsx", "pages/grupos/[slug]/novo-encontro.tsx", "pages/grupos/[slug]/editar-encontro/[id].tsx", "pages/admin/grupos.tsx", "pages/admin/eventos/index.tsx", "pages/admin/eventos/novo.tsx", "pages/admin/eventos/editar/[id].tsx", "pages/admin/eventos/[id]/novo-encontro.tsx", "pages/admin/eventos/[id]/editar-encontro/[encontroId].tsx"]) {
        const page = load(file, mocks);
        assert.equal(page.getStaticProps, undefined, file);
        assert.equal(page.getStaticPaths, undefined, file);
        assert.equal((await page.getServerSideProps(context())).redirect.destination, "/admin/login", file);
    }
});

function apiResponse() {
    return {
        code: 200, body: null, headers: {}, revalidations: [],
        setHeader(name, value) { this.headers[name] = value; },
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
        async revalidate(route) { this.revalidations.push(route); },
    };
}

test("API guard authenticates before creating a privileged client and reports missing configuration", () => {
    let calls = 0;
    const { requireAdminClient } = load("lib/adminApi.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient() { calls++; throw new Error("configuration unavailable"); } },
    });
    const anonymous = apiResponse();
    assert.equal(requireAdminClient({ headers: {} }, anonymous), null);
    assert.equal(anonymous.code, 401);
    assert.equal(calls, 0);
    const authenticated = apiResponse();
    const cookie = "adminAuth=" + auth.createAdminSession("admin@example.org", secret);
    assert.equal(requireAdminClient({ headers: { cookie } }, authenticated), null);
    assert.equal(authenticated.code, 503);
    assert.equal(calls, 1);
    assert.match(authenticated.headers["Cache-Control"], /no-store/);
});

function fakeClient(label, calls, data) {
    return {
        async rpc(name, args) {
            calls.push({ client: label, table: "rpc:" + name, mutations: [["rpc", args]] });
            return { data: { sucesso: true, grupo: { id: "g", slug: "grupo" }, evento: { id: "e" } }, error: null };
        },
        from(table) {
            const call = { client: label, table, mutations: [] };
            calls.push(call);
            let single = false;
            const bounds = [];
            const query = {
                select() { return query; }, eq() { return query; }, not() { return query; },
                order() { return query; }, limit() { return query; }, range() { return query; },
                gte(column, value) { bounds.push((row) => row[column] >= value); return query; },
                lt(column, value) { bounds.push((row) => row[column] < value); return query; },
                single() { single = true; return query; }, maybeSingle() { single = true; return query; },
                insert(value) { call.mutations.push(["insert", value]); return query; },
                update(value) { call.mutations.push(["update", value]); return query; },
                upsert(value) { call.mutations.push(["upsert", value]); return query; },
                delete() { call.mutations.push(["delete"]); return query; },
                then(resolve, reject) {
                    const rows = (data[table] || []).filter((row) => bounds.every((check) => check(row)));
                    return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(resolve, reject);
                },
            };
            return query;
        },
    };
}

test("administrative repositories use the server client while public repositories keep the public client", async () => {
    const calls = [];
    const data = {
        grupos: [{ id: "g", slug: "grupo", equipe: [] }],
        eventos: [{ id: "e", equipe: [] }],
        encontros: [{ id: "m", grupo_id: "g", evento_id: "e", data_inicio: "2026-01-01", nivel: "evento" }],
    };
    const admin = fakeClient("admin", calls, data);
    const publicClient = fakeClient("public", calls, data);
    const mocks = {
        "../supabaseAdmin": { getSupabaseAdminClient: () => admin },
        "../supabaseClient": { supabase: publicClient },
    };
    const grupos = load("lib/db/grupos.ts", mocks);
    const encontros = load("lib/db/encontros.ts", mocks);
    const eventos = load("lib/db/eventos.ts", mocks);
    await grupos.getGruposOrdenados();
    await grupos.getGrupoPorSlug("grupo");
    await encontros.getEncontros();
    await encontros.getEncontrosPorGrupo("g");
    await eventos.getEventos();
    assert.equal(calls.length, 6);
    assert.ok(calls.every((call) => call.client === "admin"));
    calls.length = 0;
    await grupos.getGruposOrdenadosStrict();
    await grupos.getGrupoPorSlugStrict("grupo");
    await encontros.getEncontrosStrict();
    await encontros.getEncontrosPorGrupoStrict("g");
    await encontros.getEncontrosPorEventoStrict("e");
    await eventos.getEventosStrict();
    assert.equal(calls.length, 7);
    assert.ok(calls.every((call) => call.client === "public"));
});

test("pastoral years validate real dates and allow intervals crossing the end of the year", () => {
    const years = load("lib/ano-pastoral.ts");
    for (const value of [null, [], ["2027"], "2027x", 2027.5, 2019]) assert.equal(years.lerAnoPastoral(value), null);
    assert.equal(years.lerAnoPastoral("2027"), 2027);
    assert.equal(years.dataDoAnoPastoral("2027-02-29", 2027), false);
    assert.equal(years.dataDoAnoPastoral("2028-02-29", 2028), true);
    assert.equal(years.dataDoAnoPastoral("2026-12-31", 2027), false);
    assert.equal(years.erroDatasDoAno("2027-12-31", "2028-01-02", 2027), null);
    assert.ok(years.erroDatasDoAno("2027-03-02", "2027-03-01", 2027));
});

test("2027 starts empty without importing 2026 dates and keeps the existing groups and events", async () => {
    const calls = [];
    const data = { grupos: [{ id: "g" }], eventos: [{ id: "retreat" }], encontros: [{ id: "old", data_inicio: "2026-07-01" }] };
    const client = fakeClient("admin", calls, data);
    const { carregarAgendaAdministrativa } = load("lib/admin-ano.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => client },
        "./ebook-config": { carregarEdicoesEbook: async () => ({ anoPublicado: 2026, anoEmPreparacao: 2027, edicoes: [{ ano: 2026 }, { ano: 2027 }] }) },
        "./db/grupos": { getGruposOrdenados: async () => [{ id: "g" }] },
        "./db/eventos": { getEventos: async () => [{ id: "retreat" }] },
    });
    const empty = await carregarAgendaAdministrativa(undefined);
    assert.equal(empty.ano, 2027);
    assert.equal(empty.anoPublicado, 2026);
    assert.equal(empty.encontros.length, 0);
    assert.equal(empty.grupos.length, 1);
    assert.equal(empty.eventos.length, 1);
    assert.equal((await carregarAgendaAdministrativa("2026")).encontros[0].id, "old");
    data.encontros.push({ id: "new", data_inicio: "2027-08-01" });
    assert.equal((await carregarAgendaAdministrativa("2027")).encontros[0].id, "new");
    assert.equal((await carregarAgendaAdministrativa("2027")).encontros.length, 1);
    assert.equal(await carregarAgendaAdministrativa("2030"), null);
    assert.equal(await carregarAgendaAdministrativa(["2026", "2027"]), null);
    assert.ok(calls.every((call) => call.mutations.length === 0));
});

test("the 2027 editor cannot change or delete 2026 meetings and never stores year metadata as a column", async () => {
    for (const scenario of [
        { method: "POST", body: { grupoId: "g", tipo: "encontro_regular", dataInicio: "2026-05-01" }, status: 400 },
        { method: "POST", body: { grupoId: "g", tipo: "encontro_regular", dataInicio: "2027-02-29" }, status: 400 },
        { method: "POST", body: { grupoId: "g", tipo: "encontro_regular", dataInicio: "2027-05-01" }, status: 200 },
        { method: "PUT", body: { id: "old", grupo_id: "g", data_inicio: "2027-05-01" }, status: 409, date: "2026-05-01" },
        { method: "DELETE", body: { id: "old" }, status: 409, date: "2026-05-01" },
        { method: "PUT", body: { id: "new", grupo_id: "g", data_inicio: "2027-05-02" }, status: 200, date: "2027-05-01" },
        { method: "DELETE", body: { id: "new" }, status: 200, date: "2027-05-01" },
    ]) {
        const calls = [];
        const client = fakeClient("admin", calls, { ebook_edicoes: [{ ano: 2027 }], encontros: scenario.date ? [{ data_inicio: scenario.date }] : [] });
        const handler = load("pages/api/encontros.ts", {
            "./supabaseAdmin": { getSupabaseAdminClient: () => client },
            "../../lib/adminBackup": { salvarBackupAutomatico: async () => ({ sucesso: true }) },
            "../../lib/revalidacao-anual": { revalidarEdicaoAnual: async (res, ano) => { await res.revalidate(`/livro/edicao/${ano}/calendario`); return true; } },
        }).default;
        const response = apiResponse();
        await handler({ method: scenario.method, headers: { cookie: "adminAuth=" + auth.createAdminSession("admin@example.org", secret) }, body: { ...scenario.body, anoPastoral: 2027 } }, response);
        assert.equal(response.code, scenario.status, JSON.stringify(scenario));
        const mutations = calls.flatMap((call) => call.mutations);
        assert.equal(mutations.length > 0, scenario.status === 200);
        if (scenario.status === 200) assert.ok(response.revalidations.includes("/livro/edicao/2027/calendario"));
        for (const [, record] of mutations) if (record) assert.equal(Object.hasOwn(record, "anoPastoral"), false);
    }
});

test("all seven write APIs reject visitors and route authenticated changes through the server client", async () => {
    for (const scenario of [
        { file: "grupos.ts", method: "POST", body: { nome: "Teste isolado", anoPastoral: 2027 } },
        { file: "eventos.ts", method: "POST", body: { titulo: "Teste isolado", anoPastoral: 2027 } },
        { file: "encontros.ts", method: "POST", body: { anoPastoral: 2026, tipo: "encontro_regular", dataInicio: "2026-01-01", grupoId: "g" }, data: { ebook_edicoes: [{ ano: 2026 }] } },
        { file: "grupos/ordenar.ts", method: "POST", body: { ordem: [{ id: "g", ordem: 1 }] } },
        { file: "grupos/mover.ts", method: "POST", body: { grupoId: "g", direcao: "baixo" }, data: { grupos: [{ id: "g", ordem: 1 }, { id: "h", ordem: 2 }] } },
        { file: "eventos/ordenar.ts", method: "POST", body: { ordem: [{ id: "e", ordem: 1 }] } },
        { file: "ebook-edicoes.ts", method: "PUT", body: { ano: 2026, titulo: "Teste", capas: ["/capa.png"] } },
    ]) {
        const calls = [];
        let factories = 0;
        const client = fakeClient("admin", calls, scenario.data || {});
        const mocks = {
            "./supabaseAdmin": { getSupabaseAdminClient() { factories++; return client; } },
            "./adminBackup": { salvarBackupAutomatico: async () => ({ sucesso: true }) },
            "./revalidacao-anual": { revalidarEdicaoAnual: async () => true },
        };
        for (const prefix of ["../../", "../../../"]) {
            mocks[prefix + "lib/adminBackup"] = { salvarBackupAutomatico: async () => ({ sucesso: true }) };
            mocks[prefix + "lib/revalidacao-anual"] = { revalidarEdicaoAnual: async () => true };
            mocks[prefix + "lib/ebook-config"] = { carregarEdicoesEbook: async () => ({ edicoes: [] }) };
            mocks[prefix + "lib/supabaseClient"] = { supabase: { from() { throw new Error("Public client used for a write"); } } };
        }
        const handler = load("pages/api/" + scenario.file, mocks).default;
        const denied = apiResponse();
        await handler({ headers: {}, method: scenario.method, body: scenario.body }, denied);
        assert.equal(denied.code, 401, scenario.file);
        assert.equal(factories, 0, scenario.file);
        const accepted = apiResponse();
        await handler({ headers: { cookie: "adminAuth=" + auth.createAdminSession("admin@example.org", secret) }, method: scenario.method, body: scenario.body }, accepted);
        assert.equal(accepted.code, 200, scenario.file);
        assert.equal(accepted.body.sucesso, true, scenario.file);
        assert.equal(factories, 1, scenario.file);
        assert.ok(calls.some((call) => call.mutations.length > 0), scenario.file);
    }
});

test("middleware protects group routes and preserves public book and login access", async () => {
    const { middleware } = load("middleware.ts");
    function request(route, token) {
        return {
            nextUrl: { pathname: route, clone: () => new URL("https://example.org" + route) },
            cookies: { get: () => token ? { value: token } : undefined },
        };
    }
    for (const route of ["/grupos/novo", "/grupos/grupo", "/grupos/grupo/editar", "/grupos/grupo/novo-encontro", "/grupos/grupo/editar-encontro/id", "/admin/grupos"]) {
        const response = await middleware(request(route));
        assert.equal(response.status, 307, route);
        assert.equal(new URL(response.headers.get("location")).pathname, "/admin/login");
    }
    for (const route of ["/livro", "/livro/grupo", "/livro/calendario", "/admin/login", "/"]) {
        assert.equal((await middleware(request(route))).status, 200, route);
    }
    const token = auth.createAdminSession("admin@example.org", secret);
    assert.equal((await middleware(request("/grupos/grupo", token))).status, 200);
    assert.equal((await middleware(request("/grupos/grupo", token + ".extra"))).status, 307);
});

test("legacy routes converge on one annual editor and preserve the meeting's actual year", async () => {
    for (const scenario of [
        { type: "grupo-novo", form: "grupo-novo", year: "2027" },
        { type: "evento-novo", form: "evento-novo", year: "2027" },
        { type: "grupo", params: { slug: "grupo" }, anchor: "#grupo-grupo", year: "2027" },
        { type: "grupo-editar", params: { slug: "grupo" }, form: "grupo-editar", year: "2027" },
        { type: "encontro-grupo-novo", params: { slug: "grupo" }, form: "encontro-grupo-novo", year: "2027" },
        { type: "eventos", anchor: "#eventos", year: "2027" },
        { type: "evento-editar", params: { id: "e" }, form: "evento-editar", year: "2027" },
        { type: "encontro-evento-novo", params: { id: "e" }, form: "encontro-evento-novo", year: "2027" },
        { type: "encontro-editar-grupo", params: { id: "m", slug: "grupo" }, form: "encontro-editar", year: "2026" },
        { type: "encontro-editar-evento", params: { id: "e", encontroId: "m" }, form: "encontro-editar", year: "2026" },
        { type: "grupo-novo", query: { ano: "2026" }, form: "grupo-novo", year: "2026" },
        { type: "encontro-editar-grupo", params: { id: "m" }, query: { ano: "2027" }, notFound: true },
        { type: "encontro-editar-evento", params: { id: "other", encontroId: "m" }, notFound: true },
        { type: "grupo-novo", query: { ano: ["2026", "2027"] }, notFound: true },
    ]) {
        const calls = [];
        const client = fakeClient("admin", calls, {
            grupos: [{ id: "g", slug: "grupo" }], eventos: [{ id: "e" }],
            encontros: [{ id: "m", evento_id: "e", data_inicio: "2026-05-01" }],
        });
        const { redirecionarCadastro } = load("lib/admin-redirecionamentos.ts", {
            "./supabaseAdmin": { getSupabaseAdminClient: () => client },
            "./ebook-config": { carregarEdicoesEbook: async () => ({ anoEmPreparacao: 2027, edicoes: [{ ano: 2026 }, { ano: 2027 }] }) },
        });
        const result = await redirecionarCadastro({ query: scenario.query || {}, params: scenario.params || {} }, scenario.type);
        if (scenario.notFound) assert.equal(result.notFound, true, scenario.type);
        else {
            const url = new URL(result.redirect.destination, "https://example.org");
            assert.equal(url.pathname, "/admin/grupos");
            assert.equal(url.searchParams.get("ano"), scenario.year, scenario.type);
            assert.equal(url.searchParams.get("form"), scenario.form || null, scenario.type);
            if (scenario.anchor) assert.equal(url.hash, scenario.anchor);
            assert.equal(result.redirect.permanent, false);
        }
        assert.ok(calls.every((call) => call.mutations.length === 0));
    }
});

test("each sector has one form implementation with the fields needed for both creation and editing", () => {
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const common = { ano: 2027, submitLabel: "Salvar", onSubmit: async () => ({ sucesso: true }), onCancel() {} };
    const group = load("components/admin/FormularioGrupo.tsx").default;
    const event = load("components/admin/FormularioEvento.tsx").default;
    const meeting = load("components/admin/FormularioEncontro.tsx").default;
    const groupHtml = renderToStaticMarkup(React.createElement(group, common));
    for (const field of ["nome", "faixa_etaria", "descricao", "objetivo_ano", "equipe", "convite_final"]) assert.ok(groupHtml.includes(`name="${field}"`));
    const eventHtml = renderToStaticMarkup(React.createElement(event, { ...common, grupos: [{ id: "g", nome: "Grupo" }] }));
    for (const field of ["titulo", "equipe", "grupos_envolvidos", "visibilidade", "objetivo_ano", "convite"]) assert.ok(eventHtml.includes(`name="${field}"`));
    const meetingHtml = renderToStaticMarkup(React.createElement(meeting, { ...common, ano: 2027, evento: { id: "e", titulo: "Retiro" }, eventos: [], permitirNivelEvento: true, mostrarVinculoEvento: false }));
    for (const field of ["nivel", "mostrar_no_anual", "dataInicio", "dataFim", "tipo", "horario", "local", "visibilidade"]) assert.ok(meetingHtml.includes(`name="${field}"`));
    assert.ok(meetingHtml.includes('min="2027-01-01"'));
    assert.ok(meetingHtml.includes('max="2027-12-31"'));
    const legacyHtml = renderToStaticMarkup(React.createElement(meeting, { ...common, ano: 2026, evento: { id: "e" }, eventos: [], permitirNivelEvento: true, mostrarVinculoEvento: false, encontro: { id: "m", tipo: "pre-evento", nivel: "organizacao" } }));
    assert.match(legacyHtml, /value="pre-evento" selected=""/);
    assert.match(legacyHtml, /value="organizacao" selected=""/);
    for (const html of [groupHtml, eventHtml, meetingHtml, legacyHtml]) assert.equal((html.match(/<form /g) || []).length, 1);
});

test("shared submission handles success, server errors and lost connections without losing the year", async () => {
    const calls = [];
    const payload = { anoPastoral: 2027, grupoId: "g", dataInicio: "2027-05-01" };
    const { salvarCadastro } = load("lib/admin-cadastros.ts", {}, {
        fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ sucesso: true, grupo: { slug: "grupo" } }) }; },
    });
    const result = await salvarCadastro("encontros", "POST", payload);
    assert.equal(result.sucesso, true);
    assert.equal(calls[0].url, "/api/encontros");
    assert.equal(JSON.parse(calls[0].options.body).anoPastoral, 2027);
    for (const response of [
        async () => ({ ok: false, json: async () => ({ erro: "Sessão inválida" }) }),
        async () => { throw new Error("Offline"); },
        async () => ({ ok: true, json: async () => { throw new Error("Invalid JSON"); } }),
    ]) {
        const failed = load("lib/admin-cadastros.ts", {}, { fetch: response });
        assert.equal((await failed.salvarCadastro("grupos", "PUT", {})).sucesso, false);
    }
});


test("disclosure uses current group or event ownership and preserves the meeting year without writes", async () => {
    for (const event of [false, true]) {
        const calls = [];
        const client = fakeClient("admin", calls, {
            encontros: [{ id: "m", grupo_id: event ? null : "g", evento_id: event ? "e" : null, data_inicio: "2026-03-08" }],
            grupos: [{ id: "g", slug: "grupo", nome: "Grupo" }],
            eventos: [{ id: "e", titulo: "Retiro" }],
        });
        const { carregarDivulgacaoEncontro } = load("lib/admin-divulgacao.ts", {
            "./supabaseAdmin": { getSupabaseAdminClient: () => client },
        });
        const data = await carregarDivulgacaoEncontro("m");
        assert.equal(data.grupo.nome, event ? "Retiro" : "Grupo");
        assert.equal(data.voltarHref, `/admin/grupos?ano=2026#${event ? "evento-e" : "grupo-grupo"}`);
        assert.deepEqual(calls.map(x => x.table), ["encontros", event ? "eventos" : "grupos", event ? "evento_edicoes" : "grupo_edicoes"]);
        assert.ok(calls.every(x => x.mutations.length === 0));
    }
    const { carregarDivulgacaoEncontro } = load("lib/admin-divulgacao.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => fakeClient("admin", [], {}) },
    });
    assert.equal(await carregarDivulgacaoEncontro("missing"), null);
});

test("preview and poster authenticate before reading meeting data", async () => {
    for (const file of ["pages/admin/preview/encontro/[id].tsx", "pages/admin/preview/encontro/[id]/cartaz.tsx"]) {
        let calls = 0;
        const mocks = {};
        for (const prefix of ["../../../../", "../../../../../"]) {
            mocks[prefix + "lib/admin-divulgacao"] = { carregarDivulgacaoEncontro: async () => { calls++; return null; } };
        }
        const page = load(file, mocks);
        assert.equal((await page.getServerSideProps(context())).redirect.destination, "/admin/login");
        assert.equal(calls, 0);
        const ctx = context("adminAuth=" + auth.createAdminSession("admin@example.org", secret));
        assert.equal((await page.getServerSideProps(ctx)).notFound, true);
        assert.equal(calls, 1);
    }
});

test("print card escapes stored text and excludes administrative actions from the PDF", () => {
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const Card = load("components/admin/CartaoEncontro.tsx").default;
    const html = renderToStaticMarkup(React.createElement(Card, {
        encontro: { id: "m", evento_id: "e", titulo: '<script>alert("x")</script>', data_inicio: "2027-03-07" },
        grupo: { nome: "Retiro & comunidade" }, voltarHref: "/admin/grupos?ano=2027", acoes: false,
    }));
    assert.ok(html.includes("Retiro &amp; comunidade"));
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(!html.includes("<script>"));
    assert.ok(!html.includes("/api/pdf/"));
    assert.ok(!html.includes("/admin/"));
});

test("PDF authenticates and validates input before reading data or launching Chromium", async () => {
    let reads = 0, launches = 0;
    const handler = load("pages/api/pdf/encontro.ts", {
        "../../../lib/admin-divulgacao": { carregarDivulgacaoEncontro: async () => { reads++; return null; } },
        puppeteer: { default: { launch: async () => { launches++; throw Error("unexpected browser"); } } },
    }).default;
    const headers = { cookie: "adminAuth=" + auth.createAdminSession("admin@example.org", secret) };
    for (const [req, code] of [
        [{ headers: {}, method: "GET", query: { id: "m" } }, 401],
        [{ headers, method: "POST", query: { id: "m" } }, 405],
        [{ headers, method: "GET", query: { id: "../../evil" } }, 400],
        [{ headers, method: "GET", query: { id: ["m", "n"] } }, 400],
    ]) {
        const res = apiResponse();
        await handler(req, res);
        assert.equal(res.code, code);
        assert.match(res.headers["Cache-Control"], /no-store/);
    }
    assert.equal(reads, 0);
    const missing = apiResponse();
    await handler({ headers, method: "GET", query: { id: "missing" } }, missing);
    assert.equal(missing.code, 404);
    assert.equal(launches, 0);
});

test("PDF returns actual bytes, disables scripts and closes the browser on success or failure", async () => {
    const headers = { cookie: "adminAuth=" + auth.createAdminSession("admin@example.org", secret) };
    for (const fail of [false, true]) {
        let closed = 0, scripts = null, html = "";
        const handler = load("pages/api/pdf/encontro.ts", {
            "../../../lib/admin-divulgacao": { carregarDivulgacaoEncontro: async () => ({
                encontro: { id: "m", titulo: "Encontro", data_inicio: "2027-03-07" }, grupo: { nome: "Grupo" }, voltarHref: "/admin/grupos?ano=2027",
            }) },
            puppeteer: { default: { launch: async () => ({
                newPage: async () => ({
                    setJavaScriptEnabled: async value => { scripts = value; },
                    setContent: async value => { html = value; },
                    pdf: async () => { if (fail) throw Error("printing failed"); return Buffer.from("%PDF-test"); },
                }),
                close: async () => { closed++; },
            }) } },
        }).default;
        const res = apiResponse();
        res.send = function(body) { this.body = body; return this; };
        await handler({ headers, method: "GET", query: { id: "m" } }, res);
        assert.equal(closed, 1);
        assert.equal(scripts, false);
        assert.ok(!html.includes("/admin/preview"));
        assert.equal(res.code, fail ? 500 : 200);
        if (!fail) { assert.equal(res.headers["Content-Type"], "application/pdf"); assert.equal(res.body.toString(), "%PDF-test"); }
    }
});

test("ordering and deletion never report failed HTTP or malformed responses as success", async () => {
    for (const response of [
        { ok: false, json: async () => ({ sucesso: true }) },
        { ok: true, json: async () => null },
        { ok: true, json: async () => ({ erro: "blocked" }) },
    ]) {
        const { enviarAcaoAdmin } = load("lib/admin-cadastros.ts", {}, { fetch: async () => response });
        for (const [route, method] of [["/api/grupos", "DELETE"], ["/api/eventos/ordenar", "POST"], ["/api/encontros", "PUT"]]) {
            assert.equal((await enviarAcaoAdmin(route, method, { id: "m" })).sucesso, false);
        }
    }
});


test("Vercel PDF bundles a Linux Chromium while local development keeps the installed browser", async () => {
    let extracted = 0;
    const chromium = { args: ["--serverless"], executablePath: async () => { extracted++; return "/tmp/chromium"; } };
    for (const [platform, vercel, expected] of [["win32", "1", false], ["linux", undefined, false], ["linux", "1", true]]) {
        const helper = load("lib/pdf-browser.ts", { "@sparticuz/chromium": { default: chromium } }, {
            process: { platform, env: { VERCEL: vercel } },
        });
        const options = await helper.opcoesNavegadorPdf();
        assert.equal(options.timeout, 20000);
        assert.equal(Boolean(options.executablePath), expected);
        if (expected) { assert.equal(options.headless, "shell"); assert.equal(options.executablePath, "/tmp/chromium"); }
    }
    assert.equal(extracted, 1);
});


test("public database audit distinguishes denied or hidden data from exposed data and inconclusive errors", () => {
    const { avaliarLeituraPublica } = require("./check-database-access.cjs");
    for (const status of [401, 403]) assert.equal(avaliarLeituraPublica({ status, error: {} }), "bloqueado");
    assert.equal(avaliarLeituraPublica({ status: 200, count: 0 }), "bloqueado");
    assert.equal(avaliarLeituraPublica({ status: 200, count: 26 }), "exposto");
    for (const value of [{ status: 200, count: null }, { status: 404 }, { status: 503 }, { status: 200, count: 0, error: {} }]) {
        assert.equal(avaliarLeituraPublica(value), "inconclusivo");
    }
});


function publicReadModule(file, rows, deniedTable) {
    const queries = [];
    let fileReads = 0;
    const client = { from(table) {
        const filters = [];
        let single = false;
        queries.push({ table, filters });
        const q = {
            select() { return q; }, order() { return q; },
            not() { return q; },
            eq(column, value) { filters.push([column, value]); return q; },
            maybeSingle() { single = true; return q; },
            then(resolve, reject) {
                if (deniedTable === table) return Promise.resolve({ data: null, error: { message: "permission denied" } }).then(resolve, reject);
                const data = (rows[table] || []).filter(row => filters.every(([column, value]) => row[column] === value));
                return Promise.resolve({ data: single ? data[0] || null : data, error: null }).then(resolve, reject);
            },
        };
        return q;
    } };
    return { module: load(file, {
        "../supabaseClient": { supabase: client },
        fs: { default: { readFileSync() { fileReads++; throw Error("Historical files must not be loaded"); } } },
    }), queries, fileReads: () => fileReads };
}

test("empty public collections and absent groups do not resurrect historical JSON records", async () => {
    const groups = publicReadModule("lib/db/grupos.ts", {});
    assert.equal((await groups.module.getGruposOrdenadosStrict()).length, 0);
    assert.equal(await groups.module.getGrupoPorSlugStrict("removed"), null);
    const meetings = publicReadModule("lib/db/encontros.ts", {});
    assert.equal((await meetings.module.getEncontrosStrict()).length, 0);
    assert.equal((await meetings.module.getEncontrosPorGrupoStrict("removed")).length, 0);
    assert.equal((await meetings.module.getEncontrosPorEventoStrict("removed")).length, 0);
    const events = publicReadModule("lib/db/eventos.ts", {});
    assert.equal((await events.module.getEventosStrict()).length, 0);
    assert.equal(groups.fileReads() + meetings.fileReads() + events.fileReads(), 0);
});

test("public permission errors cannot be replaced with historical content", async () => {
    const groups = publicReadModule("lib/db/grupos.ts", {}, "grupos");
    await assert.rejects(groups.module.getGruposOrdenadosStrict(), /Erro ao buscar/);
    await assert.rejects(groups.module.getGrupoPorSlugStrict("g"), /Erro ao buscar/);
    const meetings = publicReadModule("lib/db/encontros.ts", {}, "encontros");
    await assert.rejects(meetings.module.getEncontrosStrict(), /Erro ao buscar/);
    await assert.rejects(meetings.module.getEncontrosPorGrupoStrict("g"), /Erro ao buscar/);
    await assert.rejects(meetings.module.getEncontrosPorEventoStrict("e"), /Erro ao buscar/);
    const events = publicReadModule("lib/db/eventos.ts", {}, "eventos");
    await assert.rejects(events.module.getEventosStrict(), /Erro ao buscar/);
    const dates = publicReadModule("lib/db/eventos.ts", { eventos: [{ id: "e" }] }, "encontros");
    await assert.rejects(dates.module.getEventosStrict(), /Erro ao buscar/);
    assert.equal(groups.fileReads() + meetings.fileReads() + events.fileReads() + dates.fileReads(), 0);
});

test("public meeting readers exclude internal meetings even before database RLS is corrected", async () => {
    const meetings = publicReadModule("lib/db/encontros.ts", { encontros: [
        { id: "public", grupo_id: "g", evento_id: "e", nivel: "evento", visibilidade: "publico" },
        { id: "private", grupo_id: "g", evento_id: "e", nivel: "evento", visibilidade: "interno" },
    ] });
    for (const result of [await meetings.module.getEncontrosStrict(), await meetings.module.getEncontrosPorGrupoStrict("g"), await meetings.module.getEncontrosPorEventoStrict("e")]) {
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "public");
    }
});

test("events with no accessible meetings keep their dates empty instead of inheriting old file dates", async () => {
    const events = publicReadModule("lib/db/eventos.ts", { eventos: [{ id: "e", data_inicio: "2026-01-01" }] });
    const result = await events.module.getEventosStrict();
    assert.equal(result.length, 1);
    assert.equal(result[0].data_inicio, null);
    assert.equal(result[0].data_fim, null);
    assert.equal(events.fileReads(), 0);
});


test("annual validation requires a year, preserves cleared fields and rejects arbitrary columns", () => {
    const { validarCadastroAnual } = load("lib/admin-edicoes.ts", {
        "./adminBackup": {}, "./revalidacao-anual": {},
    });
    for (const body of [null, [], { id: "g", nome: "Novo" }, { id: "g", anoPastoral: 2027, ordem: 1 },
        { id: "g", anoPastoral: 2027, equipe: [9] }, { id: "g", anoPastoral: 2027, nome: " " }]) {
        assert.ok(validarCadastroAnual("grupos", body, false).erro);
    }
    const result = validarCadastroAnual("grupos", { id: "g", slug: "immutable", anoPastoral: 2027, objetivo_ano: "", equipe: [] }, false);
    assert.equal(result.ano, 2027);
    assert.equal(result.dados.objetivo_ano, "");
    assert.equal(result.dados.equipe.length, 0);
    assert.equal(Object.hasOwn(result.dados, "slug"), false);
    assert.equal(Object.hasOwn(result.dados, "anoPastoral"), false);
    const created = validarCadastroAnual("grupos", { anoPastoral: 2027, nome: " Grupo Árvore " }, true);
    assert.equal(created.dados.slug, "grupo-arvore");
    const event = validarCadastroAnual("eventos", { id: "e", anoPastoral: 2027, todos_os_grupos: false, visibilidade: "interno" }, false);
    assert.equal(event.dados.todos_os_grupos, false);
});

test("annual API uses only the transactional RPC and refuses missing infrastructure without global writes", async () => {
    for (const [error, expected] of [[null, 200], [{ code: "PGRST202" }, 503], [{ code: "22023" }, 400], [{ code: "23505" }, 409], [{ code: "P0002" }, 404]]) {
        let rpc = 0;
        const client = { from() { throw Error("Global table write attempted"); }, async rpc(name, args) {
            rpc++; assert.equal(name, "pascom_salvar_cadastro_anual"); assert.equal(args.p_ano, 2027);
            assert.equal(args.p_dados.objetivo_ano, ""); assert.equal(args.p_criar, false);
            return { error, data: error ? null : { sucesso: true, grupo: { id: "g", slug: "grupo" } } };
        } };
        const api = load("lib/admin-edicoes.ts", {
            "./adminBackup": { salvarBackupAutomatico: async () => ({ sucesso: true }) },
            "./revalidacao-anual": { revalidarEdicaoAnual: async () => true },
        });
        const res = apiResponse();
        await api.salvarCadastroAnualApi("grupos", { method: "PUT", body: { id: "g", anoPastoral: 2027, objetivo_ano: "" } }, res, client);
        assert.equal(res.code, expected); assert.equal(rpc, 1);
        const invalid = apiResponse();
        await api.salvarCadastroAnualApi("grupos", { method: "PUT", body: { id: "g", nome: "Wrong year context" } }, invalid, client);
        assert.equal(invalid.code, 400); assert.equal(rpc, 1);
    }
});

function annualClient(rows) {
    return { from(table) {
        const checks = [];
        const q = { select() { return q; }, order() { return q; },
            eq(k,v) { checks.push(r => r[k] === v); return q; },
            gte(k,v) { checks.push(r => r[k] >= v); return q; },
            lt(k,v) { checks.push(r => r[k] < v); return q; },
            then(resolve,reject) { return Promise.resolve({ data: (rows[table] || []).filter(r => checks.every(c => c(r))), error: null }).then(resolve,reject); },
        }; return q;
    } };
}

test("annual loading isolates 2027 content and does not change 2026 or inherit cleared values", async () => {
    const rows = {
        grupos: [{ id: "g", slug: "grupo", nome: "Original", equipe: ["Original"], objetivo_ano: "Global" }],
        eventos: [{ id: "e", titulo: "Retiro", visibilidade: "publico" }],
        grupo_edicoes: [{ grupo_id: "g", ano: 2026, objetivo_ano: "Objetivo 2026", equipe: ["Equipe 2026"] },
            { grupo_id: "g", ano: 2027, objetivo_ano: "", equipe: [] }],
        evento_edicoes: [{ evento_id: "e", ano: 2027, visibilidade: "interno" }],
        encontros: [{ id: "old", grupo_id: "g", data_inicio: "2026-03-01", visibilidade: "publico" }],
    };
    const snapshot = JSON.stringify(rows);
    const helper = load("lib/conteudo-anual.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => annualClient(rows) },
        "./ebook-config": { pertenceAoAno: (date, year) => date?.startsWith(year + "-") },
    });
    const before = await helper.carregarConteudoAnual(2026);
    const next = await helper.carregarConteudoAnual(2027);
    assert.equal(before.grupos[0].objetivo_ano, "Objetivo 2026");
    assert.equal(next.grupos[0].objetivo_ano, ""); assert.equal(next.grupos[0].equipe.length, 0);
    assert.equal(before.eventos[0].visibilidade, "publico"); assert.equal(next.eventos[0].visibilidade, "interno");
    assert.equal(next.encontros.length, 0); assert.equal(JSON.stringify(rows), snapshot);
});

test("public annual props exclude internal owners and unknown private columns before serialization", () => {
    const { filtrarConteudoPublico } = load("lib/conteudo-anual.ts", {
        "./ebook-config": { pertenceAoAno: (date, year) => date?.startsWith(year + "-") },
    });
    const data = filtrarConteudoPublico(2027, {
        grupos: [{ id: "g", nome: "Public", admin_note: "SECRET_GROUP" }],
        eventos: [{ id: "e", visibilidade: "publico", admin_note: "SECRET_EVENT" }, { id: "hidden", visibilidade: "interno", titulo: "SECRET_PARENT" }],
        encontros: [
            { id: "ok", grupo_id: "g", visibilidade: "publico", data_inicio: "2027-03-01", admin_note: "SECRET_MEETING" },
            { id: "private", grupo_id: "g", visibilidade: "interno", data_inicio: "2027-03-01" },
            { id: "child", evento_id: "hidden", visibilidade: "publico", data_inicio: "2027-03-01" },
            { id: "old", grupo_id: "g", visibilidade: "publico", data_inicio: "2026-03-01" },
        ],
    });
    assert.equal(data.encontros.length, 1); assert.equal(data.eventos.length, 1);
    assert.ok(!JSON.stringify(data).includes("SECRET"));
});

test("organization meetings appear once in involved group chapters, not as official event meetings", async () => {
    const conteudo = { grupos: [{ id: "g", slug: "grupo" }], eventos: [{ id: "e", grupos_envolvidos: ["g"], titulo: "Retiro" }],
        encontros: [{ id: "official", evento_id: "e", nivel: "evento", mostrar_no_anual: true }, { id: "org", evento_id: "e", nivel: "organizacao", mostrar_no_anual: false }] };
    const livro = load("lib/livro-ano.ts", {
        "./conteudo-anual": { carregarConteudoPublicoAnual: async () => conteudo },
        "./ebook-config": { carregarEbookPorAno: async ano => ({ ano }) },
    });
    assert.equal((await livro.carregarCapituloLivroPorAno(2027,"grupo")).encontros.length, 2);
    assert.equal((await livro.carregarEventoLivroPorAno(2027,"e")).encontros.length, 1);
    assert.equal((await livro.carregarCalendarioLivroPorAno(2027)).encontros.length, 1);
});

test("annual revalidation refreshes all indexes only in the edited year and legacy pages only for the published year", async () => {
    const helper = load("lib/revalidacao-anual.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => annualClient({ grupos: [{ slug: "grupo" }], eventos: [{ id: "e" }] }) },
        "./ebook-config": { carregarEdicoesEbook: async () => ({ anoPublicado: 2026 }) },
    });
    const next = apiResponse(); assert.equal(await helper.revalidarEdicaoAnual(next,2027), true);
    assert.ok(next.revalidations.includes("/livro/edicao/2027/grupo/grupo"));
    assert.ok(next.revalidations.includes("/livro/edicao/2027/evento/e"));
    assert.ok(!next.revalidations.includes("/livro"));
    assert.ok(!next.revalidations.some(p => p.includes("2026")));
    const published = apiResponse(); assert.equal(await helper.revalidarEdicaoAnual(published,2026),true);
    assert.ok(published.revalidations.includes("/livro/grupo"));
    assert.ok(published.revalidations.includes("/livro/evento/e"));
});

test("version 3 backups retain annual editorial content as well as base records", async () => {
    const calls = [];
    const backup = load("lib/adminBackup.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => fakeClient("admin",calls,{
            grupos: [{ id:"g" }], eventos: [], encontros: [],
            grupo_edicoes: [{ grupo_id:"g", ano:2027, objetivo_ano:"Annual" }],
            evento_edicoes: [], ebook_edicoes: [{ ano:2027 }], ebook_estado: [{ id:"principal" }],
        }) },
    });
    assert.equal((await backup.salvarBackupAutomatico({ entidade:"grupos", acao:"editar" })).sucesso,true);
    const record = calls.find(c => c.table === "admin_backups" && c.mutations.length).mutations[0][1];
    assert.equal(record.versao,3); assert.equal(record.payload.grupo_edicoes[0].objetivo_ano,"Annual");
    assert.equal(record.payload.ebook_edicoes[0].ano,2027);
});

test("annual deactivation hides chapters and meetings, preserves inactive content and can be reversed without changing another year", async () => {
    const rows = {
        grupos: [{ id: "g", slug: "grupo", nome: "Base" }],
        eventos: [{ id: "e", titulo: "Base", visibilidade: "publico" }],
        grupo_edicoes: [{ grupo_id: "g", ano: 2027, nome: "Nome 2027", ativo: true }],
        evento_edicoes: [{ evento_id: "e", ano: 2027, titulo: "Evento 2027", ativo: true }],
        encontros: [
            { id: "m", grupo_id: "g", data_inicio: "2027-03-01", visibilidade: "publico" },
            { id: "v", evento_id: "e", data_inicio: "2027-04-01", visibilidade: "publico" },
        ],
    };
    const helper = load("lib/conteudo-anual.ts", {
        "./supabaseAdmin": { getSupabaseAdminClient: () => annualClient(rows) },
        "./ebook-config": { pertenceAoAno: (date, year) => date?.startsWith(year + "-") },
    });
    const before = JSON.stringify(await helper.carregarConteudoAnual(2026));
    const dates = JSON.stringify(rows.encontros);
    let backups = 0, revalidations = 0;
    const api = load("lib/admin-edicoes.ts", {
        "./adminBackup": { salvarBackupAutomatico: async () => { backups++; return { sucesso: true }; } },
        "./revalidacao-anual": { revalidarEdicaoAnual: async (_, year) => { assert.equal(year, 2027); revalidations++; return true; } },
    });
    const client = { from() { throw Error("Global mutation attempted"); }, async rpc(name, args) {
        assert.equal(name, "pascom_salvar_cadastro_anual"); assert.equal(args.p_ano, 2027);
        assert.equal(args.p_criar, false); assert.deepEqual(Object.keys(args.p_dados).sort(), ["ativo", "id"]);
        const group = args.p_setor === "grupos";
        const table = group ? rows.grupo_edicoes : rows.evento_edicoes;
        table.find(r => r[group ? "grupo_id" : "evento_id"] === args.p_dados.id).ativo = args.p_dados.ativo;
        return { data: { sucesso: true }, error: null };
    } };
    for (const ativo of [false, true]) {
        for (const setor of ["grupos", "eventos"]) {
            const res = apiResponse();
            await api.salvarCadastroAnualApi(setor, { method: "PUT", body: { id: setor === "grupos" ? "g" : "e", anoPastoral: 2027, ativo } }, res, client);
            assert.equal(res.code, 200);
        }
        const admin = await helper.carregarConteudoAnual(2027);
        assert.equal(admin.grupos.length, ativo ? 1 : 0); assert.equal(admin.eventos.length, ativo ? 1 : 0);
        assert.equal(admin.gruposInativos.length, ativo ? 0 : 1);
        assert.equal(admin.eventosInativos.length, ativo ? 0 : 1);
        if (!ativo) { assert.equal(admin.gruposInativos[0].nome, "Nome 2027"); assert.equal(admin.eventosInativos[0].titulo, "Evento 2027"); }
        assert.equal(admin.encontros.length, 2);
        const publico = helper.filtrarConteudoPublico(2027, admin);
        assert.equal(publico.encontros.length, ativo ? 2 : 0);
        assert.equal(Object.hasOwn(publico, "gruposInativos"), false);
        assert.equal(Object.hasOwn(publico, "eventosInativos"), false);
        assert.equal(JSON.stringify(await helper.carregarConteudoAnual(2026)), before);
        assert.equal(JSON.stringify(rows.encontros), dates);
    }
    assert.equal(backups, 4); assert.equal(revalidations, 4);
});

test("inactive registry uses annual names and accessible reactivation actions for both sectors", () => {
    const React = require("react");
    const { renderToStaticMarkup } = require("react-dom/server");
    const component = load("components/admin/CadastrosInativos.tsx").default;
    const html = renderToStaticMarkup(React.createElement(component, { ano: 2027,
        grupos: [{ id: "g", nome: "Grupo anual" }], eventos: [{ id: "e", titulo: "Retiro anual" }], onAtivar: async () => {} }));
    assert.ok(html.includes("Cadastros inativos em 2027 (2)"));
    assert.ok(html.includes('aria-label="Reativar Grupo anual em 2027"'));
    assert.ok(html.includes('aria-label="Reativar Retiro anual em 2027"'));
    assert.equal((html.match(/<button/g) || []).length, 2);
});

test("meeting APIs reject missing years, unknown columns and malformed flags before database access", async () => {
    const cookie = "adminAuth=" + auth.createAdminSession("admin@example.org", secret);
    for (const method of ["POST", "PUT", "DELETE"]) {
        for (const body of [null, [], { id: "m" }, { id: "m", anoPastoral: [2027] },
            { id: "m", anoPastoral: 2027, created_at: "2027-01-01" }]) {
            const calls = [];
            const handler = load("pages/api/encontros.ts", {
                "./supabaseAdmin": { getSupabaseAdminClient: () => fakeClient("admin", calls, {}) },
                "../../lib/adminBackup": {}, "../../lib/revalidacao-anual": {},
            }).default;
            const res = apiResponse();
            await handler({ method, headers: { cookie }, body }, res);
            assert.equal(res.code, 400); assert.equal(calls.length, 0);
        }
    }
    const { validarPedidoEncontro } = load("lib/validacao-encontros.ts");
    for (const extra of [{ mostrar_no_anual: "false" }, { nivel: "outro" }, { visibilidade: null }, { grupo_id: ["g"] }, { local: {} }]) {
        assert.ok(validarPedidoEncontro("PUT", { id: "m", anoPastoral: 2027, ...extra }).erro);
    }
    const legacy = validarPedidoEncontro("PUT", { id: "m", anoPastoral: 2027, tipo: "tipo_historico", descricao: "", mostrar_no_anual: false });
    assert.equal(legacy.dados.tipo, "tipo_historico"); assert.equal(legacy.dados.descricao, "");
    assert.equal(legacy.dados.mostrar_no_anual, false);
    assert.equal(Object.hasOwn(legacy.dados, "anoPastoral"), false);
});

test("meetings require a configured edition and fail closed when it cannot be read", async () => {
    const cookie = "adminAuth=" + auth.createAdminSession("admin@example.org", secret);
    for (const denied of [false, true]) {
        const handler = load("pages/api/encontros.ts", {
            "../../lib/adminBackup": {}, "../../lib/revalidacao-anual": {},
            "./supabaseAdmin": { getSupabaseAdminClient: () => ({ from(table) {
                assert.equal(table, "ebook_edicoes");
                const q = { select() { return q; }, eq(_, year) { assert.equal(year, 2027); return q; },
                    async maybeSingle() { return { data: null, error: denied ? { code: "42501" } : null }; } };
                return q;
            } }) },
        }).default;
        const res = apiResponse();
        await handler({ method: "POST", headers: { cookie }, body: { anoPastoral: 2027, grupoId: "g", tipo: "encontro_regular", dataInicio: "2027-03-01" } }, res);
        assert.equal(res.code, denied ? 503 : 400);
    }
});

test("organization meetings cannot enter the annual calendar through a partial update and saved changes report cache or backup failures", async () => {
    const cookie = "adminAuth=" + auth.createAdminSession("admin@example.org", secret);
    for (const backupOk of [false, true]) {
        const calls = [], years = [];
        const handler = load("pages/api/encontros.ts", {
            "./supabaseAdmin": { getSupabaseAdminClient: () => fakeClient("admin", calls, {
                ebook_edicoes: [{ ano: 2027 }], encontros: [{ data_inicio: "2027-03-01", nivel: "organizacao" }],
            }) },
            "../../lib/adminBackup": { salvarBackupAutomatico: async () => ({ sucesso: backupOk }) },
            "../../lib/revalidacao-anual": { revalidarEdicaoAnual: async (_, ano) => { years.push(ano); return false; } },
        }).default;
        const res = apiResponse();
        await handler({ method: "PUT", headers: { cookie }, body: { id: "m", anoPastoral: 2027, grupo_id: null, evento_id: "e", mostrar_no_anual: true, titulo: "Organização" } }, res);
        assert.equal(res.code, 200); assert.equal(res.body.sucesso, true);
        assert.match(res.body.aviso, /salva/); assert.match(res.body.aviso, /páginas/);
        assert.equal(res.body.aviso.includes("backup"), !backupOk);
        const write = calls.find(c => c.mutations.some(m => m[0] === "update")).mutations[0][1];
        assert.equal(write.mostrar_no_anual, false);
        assert.deepEqual(years, [2027]); assert.equal(res.revalidations.length, 0);
    }
});

test("planning overview isolates the year, sorts unique meetings and respects inactive and internal owners", () => {
    const { montarAgendaPlanejamento } = load("lib/agenda-planejamento.ts");
    const shared = { id: "shared", evento_id: "e", data_inicio: "2027-04-01", nivel: "evento", mostrar_no_anual: true, visibilidade: "publico" };
    const meetings = [shared, shared,
        { id: "group", grupo_id: "g", data_inicio: "2027-03-02", visibilidade: "publico" },
        { id: "org", evento_id: "e", data_inicio: "2027-04-02", nivel: "organizacao", mostrar_no_anual: true, visibilidade: "publico" },
        { id: "internal", evento_id: "hidden", data_inicio: "2027-03-03", nivel: "evento", mostrar_no_anual: true, visibilidade: "publico" },
        { id: "inactive", grupo_id: "off", data_inicio: "2027-03-04", visibilidade: "publico" },
        { id: "private", grupo_id: "g", data_inicio: "2027-03-05", visibilidade: "interno" },
        { id: "orphan", grupo_id: "missing", data_inicio: "2027-03-06", visibilidade: "publico" },
        { id: "old", grupo_id: "g", data_inicio: "2026-03-01", visibilidade: "publico" },
        { id: "invalid", grupo_id: "g", data_inicio: "2027-02-29", visibilidade: "publico" },
    ];
    const snapshot = JSON.stringify(meetings);
    const items = montarAgendaPlanejamento(2027, meetings, [{ id: "g", nome: "Grupo" }],
        [{ id: "e", titulo: "Retiro", visibilidade: "publico", todos_os_grupos: true }, { id: "hidden", titulo: "Interno", visibilidade: "interno" }],
        [{ id: "off", nome: "Nome da edição inativa" }], []);
    assert.equal(items.length, 7); assert.equal(items[0].encontro.id, "group");
    assert.equal(items.filter(i => i.noAnual).length, 2);
    assert.equal(items.find(i => i.encontro.id === "org").situacao, "Somente nos capítulos");
    assert.equal(items.find(i => i.encontro.id === "internal").situacao, "Evento interno");
    assert.equal(items.find(i => i.encontro.id === "private").situacao, "Encontro interno");
    const inactive = items.find(i => i.encontro.id === "inactive");
    assert.equal(inactive.responsavel, "Nome da edição inativa"); assert.equal(inactive.podeEditar, false);
    assert.equal(items.find(i => i.encontro.id === "orphan").podeEditar, false);
    assert.equal(JSON.stringify(meetings), snapshot);
});

test("planning filters combine accent-insensitive terms, starting month and actual annual visibility without mutating the source", () => {
    const { montarAgendaPlanejamento, filtrarAgendaPlanejamento } = load("lib/agenda-planejamento.ts");
    const items = montarAgendaPlanejamento(2027, [
        { id: "a", grupo_id: "g", data_inicio: "2027-03-10", titulo: "Celebração", local: "Betânia", visibilidade: "publico" },
        { id: "b", grupo_id: "g", data_inicio: "2027-04-10", titulo: "Reunião", local: "Betânia", visibilidade: "interno" },
        { id: "c", grupo_id: "g", data_inicio: "2027-12-31", data_fim: "2028-01-02", titulo: "Virada", visibilidade: "publico" },
    ], [{ id: "g", nome: "GimVi Jovens" }], [], [], []);
    assert.equal(filtrarAgendaPlanejamento(items, "  celebracao  betania ", "03", "anual")[0].encontro.id, "a");
    assert.equal(filtrarAgendaPlanejamento(items, "JOVENS", "04", "fora")[0].encontro.id, "b");
    assert.equal(filtrarAgendaPlanejamento(items, "", "12", "")[0].encontro.id, "c");
    assert.equal(filtrarAgendaPlanejamento(items, "inexistente", "", "").length, 0);
    assert.equal(filtrarAgendaPlanejamento(items, "", "", "").length, 3);
    assert.equal(items.length, 3);
});

test("planning overview renders accessible filters, one edit action per record and an honest empty year", () => {
    const React = require("react"), { renderToStaticMarkup } = require("react-dom/server");
    const Component = load("components/admin/AgendaPlanejamento.tsx").default;
    const common = { ano: 2027, grupos: [{ id: "g", nome: "Grupo anual" }], eventos: [], gruposInativos: [], eventosInativos: [], onEditar() {} };
    const html = renderToStaticMarkup(React.createElement(Component, { ...common, encontros: [
        { id: "a", grupo_id: "g", data_inicio: "2027-03-10", titulo: "Título <seguro>", visibilidade: "publico" },
    ] }));
    for (const id of ["agenda-busca", "agenda-mes", "agenda-situacao"]) assert.ok(html.includes(`for="${id}"`));
    assert.ok(html.includes("Limpar filtros")); assert.ok(html.includes("Editar encontro"));
    assert.ok(html.includes("Título &lt;seguro&gt;")); assert.ok(!html.includes("<seguro>"));
    const empty = renderToStaticMarkup(React.createElement(Component, { ...common, encontros: [] }));
    assert.ok(empty.includes("Nenhum encontro cadastrado em 2027")); assert.ok(!empty.includes("Editar encontro"));
});
