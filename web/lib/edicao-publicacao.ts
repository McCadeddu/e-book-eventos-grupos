import { Grupo } from "./types";
import { Evento } from "./eventos-types";
import { supabase } from "./supabaseClient";

export type GrupoEdicao = {
    grupo_id: string;
    ano: number;
    nome?: string | null;
    faixa_etaria?: string | null;
    descricao?: string | null;
    objetivo_ano?: string | null;
    equipe?: string[] | null;
    convite_final?: string | null;
    ativo?: boolean | null;
};

export type EventoEdicao = {
    evento_id: string;
    ano: number;
    titulo?: string | null;
    faixa_etaria?: string | null;
    descricao?: string | null;
    equipe?: string[] | null;
    objetivo_ano?: string | null;
    convite?: string | null;
    grupos_envolvidos?: string[] | null;
    todos_os_grupos?: boolean | null;
    visibilidade?: "publico" | "interno" | null;
    ativo?: boolean | null;
};

function valorOuOriginal<T>(overrideValue: T | null | undefined, originalValue: T): T {
    return overrideValue ?? originalValue;
}

export async function getGruposEdicao(ano: number): Promise<GrupoEdicao[]> {
    try {
        const { data, error } = await supabase
            .from("grupo_edicoes")
            .select("*")
            .eq("ano", ano);

        if (error) {
            return [];
        }

        return (data ?? []) as GrupoEdicao[];
    } catch {
        return [];
    }
}

export async function getEventosEdicao(ano: number): Promise<EventoEdicao[]> {
    try {
        const { data, error } = await supabase
            .from("evento_edicoes")
            .select("*")
            .eq("ano", ano);

        if (error) {
            return [];
        }

        return (data ?? []) as EventoEdicao[];
    } catch {
        return [];
    }
}

export function aplicarGrupoEdicao(
    grupos: Grupo[],
    overrides: GrupoEdicao[]
) {
    const overridesMap = new Map(overrides.map((item) => [item.grupo_id, item]));

    return grupos
        .map((grupo) => {
            const override = overridesMap.get(grupo.id);

            if (override?.ativo === false) {
                return null;
            }

            return {
                ...grupo,
                nome: valorOuOriginal(override?.nome, grupo.nome),
                faixa_etaria: valorOuOriginal(
                    override?.faixa_etaria,
                    grupo.faixa_etaria
                ),
                descricao: valorOuOriginal(override?.descricao, grupo.descricao),
                objetivo_ano: valorOuOriginal(
                    override?.objetivo_ano,
                    grupo.objetivo_ano
                ),
                equipe: valorOuOriginal(override?.equipe, grupo.equipe),
                convite_final: valorOuOriginal(
                    override?.convite_final,
                    grupo.convite_final
                ),
            };
        })
        .filter(Boolean) as Grupo[];
}

export function aplicarEventoEdicao(
    eventos: Evento[],
    overrides: EventoEdicao[]
) {
    const overridesMap = new Map(overrides.map((item) => [item.evento_id, item]));

    return eventos
        .map((evento) => {
            const override = overridesMap.get(evento.id);

            if (override?.ativo === false) {
                return null;
            }

            return {
                ...evento,
                titulo: valorOuOriginal(override?.titulo, evento.titulo),
                faixa_etaria: valorOuOriginal(
                    override?.faixa_etaria,
                    evento.faixa_etaria
                ),
                descricao: valorOuOriginal(override?.descricao, evento.descricao),
                equipe: valorOuOriginal(override?.equipe, evento.equipe),
                objetivo_ano: valorOuOriginal(
                    override?.objetivo_ano,
                    evento.objetivo_ano
                ),
                convite: valorOuOriginal(override?.convite, evento.convite),
                grupos_envolvidos: valorOuOriginal(
                    override?.grupos_envolvidos,
                    evento.grupos_envolvidos
                ),
                todos_os_grupos: valorOuOriginal(
                    override?.todos_os_grupos,
                    evento.todos_os_grupos
                ),
                visibilidade: valorOuOriginal(
                    override?.visibilidade,
                    evento.visibilidade
                ),
            };
        })
        .filter(Boolean) as Evento[];
}
