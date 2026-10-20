# LeadPulse AI

Crie uma aplicação Web SaaS completa e profissional chamada "LeadPulse AI" — um motor de Triagem Inteligente de Leads e Sugestão de Respostas com IA para times de vendas e atendimento ao cliente.

Estilo Visual e UI/UX:
- Layout em Modo Escuro (Dark Mode) nativo com estilo moderno e corporativo usando Tailwind CSS.
- Paleta de cores: Fundo escuro profundo (`bg-slate-950`), bordas sutis (`border-slate-800`), cards com efeito translúcido/glassmorphism (`bg-slate-900/70 backdrop-blur-md`) e destaques em cores neon (Verde Esmeralda para alta intenção/conversão, Âmbar para média e Azul/Índigo para baixa intenção).
- Tipografia limpa, de alto contraste e legibilidade.
- Design 100% responsivo para telas móveis e desktop.

Arquitetura de Dados e Estado Local (Fallback Inteligente):
1. Conexão com Supabase Pronta:
   - Configure o cliente do Supabase para ler e gravar na tabela `leads`.
   - Estrutura da Tabela `leads`:
     - `id` (uuid, chave primária)
     - `customer_name` (text, obrigatório)
     - `channel` (text: 'WhatsApp' | 'Instagram' | 'Email' | 'Formulário Web')
     - `incoming_message` (text, obrigatório)
     - `intent_category` (text: 'Alta Intenção de Compra' | 'Dúvida de Preço / Tabela' | 'Suporte / Problema' | 'Informações Gerais')
     - `lead_temperature` (text: 'Quente' | 'Morno' | 'Frio')
     - `sentiment` (text: 'Positivo' | 'Neutro' | 'Urgente / Negativo')
     - `suggested_reply` (text)
     - `recommended_action` (text)
     - `status` (text: 'Novo' | 'Em Atendimento' | 'Convertido' | 'Arquivado')
     - `created_at` (timestamp)
2. Modo de Simulação sem Chaves (Mock Fallback):
   - Se o Supabase não estiver conectado ou faltarem as variáveis de ambiente, a aplicação deve inicializar perfeitamente com um estado local React (`useState`/`useContext`) já pré-preenchido com 3 leads simulados realistas. A aplicação NUNCA deve quebrar ou exibir tela em branco.

Estrutura e Componentes da Aplicação:

1. Cabeçalho / Navbar Superior:
   - Logo "LeadPulse AI" com um ícone animado de pulso/raio em destaque.
   - Indicador de status ativo: "Motor de IA Online" (ponto verde brilhante).
   - Métricas de topo (KPI Cards):
     - Total de Leads Analisados
     - Leads Quentes (Tag Verde)
     - Tempo Médio de Resposta (~1.2s)
     - Horas Economizadas pelo Time
   - Botão para abrir o Modal de FAQ / Dúvidas Frequentes.

2. Área Principal (Grid de 2 Colunas em Desktop / Empilhado em Mobile):

Coluna Esquerda: Console de Captura e Triagem com IA
- Formulário intuitivo:
  - Nome do Cliente (Input de texto, ex: "Lucas Mendes").
  - Canal de Origem (Dropdown: WhatsApp, Instagram, Email, Formulário Web).
  - Mensagem do Cliente (Área de texto multi-linha).
- Atalhos de Teste Rápido (Quick-fill buttons) abaixo do campo de texto:
  - Botão 1: "Exemplo: Compra Urgente" (Preenche o texto com uma dúvida quente de compra).
  - Botão 2: "Exemplo: Dúvida de Preço" (Preenche pedindo tabela de valores).
  - Botão 3: "Exemplo: Reclamação / Suporte" (Preenche com mensagem de suporte).
- Botão Principal: "⚡ Analisar Lead com IA"
  - Comportamento: Ao clicar, exibe um estado de carregamento elegante com spinner ("Classificando Intenção e Gerando Resposta...") por 1.2 segundos e em seguida insere o resultado analisado no painel e no banco de dados.

Coluna Direita: Dashboard Dinâmico de Leads
- Barra de Busca e Filtros:
  - Campo de busca por nome ou palavra-chave da mensagem.
  - Filtro por Temperatura (Todos, Quente, Morno, Frio).
  - Filtro por Canal.
- Feed de Cards de Leads (Estilo Stream em Tempo Real):
  - Cabeçalho do Card: Nome do Cliente, Ícone do Canal, Horário ("Há 2 min").
  - Badges Visuais:
    - Badge de Temperatura: 'Quente' (Verde/Red Glow), 'Morno' (Âmbar), 'Frio' (Azul/Cinza).
    - Badge de Categoria de Intenção.
    - Indicador de Sentimento.
  - Corpo do Card:
    - Caixa com a mensagem original recebida.
    - Caixa em destaque com a "Resposta Sugerida pela IA" (Texto pronto para envio no WhatsApp).
    - Caixa com a "Ação Recomendada para o Atendente" (ex: "Enviar link de pagamento imediatamente com 5% de desconto").
  - Ações do Card:
    - Botão "Copiar Resposta" (Com notificação Toast de confirmação ao clicar).
    - Selector de Status ('Novo', 'Em Atendimento', 'Convertido', 'Arquivado').
    - Botão de Excluir / Descartar.

3. Modal de FAQ / Como Funciona (Embutido):
- Modal interativo acessível pelo cabeçalho explicando para os avaliadores:
  1. Como a IA classifica a intenção do cliente em milissegundos?
  2. Como conectar a ferramenta a instâncias reais do WhatsApp ou CRM via Webhooks/Supabase?
  3. É possível personalizar o tom da resposta da IA para a minha empresa?

Polimento de Interface:
- Animações suaves ao adicionar/remover cards, efeitos de hover em botões e estados vazios (empty state) amigáveis caso o usuário filtre ou apague todos os leads.
- Use exclusivamente ícones SVG da biblioteca `lucide-react`.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1fbfb927-b19b-4d58-933b-03be33d34092).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
