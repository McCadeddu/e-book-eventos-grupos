export type EventoAdmin = {
    id: string;
    titulo: string;
    faixa_etaria?: string | null;
    descricao?: string | null;
    equipe?: string[];
    grupos_envolvidos?: string[];
    todos_os_grupos?: boolean;
    objetivo_ano?: string | null;
    convite?: string | null;
    visibilidade?: string;
};

export type ResultadoAcao =
    | { sucesso: true; aviso?: string; grupoSlug?: string; eventoId?: string }
    | { sucesso: false; erro: string };
