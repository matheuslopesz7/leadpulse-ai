import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  name: z.string().min(1).max(120),
  channel: z.enum(["WhatsApp", "Instagram", "Email", "Formulário Web"]),
  message: z.string().min(1).max(4000),
});

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["intent_category", "lead_temperature", "sentiment", "suggested_reply", "recommended_action"],
  properties: {
    intent_category: { type: "string", enum: ["Alta Intenção de Compra", "Dúvida de Preço / Tabela", "Suporte / Problema", "Informações Gerais"] },
    lead_temperature: { type: "string", enum: ["Quente", "Morno", "Frio"] },
    sentiment: { type: "string", enum: ["Positivo", "Neutro", "Urgente / Negativo"] },
    suggested_reply: { type: "string" },
    recommended_action: { type: "string" },
  },
};

const SYSTEM = `Você é um motor de triagem de leads para times de vendas brasileiros.
Classifique a mensagem do cliente e responda SOMENTE no JSON do schema.
- intent_category: intenção comercial principal.
- lead_temperature: Quente = pronto para comprar; Morno = interessado/precisa de atenção; Frio = curiosidade.
- sentiment: tom emocional.
- suggested_reply: resposta curta (até 3 frases), cordial, em português do Brasil, chamando o cliente pelo primeiro nome, adequada ao canal. Não invente preços.
- recommended_action: próxima ação objetiva para o vendedor, com prazo.`;

export const triageLead = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "IA não configurada." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Cliente: ${data.name}\nCanal: ${data.channel}\nMensagem: ${data.message}` },
        ],
        response_format: { type: "json_schema", json_schema: { name: "triage", strict: true, schema } },
      }),
    });
    if (!res.ok) {
      console.error("AI gateway", res.status, await res.text());
      if (res.status === 429) return { ok: false as const, error: "Muitas requisições. Tente em instantes." };
      if (res.status === 402) return { ok: false as const, error: "Créditos de IA esgotados." };
      return { ok: false as const, error: "Falha ao consultar a IA." };
    }
    const json = await res.json();
    try {
      const out = JSON.parse(json.choices[0].message.content);
      return { ok: true as const, result: out as Record<string, string> };
    } catch {
      return { ok: false as const, error: "Resposta da IA inválida." };
    }
  });
