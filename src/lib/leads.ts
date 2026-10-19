import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const CHANNELS = ["WhatsApp", "Instagram", "Email", "Formulário Web"] as const;
export const STATUSES = ["Novo", "Em Atendimento", "Convertido", "Arquivado"] as const;
export const TEMPERATURES = ["Quente", "Morno", "Frio"] as const;

export type Channel = (typeof CHANNELS)[number];
export type Status = (typeof STATUSES)[number];
export type Temperature = (typeof TEMPERATURES)[number];
export type Intent =
  | "Alta Intenção de Compra"
  | "Dúvida de Preço / Tabela"
  | "Suporte / Problema"
  | "Informações Gerais";
export type Sentiment = "Positivo" | "Neutro" | "Urgente / Negativo";

export interface Lead {
  id: string;
  customer_name: string;
  channel: Channel;
  incoming_message: string;
  intent_category: Intent;
  lead_temperature: Temperature;
  sentiment: Sentiment;
  suggested_reply: string;
  recommended_action: string;
  status: Status;
  created_at: string;
}

let client: SupabaseClient | null | undefined;
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  try {
    client = url && key ? createClient(url, key) : null;
  } catch {
    client = null;
  }
  return client;
}

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

export function analyzeMessage(name: string, channel: Channel, message: string): Omit<Lead, "id" | "created_at" | "status"> {
  const t = message.toLowerCase();
  const first = name.trim().split(" ")[0] || "tudo bem";
  let intent: Intent = "Informações Gerais";
  let temp: Temperature = "Frio";
  let sentiment: Sentiment = "Neutro";
  let reply = `Olá, ${first}! Obrigado pelo contato 😊 Posso te ajudar com mais detalhes sobre nossos produtos e serviços. O que você gostaria de saber primeiro?`;
  let action = "Responder em até 1h e qualificar a necessidade com 2 perguntas abertas.";

  if (has(t, ["problema", "erro", "não funciona", "nao funciona", "reclama", "defeito", "atraso", "cancelar", "péssimo", "pessimo", "reembolso"])) {
    intent = "Suporte / Problema";
    temp = "Morno";
    sentiment = "Urgente / Negativo";
    reply = `Oi, ${first}. Sinto muito pelo transtorno! Já estou verificando seu caso com prioridade. Pode me enviar o número do pedido para eu resolver agora mesmo?`;
    action = "Escalar para suporte nível 2 em até 15 min e oferecer compensação (frete grátis ou cupom 10%).";
  } else if (has(t, ["comprar", "fechar", "quero contratar", "pagamento", "pix", "link", "hoje", "urgente", "agora"])) {
    intent = "Alta Intenção de Compra";
    temp = "Quente";
    sentiment = has(t, ["urgente", "agora"]) ? "Urgente / Negativo" : "Positivo";
    if (sentiment === "Urgente / Negativo" && !has(t, ["problema"])) sentiment = "Positivo";
    reply = `Perfeito, ${first}! 🚀 Já separei tudo para você. Te envio agora o link de pagamento seguro — e, fechando hoje, você ganha 5% de desconto. Posso mandar?`;
    action = "Enviar link de pagamento imediatamente com 5% de desconto e confirmar em 10 min.";
  } else if (has(t, ["preço", "preco", "valor", "tabela", "quanto custa", "orçamento", "orcamento", "planos"])) {
    intent = "Dúvida de Preço / Tabela";
    temp = "Morno";
    sentiment = "Neutro";
    reply = `Olá, ${first}! Claro, segue nossa tabela atualizada 📄 Temos planos a partir de R$ 97/mês. Me conta rapidinho o tamanho do seu time que te indico o melhor custo-benefício!`;
    action = "Enviar tabela em PDF e agendar call de 15 min para apresentar o plano ideal.";
  }
  return {
    customer_name: name.trim(),
    channel,
    incoming_message: message.trim(),
    intent_category: intent,
    lead_temperature: temp,
    sentiment,
    suggested_reply: reply,
    recommended_action: action,
  };
}

export function makeMockLeads(): Lead[] {
  const now = Date.now();
  const seed: [string, Channel, string, number, Status][] = [
    ["Lucas Mendes", "WhatsApp", "Oi! Quero fechar o plano anual hoje ainda, consegue me mandar o link de pagamento via Pix?", 2, "Novo"],
    ["Mariana Costa", "Instagram", "Olá, qual o valor dos planos? Vocês têm uma tabela de preços para equipes de 10 pessoas?", 18, "Em Atendimento"],
    ["Rafael Souza", "Email", "Meu pedido está com atraso de 5 dias e ninguém responde. Isso é um problema sério, quero uma solução.", 47, "Novo"],
  ];
  return seed.map(([n, c, m, mins, s], i) => ({
    ...analyzeMessage(n, c, m),
    id: `mock-${i}`,
    status: s,
    created_at: new Date(now - mins * 60000).toISOString(),
  }));
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Agora mesmo";
  if (s < 3600) return `Há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Há ${Math.floor(s / 3600)} h`;
  return `Há ${Math.floor(s / 86400)} d`;
}
