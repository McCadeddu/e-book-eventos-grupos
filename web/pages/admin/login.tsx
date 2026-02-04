// web/pages/admin/login.tsx

import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const resposta = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      router.push("/admin");
    } else {
      setErro("Acesso permitido somente para e-mails @villaregia.org");
    }
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Acesso PASCOM</h1>

      <form onSubmit={entrar}>
        <label>
          E-mail institucional
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginTop: "0.5rem" }}
          />
        </label>

        <br /><br />

        <button type="submit">Entrar</button>
      </form>

      {erro && <p style={{ color: "darkred" }}>{erro}</p>}
    </main>
  );
}