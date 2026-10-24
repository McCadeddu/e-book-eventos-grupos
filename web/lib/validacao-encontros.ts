import { lerAnoPastoral } from "./ano-pastoral";

/** Validate requests before any database reads or writes. Metadata never becomes a column. */
export function validarPedidoEncontro(metodo: string, body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) return { erro: "Dados do encontro inválidos." };
    const entrada = body as Record<string, unknown>;
    const ano = lerAnoPastoral(entrada.anoPastoral);
    if (!ano) return { erro: "Informe o ano pastoral válido antes de alterar encontros." };
    const textos = metodo === "POST"
        ? ["tipo", "dataInicio", "dataFim", "dataLegivel", "titulo", "descricao", "horario", "local"]
        : metodo === "PUT"
            ? ["tipo", "data_inicio", "data_fim", "data_legivel", "titulo", "descricao", "horario", "local"] : [];
    const ids = metodo === "POST" ? ["grupoId", "evento_id"] : metodo === "PUT" ? ["id", "grupo_id", "evento_id"] : ["id", "grupo_id"];
    const opcoes = metodo === "DELETE" ? [] : ["visibilidade", "nivel", "mostrar_no_anual"];
    const permitidos = new Set(["anoPastoral", ...textos, ...ids, ...opcoes]);
    if (Object.keys(entrada).some(c => !permitidos.has(c))) return { erro: "Campo não permitido no encontro." };
    const dados: Record<string, unknown> = {};
    for (const campo of [...textos, ...ids]) if (entrada[campo] !== undefined) {
        const valor = entrada[campo];
        if (valor !== null && (typeof valor !== "string" || valor.length > (ids.includes(campo) ? 100 : 20000))) {
            return { erro: `Valor inválido: ${campo}.` };
        }
        dados[campo] = typeof valor === "string" ? valor.trim() : valor;
    }
    if (metodo !== "POST" && !dados.id) return { erro: "ID ausente." };
    if (metodo === "POST" && !dados.tipo) return { erro: "Informe o tipo do encontro." };
    if (entrada.tipo !== undefined && !dados.tipo) return { erro: "Tipo do encontro inválido." };
    for (const [campo, valores] of [["visibilidade", ["publico", "interno"]], ["nivel", ["evento", "organizacao"]]] as const) {
        if (entrada[campo] !== undefined) {
            if (typeof entrada[campo] !== "string" || !valores.some(v => v === entrada[campo])) return { erro: `Valor inválido: ${campo}.` };
            dados[campo] = entrada[campo];
        }
    }
    if (entrada.mostrar_no_anual !== undefined) {
        if (typeof entrada.mostrar_no_anual !== "boolean") return { erro: "Mostrar no calendário deve ser verdadeiro ou falso." };
        dados.mostrar_no_anual = entrada.mostrar_no_anual;
    }
    return { ano, dados };
}
