import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Zap, Activity, Users, Flame, Timer, Clock, HelpCircle, X, Loader2, Search, MessageCircle,
  Camera, Mail, Globe, Copy, Trash2, Bot, Target, Inbox, ChevronDown, Smile, Meh, AlertTriangle, Database,
} from "lucide-react";
import { LeadsProvider, useLeads } from "@/lib/leads-context";
import { CHANNELS, STATUSES, TEMPERATURES, timeAgo, type Channel, type Lead, type Temperature } from "@/lib/leads";
import { triageLead } from "@/lib/ai-triage.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadPulse AI — Triagem Inteligente de Leads com IA" },
      { name: "description", content: "Classifique a intenção de leads em segundos e receba respostas sugeridas por IA para vendas e atendimento." },
      { property: "og:title", content: "LeadPulse AI — Triagem Inteligente de Leads" },
      { property: "og:description", content: "Motor de IA que classifica leads e sugere respostas prontas para WhatsApp, Instagram e Email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <LeadsProvider>
      <App />
    </LeadsProvider>
  ),
});

const channelIcon: Record<Channel, typeof Mail> = { WhatsApp: MessageCircle, Instagram: Camera, Email: Mail, "Formulário Web": Globe };
const tempStyle: Record<Temperature, string> = {
  Quente: "bg-hot/15 text-hot border-hot/40 glow-hot",
  Morno: "bg-warm/15 text-warm border-warm/40",
  Frio: "bg-cold/15 text-cold border-cold/40",
};
const inputCls = "w-full rounded-lg border border-input bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function App() {
  const [faq, setFaq] = useState(false);
  return (
    <div className="min-h-screen">
      <Header onFaq={() => setFaq(true)} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Console />
        <Dashboard />
      </main>
      {faq && <FaqModal onClose={() => setFaq(false)} />}
    </div>
  );
}

function Header({ onFaq }: { onFaq: () => void }) {
  const { leads, connected } = useLeads();
  const hot = leads.filter((l) => l.lead_temperature === "Quente").length;
  const kpis = [
    { label: "Leads Analisados", value: leads.length, icon: Users, tone: "text-foreground" },
    { label: "Leads Quentes", value: hot, icon: Flame, tone: "text-hot" },
    { label: "Tempo Médio de Resposta", value: "~1.2s", icon: Timer, tone: "text-warm" },
    { label: "Horas Economizadas", value: `${(leads.length * 0.25).toFixed(1)}h`, icon: Clock, tone: "text-cold" },
  ];
  return (
    <header className="mx-auto max-w-7xl px-4 pt-6 pb-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative grid size-11 place-items-center rounded-xl bg-brand">
            <span className="absolute inset-0 animate-ping rounded-xl bg-hot/30" />
            <Activity className="relative size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LeadPulse <span className="text-gradient">AI</span></h1>
            <p className="text-xs text-muted-foreground">Triagem inteligente de leads</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <Database className="size-3.5" /> {connected ? "Banco conectado" : "Conectando..."}
          </span>
          <span className="flex items-center gap-2 rounded-full border border-hot/30 bg-hot/10 px-3 py-1.5 text-xs font-medium text-hot">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-hot opacity-75" /><span className="relative size-2 rounded-full bg-hot" /></span>
            Motor de IA Online
          </span>
          <button onClick={onFaq} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:border-ring hover:text-primary">
            <HelpCircle className="size-4" /> FAQ
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass rounded-xl p-4 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">{k.label}<k.icon className={`size-4 ${k.tone}`} /></div>
            <div className={`mt-2 font-display text-2xl font-bold ${k.tone}`}>{k.value}</div>
          </div>
        ))}
      </div>
    </header>
  );
}

const examples = [
  { label: "Compra Urgente", text: "Oi! Preciso fechar hoje ainda o plano Pro para meu time de 8 pessoas. Pode me mandar o link de pagamento via Pix agora?" },
  { label: "Dúvida de Preço", text: "Olá, boa tarde! Gostaria de saber o valor dos planos. Vocês têm uma tabela de preços com desconto anual?" },
  { label: "Reclamação / Suporte", text: "Estou com um problema sério: o sistema não funciona desde ontem e perdi vendas. Preciso de suporte urgente!" },
];

function Console() {
  const { addLead } = useLeads();
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("WhatsApp");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !msg.trim()) { toast.error("Preencha o nome e a mensagem do cliente."); return; }
    setLoading(true);
    try {
      const r = await triageLead({ data: { name: name.trim(), channel, message: msg.trim() } });
      if (!r.ok) { toast.error(r.error); return; }
      const result = { customer_name: name.trim(), channel, incoming_message: msg.trim(), ...r.result } as Omit<Lead, "id" | "created_at" | "status">;
      await addLead(result);
      setMsg("");
      setName("");
      toast.success(`Lead classificado: ${result.lead_temperature} · ${result.intent_category}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar o lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="glass h-fit rounded-2xl p-5 sm:p-6 lg:sticky lg:top-6">
      <div className="mb-5 flex items-center gap-2">
        <Bot className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Console de Triagem com IA</h2>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Nome do Cliente</span>
          <input className={inputCls} placeholder="Ex: Lucas Mendes" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Canal de Origem</span>
          <div className="relative">
            <select className={`${inputCls} appearance-none pr-9`} value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
          </div>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Mensagem do Cliente</span>
          <textarea rows={5} className={`${inputCls} resize-none`} placeholder="Cole aqui a mensagem recebida..." value={msg} onChange={(e) => setMsg(e.target.value)} />
        </label>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Atalhos de teste rápido</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button type="button" key={ex.label} onClick={() => { setMsg(ex.text); if (!name) setName("Lucas Mendes"); }}
                className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs transition hover:border-ring hover:text-primary">
                Exemplo: {ex.label}
              </button>
            ))}
          </div>
        </div>
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 hover:glow-hot disabled:opacity-80">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Classificando Intenção e Gerando Resposta...</> : <><Zap className="size-4" /> Analisar Lead com IA</>}
        </button>
      </form>
    </section>
  );
}

function Dashboard() {
  const { leads } = useLeads();
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState<"Todos" | Temperature>("Todos");
  const [ch, setCh] = useState<"Todos" | Channel>("Todos");
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(i); }, []);

  const filtered = useMemo(() => leads.filter((l) =>
    (temp === "Todos" || l.lead_temperature === temp) &&
    (ch === "Todos" || l.channel === ch) &&
    (`${l.customer_name} ${l.incoming_message}`.toLowerCase().includes(q.toLowerCase()))), [leads, q, temp, ch]);

  return (
    <section className="min-w-0 space-y-4">
      <div className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Buscar por nome ou palavra-chave..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-36`} value={temp} onChange={(e) => setTemp(e.target.value as typeof temp)}>
          <option>Todos</option>{TEMPERATURES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className={`${inputCls} sm:w-44`} value={ch} onChange={(e) => setCh(e.target.value as typeof ch)}>
          <option value="Todos">Todos os canais</option>{CHANNELS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="glass grid place-items-center rounded-2xl px-6 py-16 text-center animate-in fade-in">
          <Inbox className="size-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Nenhum lead por aqui</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {leads.length ? "Ajuste a busca ou os filtros para ver mais resultados." : "Analise uma nova mensagem no console para começar."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">{filtered.map((l) => <LeadCard key={l.id} lead={l} />)}</div>
      )}
    </section>
  );
}

function SentimentTag({ s }: { s: Lead["sentiment"] }) {
  const map = { Positivo: [Smile, "text-hot"], Neutro: [Meh, "text-muted-foreground"], "Urgente / Negativo": [AlertTriangle, "text-urgent"] } as const;
  const [Icon, tone] = map[s];
  return <span className={`flex items-center gap-1 text-xs ${tone}`}><Icon className="size-3.5" />{s}</span>;
}

function LeadCard({ lead }: { lead: Lead }) {
  const { updateStatus, removeLead } = useLeads();
  const [leaving, setLeaving] = useState(false);
  const Icon = channelIcon[lead.channel];
  const copy = async () => {
    try { await navigator.clipboard.writeText(lead.suggested_reply); toast.success("Resposta copiada! Pronta para enviar."); }
    catch { toast.error("Não foi possível copiar."); }
  };
  const del = () => { setLeaving(true); setTimeout(() => { removeLead(lead.id); toast("Lead descartado"); }, 250); };

  return (
    <article className={`glass rounded-2xl p-5 transition-all duration-300 hover:border-ring/40 animate-in fade-in slide-in-from-top-3 ${leaving ? "scale-95 opacity-0" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-secondary"><Icon className="size-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold leading-tight">{lead.customer_name}</h3>
            <p className="text-xs text-muted-foreground">{lead.channel} · {timeAgo(lead.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tempStyle[lead.lead_temperature]}`}>{lead.lead_temperature}</span>
          <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs">{lead.intent_category}</span>
          <SentimentTag s={lead.sentiment} />
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-xl border border-border bg-background/50 p-3">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Mensagem recebida</p>
          <p className="text-foreground/90">"{lead.incoming_message}"</p>
        </div>
        <div className="rounded-xl border border-hot/30 bg-hot/5 p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-hot"><Bot className="size-3.5" /> Resposta sugerida pela IA</p>
          <p>{lead.suggested_reply}</p>
        </div>
        <div className="rounded-xl border border-warm/30 bg-warm/5 p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wide text-warm"><Target className="size-3.5" /> Ação recomendada</p>
          <p>{lead.recommended_action}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110 hover:glow-hot">
          <Copy className="size-3.5" /> Copiar Resposta
        </button>
        <select value={lead.status} onChange={(e) => { updateStatus(lead.id, e.target.value as Lead["status"]); toast.success(`Status: ${e.target.value}`); }}
          className="rounded-lg border border-input bg-background/60 px-3 py-2 text-xs outline-none focus:border-ring">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button onClick={del} aria-label="Excluir lead" className="ml-auto rounded-lg border border-border p-2 text-muted-foreground transition hover:border-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}

const faqs = [
  { q: "Como a IA classifica a intenção do cliente em milissegundos?", a: "O motor analisa sinais linguísticos (palavras de compra, preço, urgência e insatisfação), combina com o canal de origem e atribui intenção, temperatura e sentimento. Em produção, isso é feito por um modelo de linguagem com prompts treinados no seu funil, retornando uma resposta estruturada em cerca de 1 segundo." },
  { q: "Como conectar a instâncias reais do WhatsApp ou CRM?", a: "Cada lead é gravado na tabela `leads` do Supabase. Basta apontar o webhook do WhatsApp Business API, Instagram ou seu formulário para um endpoint que chama o motor de IA e insere o resultado. CRMs como HubSpot ou Pipedrive podem consumir os mesmos dados via webhooks ou integrações nativas." },
  { q: "É possível personalizar o tom da resposta da IA?", a: "Sim. Você define o tom (formal, consultivo, descontraído), políticas de desconto, scripts de objeção e informações da empresa. A IA usa esse contexto para gerar respostas alinhadas à sua marca e ações recomendadas para cada etapa do funil." },
];

function FaqModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(0);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div role="dialog" aria-modal className="w-full max-w-lg rounded-2xl border border-border bg-popover p-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><HelpCircle className="size-5 text-primary" /> Como funciona</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-5" /></button>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-border">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium hover:text-primary">
                <span>{i + 1}. {f.q}</span><ChevronDown className={`size-4 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="px-4 pb-4 text-sm text-muted-foreground animate-in fade-in">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
