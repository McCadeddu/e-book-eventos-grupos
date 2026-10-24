// web/lib/eventos-types.ts

export type Evento = {
    id: string;
    slug?: string;
    ordem?: number;
    titulo: string;
    faixa_etaria?: string | null;
    descricao?: string | null;
    equipe?: string[];
    objetivo_ano?: string | null;
    convite?: string | null;

    // Legacy/derived dates; an event's actual schedule belongs to its meetings.
    data_inicio?: string | null;
    data_fim?: string | null;

    grupos_envolvidos?: string[];
    todos_os_grupos?: boolean;

    visibilidade: "publico" | "interno";
};
