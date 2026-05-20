import { getEncontrosPorEventoStrict, getEncontrosPorGrupoStrict, getEncontrosStrict } from "./db/encontros";
import { getEventosStrict } from "./db/eventos";
import { getGrupoPorSlugStrict, getGruposOrdenadosStrict } from "./db/grupos";
import { carregarEbookPorAno, pertenceAoAno } from "./ebook-config";

export async function carregarCalendarioLivroPorAno(ano: number) {
    const ebook = await carregarEbookPorAno(ano);

    if (!ebook) {
        return null;
    }

    const grupos = await getGruposOrdenadosStrict();
    const encontros = (await getEncontrosStrict())
        .filter((e) => {
            if (!pertenceAoAno(e.data_inicio, ano)) return false;

            if (!e.evento_id) return true;

            return e.nivel === "evento" && e.mostrar_no_anual === true;
        })
        .map((e) => ({
            ...e,
            data_inicio: e.data_inicio ?? null,
            data_fim: e.data_fim ?? null,
            data_legivel: e.data_legivel ?? null,
        }));

    const eventos = (await getEventosStrict()).filter((evento: any) =>
        encontros.some((encontro) => encontro.evento_id === evento.id)
    );

    return { ano, ebook, grupos, encontros, eventos };
}

export async function carregarCapituloLivroPorAno(ano: number, slug: string) {
    const ebook = await carregarEbookPorAno(ano);

    if (!ebook) {
        return null;
    }

    const grupo = await getGrupoPorSlugStrict(slug);
    if (!grupo) {
        return null;
    }

    const grupos = await getGruposOrdenadosStrict();
    const encontrosGrupo = (await getEncontrosPorGrupoStrict(grupo.id)).filter(
        (encontro) => pertenceAoAno(encontro.data_inicio, ano)
    );

    const eventos = await getEventosStrict();
    const eventosDoGrupo = eventos.filter(
        (evento: any) =>
            evento.todos_os_grupos ||
            (evento.grupos_envolvidos &&
                evento.grupos_envolvidos.includes(grupo.id))
    );

    const encontrosEventos: any[] = [];

    for (const evento of eventosDoGrupo) {
        const data = await getEncontrosPorEventoStrict(evento.id);

        if (data) {
            encontrosEventos.push(
                ...data
                    .filter((encontro) => pertenceAoAno(encontro.data_inicio, ano))
                    .map((encontro) => ({
                        ...encontro,
                        nome_evento: evento.titulo,
                    }))
            );
        }
    }

    const encontros = [...encontrosGrupo, ...encontrosEventos];
    const eventosDoGrupoNoAno = eventosDoGrupo.filter((evento: any) =>
        encontros.some((encontro) => encontro.evento_id === evento.id)
    );

    return {
        ano,
        ebook,
        grupo,
        grupos,
        encontros,
        eventosDoGrupo: eventosDoGrupoNoAno,
    };
}

export async function carregarEventoLivroPorAno(ano: number, id: string) {
    const ebook = await carregarEbookPorAno(ano);

    if (!ebook) {
        return null;
    }

    const eventos = await getEventosStrict();
    const grupos = await getGruposOrdenadosStrict();
    const evento = eventos.find((item) => item.id === id);

    if (!evento) {
        return null;
    }

    const encontros = (await getEncontrosPorEventoStrict(evento.id)).filter(
        (encontro) => pertenceAoAno(encontro.data_inicio, ano)
    );

    return {
        ano,
        ebook,
        evento,
        grupos,
        encontros,
    };
}
