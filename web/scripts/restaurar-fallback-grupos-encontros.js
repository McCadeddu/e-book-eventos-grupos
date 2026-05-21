const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const EVENTOS_PROMOVIDOS = {
    "afetividade-jovens": {
        eventId: "6f6ac7f4-7c5c-4a79-9f9d-2b2fd3d0a101",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-adolescentes", "gimvi-jovens"],
    },
    jeshua: {
        eventId: "d0c22f65-2453-4b5f-8300-f91f1dcff102",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-jovens"],
    },
    "grand-prix-formula-1": {
        eventId: "3b33e0bb-2cb8-4d31-bf95-f6c2cb4ab103",
        tipo: "retiro",
        grupos_envolvidos: ["gimvi-adolescentes"],
    },
    cana: {
        eventId: "0f0aa7de-a88e-4761-8f57-b7a211c9d104",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    "areia-ou-rocha": {
        eventId: "1c250f5d-83f9-4473-b94a-ef6dfeef3105",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    "afetividade-casais": {
        eventId: "fb334ac3-53d1-456a-8108-3d526511f106",
        tipo: "retiro",
        grupos_envolvidos: ["gimca-1", "gimca-2"],
    },
    emaus: {
        eventId: "727bb9b1-3d38-49fb-a184-7f116f954107",
        tipo: "retiro",
        grupos_envolvidos: ["gam", "grupo-trilhas"],
    },
};

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

    return grupos
        .filter((grupo) => !EVENTOS_PROMOVIDOS[grupo.id])
        .map((grupo, index) => ({
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

function montarEventos() {
    const grupos = lerJson("grupos(nãousado).json").grupos ?? [];

    return Object.entries(EVENTOS_PROMOVIDOS).map(([grupoId, config]) => {
        const grupo = grupos.find((item) => item.id === grupoId);

        if (!grupo) {
            throw new Error(`Grupo-base do evento ${grupoId} não encontrado.`);
        }

        return {
            id: config.eventId,
            tipo: config.tipo,
            titulo: grupo.nome,
            faixa_etaria: grupo.faixa_etaria ?? "",
            descricao: grupo.descricao ?? "",
            equipe: Array.isArray(grupo.equipe) ? grupo.equipe : [],
            grupos_envolvidos: config.grupos_envolvidos ?? [],
            todos_os_grupos: false,
            objetivo_ano: grupo.objetivo_ano ?? "",
            convite: grupo.convite_final ?? "",
            visibilidade: "publico",
        };
    });
}

function montarEncontros() {
    const encontros = lerJson("encontros(nãousado).json").encontros ?? [];

    return encontros
        .filter(
            (encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== ""
        )
        .map((encontro) => {
            const promocao = encontro.grupo_id
                ? EVENTOS_PROMOVIDOS[encontro.grupo_id]
                : null;

            return {
            id: encontro.id,
            grupo_id: promocao ? null : encontro.grupo_id,
            evento_id: promocao
                ? promocao.eventId
                : encontro.evento_id ?? null,
            tipo: encontro.tipo ?? "encontro_regular",
            data_inicio: encontro.data_inicio,
            data_fim: encontro.data_fim ?? null,
            data_legivel: encontro.data_legivel ?? null,
            horario: encontro.horario ?? null,
            local: encontro.local ?? null,
            titulo: encontro.titulo ?? null,
            descricao: encontro.descricao ?? null,
            visibilidade: encontro.visibilidade ?? "publico",
            nivel: promocao ? "evento" : encontro.nivel ?? "evento",
            mostrar_no_anual:
                typeof encontro.mostrar_no_anual === "boolean"
                    ? encontro.mostrar_no_anual
                    : true,
            };
        });
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
    const eventos = montarEventos();
    const encontros = montarEncontros();

    console.log("Restauração preparada:");
    console.log(`- grupos do fallback: ${grupos.length}`);
    console.log(`- eventos promovidos: ${eventos.length}`);
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

    const { error: erroEventos } = await supabase
        .from("eventos")
        .upsert(eventos, { onConflict: "id" });

    if (erroEventos) {
        throw new Error(`Falha ao restaurar eventos: ${erroEventos.message}`);
    }

    const { error: erroEncontros } = await supabase
        .from("encontros")
        .upsert(encontros, { onConflict: "id" });

    if (erroEncontros) {
        throw new Error(
            `Falha ao restaurar encontros: ${erroEncontros.message}`
        );
    }

    const idsPromovidos = Object.keys(EVENTOS_PROMOVIDOS);

    if (idsPromovidos.length > 0) {
        const { error: erroLimpeza } = await supabase
            .from("grupos")
            .delete()
            .in("id", idsPromovidos);

        if (erroLimpeza) {
            throw new Error(
                `Falha ao remover grupos promovidos: ${erroLimpeza.message}`
            );
        }
    }

    console.log("Restauração concluída com sucesso.");
}

main().catch((error) => {
    console.error("Falha ao restaurar fallback.");
    console.error(error.message);
    process.exit(1);
});
