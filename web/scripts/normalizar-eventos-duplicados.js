const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function resolverArquivoEnv() {
    const argumento = process.argv.find((item) =>
        item.startsWith("--env-file=")
    );

    if (argumento) {
        return argumento.slice("--env-file=".length);
    }

    return ".env.production.current";
}

function carregarEnvLocal() {
    const caminho = path.join(process.cwd(), resolverArquivoEnv());

    if (!fs.existsSync(caminho)) {
        throw new Error(`Arquivo de ambiente não encontrado: ${caminho}`);
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

const EVENTOS_CANONICOS = [
    {
        keepId: "15956215-1c66-40dc-af45-0db1f9fce4b0",
        removeIds: ["6f6ac7f4-7c5c-4a79-9f9d-2b2fd3d0a101"],
        patch: {
            titulo: "AFETIVIDADE JOVENS",
            ordem: 4,
        },
    },
    {
        keepId: "94a47b72-ad64-41b6-91c9-10ed03f297b6",
        removeIds: ["3b33e0bb-2cb8-4d31-bf95-f6c2cb4ab103"],
        patch: {
            titulo: "GRAND PRIX FÓRMULA 1",
            ordem: 2,
        },
    },
    {
        keepId: "b82573c8-75d2-4c76-b670-dbc9f392fcc0",
        removeIds: ["d0c22f65-2453-4b5f-8300-f91f1dcff102"],
        patch: {
            titulo: "JESHUÁ",
            ordem: 3,
        },
    },
    {
        keepId: "c6392d83-de3b-4d09-bffb-22cbb264aee3",
        removeIds: ["0f0aa7de-a88e-4761-8f57-b7a211c9d104"],
        patch: {
            titulo: "CANÁ",
            ordem: 6,
        },
    },
    {
        keepId: "2aea4919-bfa5-4f60-8870-a0e05deed062",
        removeIds: ["1c250f5d-83f9-4473-b94a-ef6dfeef3105"],
        patch: {
            titulo: "AREIA OU ROCHA",
            ordem: 8,
        },
    },
    {
        keepId: "8a1ba62a-9617-420b-8e36-8d4411bce3bb",
        removeIds: ["fb334ac3-53d1-456a-8108-3d526511f106"],
        patch: {
            titulo: "AFETIVIDADE CASAIS",
            ordem: 7,
        },
    },
    {
        keepId: "e33c6f69-a5f5-4907-8262-c3735a9f985f",
        removeIds: ["727bb9b1-3d38-49fb-a184-7f116f954107"],
        patch: {
            titulo: "EMAÚS",
            grupos_envolvidos: ["gam", "grupo-trilhas"],
            ordem: 9,
        },
    },
    {
        keepId: "5c0e6f63-3298-4f25-b754-4d3c88f7e201",
        removeIds: ["a50b8339-d339-4171-8dc3-7c1d7808e5be"],
        patch: {
            titulo: "Aniversário da Comunidade",
            faixa_etaria:
                "Encontro com Briseida, presidente da Comunidade Missionária de Villaregia",
            descricao:
                "Celebração do aniversário da Comunidade Missionária de Villaregia.",
            equipe: ["P. Siro Opportuni", "Coordenadores dos grupos"],
            objetivo_ano:
                "Atualizar os Membros Associados sobre a caminhada jurídica da CMV e refletir juntos os passos a cumprir para uma definição melhor do carisma.",
            convite: "Juntos construímos a nossa família CMV!",
            grupos_envolvidos: [
                "gimvi-jovens",
                "gimca-1",
                "gimvi-adolescentes",
                "gimca-2",
                "gam",
            ],
            todos_os_grupos: false,
            ordem: 10,
        },
    },
];

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
    const dryRun = !process.argv.includes("--write");

    const { data: eventos, error: erroEventos } = await supabase
        .from("eventos")
        .select("*");

    if (erroEventos) {
        throw new Error(`Falha ao carregar eventos: ${erroEventos.message}`);
    }

    const idsExistentes = new Set((eventos ?? []).map((evento) => evento.id));
    const operacoes = EVENTOS_CANONICOS.filter((config) =>
        idsExistentes.has(config.keepId)
    );

    console.log(
        JSON.stringify(
            operacoes.map((config) => ({
                keepId: config.keepId,
                removeIds: config.removeIds.filter((id) => idsExistentes.has(id)),
            })),
            null,
            2
        )
    );

    if (dryRun) {
        console.log("Simulação concluída. Use --write para aplicar.");
        return;
    }

    for (const config of operacoes) {
        const removeIds = config.removeIds.filter((id) => idsExistentes.has(id));

        if (removeIds.length > 0) {
            const { error: erroMover } = await supabase
                .from("encontros")
                .update({ evento_id: config.keepId })
                .in("evento_id", removeIds);

            if (erroMover) {
                throw new Error(
                    `Falha ao mover encontros para ${config.keepId}: ${erroMover.message}`
                );
            }
        }

        const { error: erroAtualizar } = await supabase
            .from("eventos")
            .update(config.patch)
            .eq("id", config.keepId);

        if (erroAtualizar) {
            throw new Error(
                `Falha ao atualizar evento ${config.keepId}: ${erroAtualizar.message}`
            );
        }

        if (removeIds.length > 0) {
            const { error: erroExcluir } = await supabase
                .from("eventos")
                .delete()
                .in("id", removeIds);

            if (erroExcluir) {
                throw new Error(
                    `Falha ao excluir duplicados de ${config.keepId}: ${erroExcluir.message}`
                );
            }
        }
    }

    console.log("Normalização de eventos concluída com sucesso.");
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
