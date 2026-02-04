// web/pages/api/admin/login.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;

  if (!email || !email.endsWith("@villaregia.org")) {
    return res.status(401).json({ sucesso: false });
  }

  // Cria um cookie simples de sessão
  res.setHeader(
    "Set-Cookie",
    `adminAuth=true; Path=/; HttpOnly; SameSite=Lax`
  );

  return res.status(200).json({ sucesso: true });
}