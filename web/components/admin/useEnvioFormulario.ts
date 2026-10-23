import { useState } from "react";
import type { ResultadoAcao } from "../../lib/admin-types";

export function useEnvioFormulario(onSubmit: (payload: Record<string, unknown>) => Promise<ResultadoAcao>) {
    const [status, setStatus] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    async function enviar(payload: Record<string, unknown>) {
        setStatus(null);
        setSalvando(true);
        try {
            const resultado = await onSubmit(payload);
            if (!resultado.sucesso) setStatus(resultado.erro);
        } catch {
            setStatus("Erro de conexão. Confira os dados antes de tentar novamente.");
        } finally {
            setSalvando(false);
        }
    }

    return { status, salvando, enviar };
}
