// web/lib/eventos-types.ts

export type Evento = {
    id: string;
    titulo: string;
    faixa_etaria?: string;
    descricao?: string;
    equipe?: string[];
    objetivo_ano?: string;
    convite?: string;

    data_inicio: string;
    data_fim?: string | null;

    grupos_envolvidos?: string[];
    todos_os_grupos?: boolean;

    visibilidade: "publico" | "interno";
};