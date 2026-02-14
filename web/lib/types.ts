export type Grupo = {
    id: string;
    slug: string;
    nome: string;
    faixa_etaria: string;
    descricao: string;
    objetivo_ano: string;
    equipe: string[];
    convite_final: string;
    ordem: number;
    categoria?: "grupo" | "evento";
};

export type Encontro = {
    id: string;
    grupo_id: string;
    data_inicio: string;
    data_fim?: string | null;
    data_legivel?: string | null;
    horario?: string | null;
    titulo?: string | null;
    descricao?: string | null;
    local?: string | null;
    tipo: "encontro_regular" | "evento_especial";
    visibilidade: "interno" | "publico";
    evento_id?: string | null;
};
