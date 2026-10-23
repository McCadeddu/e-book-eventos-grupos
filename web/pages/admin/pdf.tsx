// web/pages/admin/pdf.tsx

import Link from "next/link";
import { useRouter } from "next/router";

export default function PdfAdmin() {
  const router = useRouter();

  return (
    <main style={{ padding: "2rem" }}>
      <p>
        <button
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Voltar à administração
        </button>
      </p>

      <h1>🖨 PDFs dos encontros</h1>

      <p>
        Para gerar o PDF de um encontro, abra o grupo, evento ou retiro na agenda
        do ano desejado e selecione “Prévia / PDF / Cartaz”. Na prévia, use “Gerar PDF”.
      </p>
      <p>
        <Link href="/admin/grupos">Abrir agenda pastoral</Link>
      </p>
      <p style={{ marginTop: "1.5rem", opacity: 0.7 }}>
        A exportação do livro completo e dos capítulos por grupo ainda está em desenvolvimento.
      </p>
    </main>
  );
}
