// /web/pages/api/grupos/ordenar.ts

import fs from "fs";
import path from "path";
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ erro: "Método não permitido" });
    }

    const { grupoId, direcao } = req.body;

    const caminho = path.join(process.cwd(), "..", "data", "grupos.json");
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    const grupos = dados.grupos;

    const index = grupos.findIndex((g: any) => g.id === grupoId);
    if (index === -1) {
        return res.status(404).json({ erro: "Grupo não encontrado" });
    }

    const alvo =
        direcao === "up" ? index - 1 :
            direcao === "down" ? index + 1 :
                index;

    if (alvo < 0 || alvo >= grupos.length) {
        return res.json({ sucesso: true });
    }

    // troca de ordem
    const ordemTemp = grupos[index].ordem;
    grupos[index].ordem = grupos[alvo].ordem;
    grupos[alvo].ordem = ordemTemp;

    // também troca posição no array (para consistência)
    [grupos[index], grupos[alvo]] = [grupos[alvo], grupos[index]];

    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));

    return res.json({ sucesso: true });
}
