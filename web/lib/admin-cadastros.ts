import type { ResultadoAcao } from "./admin-types";

export type SetorCadastro = "grupos" | "eventos" | "encontros";

/** Shared request handling for the three pastoral forms. */
export async function salvarCadastro(
    setor: SetorCadastro,
    metodo: "POST" | "PUT",
    payload: Record<string, unknown>
): Promise<ResultadoAcao> {
    return enviarAcaoAdmin(`/api/${setor}`, metodo, payload);
}

/** Mutations must confirm both HTTP and application success before changing the interface. */
export async function enviarAcaoAdmin(
    caminho: string,
    metodo: "POST" | "PUT" | "DELETE",
    payload: Record<string, unknown>
): Promise<ResultadoAcao> {
    try {
        const resposta = await fetch(caminho, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const dados = await resposta.json();
        if (!resposta.ok || !dados?.sucesso) {
            return { sucesso: false, erro: typeof dados?.erro === "string" ? dados.erro : "Não foi possível concluir a ação." };
        }
        return {
            sucesso: true,
            aviso: typeof dados.aviso === "string" ? dados.aviso : undefined,
            grupoSlug: typeof dados.grupo?.slug === "string" ? dados.grupo.slug : undefined,
            eventoId: typeof dados.evento?.id === "string" ? dados.evento.id : undefined,
        };
    } catch {
        return { sucesso: false, erro: "Erro de conexão. Confira os dados antes de tentar novamente." };
    }
}
