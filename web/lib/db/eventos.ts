// web/lib/db/eventos.ts

import fs from "fs";
import path from "path";
import { supabase } from "../supabaseClient";
import { Grupo } from "../types";

const IDS_EVENTOS_FALLBACK = new Set([
    "afetividade-jovens",
    "jeshua",
    "grand-prix-formula-1",
    "cana",
    "areia-ou-rocha",
    "afetividade-casais",
    "emaus",
]);

function criarErroDeConsulta(contexto: string, detalhes: unknown) {
    const texto =
        detalhes instanceof Error
            ? detalhes.message
            : JSON.stringify(detalhes);

    return new Error(`${contexto}: ${texto}`);
}

function lerGruposFallback(): Grupo[] {
    const caminho = path.join(
        process.cwd(),
        "..",
        "data",
        "grupos(nãousado).json"
    );
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return (dados.grupos ?? []) as Grupo[];
}

function lerEventosJsonFallback() {
    const caminho = path.join(process.cwd(), "..", "data", "eventos-2026.json");

    if (!fs.existsSync(caminho)) {
        return [];
    }

    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return Array.isArray(dados.eventos) ? dados.eventos : [];
}

function lerEventosFallback() {
    const eventosDeGrupos = lerGruposFallback()
        .filter((grupo) => IDS_EVENTOS_FALLBACK.has(grupo.id))
        .map((grupo, index) => ({
            id: grupo.id,
            slug: grupo.slug,
            titulo: grupo.nome,
            faixa_etaria: grupo.faixa_etaria,
            descricao: grupo.descricao,
            equipe: Array.isArray(grupo.equipe) ? grupo.equipe : [],
            objetivo_ano: grupo.objetivo_ano,
            convite: grupo.convite_final,
            grupos_envolvidos: [],
            todos_os_grupos: false,
            visibilidade: "publico" as const,
            ordem: 100 + index,
        }));

    const eventosDoArquivo = lerEventosJsonFallback()
        .filter((evento: any) => evento.visibilidade === "publico")
        .map((evento: any, index: number) => ({
            id: evento.id,
            slug: evento.id,
            titulo: evento.titulo,
            faixa_etaria: undefined,
            descricao: evento.descricao,
            equipe: evento.responsaveis ?? [],
            objetivo_ano: undefined,
            convite: evento.observacoes ?? "",
            grupos_envolvidos: [],
            todos_os_grupos: false,
            visibilidade: "publico" as const,
            ordem: 1000 + index,
        }));

    const mapa = new Map<string, any>();

    [...eventosDeGrupos, ...eventosDoArquivo].forEach((evento) => {
        if (!mapa.has(evento.id)) {
            mapa.set(evento.id, evento);
        }
    });

    return Array.from(mapa.values());
}

export async function getEventos() {
    try {
        const { data, error } = await supabase
            .from("eventos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar eventos", error);
        }

        const eventos = data || [];

        if (eventos.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar eventos",
                "nenhum evento retornado"
            );
        }

        return eventos;
    } catch (error) {
        console.warn(
            "Usando fallback local para eventos administrativos:",
            error instanceof Error ? error.message : error
        );
        return lerEventosFallback();
    }
}

export async function getEventosStrict() {
    try {
        const { data, error } = await supabase
            .from("eventos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar eventos públicos", error);
        }

        const eventos = data || [];

        if (eventos.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar eventos públicos",
                "nenhum evento retornado"
            );
        }

        return eventos;
    } catch (error) {
        console.warn(
            "Usando fallback local para eventos públicos:",
            error instanceof Error ? error.message : error
        );
        return lerEventosFallback();
    }
}
