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

function formatarDataPtBr(dataIso) {
    if (!dataIso || typeof dataIso !== "string") {
        return "";
    }

    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function escreverJson(caminho, conteudo) {
    fs.writeFileSync(caminho, `${JSON.stringify(conteudo, null, 2)}\n`, "utf-8");
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

    const [gruposResp, eventosResp, encontrosResp] = await Promise.all([
        supabase.from("grupos").select("*").order("ordem", { ascending: true }),
        supabase
            .from("eventos")
            .select("*")
            .order("ordem", { ascending: true, nullsFirst: false }),
        supabase
            .from("encontros")
            .select("*")
            .order("data_inicio", { ascending: true }),
    ]);

    if (gruposResp.error) throw gruposResp.error;
    if (eventosResp.error) throw eventosResp.error;
    if (encontrosResp.error) throw encontrosResp.error;

    const grupos = gruposResp.data ?? [];
    const eventos = eventosResp.data ?? [];
    const encontros = encontrosResp.data ?? [];

    const encontrosPorEvento = new Map();

    for (const encontro of encontros) {
        if (!encontro.evento_id) continue;
        const lista = encontrosPorEvento.get(encontro.evento_id) ?? [];
        lista.push(encontro);
        encontrosPorEvento.set(encontro.evento_id, lista);
    }

    const eventosJson = {
        ano: 2026,
        eventos: eventos.map((evento) => {
            const encontrosEvento = (encontrosPorEvento.get(evento.id) ?? []).sort(
                (a, b) => (a.data_inicio || "").localeCompare(b.data_inicio || "")
            );
            const primeiro = encontrosEvento[0] ?? null;

            return {
                id: evento.id,
                titulo: evento.titulo,
                tipo: "evento",
                categoria_principal: evento.todos_os_grupos
                    ? "comunidade"
                    : "evento",
                grupos_envolvidos: evento.grupos_envolvidos ?? [],
                todos_os_grupos: !!evento.todos_os_grupos,
                data: formatarDataPtBr(primeiro?.data_inicio ?? ""),
                horario: primeiro?.horario ?? "",
                local: primeiro?.local ?? "",
                tema: "",
                descricao: evento.descricao ?? "",
                observacoes: evento.convite ?? "",
                visibilidade: evento.visibilidade ?? "publico",
                responsaveis: Array.isArray(evento.equipe) ? evento.equipe : [],
                campos_personalizados: {},
                criado_por: "sync-banco",
                data_criacao: formatarDataPtBr(
                    (evento.created_at ?? "").slice(0, 10)
                ),
                ultima_atualizacao: formatarDataPtBr(
                    (evento.created_at ?? "").slice(0, 10)
                ),
            };
        }),
    };

    const gruposJson = {
        grupos: grupos.map((grupo) => ({
            id: grupo.id,
            slug: grupo.slug,
            nome: grupo.nome,
            faixa_etaria: grupo.faixa_etaria ?? "",
            descricao: grupo.descricao ?? "",
            objetivo_ano: grupo.objetivo_ano ?? "",
            equipe: Array.isArray(grupo.equipe) ? grupo.equipe : [],
            convite_final: grupo.convite_final ?? "",
            ordem: grupo.ordem ?? null,
            categoria: grupo.categoria ?? "grupo",
        })),
    };

    const encontrosJson = {
        encontros: encontros.map((encontro) => ({
            id: encontro.id,
            grupo_id: encontro.grupo_id ?? null,
            evento_id: encontro.evento_id ?? null,
            data_inicio: encontro.data_inicio ?? null,
            data_legivel: encontro.data_legivel ?? "",
            data_fim: encontro.data_fim ?? null,
            horario: encontro.horario ?? null,
            titulo: encontro.titulo ?? null,
            local: encontro.local ?? null,
            tema: "",
            descricao: encontro.descricao ?? "",
            tipo: encontro.tipo ?? "encontro_regular",
            visibilidade: encontro.visibilidade ?? "publico",
            nivel: encontro.nivel ?? "evento",
            mostrar_no_anual:
                typeof encontro.mostrar_no_anual === "boolean"
                    ? encontro.mostrar_no_anual
                    : true,
        })),
    };

    const pastaData = path.join(process.cwd(), "..", "data");

    escreverJson(path.join(pastaData, "eventos-2026.json"), eventosJson);
    escreverJson(path.join(pastaData, "grupos(nãousado).json"), gruposJson);
    escreverJson(path.join(pastaData, "encontros(nãousado).json"), encontrosJson);

    console.log(
        JSON.stringify(
            {
                grupos: gruposJson.grupos.length,
                eventos: eventosJson.eventos.length,
                encontros: encontrosJson.encontros.length,
            },
            null,
            2
        )
    );
}

main().catch((error) => {
    console.error("Falha ao sincronizar fallback do banco.");
    console.error(error.message);
    process.exit(1);
});
