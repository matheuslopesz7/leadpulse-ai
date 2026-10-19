CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  channel text NOT NULL,
  incoming_message text NOT NULL,
  intent_category text NOT NULL,
  lead_temperature text NOT NULL,
  sentiment text NOT NULL,
  suggested_reply text NOT NULL,
  recommended_action text NOT NULL,
  status text NOT NULL DEFAULT 'Novo',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon, authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo read" ON public.leads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "demo insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "demo update" ON public.leads FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "demo delete" ON public.leads FOR DELETE TO anon, authenticated USING (true);
INSERT INTO public.leads (customer_name, channel, incoming_message, intent_category, lead_temperature, sentiment, suggested_reply, recommended_action, status, created_at) VALUES
('Lucas Mendes','WhatsApp','Oi! Quero fechar o plano anual hoje ainda, consegue me mandar o link de pagamento via Pix?','Alta Intenção de Compra','Quente','Positivo','Perfeito, Lucas! 🚀 Já separei tudo para você. Te envio agora o link de pagamento via Pix. Posso mandar?','Enviar link de pagamento imediatamente e confirmar em 10 min.','Novo', now() - interval '2 minutes'),
('Mariana Costa','Instagram','Olá, qual o valor dos planos? Vocês têm uma tabela de preços para equipes de 10 pessoas?','Dúvida de Preço / Tabela','Morno','Neutro','Olá, Mariana! Claro, te envio nossa tabela atualizada. Para um time de 10 pessoas tenho uma condição especial — posso te explicar numa call rápida?','Enviar tabela e agendar call de 15 min.','Em Atendimento', now() - interval '18 minutes'),
('Rafael Souza','Email','Meu pedido está com atraso de 5 dias e ninguém responde. Isso é um problema sério, quero uma solução.','Suporte / Problema','Morno','Urgente / Negativo','Oi, Rafael. Sinto muito pelo transtorno! Já estou verificando seu caso com prioridade. Pode me enviar o número do pedido?','Escalar para suporte nível 2 em até 15 min.','Novo', now() - interval '47 minutes');