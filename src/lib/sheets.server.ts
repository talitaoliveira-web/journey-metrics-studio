// Server-only Google Sheets gateway helper (builder's own Google account).
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export async function sheetsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const sheetsKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !sheetsKey) throw new Error("Conexão com o Google Sheets não configurada.");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Sheets request failed [${res.status}]: ${body}`);
    if (res.status === 404) throw new Error("Planilha não encontrada. Confira o link.");
    if (res.status === 403) throw new Error("Sua conta Google não tem acesso a essa planilha.");
    throw new Error(`Falha ao acessar o Google Sheets (${res.status}).`);
  }
  return (await res.json()) as T;
}
