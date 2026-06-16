# LiberPay — Dashboard de Funil de Vendas

Dashboard interno semanal que consolida dados de GA4, Pipedrive e MailPoet em uma única visão do funil de vendas. Atualizado automaticamente toda sexta-feira via Make.com.

---

## Visão Geral

```
Make.com (sexta 08h — America/Sao_Paulo)
  ├── Google Analytics 4  → visitantes, novos usuários, eventos
  ├── Pipedrive CRM       → deals criados na semana
  └── MailPoet (WordPress)→ total de assinantes
        │
        ▼
  POST /api/snapshot
  (autenticado via header x-snapshot-secret)
        │
        ▼
  Vercel Blob Storage
  ├── snapshots/latest.json          (sempre sobrescrito — semana mais recente)
  └── snapshots/weeks/YYYY-MM-DD.json (arquivo por semana — histórico permanente)
        │
        ▼
  Dashboard Next.js
  liberpay-dashboard.vercel.app
  ├── Visualiza semana selecionada (?week=YYYY-MM-DD)
  ├── Exporta PDF via window.print()
  └── Exporta CSV com os dados da semana
```

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, CSS Modules, Lucide React |
| Backend | Next.js API Routes (Vercel Serverless Functions) |
| Storage | Vercel Blob (acesso público) |
| Automação | Make.com (cenário semanal agendado) |
| Deploy | Vercel |

---

## Estrutura do Projeto

```
liberpay-dashboard/
├── app/
│   ├── page.tsx                  # Dashboard principal (Server Component, aceita ?week=)
│   ├── layout.tsx                # Layout, metadata e favicon
│   ├── globals.css               # Estilos globais + print CSS
│   └── api/
│       ├── snapshot/
│       │   └── route.ts          # POST — salva latest.json + weeks/YYYY-MM-DD.json
│       └── weeks/
│           └── route.ts          # GET — lista semanas disponíveis no Blob
├── components/
│   ├── Sidebar.tsx               # Sidebar com seletor de semanas e exportação
│   ├── FunnelChart.tsx           # Funil de vendas (diagrama de trapézios com labels coloridos)
│   ├── SourceChart.tsx           # Origem dos visitantes
│   ├── EmailStats.tsx            # Estatísticas de e-mail marketing
│   └── WeeklyTable.tsx           # Comparativo semana atual vs anterior
├── types/
│   └── snapshot.ts               # Interface WeeklySnapshot
├── public/
│   ├── logo.png                  # Logo exibida no header
│   ├── logo1.png                 # Ícone da sidebar e favicon
│   └── data/
│       └── mock.json             # Dados de exemplo para dev local
└── .env.local                    # Variáveis de ambiente (não versionado)
```

---

## Variáveis de Ambiente

Configure em **Vercel → Project → Settings → Environment Variables**:

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SNAPSHOT_URL` | URL pública do Blob gerada após o primeiro POST bem-sucedido |
| `SNAPSHOT_SECRET` | Token secreto para autenticar o POST vindo do Make.com |
| `BLOB_READ_WRITE_TOKEN` | Gerado automaticamente ao conectar o Vercel Blob Store |

Para desenvolvimento local, crie um arquivo `.env.local` na raiz:
```env
NEXT_PUBLIC_SNAPSHOT_URL=https://xxxx.public.blob.vercel-storage.com/snapshots/latest.json
SNAPSHOT_SECRET=liberpay-snapshot-2026-abc123
BLOB_READ_WRITE_TOKEN=...
```

---

## Endpoint da API

### `POST /api/snapshot`

Recebe o snapshot semanal do Make.com e salva (sobrescrevendo) no Vercel Blob.

**Headers obrigatórios:**
```
x-snapshot-secret: <SNAPSHOT_SECRET>
Content-Type: application/json
```

**Body esperado:**
```json
{
  "week": "2026-06-02/2026-06-08",
  "generatedAt": "2026-06-08T08:00:00.000Z",
  "ga4": {
    "visitors": 973,
    "newUsers": 758,
    "leads": 11910,
    "bySource": {},
    "topPages": []
  },
  "pipedrive": {
    "dealsCreated": 100,
    "dealsWon": 0,
    "totalValue": 0
  },
  "mailpoet": {
    "newSubscribers": 0,
    "totalSubscribers": 4604,
    "openRate": 0,
    "automationsActive": 0
  },
  "conversion": {
    "transactions": null,
    "revenue": null
  }
}
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "url": "https://xxxx.public.blob.vercel-storage.com/snapshots/latest.json",
  "weekKey": "2026-06-08"
}
```

O campo `week` deve seguir o formato `"YYYY-MM-DD/YYYY-MM-DD"` (início/fim da semana). O dashboard usa esse campo para exibir o período no header.

A cada POST, dois arquivos são salvos no Blob:
- `snapshots/latest.json` — sempre sobrescrito, usado como padrão pelo dashboard
- `snapshots/weeks/YYYY-MM-DD.json` — arquivo permanente por semana (data final do período)

### `GET /api/weeks`

Retorna a lista de semanas salvas no Blob, ordenadas da mais recente para a mais antiga.

```json
{
  "weeks": [
    { "key": "2026-06-15", "url": "https://...", "uploadedAt": "..." },
    { "key": "2026-06-08", "url": "https://...", "uploadedAt": "..." }
  ]
}
```

---

## Automação Make.com

O cenário roda toda **sexta-feira às 08:00 (America/Sao_Paulo)** e coleta automaticamente os dados da semana encerrada.

### Fluxo dos Módulos

Ordem real de execução (números de módulo não são sequenciais — mudam conforme módulos são inseridos; sempre confirmar pelo flowchart no Make antes de referenciar em fórmulas):

| # | Módulo | Tipo | Função |
|---|--------|------|--------|
| 1 | Google Analytics 4 | Trigger/Schedule | Inicia o cenário no agendamento (sexta 08h) |
| 9 | Google Analytics 4 — Generate a Report | Search | Sessions/newUsers da semana (dimensão `yearMonth`, 1 bundle único) |
| 33 | Google Analytics 4 — Generate a Report | Search | `eventCount` filtrado por `Event name` = `lead_created` (Dimension Filter) — **fonte real de `ga4.leads`** |
| 23 | Google Analytics 4 — Generate a Report | Search | Sessões por canal (`sessionDefaultChannelGroup`) dos últimos 7 dias |
| 24 | Tools — Text Aggregator | Aggregator | Consolida os bundles de canal (módulo 23) em string JSON para `ga4.bySource` |
| 11 | Pipedrive CRM — List Deals | Search | Deals criados na semana (filtro custom `DashboardAutomação`, limit 1000) |
| 12 | Array aggregator | Aggregator | Consolida a lista de deals em 1 bundle — total via `__IMTAGGLENGTH__` |
| 13 | HTTP | Action | GET na API REST do MailPoet (`/subscribers`) para total de assinantes |
| 25 | Tools | Action | Etapa intermediária para o bloco de automações do MailPoet |
| 31 | HTTP | Action | GET na API REST do MailPoet (`/automations`) |
| 32 | Tools | Action | Calcula `totalSent`/`totalOpened`/`openRate` a partir do módulo 31 (filtro client-side — MailPoet ignora `filter[...]` na API) |
| 14 | HTTP | Action | POST em `/api/snapshot` com todos os dados |

> Módulos 25/31/32 documentados no nível de função; a sintaxe exata das fórmulas usadas neles e o mapeamento final no módulo 14 para `mailpoet.openRate`/`automationsActive` precisam ser confirmados contra a config atual no Make (cole o body atual do módulo 14 para eu fechar essa parte da tabela com precisão).

### Configuração do Módulo 9 — GA4 Report

| Campo | Valor |
|-------|-------|
| Dimension | `yearMonth` (retorna 1 bundle — evita cascata nos módulos seguintes) |
| Metrics | `sessions`, `newUsers`, `eventCount` |
| Date Range | Últimos 7 dias |

> **Por que `yearMonth` como dimensão?** Usar `sessionDefaultChannelGroup` retorna 1 bundle por canal (até 9), fazendo o Pipedrive e MailPoet executarem 9 vezes. A dimensão `yearMonth` agrega tudo em 1 único bundle.
>
> O `eventCount` deste módulo soma **todos os eventos do site** (cliques, scroll, page_view etc.), não só leads — por isso não é mais usado para `ga4.leads`. Esse campo foi substituído pelo módulo 33 (abaixo). Mantido aqui só por compatibilidade; pode ser removido das Metrics se não houver mais nenhum uso.

### Configuração do Módulo 33 — GA4 Report (Leads)

| Campo | Valor |
|-------|-------|
| Dimensions | `Event name` |
| Metrics | `eventCount` |
| Date Range | Últimos 7 dias |
| Advanced settings → Dimension Filter | `Event name` `exactly matches` `lead_created` |

Módulo separado do 9 (não reaproveitado) para não fragmentar o bundle único do 9 em vários bundles por evento — outros campos do body (`{{9.sessions}}`, `{{9.newUsers}}`) dependem do 9 continuar retornando exatamente 1 bundle.

> **Atenção ao inserir módulos novos no meio do fluxo:** o Make não conecta a saída automaticamente — se o módulo ficar "solto" (sem seta de conexão para o próximo), os módulos seguintes perdem a referência aos anteriores (erro "references inaccessible module") e tudo após o módulo solto é pulado na execução. Sempre arrastar a conexão manualmente depois de inserir.

### Configuração do Módulo 11 — Pipedrive List Deals

| Campo | Valor |
|-------|-------|
| Filter | `DashboardAutomação` (filtro custom, 2 condições AND em "Negócio criado em": `é exatamente em ou após` `1 semana atrás` E `é exatamente em ou antes de` `hoje` — datas relativas, recalculam a cada execução) |
| Limit | 1000 |

O módulo 12 (Array aggregator) conta o total com `__IMTAGGLENGTH__`.

> **Por que não usar o filtro fixo "última semana" do Pipedrive?** Os filtros prontos do Pipedrive (ex: "semana passada") usam semana de calendário fixa, não uma janela rolante dos últimos 7 dias — não bate com o período real exibido no dashboard. Por isso o filtro é custom, com datas relativas.
>
> **Sinal de alerta:** se o número de deals retornado bater exatamente com o `Limit` configurado, é sinal de que o filtro de data não está sendo aplicado (estava assim antes desta correção: 100 deals = Limit, não a contagem real da semana).

### Configuração do Módulo 13 — MailPoet REST API

| Campo | Valor |
|-------|-------|
| URL | `https://liberpay.com/wp-json/mailpoet/v1/subscribers?limit=1` |
| Method | GET |
| Authorization | WordPress Application Password (usuário:senha\_de\_aplicativo) |

O total de assinantes está em `Data.data.meta.count` na resposta.

### Mapeamento de Variáveis no Módulo 14 (body do POST)

| Campo JSON | Variável Make (usar picker `{{`) |
|------------|----------------------------------|
| `ga4.visitors` | `9. Sessions` |
| `ga4.newUsers` | `9. New users` |
| `ga4.leads` | `33. Event count` |
| `ga4.bySource` | `24.` (string JSON consolidada pelo Text Aggregator) |
| `pipedrive.dealsCreated` | `12. __IMTAGGLENGTH__` |
| `pipedrive.dealsWon` | ainda hardcoded `0` — não filtrado/calculado |
| `pipedrive.totalValue` | ainda hardcoded `0` — não filtrado/calculado |
| `mailpoet.totalSubscribers` | `13. Data: data: meta: count` |
| `mailpoet.newSubscribers` | enviado como `0` no body — o valor exibido no dashboard é recalculado client-side em `EmailStats.tsx` a partir do delta entre `mailpoet.totalSubscribers` e `previousWeek.mailpoet.totalSubscribers` |
| `mailpoet.openRate` | calculado no módulo 32 a partir do módulo 31 — caminho exato pendente de confirmação |
| `mailpoet.automationsActive` | calculado nos módulos 25/31/32 — caminho exato pendente de confirmação |

> **Atenção ao campo body do módulo HTTP:** O campo de body deve estar em modo texto (não "A"/structured). Se o ícone "A" aparecer no campo, clique nele para alternar para modo texto antes de colar o JSON.

> **Use sempre o variable picker:** Digitar os caminhos manualmente (ex: `{{13.Data.data.meta.count}}`) causa erros. Clique em `{{` para abrir o seletor, navegue pela árvore do módulo e clique no campo desejado.

### Campos com Datas Dinâmicas

Para que `week` e `generatedAt` reflitam a semana real (em vez de valores fixos), use as funções de data do Make no corpo do módulo 14:

```
"week": "{{formatDate(addDays(now; -7); "YYYY-MM-DD")}}/{{formatDate(now; "YYYY-MM-DD")}}"
"generatedAt": "{{formatDate(now; "YYYY-MM-DDTHH:mm:ss.000Z")}}"
```

---

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

Sem `NEXT_PUBLIC_SNAPSHOT_URL` definido, o dashboard carrega automaticamente os dados de `public/data/mock.json` como fallback.

---

## Deploy

O deploy é feito via Vercel CLI (contorna restrições de conta no git push):

```bash
npx vercel --prod --yes
```

---

## Status das Integrações

| Fonte | Status | Campos |
|-------|--------|--------|
| Google Analytics 4 | Ativo | `visitors`, `newUsers`, `leads` (filtrado por `lead_created`, módulo 33) |
| Pipedrive CRM | Ativo | `dealsCreated` (filtro de data real, módulo 11) |
| Pipedrive CRM | Hardcoded em 0 | `dealsWon`, `totalValue` — não filtrado/calculado ainda |
| MailPoet | Ativo | `totalSubscribers`, `newSubscribers` (calculado client-side via `previousWeek`), `openRate`, `automationsActive` |
| Origem dos visitantes | Ativo | `ga4.bySource` — módulo GA4 com dimensão `sessionDefaultChannelGroup` + Text Aggregator |
| Conversão LiberPay | Aguardando dev | `conversion.transactions`, `conversion.revenue` — integração pendente com a plataforma de pagamentos (dev Steven) |
| Jornada do cliente (User ID → origem → conversão) | Não iniciado | Não existe nenhum campo no schema atual para isso — ver seção "Limitações conhecidas" abaixo |

---

## Histórico e Navegação por Semanas

O ícone de calendário na sidebar abre um painel com todas as semanas salvas. Clicar em uma semana atualiza o dashboard com os dados daquele período via URL param (`?week=YYYY-MM-DD`). O servidor busca o arquivo correspondente no Blob e renderiza os dados sem recarregar a página inteira.

O histórico cresce automaticamente a cada execução semanal do Make.com — nenhuma configuração adicional é necessária.

---

## Exportação

O ícone de download na sidebar oferece duas opções:

| Formato | Como funciona |
|---------|--------------|
| **PDF** | `window.print()` com CSS de impressão que oculta sidebar, remove backgrounds e formata para A4 paisagem |
| **CSV** | Gerado client-side com BOM UTF-8 (compatível com Excel e Google Sheets) |

O painel de exportação é fechado automaticamente antes de abrir o diálogo de impressão para garantir que o PDF capture apenas o conteúdo do dashboard.

---

## Comparativo Semanal

O card "Comparativo Semanal" exibe a variação em relação à semana anterior. Esse dado acumulará automaticamente conforme as execuções semanais ocorrem — as primeiras semanas mostrarão "—" até haver histórico suficiente para comparação.

---

## Limitações Conhecidas

O dashboard hoje mostra **métricas agregadas por semana e por canal** (`ga4.bySource`), não jornada individual de usuário. Não existe nenhum campo no schema (`types/snapshot.ts`) nem no pipeline do Make para:

- Capturar um GA4 User ID / client ID persistente por visitante;
- Associar esse ID à origem de aquisição (Instagram, Facebook, Google etc.) no momento do clique/lead;
- Casar esse mesmo ID com o evento de conversão real dentro da plataforma LiberPay.

Isso é um pedido separado e maior do que o dashboard atual (rastreamento de jornada/atribuição ponta a ponta), que exigiria uma arquitetura nova — captura de ID no formulário do site, campo custom no Pipedrive, e coordenação com o dev da LiberPay para expor o evento de conversão com o mesmo ID. Não está implementado em nenhuma camada deste projeto.
