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

function montarGrupos() {
    const grupos = lerJson("grupos(nãousado).json").grupos ?? [];

    return grupos.map((grupo, index) => ({
        id: grupo.id,
        slug: grupo.slug,
        nome: grupo.nome,
        faixa_etaria: grupo.faixa_etaria ?? "",
        descricao: grupo.descricao ?? "",
        objetivo_ano: grupo.objetivo_ano ?? "",
        equipe: Array.isArray(grupo.equipe) ? grupo.equipe : [],
        convite_final: grupo.convite_final ?? "",
        ordem: grupo.ordem ?? index + 1,
        categoria: grupo.categoria ?? "grupo",
    }));
}

function montarEncontros() {
    const encontros = lerJson("encontros(nãousado).json").encontros ?? [];

    return encontros
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== "" &&
                encontro.grupo_id
        )
        .map((encontro) => ({
            id: encontro.id,
            grupo_id: encontro.grupo_id,
            evento_id: encontro.evento_id ?? null,
            tipo: encontro.tipo ?? "encontro_regular",
            data_inicio: encontro.data_inicio,
            data_fim: encontro.data_fim ?? null,
            data_legivel: encontro.data_legivel ?? null,
            horario: encontro.horario ?? null,
            local: encontro.local ?? null,
            titulo: encontro.titulo ?? null,
            descricao: encontro.descricao ?? null,
            visibilidade: encontro.visibilidade ?? "publico",
            nivel: encontro.nivel ?? "evento",
            mostrar_no_anual:
                typeof encontro.mostrar_no_anual === "boolean"
                    ? encontro.mostrar_no_anual
                    : true,
        }));
}

async function main() {
    carregarEnvLocal();

    const modoEscrita = process.argv.includes("--write");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
        throw new Error(
            "Faltam NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
        );
    }

    const chave = serviceRoleKey || anonKey;

    if (serviceRoleKey) {
        console.log("Usando service role para restauração administrativa.");
    } else {
        console.log("Service role ausente; usando chave pública.");
    }

    const supabase = createClient(url, chave);
    const grupos = montarGrupos();
    const encontros = montarEncontros();

    console.log("Restauração preparada:");
    console.log(`- grupos do fallback: ${grupos.length}`);
    console.log(`- encontros do fallback: ${encontros.length}`);

    if (!modoEscrita) {
        console.log(
            "Modo simulacao. Use --write para aplicar a restauração no Supabase."
        );
        return;
    }

    const { error: erroGrupos } = await supabase
        .from("grupos")
        .upsert(grupos, { onConflict: "id" });

    if (erroGrupos) {
        throw new Error(`Falha ao restaurar grupos: ${erroGrupos.message}`);
    }

    const { error: erroEncontros } = await supabase
        .from("encontros")
        .upsert(encontros, { onConflict: "id" });

    if (erroEncontros) {
        throw new Error(
            `Falha ao restaurar encontros: ${erroEncontros.message}`
        );
    }

    console.log("Restauração concluída com sucesso.");
}

main().catch((error) => {
    console.error("Falha ao restaurar fallback.");
    console.error(error.message);
    process.exit(1);
});
