// web/lib/db/eventos.ts

import fs from "fs";
import path from "path";
import { supabase } from "../supabaseClient";
import { getSupabaseAdminClient } from "../supabaseAdmin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Grupo, Encontro } from "../types";
import type { Evento } from "../eventos-types";

type EventoArquivo = Evento & { responsaveis?: string[]; observacoes?: string };

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

function lerEventosJsonFallback(): EventoArquivo[] {
    const caminho = path.join(process.cwd(), "..", "data", "eventos-2026.json");

    if (!fs.existsSync(caminho)) {
        return [];
    }

    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return Array.isArray(dados.eventos) ? dados.eventos : [];
}

function lerEncontrosFallback(): Encontro[] {
    const caminho = path.join(
        process.cwd(),
        "..",
        "data",
        "encontros(nãousado).json"
    );

    if (!fs.existsSync(caminho)) {
        return [];
    }

    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return Array.isArray(dados.encontros) ? dados.encontros : [];
}

function enriquecerEventosComDatas<T extends { id: string }>(eventos: T[]) {
    const encontros = lerEncontrosFallback().filter(
        (encontro) =>
            typeof encontro.data_inicio === "string" &&
            encontro.data_inicio.trim() !== ""
    );

    return eventos.map((evento) => {
        const encontrosDoEvento = encontros
            .filter(
                (encontro) =>
                    encontro.evento_id === evento.id ||
                    encontro.grupo_id === evento.id
            )
            .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

        const primeiro = encontrosDoEvento[0];
        const ultimo = encontrosDoEvento[encontrosDoEvento.length - 1];

        return {
            ...evento,
            data_inicio: primeiro?.data_inicio ?? null,
            data_fim: ultimo?.data_fim ?? primeiro?.data_fim ?? null,
        };
    });
}

function normalizarEventoSerializable<T extends Evento>(evento: T) {
    return {
        ...evento,
        faixa_etaria: evento.faixa_etaria ?? null,
        descricao: evento.descricao ?? null,
        equipe: Array.isArray(evento.equipe) ? evento.equipe : [],
        objetivo_ano: evento.objetivo_ano ?? null,
        convite: evento.convite ?? null,
        grupos_envolvidos: Array.isArray(evento.grupos_envolvidos)
            ? evento.grupos_envolvidos
            : [],
        todos_os_grupos: !!evento.todos_os_grupos,
        data_inicio: evento.data_inicio ?? null,
        data_fim: evento.data_fim ?? null,
    };
}

async function enriquecerEventosComDatasDoBanco<T extends { id: string }>(
    eventos: T[],
    client: SupabaseClient = supabase,
    permitirFallback = true
) {
    try {
        const { data, error } = await client
            .from("encontros")
            .select("evento_id, data_inicio, data_fim")
            .not("data_inicio", "is", null)
            .order("data_inicio", { ascending: true });

        if (error) {
            throw error;
        }

        const encontros = (Array.isArray(data) ? data : []) as Pick<Encontro, "evento_id" | "data_inicio" | "data_fim">[];

        if (encontros.length === 0 && permitirFallback) {
            return enriquecerEventosComDatas(eventos);
        }

        return eventos.map((evento) => {
            const encontrosDoEvento = encontros.filter(
                (encontro) => encontro.evento_id === evento.id
            );

            const primeiro = encontrosDoEvento[0];
            const ultimo = encontrosDoEvento[encontrosDoEvento.length - 1];

            return {
                ...evento,
                data_inicio: primeiro?.data_inicio ?? null,
                data_fim: ultimo?.data_fim ?? primeiro?.data_fim ?? null,
            };
        });
    } catch (error) {
        if (!permitirFallback) throw criarErroDeConsulta("Erro ao buscar datas públicas dos eventos", error);
        return enriquecerEventosComDatas(eventos);
    }
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
            data_inicio: null,
            data_fim: null,
        }));

    const eventosDoArquivo = lerEventosJsonFallback()
        .filter((evento) => evento.visibilidade === "publico")
        .map((evento, index) => ({
            id: evento.id,
            slug: evento.slug ?? evento.id,
            titulo: evento.titulo,
            faixa_etaria: evento.faixa_etaria,
            descricao: evento.descricao,
            equipe: evento.responsaveis ?? [],
            objetivo_ano: evento.objetivo_ano,
            convite: evento.observacoes ?? "",
            grupos_envolvidos: Array.isArray(evento.grupos_envolvidos)
                ? evento.grupos_envolvidos
                : [],
            todos_os_grupos: !!evento.todos_os_grupos,
            visibilidade: "publico" as const,
            ordem: 1000 + index,
            data_inicio: null,
            data_fim: null,
        }));

    const mapa = new Map<string, Evento>();

    [...eventosDeGrupos, ...eventosDoArquivo].forEach((evento) => {
        if (!mapa.has(evento.id)) {
            mapa.set(evento.id, evento);
        }
    });

    return enriquecerEventosComDatas(Array.from(mapa.values())).map(
        normalizarEventoSerializable
    );
}

export async function getEventos() {
    const admin = getSupabaseAdminClient();
    try {
        const { data, error } = await admin
            .from("eventos")
            .select("*")
            .order("ordem", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar eventos", error);
        }

        const eventos = (data ?? []) as Evento[];

        if (eventos.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar eventos",
                "nenhum evento retornado"
            );
        }

        return (await enriquecerEventosComDatasDoBanco(eventos, admin)).map(
            normalizarEventoSerializable
        );
    } catch (error) {
        console.warn(
            "Usando fallback local para eventos administrativos:",
            error instanceof Error ? error.message : error
        );
        return lerEventosFallback();
    }
}

export async function getEventosStrict() {
    const { data, error } = await supabase.from("eventos").select("*").order("ordem", { ascending: true });
    if (error) throw criarErroDeConsulta("Erro ao buscar eventos públicos", error);
    const eventos = (data ?? []) as Evento[];
    if (eventos.length === 0) return [];
    return (await enriquecerEventosComDatasDoBanco(eventos, supabase, false)).map(normalizarEventoSerializable);
}
