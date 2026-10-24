import type { Encontro } from "./encontros-utils";
import type { Grupo } from "./types";
import type { EventoAdmin } from "./admin-types";
import { dataDoAnoPastoral } from "./ano-pastoral";
import { nivelPermitidoNoAnual } from "./calendario-regras";
import { pendenciasDoEncontro } from "./alertas";

export type ItemPlanejamento = {
    encontro: Encontro;
    responsavel: string;
    situacao: string;
    noAnual: boolean;
    podeEditar: boolean;
    busca: string;
    pendencias: string[];
};

function normalizar(texto: string) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function minutosDoHorario(horario?: string | null) {
    const partes = horario?.match(/^\s*(\d{1,2})\s*(?:h|:)\s*(\d{1,2})?/i);
    if (!partes) return 1440;
    const horas = Number(partes[1]), minutos = Number(partes[2] || 0);
    return horas < 24 && minutos < 60 ? horas * 60 + minutos : 1440;
}

/** One row per meeting, including internal records and inactive owners, for authenticated use. */
export function montarAgendaPlanejamento(ano: number, encontros: Encontro[], grupos: Grupo[], eventos: EventoAdmin[], gruposInativos: Grupo[], eventosInativos: EventoAdmin[]): ItemPlanejamento[] {
    const gruposAtivos = new Map(grupos.map(g => [g.id, g]));
    const eventosAtivos = new Map(eventos.map(e => [e.id, e]));
    const todosGrupos = new Map([...gruposInativos, ...grupos].map(g => [g.id, g]));
    const todosEventos = new Map([...eventosInativos, ...eventos].map(e => [e.id, e]));
    const unicos = new Map(encontros.filter(e => dataDoAnoPastoral(e.data_inicio, ano)).map(e => [e.id, e]));
    return [...unicos.values()].map(encontro => {
        const evento = encontro.evento_id ? todosEventos.get(encontro.evento_id) : undefined;
        const grupo = !encontro.evento_id && encontro.grupo_id ? todosGrupos.get(encontro.grupo_id) : undefined;
        const existe = Boolean(evento || grupo);
        const ativo = encontro.evento_id ? eventosAtivos.has(encontro.evento_id) : !!encontro.grupo_id && gruposAtivos.has(encontro.grupo_id);
        const publico = ativo && encontro.visibilidade === "publico" && (!encontro.evento_id || evento?.visibilidade === "publico");
        const noAnual = publico && nivelPermitidoNoAnual(encontro);
        const responsavel = evento?.titulo || grupo?.nome || "Vínculo não encontrado";
        const situacao = !existe ? "Vínculo não encontrado" : !ativo ? "Cadastro inativo"
            : encontro.visibilidade !== "publico" ? "Encontro interno"
            : encontro.evento_id && evento?.visibilidade !== "publico" ? "Evento interno"
            : noAnual ? "No calendário anual" : "Somente nos capítulos";
        return { encontro, responsavel, situacao, noAnual, podeEditar: ativo, pendencias: pendenciasDoEncontro(encontro),
            busca: normalizar([responsavel, encontro.titulo, encontro.local, encontro.horario].filter(Boolean).join(" ")) };
    }).sort((a,b) => a.encontro.data_inicio.localeCompare(b.encontro.data_inicio)
        || minutosDoHorario(a.encontro.horario) - minutosDoHorario(b.encontro.horario)
        || a.encontro.id.localeCompare(b.encontro.id));
}

export function filtrarAgendaPlanejamento(itens: ItemPlanejamento[], busca: string, mes: string, situacao: string, revisao = "") {
    const termos = normalizar(busca.trim()).split(/\s+/).filter(Boolean);
    return itens.filter(item => (!mes || item.encontro.data_inicio.slice(5,7) === mes)
        && (!situacao || (situacao === "anual" ? item.noAnual : !item.noAnual))
        && (!revisao || (revisao === "com" ? item.pendencias.length > 0 : item.pendencias.length === 0))
        && termos.every(termo => item.busca.includes(termo)));
}
