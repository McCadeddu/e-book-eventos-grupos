// web/lib/db/encontros.ts
import { supabase } from "../supabaseClient";
import { Encontro } from "../types";
import fs from "fs";
import path from "path";

const EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID =
    "5c0e6f63-3298-4f25-b754-4d3c88f7e201";

function criarErroDeConsulta(contexto: string, detalhes: unknown) {
    const texto =
        detalhes instanceof Error
            ? detalhes.message
            : JSON.stringify(detalhes);

    return new Error(`${contexto}: ${texto}`);
}

function ehEncontroDoAniversarioDaCmv(encontro: Encontro) {
    return (
        encontro.data_inicio === "2026-09-06" &&
        typeof encontro.titulo === "string" &&
        encontro.titulo.includes("Aniversário da CMV")
    );
}

function lerEncontrosFallback(): Encontro[] {
    const caminho = path.join(
        process.cwd(),
        "..",
        "data",
        "encontros(nãousado).json"
    );
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    return (dados.encontros ?? [])
        .filter(
            (encontro: Encontro) =>
                typeof encontro.data_inicio === "string" &&
                encontro.data_inicio.trim() !== ""
        )
        .map((encontro: Encontro) => {
            if (!ehEncontroDoAniversarioDaCmv(encontro)) {
                return encontro;
            }

            return {
                ...encontro,
                grupo_id: null as any,
                evento_id: EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID,
                nivel: "evento",
            };
        });
}

export async function getEncontros() {
    try {
        const { data, error } = await supabase
            .from("encontros")
            .select("*")
            .not("data_inicio", "is", null)
            .order("data_inicio", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar encontros", error);
        }

        const encontros = (data ?? []) as Encontro[];

        if (encontros.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar encontros",
                "nenhum encontro retornado"
            );
        }

        return encontros;
    } catch (error) {
        console.warn(
            "Usando fallback local para encontros administrativos:",
            error instanceof Error ? error.message : error
        );
        return lerEncontrosFallback();
    }
}

export async function getEncontrosStrict() {
    try {
        const { data, error } = await supabase
            .from("encontros")
            .select("*")
            .not("data_inicio", "is", null)
            .order("data_inicio", { ascending: true });

        if (error) {
            throw criarErroDeConsulta("Erro ao buscar encontros públicos", error);
        }

        const encontros = (data || []) as Encontro[];

        if (encontros.length === 0) {
            throw criarErroDeConsulta(
                "Resposta vazia ao buscar encontros públicos",
                "nenhum encontro retornado"
            );
        }

        return encontros;
    } catch (error) {
        console.warn(
            "Usando fallback local para encontros públicos:",
            error instanceof Error ? error.message : error
        );
        return lerEncontrosFallback();
    }
}

export async function getEncontrosPorGrupo(
    grupoId: string
): Promise<Encontro[]> {
    const { data, error } = await supabase
        .from("encontros")
        .select("*")
        .eq("grupo_id", grupoId);

    if (error) {
        console.error("Erro ao buscar encontros do grupo:", error);
        return [];
    }

    return data as Encontro[];
}

export async function getEncontrosPorGrupoStrict(
    grupoId: string
): Promise<Encontro[]> {
    try {
        const { data, error } = await supabase
            .from("encontros")
            .select("*")
            .eq("grupo_id", grupoId);

        if (error) {
            throw criarErroDeConsulta(
                `Erro ao buscar encontros públicos do grupo ${grupoId}`,
                error
            );
        }

        const encontros = (data ?? []) as Encontro[];

        if (encontros.length === 0) {
            throw criarErroDeConsulta(
                `Resposta vazia ao buscar encontros públicos do grupo ${grupoId}`,
                "nenhum encontro retornado"
            );
        }

        return encontros;
    } catch (error) {
        console.warn(
            `Usando fallback local para encontros do grupo ${grupoId}:`,
            error instanceof Error ? error.message : error
        );
        return lerEncontrosFallback().filter(
            (encontro) => encontro.grupo_id === grupoId
        );
    }
}

export async function getEncontrosPorEventoStrict(eventoId: string) {
    try {
        const { data, error } = await supabase
            .from("encontros")
            .select("*")
            .eq("evento_id", eventoId)
            .eq("nivel", "evento")
            .order("data_inicio", { ascending: true });

        if (error) {
            throw criarErroDeConsulta(
                `Erro ao buscar encontros públicos do evento ${eventoId}`,
                error
            );
        }

        const encontros = (data || []) as Encontro[];

        if (encontros.length === 0) {
            throw criarErroDeConsulta(
                `Resposta vazia ao buscar encontros públicos do evento ${eventoId}`,
                "nenhum encontro retornado"
            );
        }

        return encontros;
    } catch (error) {
        console.warn(
            `Usando fallback local para encontros do evento ${eventoId}:`,
            error instanceof Error ? error.message : error
        );
        return lerEncontrosFallback().filter(
            (encontro) => encontro.evento_id === eventoId
        );
    }
}
