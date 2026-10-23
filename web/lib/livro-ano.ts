import { carregarConteudoPublicoAnual } from "./conteudo-anual";
import { carregarEbookPorAno } from "./ebook-config";

export async function carregarCalendarioLivroPorAno(ano: number) {
    const ebook = await carregarEbookPorAno(ano);
    if (!ebook) return null;
    const conteudo = await carregarConteudoPublicoAnual(ano);
    const encontros = conteudo.encontros.filter(e => !e.evento_id || (e.nivel === "evento" && e.mostrar_no_anual === true));
    const eventos = conteudo.eventos.filter(e => encontros.some(m => m.evento_id === e.id));
    return { ano, ebook, grupos: conteudo.grupos, encontros, eventos };
}

export async function carregarCapituloLivroPorAno(ano: number, slug: string) {
    const ebook = await carregarEbookPorAno(ano);
    if (!ebook) return null;
    const conteudo = await carregarConteudoPublicoAnual(ano);
    const grupo = conteudo.grupos.find(g => g.slug === slug);
    if (!grupo) return null;
    const relacionados = conteudo.eventos.filter(e => e.todos_os_grupos || e.grupos_envolvidos?.includes(grupo.id));
    const ids = new Set(relacionados.map(e => e.id));
    const porId = new Map(conteudo.eventos.map(e => [e.id, e]));
    const encontros = conteudo.encontros.filter(e => e.evento_id ? ids.has(e.evento_id) : e.grupo_id === grupo.id)
        .map(e => e.evento_id ? { ...e, nome_evento: porId.get(e.evento_id)?.titulo || "" } : e);
    const unicos = [...new Map(encontros.map(e => [e.id, e])).values()];
    return { ano, ebook, grupo, grupos: conteudo.grupos, encontros: unicos,
        eventosDoGrupo: relacionados.filter(e => unicos.some(m => m.evento_id === e.id)) };
}

export async function carregarEventoLivroPorAno(ano: number, id: string) {
    const ebook = await carregarEbookPorAno(ano);
    if (!ebook) return null;
    const conteudo = await carregarConteudoPublicoAnual(ano);
    const evento = conteudo.eventos.find(e => e.id === id);
    if (!evento) return null;
    return { ano, ebook, evento, grupos: conteudo.grupos,
        encontros: conteudo.encontros.filter(e => e.evento_id === id && e.nivel === "evento") };
}
