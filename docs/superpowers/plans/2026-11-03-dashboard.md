# Dashboard: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a aba `/app` mostra a operação do dia (próximo atendimento, resumo com R$, pendências e equipe) e permite agir sobre cada item com um toque.

**Architecture:** o agendamento passa a gravar o preço do serviço (migração V3). Um `DashboardService` só de leitura busca numa consulta os agendamentos de hoje − 7 dias até o fim de amanhã e monta os blocos em memória, com o "agora" do `Clock` do salão; o expediente reaproveita a interseção do `AvailabilityService`. O front consome `GET /api/dashboard/today` via React Query e reaproveita o `PATCH` de status da Agenda.

**Tech Stack:** Java 21+/Spring Boot 3.4.1, Spring Data JPA, Flyway, PostgreSQL (H2 modo PostgreSQL nos testes), JUnit 5 + Mockito; React 19, TanStack Query 5, React Router, Tailwind 4, Vitest.

**Spec:** [`docs/superpowers/specs/2026-11-03-dashboard-design.md`](../specs/2026-11-03-dashboard-design.md)

## Global Constraints

- "Hoje" é `LocalDate.now(clock)` e "agora" é `LocalDateTime.now(clock)`, com o `Clock` do `TimeConfig` (fuso `app.timezone`, `America/Sao_Paulo`). Nada de `LocalDateTime.now()` sem clock.
- Em aberto = `PENDING` ou `CONFIRMED`.
- Janela dos atrasados: início a partir de **hoje − 7 dias, 00:00**. Janela do "a confirmar": início em **[agora, depois de amanhã 00:00)**.
- Listas de pendência: no máximo **20** itens cada, com o total real em `toConfirmTotal` / `overdueTotal`.
- Valores em R$: `BigDecimal`, coluna `price numeric(38, 2)`, igual a `services.price`.
- Toda leitura passa pelo filtro de tenant; busca do salão atual com `tenantRepository.findById(TenantContext.getCurrentTenant())` e `BusinessException("Tenant atual não encontrado.")` se ausente (padrão do `AvailabilityService`).
- Front: chave React Query `['dashboard']`, `refetchInterval: 60_000`, `refetchOnWindowFocus: true`. Datas da API `aaaa-mm-dd` no fuso local; nunca `toISOString()`.
- Avisos com `toast`; cancelar pede `ConfirmDialog`. Textos em pt-BR.
- Migrações nunca editam V1/V2; tudo novo vai em `V3__preco_no_agendamento.sql`.

## Review Focus

- **Agendamento que atravessa "agora" e já foi concluído:** profissional que concluiu antes do fim fica `FREE`, não `BUSY`. Teste na Tarefa 2 (`completedAppointmentDoesNotMakeProfessionalBusy`).
- **Atendimento das 23:30 de ontem ainda aberto:** entra em atrasados, não em "próximo" (que é só de hoje). Teste na Tarefa 2 (`yesterdayOpenAppointmentIsOverdueNotNext`).
- **Salão sem profissionais ativos e sem agendamentos:** resposta 200 com zeros, `next: null`, listas vazias, `team: []`. Teste na Tarefa 3.
- **`?data=` malformado ou ausente na Agenda:** abre em hoje, sem quebrar a tela. Teste na Tarefa 4 (`fromApiDate`).
- **Cliente sem telefone válido ou com telefone curto:** o link do WhatsApp usa só dígitos; telefone vazio não mostra o botão. Teste na Tarefa 4 (`whatsappLink`).

---

## File Structure

**Backend** (`backend/src/main/java/com/agenda/api/`)

| Arquivo | Responsabilidade |
|---|---|
| `resources/db/migration/V3__preco_no_agendamento.sql` (novo) | coluna `price`, backfill e `NOT NULL` |
| `model/Appointment.java`, `service/AppointmentService.java` | campo `price`, gravado na criação |
| `service/AvailabilityService.java` | método público `isWithinWorkingHours` |
| `repository/AppointmentRepository.java` | `findWithDetailsBetween` com `JOIN FETCH` |
| `dto/dashboard/*.java` (novos, records) | contrato da resposta |
| `service/DashboardService.java` (novo) | regras dos blocos |
| `controller/DashboardController.java` (novo) | `GET /api/dashboard/today` |

**Frontend** (`frontend/src/`)

| Arquivo | Responsabilidade |
|---|---|
| `shared/utils/date.ts`, `shared/utils/currency.ts` (novo), `shared/utils/phone.ts` (+ testes) | `fromApiDate`, `formatCurrency`, `whatsappLink` |
| `modules/agenda/pages/agenda-page.tsx` | dia inicial por `?data=`; invalida `['dashboard']` |
| `modules/dashboard/api/dashboard.ts` (novo) | tipos e chamada |
| `modules/dashboard/components/*.tsx` (novos) | um componente por bloco |
| `modules/dashboard/pages/dashboard-page/dashboard-page.tsx` | monta os blocos e as mutações |

---

### Task 1: Preço gravado no agendamento

**Files:**
- Create: `backend/src/main/resources/db/migration/V3__preco_no_agendamento.sql`
- Modify: `backend/src/main/java/com/agenda/api/model/Appointment.java`, `backend/src/main/java/com/agenda/api/service/AppointmentService.java` (método `create`)
- Test: `backend/src/test/java/com/agenda/api/controller/AppointmentIntegrationTest.java`, `backend/src/test/java/com/agenda/api/service/AppointmentServiceTest.java`

**Interfaces:**
- Produces: `Appointment.getPrice(): BigDecimal` / `setPrice(BigDecimal)`, coluna `price` não nula. Tarefa 2 soma esse campo.

- [x] **Step 1: Testes que falham.**
  - `AppointmentServiceTest.shouldStoreServicePriceOnCreate`: serviço com `price = new BigDecimal("45.00")` → o `Appointment` capturado no `save` tem `price` igual a `45.00`.
  - `AppointmentIntegrationTest.priceIsKeptAfterServiceIsRepriced`: cria agendamento com serviço de `50.00`, faz `PUT /api/services/{id}` com `price = 80.00`, lê `select price from appointments where id = ?` via `JdbcTemplate` (autowired) → `50.00`.
- [x] **Step 2: Rodar e ver falhar:** `./mvnw test -Dtest='AppointmentServiceTest,AppointmentIntegrationTest'` → falha de compilação (`setPrice` inexistente) ou coluna ausente.
- [x] **Step 3: Implementar.**
  - V3, em SQL que roda no PostgreSQL e no H2 modo PostgreSQL (subconsulta correlacionada, sem `UPDATE … FROM`):
    ```sql
    ALTER TABLE appointments ADD COLUMN price numeric(38, 2);
    UPDATE appointments SET price = (SELECT s.price FROM services s WHERE s.id = appointments.service_id);
    ALTER TABLE appointments ALTER COLUMN price SET NOT NULL;
    ```
    Com um comentário de uma linha no topo, no estilo do V2 ("Preço do serviço no momento do agendamento; os existentes recebem o preço atual.").
  - `Appointment`: `@Column(nullable = false, precision = 38, scale = 2) private BigDecimal price;` com getter/setter.
  - `AppointmentService.create`: `appointment.setPrice(service.getPrice());` junto dos outros setters.
- [x] **Step 4: Rodar a suíte inteira:** `./mvnw test` → verde (o `ddl-auto: validate` dos testes confirma que entidade e migração batem).
- [x] **Step 5: Verificar o backfill no PostgreSQL local** (o H2 dos testes começa vazio): com o Docker de pé e agendamentos existentes, `./mvnw spring-boot:run` aplica a V3; `docker compose exec db psql -U postgres -d agendadb -c "select count(*) from appointments where price is null"` → `0`.
- [x] **Step 6: Commit:** `feat: agendamento guarda o preço do serviço (V3)`

---

### Task 2: `DashboardService`: regras dos blocos

**Files:**
- Modify: `backend/src/main/java/com/agenda/api/service/AvailabilityService.java`, `backend/src/main/java/com/agenda/api/repository/AppointmentRepository.java`
- Create: `backend/src/main/java/com/agenda/api/dto/dashboard/DashboardResponse.java`, `DaySummaryDto.java`, `DashboardAppointmentDto.java`, `PendingDto.java`, `TeamMemberDto.java`, `TeamMemberState.java`
- Create: `backend/src/main/java/com/agenda/api/service/DashboardService.java`
- Test: `backend/src/test/java/com/agenda/api/service/DashboardServiceTest.java` (novo), `AvailabilityServiceTest.java`

**Interfaces:**
- Consumes: `Appointment.getPrice()` (Tarefa 1).
- Produces:
  - `AvailabilityService.isWithinWorkingHours(Tenant tenant, Professional professional, LocalDateTime moment): boolean` — `true` se o expediente do dia (o `workingWindow` existente) existe e `open ≤ moment.toLocalTime() < close`.
  - `AppointmentRepository.findWithDetailsBetween(LocalDateTime start, LocalDateTime end): List<Appointment>` — todos os status, início em `[start, end)`, `JOIN FETCH` de `customer`, `service` e `professional`, `ORDER BY a.startTime ASC, a.customer.name ASC`.
  - Records (pacote `com.agenda.api.dto.dashboard`, `@JsonFormat` como no `AvailableSlotResponse`):
    - `DashboardResponse(LocalDate date, String salonName, DaySummaryDto summary, DashboardAppointmentDto next, PendingDto pending, List<TeamMemberDto> team)`
    - `DaySummaryDto(int total, int completed, int toConfirm, int canceled, BigDecimal expectedRevenue, BigDecimal realizedRevenue)`
    - `DashboardAppointmentDto(UUID id, String customerName, String customerPhone, String serviceName, String professionalName, LocalDateTime startTime, LocalDateTime endTime, AppointmentStatus status, boolean inProgress)` — `customerPhone` preenchido sempre (o front só usa no `next`).
    - `PendingDto(List<DashboardAppointmentDto> toConfirm, int toConfirmTotal, List<DashboardAppointmentDto> overdue, int overdueTotal)`
    - `TeamMemberDto(UUID professionalId, String name, int appointmentsToday, TeamMemberState state, @JsonFormat(pattern = "HH:mm") LocalTime currentUntil, @JsonFormat(pattern = "HH:mm") LocalTime nextAt)`
    - `enum TeamMemberState { BUSY, FREE, OFF }`
  - `DashboardService(TenantRepository, ProfessionalRepository, AppointmentRepository, AvailabilityService, Clock)` com `@Transactional(readOnly = true) DashboardResponse today()`.

- [x] **Step 1: Teste que falha em `AvailabilityServiceTest`:** `isWithinWorkingHoursUsesIntersection` — salão 8h–18h, profissional 10h–14h na segunda: 09:59 → `false`, 10:00 → `true`, 13:59 → `true`, 14:00 → `false`; sábado (salão fechado) 11:00 → `false`.
- [x] **Step 2: Testes que falham em `DashboardServiceTest`** (Mockito, `Clock.fixed` em segunda `2026-10-12T10:00` no fuso `America/Sao_Paulo`, salão 8h–18h seg–sex como no `AvailabilityServiceTest`; `findWithDetailsBetween` devolve a lista montada no teste; `AvailabilityService` real, construído com os mesmos mocks):
  - `summaryCountsAndRevenue`: hoje 1 `PENDING` (30,00), 1 `CONFIRMED` (40,00), 1 `COMPLETED` (50,00), 1 `CANCELED` (60,00) → `total 3, completed 1, toConfirm 1, canceled 1, expectedRevenue 120.00, realizedRevenue 50.00`; agendamento de amanhã não entra no resumo.
  - `nextIsInProgressAppointment`: `CONFIRMED` 09:45–10:15 e `PENDING` 10:30 → `next` é o de 09:45 com `inProgress = true`.
  - `nextIsFutureWhenNothingInProgress`: só `PENDING` 11:00 → `next` 11:00, `inProgress = false`.
  - `nextIncludesTodayLateWithoutCompletion`: `CONFIRMED` 09:00–09:30 (fim ≤ agora) e `PENDING` 11:00 → `next` é o das 11:00 (o das 09:00 já terminou e vai para atrasados).
  - `nextIsNullWhenNothingOpenRemains`: hoje só `COMPLETED` e `CANCELED` → `next == null`.
  - `yesterdayOpenAppointmentIsOverdueNotNext`: `PENDING` ontem 17:00–17:30 → em `overdue`, e `next == null`.
  - `toConfirmUntilEndOfTomorrow`: `PENDING` hoje 11:00, amanhã 17:00 e depois de amanhã 08:00 → `toConfirm` tem os dois primeiros, `toConfirmTotal 2`; `PENDING` hoje 09:00 (já começou) não entra em `toConfirm`.
  - `overdueWithinSevenDays`: `CONFIRMED` terminado há 7 dias às 08:00 entra; um de 8 dias atrás não (a consulta já não traz, mas o teste devolve-o e confirma o filtro); `COMPLETED` passado não entra.
  - `pendingListsCappedAtTwentyWithTotal`: 25 `PENDING` futuros até amanhã → `toConfirm.size() == 20`, `toConfirmTotal == 25`, em ordem de início.
  - `teamStates`: profissionais "Ana" (com `CONFIRMED` 09:45–10:15), "Bruno" (sem agendamento, expediente normal) e "Carla" (configuração própria fechada na segunda) → Ana `BUSY` com `currentUntil 10:15`, Bruno `FREE`, Carla `OFF`; lista ordenada por nome.
  - `completedAppointmentDoesNotMakeProfessionalBusy`: Ana com `COMPLETED` 09:45–10:15 → `FREE`.
  - `teamNextAtAndCount`: Bruno com `PENDING` 11:00, `CONFIRMED` 14:00 e `CANCELED` 15:00 hoje → `appointmentsToday 2`, `nextAt 11:00`; sem agendamentos futuros → `nextAt null`.
  - `queriesFromSevenDaysAgoUntilDayAfterTomorrow`: verifica `findWithDetailsBetween(2026-10-05T00:00, 2026-10-14T00:00)`.
- [x] **Step 3: Rodar e ver falhar:** `./mvnw test -Dtest='AvailabilityServiceTest,DashboardServiceTest'` → falha de compilação.
- [x] **Step 4: Implementar.** Expor `isWithinWorkingHours` em cima do `workingWindow` existente (sem duplicar a interseção). No `DashboardService`, uma chamada a `findWithDetailsBetween(hoje − 7d 00:00, hoje + 2d 00:00)`, outra a `findByActiveTrueOrderByNameAsc()` e uma ao salão; o restante são filtros em memória seguindo a seção 5.3 da spec. O profissional `BUSY` ganha prioridade sobre `FREE`/`OFF` (atendimento em andamento fora do expediente ainda é `BUSY`).
- [x] **Step 5: Rodar:** `./mvnw test -Dtest='AvailabilityServiceTest,DashboardServiceTest'` → verde.
- [x] **Step 6: Commit:** `feat: DashboardService com resumo, próximo, pendências e equipe`

---

### Task 3: Endpoint `GET /api/dashboard/today`

**Files:**
- Create: `backend/src/main/java/com/agenda/api/controller/DashboardController.java`
- Test: `backend/src/test/java/com/agenda/api/controller/DashboardIntegrationTest.java` (novo), `TenantIsolationIntegrationTest.java`
- Modify: `README.md` (linha "Dashboard" na tabela da API)

**Interfaces:**
- Consumes: `DashboardService.today(): DashboardResponse` (Tarefa 2).
- Produces: `GET /api/dashboard/today` → 200 com o JSON da seção 5.2 da spec. Tarefa 5 consome.

- [x] **Step 1: Testes que falham** em `DashboardIntegrationTest` (`@SpringBootTest(webEnvironment = RANDOM_PORT)`, `@ActiveProfiles("test")`, `ApiTestClient`). Um `@TestConfiguration` com `@Bean @Primary Clock` fixo na próxima segunda às 09:00 em `America/Sao_Paulo`, para que "hoje" seja um dia útil e dê para criar agendamentos no futuro do mesmo dia:
  - `withoutTokenIsForbidden`: `GET /api/dashboard/today` sem token → 403 (mesmo comportamento dos outros endpoints protegidos, ver `ApiInfrastructureIntegrationTest`).
  - `emptySalonReturnsZeros`: salão novo → 200, `summary.total 0`, `expectedRevenue 0`, `next null`, `pending.toConfirm []`, `team []`.
  - `showsTodaysAppointment`: profissional "Carlos", serviço de `50.00`, agendamento às 10:00 → `summary.total 1`, `toConfirm 1`, `expectedRevenue 50.0`, `next.customerName` igual ao cliente, `next.inProgress false`, `team[0].state FREE`, `team[0].nextAt "10:00"`.
  - `otherSalonDoesNotSeeTheAppointment`: salão B no mesmo cenário → `summary.total 0`, `team []`.
- [x] **Step 2: Em `TenantIsolationIntegrationTest`:** `dashboardTeamOnlyListsOwnProfessionals` — `GET /api/dashboard/today` com o token B não contém "Profissional do A" em `team`.
- [x] **Step 3: Rodar e ver falhar:** `./mvnw test -Dtest='DashboardIntegrationTest,TenantIsolationIntegrationTest'` → 404/403 onde se espera 200.
- [x] **Step 4: Implementar** `DashboardController` em `@RequestMapping("/api/dashboard")`, `@GetMapping("/today")` devolvendo `ResponseEntity.ok(dashboardService.today())`, no estilo do `AppointmentController`. Adicionar a linha `| Dashboard | GET /api/dashboard/today (operação do dia) | JWT |` no README.
- [x] **Step 5: Rodar a suíte inteira:** `./mvnw test` → verde.
- [x] **Step 6: Commit:** `feat: endpoint do dashboard do dia`

---

### Task 4: Front: utilitários e Agenda por URL

**Files:**
- Modify: `frontend/src/shared/utils/date.ts`, `frontend/src/shared/utils/phone.ts`
- Create: `frontend/src/shared/utils/currency.ts`
- Test: `frontend/src/shared/utils/date.test.ts`, `phone.test.ts`, `currency.test.ts` (novo)
- Modify: `frontend/src/modules/agenda/pages/agenda-page.tsx`

**Interfaces:**
- Produces:
  - `fromApiDate(value: string | null): Date | null` — `aaaa-mm-dd` válido vira `new Date(ano, mês − 1, dia)` (local); qualquer outro valor, `null`.
  - `formatCurrency(value: number): string` — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - `whatsappLink(apiPhone: string): string | null` — `https://wa.me/<só dígitos>`; `null` se não houver dígitos.
  - `formatWeekdayLong(date: Date): string` — "terça, 3 de novembro" (usado no cabeçalho, Tarefa 5).
  - Agenda abre em `fromApiDate(searchParams.get('data')) ?? new Date()`.

- [x] **Step 1: Testes que falham:**
  - `fromApiDate('2026-11-03')` → `getFullYear() 2026, getMonth() 10, getDate() 3, getHours() 0`; `fromApiDate('03-11-2026')`, `fromApiDate('2026-13-40')`, `fromApiDate('')` e `fromApiDate(null)` → `null`.
  - `formatCurrency(640)` → `"R$ 640,00"` (comparar após trocar o espaço não separável ` ` por espaço); `formatCurrency(0)` → `"R$ 0,00"`.
  - `whatsappLink('5586999990000')` → `'https://wa.me/5586999990000'`; `whatsappLink('+55 (86) 99999-0000')` → o mesmo; `whatsappLink('')` → `null`.
  - `formatWeekdayLong(new Date(2026, 10, 3))` → `"terça, 3 de novembro"`.
- [x] **Step 2: Rodar e ver falhar:** `cd frontend && npm test` → falham por funções inexistentes.
- [x] **Step 3: Implementar** as funções. `fromApiDate` rejeita data que não faz ida e volta (`toApiDate(resultado) !== value`), o que cobre mês 13 e dia 40. `formatWeekdayLong` usa listas próprias de dias e meses em pt-BR (como o `WEEKDAYS` existente), sem depender do locale do navegador.
- [x] **Step 4: Agenda:** `useSearchParams` do `react-router`; o `useState` inicial usa `fromApiDate(searchParams.get('data')) ?? new Date()`. O `statusMutation.onSuccess` e o `handleCreated` passam a invalidar também `['dashboard']`.
- [x] **Step 5: Rodar:** `npm test` e `npm run build` → verdes.
- [x] **Step 6: Commit:** `feat(frontend): utilitários do dashboard e Agenda abrindo no dia da URL`

---

### Task 5: Front: tela do Dashboard

**Files:**
- Create: `frontend/src/modules/dashboard/api/dashboard.ts`
- Create: `frontend/src/modules/dashboard/components/NextAppointmentCard.tsx`, `DaySummary.tsx`, `PendingList.tsx`, `TeamToday.tsx`
- Modify: `frontend/src/modules/dashboard/pages/dashboard-page/dashboard-page.tsx`

**Interfaces:**
- Consumes: `GET /api/dashboard/today` (Tarefa 3); `appointmentsApi.updateStatus` e `AppointmentStatus` de `modules/agenda/api/appointments.ts`; `formatCurrency`, `whatsappLink`, `formatWeekdayLong`, `toApiDate`, `formatPhone` (Tarefa 4 e existentes); `ConfirmDialog`, `LoadError`, `toast`, `Button` de `shared/components`.
- Produces: `dashboardApi.today(): Promise<DashboardDto>` e os tipos `DashboardDto`, `DashboardAppointment`, `TeamMember` (`state: 'BUSY' | 'FREE' | 'OFF'`), espelhando os records da Tarefa 2.

- [x] **Step 1: `dashboard.ts`:** tipos e `today()` com `apiClient.get<DashboardDto>('/dashboard/today')`.
- [x] **Step 2: Componentes**, cada um recebendo dados e callbacks por props (sem chamar a API):
  - `NextAppointmentCard({ appointment, onStatusChange, onOpen })`: horário `HH:mm–HH:mm`, cliente, serviço, profissional, selo "Em andamento" se `inProgress`. Botões **Confirmar** (só `PENDING`), **Concluir**, **WhatsApp** (link `<a target="_blank" rel="noopener noreferrer">`, oculto se `whatsappLink` der `null`). Com `appointment == null`: "Nenhum atendimento restante hoje" e botão **Novo agendamento** que navega para `/app/agenda`.
  - `DaySummary({ summary })`: grade 2×2 (Atendimentos, Concluídos, A confirmar, Cancelados) e "Previsto R$ … · Realizado R$ …".
  - `PendingList({ pending, onStatusChange, onOpen })`: seções "A confirmar" (ação **Confirmar**) e "Atrasados" (ações **Concluir** e **Cancelar**); item mostra `formatDayLabel` + hora, cliente e serviço; "e mais N" com link para `/app/agenda` quando o total passa de 20; ambas vazias → "Tudo em dia ✓".
  - `TeamToday({ team })`: ponto verde (`FREE`), âmbar (`BUSY`), cinza (`OFF`); textos exatos "Atendendo até HH:mm", "Livre · próximo às HH:mm", "Livre", "Fora do expediente"; à direita "N hoje". Lista vazia → "Nenhum profissional ativo."
- [x] **Step 3: Página:** `useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.today, refetchInterval: 60_000, refetchOnWindowFocus: true })`. Cabeçalho "Bom dia" (< 12h) / "Boa tarde" (< 18h) / "Boa noite" + `salonName` e `formatWeekdayLong(fromApiDate(data.date) ?? new Date())`. Uma `useMutation` de status com as mesmas mensagens do `STATUS_MESSAGES` da Agenda (extrair para `modules/agenda/api/appointments.ts` como `STATUS_MESSAGES` exportado e usar nas duas telas); no sucesso invalida `['dashboard']` e `['appointments', toApiDate(início)]`. **Cancelar** abre o `ConfirmDialog` antes do `PATCH`. `onOpen(appointment)` navega para `/app/agenda?data=<toApiDate(início)>`. Carregando: blocos-esqueleto (`animate-pulse`); erro: `LoadError` com `refetch`.
- [x] **Step 4: Build:** `npm run build` → sem erros de tipo.
- [x] **Step 5: Verificar no navegador** (backend e front de pé, salão com 2 profissionais, um com agendamento em andamento e outro com agendamento futuro `PENDING`): os quatro blocos aparecem; Confirmar no próximo atualiza o resumo sem recarregar; Cancelar pede confirmação; tocar numa pendência abre a Agenda no dia certo; o WhatsApp abre `wa.me` com o número; largura de 375 px sem rolagem horizontal.
- [x] **Step 6: Commit:** `feat(frontend): dashboard da operação do dia`

---

### Task 6: Fechamento

**Files:**
- Modify: `project_context.md` (rota `/api/dashboard/today`, preço no agendamento, Flyway, abas implementadas), `docs/superpowers/plans/2026-11-03-dashboard.md` (marcar os passos)

- [x] **Step 1: Suítes completas:** `cd backend && ./mvnw test` e `cd frontend && npm test && npm run build` → verdes.
- [x] **Step 2: E2E:** com o backend de pé, `.\test_api.ps1` → todas as etapas OK (o agendamento continua sendo criado com o novo campo `price`).
- [x] **Step 3: Atualizar `project_context.md`** com o estado atual (tabela de rotas, Flyway V1–V3, Dashboard) e marcar as caixas deste plano.
- [x] **Step 4: Commit:** `docs: contexto do projeto com o dashboard`
