# Dashboard: design

**Data:** 2026-11-03
**Status:** aprovado em conversa; aguardando revisão da spec escrita

## 1. Contexto

A aba `/app` é a primeira tela depois do login e hoje só mostra "O conteúdo do dashboard está em construção". A Agenda já lista os agendamentos de um dia, mas não responde "o que eu faço agora?": qual é o próximo atendimento, o que falta confirmar, o que ficou sem baixa e quem da equipe está livre.

O agendamento não guarda o preço: qualquer soma em R$ teria que usar o preço atual do serviço, e um reajuste mudaria o histórico.

## 2. Objetivo e critérios de sucesso

Quem usa é o salão (dono ou recepção), ao abrir o app ao longo do dia. O foco é a **operação do dia**; indicadores por semana ou mês ficam fora.

Sucesso:
- abrir o app e ver, sem rolar muito, o próximo atendimento e agir sobre ele (confirmar, concluir, chamar no WhatsApp);
- ver quantos atendimentos o dia tem e quanto vale em R$, previsto e realizado;
- encontrar e resolver as pendências (a confirmar e atrasados) com um toque cada;
- saber quem da equipe está atendendo, livre ou fora do expediente agora;
- o valor de um agendamento não muda quando o serviço é reajustado.

## 3. Escopo

**Entra:**
1. Preço gravado no agendamento (migração V3).
2. Endpoint `GET /api/dashboard/today`.
3. Tela `/app` com cinco blocos: cabeçalho, próximo atendimento, resumo do dia, pendências e equipe hoje.
4. Agenda aceitando a data inicial pela URL (`/app/agenda?data=aaaa-mm-dd`).

**Fica fora:** indicadores por semana ou mês, ranking de serviços e profissionais, gráficos, filtro por profissional, notificações push.

## 4. Decisões

| Decisão | Escolha |
|---|---|
| Foco da tela | Operação do dia |
| Onde montar os dados | **Backend**, num endpoint agregado, com o "agora" do `Clock` do salão |
| Valor em R$ | Preço **gravado no agendamento** na criação; os existentes recebem o preço atual do serviço |
| Janela dos atrasados | Últimos **7 dias** |
| Janela do "a confirmar" | De agora até o fim de amanhã |
| Itens por lista de pendência | No máximo 20, com o total real ao lado |
| Atualização da tela | A cada 60 s e quando a aba volta ao foco |

## 5. Backend

### 5.1 Preço no agendamento

- Migração `V3__preco_no_agendamento.sql`: adiciona `price numeric(38, 2)` em `appointments` (mesmo tipo de `services.price`), preenche com o preço atual do serviço de cada agendamento (`UPDATE … FROM services`) e passa a coluna para `NOT NULL`.
- `Appointment` ganha o campo `price` (`BigDecimal`, `nullable = false`).
- `AppointmentService.create` grava `service.getPrice()` no agendamento.

### 5.2 `GET /api/dashboard/today`

Autenticado (JWT), restrito ao salão do token. "Hoje" é `LocalDate.now(clock)` e "agora" é `LocalDateTime.now(clock)`, no fuso `app.timezone` (`America/Sao_Paulo`).

```json
{
  "date": "2026-11-03",
  "salonName": "Salão da Maria",
  "summary": {
    "total": 12, "completed": 4, "toConfirm": 3, "canceled": 1,
    "expectedRevenue": 640.00, "realizedRevenue": 210.00
  },
  "next": {
    "id": "…", "customerName": "Maria", "customerPhone": "5586999990000",
    "serviceName": "Corte", "professionalName": "Carlos",
    "startTime": "2026-11-03T10:00:00", "endTime": "2026-11-03T10:30:00",
    "status": "CONFIRMED", "inProgress": false
  },
  "pending": {
    "toConfirm": [ { "id": "…", "customerName": "…", "serviceName": "…", "professionalName": "…",
                     "startTime": "…", "endTime": "…", "status": "PENDING" } ],
    "toConfirmTotal": 3,
    "overdue": [ … ],
    "overdueTotal": 1
  },
  "team": [
    { "professionalId": "…", "name": "Carlos", "appointmentsToday": 5,
      "state": "BUSY", "currentUntil": "10:30", "nextAt": "11:00" }
  ]
}
```

`next` é `null` quando não há próximo atendimento. `currentUntil` só vem com `state = BUSY`; `nextAt` é `null` quando o profissional não tem mais atendimentos hoje.

### 5.3 Regras

Considera-se **em aberto** o agendamento em `PENDING` ou `CONFIRMED`.

1. **Resumo** (agendamentos com início hoje):
   - `total`: não cancelados; `canceled`: cancelados; `completed`: `COMPLETED`; `toConfirm`: `PENDING`;
   - `expectedRevenue`: soma de `price` dos não cancelados; `realizedRevenue`: soma de `price` dos `COMPLETED`.
2. **Próximo atendimento:** entre os agendamentos de hoje em aberto com `fim > agora`, o de início mais cedo (empate pelo nome do cliente). Inclui o que está em andamento ou atrasado sem baixa. `inProgress = início ≤ agora < fim` (vale para todo item da resposta; um atrasado nunca aparece como em andamento).
3. **Pendências:**
   - *A confirmar:* `PENDING` com `início ≥ agora` e início antes do fim de amanhã (meia-noite de depois de amanhã, exclusivo).
   - *Atrasados:* em aberto com `fim ≤ agora` e início a partir de hoje − 7 dias, meia-noite.
   - Cada lista ordenada por início, limitada a 20 itens; `toConfirmTotal` e `overdueTotal` trazem a contagem completa.
4. **Equipe:** profissionais ativos, ordenados por nome (`findByActiveTrueOrderByNameAsc`). Para cada um:
   - `appointmentsToday`: agendamentos não cancelados com início hoje;
   - `BUSY` se há agendamento em aberto com `início ≤ agora < fim`; `currentUntil` é o fim dele;
   - senão `FREE` se agora está dentro do expediente de hoje (interseção salão × profissional);
   - senão `OFF`;
   - `nextAt`: início do próximo agendamento em aberto de hoje com `início > agora`.

### 5.4 Organização

- `DashboardService` (novo, `@Transactional(readOnly = true)`) monta a resposta; `DashboardController` em `/api/dashboard`.
- Uma consulta busca os agendamentos com início em [hoje − 7 dias, depois de amanhã), em todos os status, com `JOIN FETCH` de cliente, serviço e profissional (evita N+1); os blocos são montados em memória a partir dela. Outras duas buscam o salão e os profissionais ativos.
- O expediente reaproveita a regra do `AvailabilityService`: o `workingWindow` privado passa a ter um método público (ex.: `isWithinWorkingHours(tenant, professional, dateTime)`), sem duplicar a interseção.
- DTOs: `DashboardResponse`, `DaySummaryDto`, `DashboardAppointmentDto` (o `next` usa o mesmo DTO com `customerPhone` e `inProgress`) e `TeamMemberDto`.

### 5.5 Erros

| Situação | Status |
|---|---|
| Sem token ou token inválido | 403 (comportamento atual do Spring Security para rotas protegidas) |
| Salão do token não encontrado | 422 (`BusinessException`, como no `AvailabilityService`) |

## 6. Frontend

### 6.1 Tela `/app`

Mobile-first, um bloco abaixo do outro:

1. **Cabeçalho:** "Bom dia / Boa tarde / Boa noite, <salonName>" (pela hora do aparelho) e a data por extenso (*terça, 3 de novembro*).
2. **Próximo atendimento:** cartão em destaque com horário, cliente, serviço e profissional; selo "Em andamento" quando `inProgress`. Ações: **Confirmar** (se `PENDING`), **Concluir** e **WhatsApp** (abre `https://wa.me/<customerPhone>` em nova aba). Sem próximo: "Nenhum atendimento restante hoje" com o botão **Novo agendamento**, que leva à Agenda.
3. **Resumo do dia:** grade 2×2 (Atendimentos, Concluídos, A confirmar, Cancelados) e a linha "Previsto R$ 640,00 · Realizado R$ 210,00".
4. **Pendências:** seções "A confirmar" e "Atrasados". Cada item mostra dia e hora, cliente e serviço, com ação de um toque: **Confirmar** (a confirmar) ou **Concluir** e **Cancelar** (atrasados). Com total acima de 20, "e mais N". Sem pendências, o bloco vira "Tudo em dia ✓".
5. **Equipe hoje:** uma linha por profissional com nome, ponto de estado (verde livre, âmbar atendendo, cinza fora) e texto: "Atendendo até 10:30", "Livre · próximo às 11:00", "Livre", "Fora do expediente". À direita, "5 hoje".

Tocar no cartão do próximo ou num item de pendência leva para `/app/agenda?data=<dia do agendamento>`.

### 6.2 Agenda pela URL

`AgendaPage` lê `data` da query string (formato `aaaa-mm-dd`, convertido para data local) como dia inicial; valor ausente ou inválido usa hoje. Trocar de dia na Agenda não precisa atualizar a URL.

### 6.3 Dados e ações

- `dashboardApi.today()` via React Query, chave `['dashboard']`, `refetchInterval: 60_000` e `refetchOnWindowFocus: true`.
- Ações usam o `PATCH /api/appointments/{id}/status` existente (`appointmentsApi.updateStatus`) com as mesmas mensagens de toast da Agenda. No sucesso, invalidam `['dashboard']` e `['appointments', dia do agendamento]`.
- **Cancelar** pede confirmação pelo `ConfirmDialog`; confirmar e concluir são diretos, como no card da Agenda.
- Na Agenda, mudar status e criar agendamento passam a invalidar também `['dashboard']`.
- Carregando: esqueleto dos blocos. Erro: `LoadError` com "Tentar de novo".

### 6.4 Componentes

- `modules/dashboard/api/dashboard.ts`: tipos e chamada.
- `modules/dashboard/components/`: `NextAppointmentCard`, `DaySummary`, `PendingList`, `TeamToday`.
- `dashboard-page.tsx` monta os blocos e concentra as mutações.
- `shared/utils`: `formatCurrency` (`Intl.NumberFormat('pt-BR', { currency: 'BRL' })`) e `whatsappLink(phone)`; `fromApiDate` em `date.ts` para ler `aaaa-mm-dd` como data local.

## 7. Testes

**Backend, unitários (`DashboardService`, `Clock` fixo):** resumo e valores (cancelado fora do previsto, só concluídos no realizado); próximo em andamento, futuro, atrasado sem baixa e inexistente; "a confirmar" até o fim de amanhã e não depois; atrasados dentro e fora dos 7 dias; limite de 20 com total real; estados `BUSY`, `FREE` e `OFF`, incluindo salão aberto com profissional fechado no dia; `nextAt` nulo sem próximos.

**Backend, integração:** migração V3 roda no H2 (o backfill é conferido à mão no PostgreSQL local, que tem dados); agendamento criado grava o preço e mantém o valor depois de reajustar o serviço; `GET /api/dashboard/today` sem token dá 403; `TenantIsolationIntegrationTest` garante que o dashboard de um salão não conta agendamentos nem profissionais do outro.

**Frontend:** Vitest para `formatCurrency`, `whatsappLink` e `fromApiDate`. Os blocos são verificados no navegador.

## 8. Riscos

- **Backfill do preço:** usa o preço atual do serviço, então agendamentos antigos de serviços já reajustados ficam com o valor novo. Aceito: hoje não existe outro registro do preço antigo.
- **Fuso:** o servidor decide o "agora" pelo fuso do salão; o cabeçalho usa a hora do aparelho só para a saudação. Um aparelho em outro fuso vê a saudação diferente, mas os blocos corretos.
- **Atrasados acumulando:** salões que não dão baixa veem até 7 dias de atrasados; o limite de 20 itens mantém a tela curta.
