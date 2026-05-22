// web/lib/db/encontros.ts
import { supabase } from "../supabaseClient";
import { Encontro } from "../types";
import fs from "fs";
import path from "path";

const EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID =
    "5c0e6f63-3298-4f25-b754-4d3c88f7e201";
const EVENTOS_PROMOVIDOS: Record<string, string> = {
    "afetividade-jovens": "6f6ac7f4-7c5c-4a79-9f9d-2b2fd3d0a101",
    jeshua: "d0c22f65-2453-4b5f-8300-f91f1dcff102",
    "grand-prix-formula-1": "3b33e0bb-2cb8-4d31-bf95-f6c2cb4ab103",
    cana: "0f0aa7de-a88e-4761-8f57-b7a211c9d104",
    "areia-ou-rocha": "1c250f5d-83f9-4473-b94a-ef6dfeef3105",
    "afetividade-casais": "fb334ac3-53d1-456a-8108-3d526511f106",
    emaus: "727bb9b1-3d38-49fb-a184-7f116f954107",
};

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

function resolverEventoEspecial(encontro: Encontro) {
    if (encontro.grupo_id && EVENTOS_PROMOVIDOS[encontro.grupo_id]) {
        return EVENTOS_PROMOVIDOS[encontro.grupo_id];
    }

    if (ehEncontroDoAniversarioDaCmv(encontro)) {
        return EVENTO_ANIVERSARIO_DA_COMUNIDADE_ID;
    }

    return null;
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
            const eventoEspecialId = resolverEventoEspecial(encontro);

            if (!eventoEspecialId) {
                return encontro;
            }

            return {
                ...encontro,
                grupo_id: null as any,
                evento_id: eventoEspecialId,
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
