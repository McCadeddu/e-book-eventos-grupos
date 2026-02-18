// web/components/PixAlmoco

import { useState } from "react";

const PIX_CODE = `00020126710014br.gov.bcb.pix0127economato.bh@villaregia.org0218Doacao para almoco5204000053039865802BR5925COMUNIDADE MISSIONARIA DE6014BELO HORIZONTE62160512DoacaoAlmoco63045DEC`;

export default function PixAlmoco() {
    const [copiado, setCopiado] = useState(false);

    async function copiar() {
        await navigator.clipboard.writeText(PIX_CODE);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <div
            style={{
                marginTop: "2rem",
                padding: "1.5rem",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: "8px",
            }}
        >
            <h3>Contribuição para o almoço</h3>
            <p>Contribuição a partir de R$ 10,00.</p>

            <div
                style={{
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                    backgroundColor: "#ffffff",
                    color: "#333",
                    padding: "0.7rem",
                    borderRadius: "6px",
                    marginTop: "0.5rem",
                }}
            >
                {PIX_CODE}
            </div>

            <button
                onClick={copiar}
                style={{
                    marginTop: "0.8rem",
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "#ff6136",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                }}
            >
                {copiado ? "Pix copiado!" : "Copiar Pix"}
            </button>
        </div>
    );
}