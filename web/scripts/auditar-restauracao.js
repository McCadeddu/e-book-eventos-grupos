const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function resolverArquivoEnv() {
    const argumento = process.argv.find((item) =>
        item.startsWith("--env-file=")
    );

    if (argumento) {
        return argumento.slice("--env-file=".length);
    }

    return process.env.ENV_FILE || ".env.local";
}

function carregarEnvLocal() {
    const caminho = path.join(process.cwd(), resolverArquivoEnv());

    if (!fs.existsSync(caminho)) {
        return;
    }

    const linhas = fs.readFileSync(caminho, "utf-8").split(/\r?\n/);

    for (const linha of linhas) {
        const conteudo = linha.trim();

        if (!conteudo || conteudo.startsWith("#")) {
            continue;
        }

        const indice = conteudo.indexOf("=");

        if (indice === -1) {
            continue;
        }

        const chave = conteudo.slice(0, indice).trim();
        const valor = conteudo.slice(indice + 1).trim();

        if (!process.env[chave]) {
            process.env[chave] = valor;
        }
    }
}

function lerJson(nomeArquivo) {
    const caminho = path.join(process.cwd(), "..", "data", nomeArquivo);
    return JSON.parse(fs.readFileSync(caminho, "utf-8"));
}

function mapearGruposFallback() {
    const grupos = lerJson("grupos(nãousado).json").grupos ?? [];

    return grupos.map((grupo, index) => ({
        id: grupo.id,
        slug: grupo.slug,
        nome: grupo.nome,
        ordem: grupo.ordem ?? index + 1,
    }));
}

function mapearEncontrosFallback() {
    const encontros = lerJson("encontros(nãousado).json").encontros ?? [];

    return encontros
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== ""
        )
        .map((encontro) => ({
            id: encontro.id,
            grupo_id: encontro.grupo_id ?? null,
            evento_id: encontro.evento_id ?? null,
            data_inicio: encontro.data_inicio,
            titulo: encontro.titulo ?? null,
            visibilidade: encontro.visibilidade ?? "publico",
        }));
}

async function buscarTabela(supabase, tabela, colunas) {
    const { data, error } = await supabase
        .from(tabela)
        .select(colunas);

    if (error) {
        throw new Error(`${tabela}: ${error.message}`);
    }

    return data ?? [];
}

function diferencaPorId(origem, destino) {
    const idsDestino = new Set(destino.map((item) => item.id));
    return origem.filter((item) => !idsDestino.has(item.id));
}

async function main() {
    carregarEnvLocal();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
    }

    const supabase = createClient(url, anonKey);

    const gruposFallback = mapearGruposFallback();
    const encontrosFallback = mapearEncontrosFallback();

    const [gruposBanco, encontrosBanco, eventosBanco] = await Promise.all([
        buscarTabela(supabase, "grupos", "id, slug, nome, ordem"),
        buscarTabela(
            supabase,
            "encontros",
            "id, grupo_id, evento_id, data_inicio, titulo, visibilidade"
        ),
        buscarTabela(supabase, "eventos", "id, titulo, visibilidade"),
    ]);

    const gruposFaltando = diferencaPorId(gruposFallback, gruposBanco);
    const encontrosFaltando = diferencaPorId(encontrosFallback, encontrosBanco);

    const resumo = {
        fallback: {
            grupos: gruposFallback.length,
            encontros: encontrosFallback.length,
        },
        banco: {
            grupos: gruposBanco.length,
            encontros: encontrosBanco.length,
            eventos: eventosBanco.length,
        },
        faltandoNoBanco: {
            grupos: gruposFaltando.length,
            encontros: encontrosFaltando.length,
        },
        exemplos: {
            grupos: gruposFaltando.slice(0, 10),
            encontros: encontrosFaltando.slice(0, 10),
            eventosNoBanco: eventosBanco.slice(0, 10),
        },
    };

    console.log(JSON.stringify(resumo, null, 2));
}

main().catch((error) => {
    console.error("Falha ao auditar restauração.");
    console.error(error.message);
    process.exit(1);
});
