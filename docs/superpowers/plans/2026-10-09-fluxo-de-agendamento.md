# Fluxo de agendamento: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o salão cria agendamentos reais (cliente, serviço, profissional ou "qualquer", dia e hora livres), vê a agenda do dia com dados reais e gerencia clientes numa aba própria.

**Architecture:** um `AvailabilityService` no backend concentra as regras de horário (interseção salão × profissional, grade de 30 min, passado, sobreposição, atribuição no modo "qualquer") e é usado tanto pelo endpoint de disponibilidade quanto pela criação, que trava a linha do profissional com `PESSIMISTIC_WRITE`. O front consome os endpoints novos via React Query; o painel de novo agendamento é reescrito em componentes por etapa.

**Tech Stack:** Java 21+/Spring Boot 3.4.1, Spring Data JPA, PostgreSQL (H2 nos testes), JUnit 5 + Mockito; React 19, Vite 8, TanStack Query 5, Tailwind 4, Vitest (novo).

**Spec:** [`docs/superpowers/specs/2026-10-09-fluxo-de-agendamento-design.md`](../specs/2026-10-09-fluxo-de-agendamento-design.md)

## Global Constraints

- Horário do profissional × salão: **interseção**; profissional sem configuração no dia usa o horário do salão.
- Grade de horários: **fixa de 30 min**, a partir da abertura do expediente, enquanto `início + duração ≤ fechamento`.
- "Agora" vem de um `Clock` no fuso **`America/Sao_Paulo`** (propriedade `app.timezone`).
- Busca de clientes: no máximo **50** resultados, ordenados por nome.
- Telefone guardado só com dígitos e código do país (ex.: `5586999990000`); único por salão (`tenant_id`, `phone`).
- Status HTTP: horário não livre e telefone duplicado → **409**; regra de negócio → **422** (`BusinessException`, padrão atual); validação/parâmetro inválido → **400**; id inexistente ou de outro salão → **404**; método não suportado → **405**.
- Datas trafegam como `aaaa-mm-dd` no fuso local; o front nunca usa `toISOString()` para montar datas.
- Toda busca por id de entidade de salão usa `findByIdInCurrentTenant` (ver `TenantScopedRepository`); nunca `findById`.
- Avisos no front usam `toast` (`shared/components/toast`); nada de `window.alert`.
- Textos de interface e mensagens de erro em pt-BR.
- Todo profissional ativo faz todo serviço (sem vínculo profissional ↔ serviço).

## Review Focus

- **Hoje com horas já passadas:** às 10:10, a grade de hoje começa em 10:30 e os horários de amanhã aparecem inteiros. Teste na Tarefa 3.
- **Busca de cliente sem dígitos:** buscar "ana" não pode casar todos os clientes pela cláusula de telefone (`like '%%'`). Teste na Tarefa 2.
- **Parâmetros malformados:** `date=12-10-2026`, `serviceId=abc` ou id inexistente devolvem 400/404, nunca 500. Testes nas Tarefas 1 e 4.
- **Telefone em formatos diferentes:** `(86) 99999-0000` com `+55` e `5586999990000` são o mesmo cliente; editar um cliente mantendo o próprio telefone não gera 409. Testes na Tarefa 2.
- **Nenhum profissional ativo ou dia fechado no modo "qualquer":** devolve lista vazia (200), não erro. Teste na Tarefa 3.

---

## File Structure

**Backend** (`backend/src/main/java/com/agenda/api/`)

| Arquivo | Responsabilidade |
|---|---|
| `exception/ConflictException.java` (novo) | 409, estende `BusinessException`, carrega `Map<String,String> details` |
| `exception/GlobalExceptionHandler.java` | handlers de 409, 405 e 400 (parâmetro ausente/tipo inválido) |
| `config/TimeConfig.java` (novo) | bean `Clock` no fuso `app.timezone` |
| `security/SecurityConfig.java` | remove o `permitAll` do `POST /api/appointments` |
| `model/Customer.java`, `repository/CustomerRepository.java`, `service/CustomerService.java`, `controller/CustomerController.java` | busca, edição, telefone normalizado e único |
| `service/AvailabilityService.java` (novo) + `dto/AvailableSlotResponse.java` (novo) | regras de horário |
| `repository/AppointmentRepository.java`, `repository/ProfessionalRepository.java` | consultas do dia e trava |
| `service/AppointmentService.java`, `controller/AppointmentController.java` | agenda por dia, disponibilidade, criação com trava, status final |

**Frontend** (`frontend/src/`)

| Arquivo | Responsabilidade |
|---|---|
| `shared/utils/date.ts`, `shared/utils/phone.ts` (+ `*.test.ts`) | data local `aaaa-mm-dd`; máscara e conversão de telefone |
| `modules/customers/api/customers.ts` (novo) | cliente HTTP de clientes |
| `modules/customers/components/CustomerForm.tsx` (novo) | formulário único de cliente (completo ou curto) |
| `modules/customers/components/CustomerFormSheet.tsx` (novo), `modules/customers/pages/customers-page.tsx` | aba Clientes |
| `modules/agenda/api/appointments.ts` (novo) | cliente HTTP de agendamentos |
| `modules/agenda/pages/agenda-page.tsx`, `components/AgendaDayCarousel.tsx`, `components/AgendaList.tsx`, `components/AppointmentCard.tsx` | agenda real, carrossel controlado, sem "Editar" |
| `modules/agenda/components/new-appointment/*` (novo) | painel de novo agendamento por etapa |

---

### Task 1: Base da API: Swagger, erros 405/400/409 e rota de criação protegida

**Files:**
- Modify: `backend/pom.xml` (springdoc `2.6.0` → `2.7.0`, linha compatível com Spring Boot 3.4)
- Create: `backend/src/main/java/com/agenda/api/exception/ConflictException.java`
- Modify: `backend/src/main/java/com/agenda/api/exception/GlobalExceptionHandler.java`
- Modify: `backend/src/main/java/com/agenda/api/security/SecurityConfig.java:50-51`
- Test: `backend/src/test/java/com/agenda/api/controller/ApiInfrastructureIntegrationTest.java` (novo)

**Interfaces:**
- Produces: `public class ConflictException extends BusinessException` com `ConflictException(String message)`, `ConflictException(String message, Map<String,String> details)` e `Map<String,String> getDetails()`. O handler de `ConflictException` responde 409 com `ApiErrorResponse` usando o construtor que recebe `details`. Por estender `BusinessException`, código e testes que esperam `BusinessException` continuam válidos; o Spring escolhe o handler mais específico.

- [ ] **Step 1: Escrever os testes que falham** em `ApiInfrastructureIntegrationTest` (`@SpringBootTest(webEnvironment = RANDOM_PORT)`, `@ActiveProfiles("test")`, salão registrado e logado como no `TenantIsolationIntegrationTest`):
  - `openApiDocsAreAvailable`: `GET /v3/api-docs` → 200.
  - `wrongHttpMethodReturns405`: `DELETE /api/tenants/me` com token → 405.
  - `malformedIdReturns400`: `GET /api/customers/abc` com token → 400.
  - `creatingAppointmentWithoutTokenIsForbidden`: `POST /api/appointments` sem token, corpo válido → 403.
- [ ] **Step 2: Rodar e ver falhar:** `./mvnw test -Dtest=ApiInfrastructureIntegrationTest` → os quatro falham (500, 500, 500, 404).
- [ ] **Step 3: Implementar:** subir o springdoc; criar `ConflictException`; no handler, adicionar `ConflictException` → 409, `HttpRequestMethodNotSupportedException` → 405, `MethodArgumentTypeMismatchException` e `MissingServletRequestParameterException` → 400 (mensagem "Parâmetro inválido: <nome>" / "Parâmetro obrigatório ausente: <nome>"); remover o `requestMatchers(HttpMethod.POST, "/api/appointments").permitAll()` e o comentário acima dele.
- [ ] **Step 4: Rodar a suíte inteira:** `./mvnw test` → tudo verde.
- [ ] **Step 5: Commit:** `fix: Swagger, erros 405/400/409 e criação de agendamento só autenticada`

---

### Task 2: Clientes: busca, edição e telefone único por salão

**Files:**
- Modify: `model/Customer.java` (`@Table(name = "customers", uniqueConstraints = @UniqueConstraint(name = "uk_customers_tenant_phone", columnNames = {"tenant_id", "phone"}))`)
- Modify: `repository/CustomerRepository.java`, `service/CustomerService.java`, `controller/CustomerController.java`
- Test: `backend/src/test/java/com/agenda/api/service/CustomerServiceTest.java`, `backend/src/test/java/com/agenda/api/controller/CustomerIntegrationTest.java` (novo), `TenantIsolationIntegrationTest.java`

**Interfaces:**
- Consumes: `ConflictException(String, Map<String,String>)` (Tarefa 1).
- Produces:
  - `CustomerService.search(String term): List<CustomerResponse>` e `CustomerService.update(UUID id, CustomerRequest request): CustomerResponse`.
  - `GET /api/customers?search=` → `List<CustomerResponse>`; `PUT /api/customers/{id}` → `CustomerResponse`.
  - Telefone normalizado no serviço com `phone.replaceAll("\\D", "")` antes de checar e salvar.
  - Conflito de telefone: `ConflictException("Já existe um cliente com este telefone.", Map.of("existingCustomerId", <uuid>, "existingCustomerName", <nome>))`.

- [ ] **Step 1: Testes unitários que falham** em `CustomerServiceTest`:
  - `shouldNormalizePhoneToDigitsOnCreate`: request com `"+55 (86) 99999-0000"` salva `"5586999990000"`.
  - `shouldRejectDuplicatePhoneWithExistingCustomerDetails`: repositório devolve cliente "Maria" com o mesmo telefone → `ConflictException` com `details.existingCustomerName == "Maria"`.
  - `shouldAllowUpdateKeepingOwnPhone`: atualizar o cliente X com o telefone que já é dele → sem exceção.
  - `shouldRejectUpdateToAnotherCustomersPhone`: telefone pertence ao cliente Y → `ConflictException`.
- [ ] **Step 2: Testes de integração que falham** em `CustomerIntegrationTest`:
  - `searchMatchesNameIgnoringCase`: clientes "Ana Paula", "Bruno"; `search=ana` → só "Ana Paula".
  - `searchByNameDoesNotMatchEveryoneThroughPhone`: `search=ana` não devolve "Bruno" (pega a cláusula `like '%%'`).
  - `searchMatchesPhoneDigits`: `search=99990` casa pelo telefone.
  - `listWithoutSearchIsSortedByNameAndCappedAt50`: 51 clientes → 50 resultados em ordem alfabética.
  - `samePhoneInSameSalonReturns409WithDetails` e `samePhoneInAnotherSalonIsAllowed`.
  - Em `TenantIsolationIntegrationTest`: `customerSearchOnlyReturnsOwnCustomers` (salão B busca o nome do cliente do A → lista vazia) e `otherTenantCannotUpdateCustomer` (`PUT` do B no cliente do A → 404).
- [ ] **Step 3: Rodar e ver falhar:** `./mvnw test -Dtest='CustomerServiceTest,CustomerIntegrationTest,TenantIsolationIntegrationTest'`.
- [ ] **Step 4: Implementar.** No repositório: `findByPhoneAndTenantId(String phone, UUID tenantId)`, uma listagem ordenada por nome com `Pageable` e uma busca por nome (`lower(name) like lower(concat('%', :term, '%'))`) que só inclui a cláusula de telefone quando o termo tem dígitos; o serviço escolhe a consulta e passa `PageRequest.of(0, 50)`.
- [ ] **Step 5: Rodar a suíte inteira:** `./mvnw test` → verde.
- [ ] **Step 6: Commit:** `feat: busca, edição e telefone único de clientes`

---

### Task 3: `AvailabilityService`: regras de horário

**Files:**
- Create: `config/TimeConfig.java`, `service/AvailabilityService.java`, `dto/AvailableSlotResponse.java`
- Modify: `repository/AppointmentRepository.java`, `src/main/resources/application.yml` (`app.timezone: ${APP_TIMEZONE:America/Sao_Paulo}`)
- Test: `backend/src/test/java/com/agenda/api/service/AvailabilityServiceTest.java` (novo)

**Interfaces:**
- Produces:
  - `@Bean Clock clock(@Value("${app.timezone}") String zone)` → `Clock.system(ZoneId.of(zone))`.
  - `record AvailableSlotResponse(LocalTime time, UUID professionalId, String professionalName)`; `time` serializa como `"HH:mm"` (`@JsonFormat(pattern = "HH:mm")`).
  - `AvailabilityService(TenantRepository, ProfessionalRepository, ServiceRepository, AppointmentRepository, Clock)`.
  - `List<AvailableSlotResponse> findAvailableSlots(LocalDate date, UUID serviceId, UUID professionalId /* nullable */)`: carrega tenant, serviço e profissional(is) do salão atual (404 via `ResourceNotFoundException` se não existirem).
  - `void assertBookable(Tenant tenant, Professional professional, LocalDateTime start, LocalDateTime end)`: lança `BusinessException` (422) para profissional inativo ("O profissional selecionado não está ativo."), dia fechado ("O salão ou o profissional não está disponível neste dia."), fora do expediente ("O horário agendado está fora do horário de funcionamento.") e passado ("O horário de início não pode estar no passado."); lança `ConflictException` (409) para sobreposição ("O profissional já possui um agendamento neste horário.").
  - `AppointmentRepository.findActiveBetween(LocalDateTime start, LocalDateTime end): List<Appointment>`: não cancelados com início em `[start, end)`.
  - `hasOverlappingAppointment` passa a comparar com `com.agenda.api.model.AppointmentStatus.CANCELED` (corrige `'CANCELLED'`).

- [ ] **Step 1: Testes que falham** em `AvailabilityServiceTest` (Mockito para repositórios; `Clock.fixed` em segunda 2026-10-12 08:00 `America/Sao_Paulo`, salvo onde indicado; salão seg-sex 08:00-18:00, fim de semana fechado; serviço de 30 min salvo onde indicado):
  - `usesSalonHoursWhenProfessionalHasNoConfigForTheDay`: primeiro horário 08:00, último 17:30.
  - `intersectsSalonAndProfessionalHours`: profissional 10:00-20:00 → de 10:00 a 17:30.
  - `noSlotsWhenSalonIsClosed`: sábado → vazio.
  - `noSlotsWhenProfessionalIsClosedThatDay`: profissional fechado na segunda → vazio.
  - `noSlotsWhenIntersectionIsEmpty`: profissional 18:00-22:00 → vazio.
  - `serviceMustFitBeforeClosing`: serviço de 45 min → último horário 17:00.
  - `skipsPastSlotsToday`: clock 10:10 → primeiro horário 10:30; mesma consulta para terça começa em 08:00.
  - `overlappingAppointmentRemovesSlots`: agendamento 09:00-09:45 → somem 09:00 e 09:30; 08:30 continua (termina 09:00).
  - `canceledAppointmentDoesNotBlock`: `findActiveBetween` não devolve cancelados; o teste garante que só ele é usado para sobreposição.
  - `inactiveProfessionalHasNoSlots`.
  - `anyProfessionalAssignsTheOneWithFewestAppointments`: Ana com 2 agendamentos no dia e Bruno com 0, ambos livres às 08:00 → 08:00 vai para Bruno.
  - `anyProfessionalTieBreaksByName`: ambos com 0 → "Ana".
  - `anyProfessionalSkipsBusyOnes`: só Bruno livre às 09:00 → 09:00 com Bruno.
  - `anyProfessionalWithNoActiveProfessionalsReturnsEmpty`.
  - `assertBookableRejectsOverlapWithConflict` e `assertBookableRejectsPastWithBusinessException` (este último não pode ser `ConflictException`).
- [ ] **Step 2: Rodar e ver falhar:** `./mvnw test -Dtest=AvailabilityServiceTest`.
- [ ] **Step 3: Implementar.** O expediente do dia é a interseção `[max(aberturas), min(fechamentos))` dos dois `BusinessHour` do dia (`DayOfWeek.getValue()` 1-7). A grade sai de 30 em 30 min. No modo "qualquer", calcular a grade por profissional e, para cada horário, escolher entre os livres o de menor contagem de agendamentos do dia (`findActiveBetween` do dia agrupado por profissional), com empate pelo nome; ordenar o resultado por horário.
- [ ] **Step 4: Rodar:** `./mvnw test -Dtest=AvailabilityServiceTest` → verde; `./mvnw test` → verde.
- [ ] **Step 5: Commit:** `feat: AvailabilityService com interseção de horários e modo qualquer profissional`

---

### Task 4: Endpoints de agendamento: agenda do dia, disponibilidade, criação com trava

**Files:**
- Modify: `repository/ProfessionalRepository.java`, `service/AppointmentService.java`, `controller/AppointmentController.java`, `dto/AppointmentResponseDTO.java` (adiciona `professionalId`)
- Modify: `test_api.ps1` (passo 10 passa `?date=` com a data do agendamento criado), `README.md` (tabela da API)
- Test: `AppointmentServiceTest.java`, `backend/src/test/java/com/agenda/api/controller/AppointmentIntegrationTest.java` (novo), `TenantIsolationIntegrationTest.java`

**Interfaces:**
- Consumes: `AvailabilityService.findAvailableSlots(...)`, `assertBookable(...)`, `AppointmentRepository.findActiveBetween(...)` (Tarefa 3); `ConflictException` (Tarefa 1).
- Produces:
  - `ProfessionalRepository.findByIdForUpdate(UUID id, UUID tenantId): Optional<Professional>` com `@Lock(LockModeType.PESSIMISTIC_WRITE)` e `@Query("select p from Professional p where p.id = :id and p.tenantId = :tenantId")`.
  - `AppointmentRepository.findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(LocalDateTime, LocalDateTime)`, para o dia, incluindo cancelados.
  - `GET /api/appointments?date=aaaa-mm-dd` (`date` obrigatório) → `List<AppointmentResponseDTO>`.
  - `GET /api/appointments/availability?date=&serviceId=&professionalId=` → `List<AvailableSlotResponse>`.
  - `AppointmentService.create` usa `findByIdForUpdate` e `assertBookable`; as validações de horário saem do `AppointmentService`.
  - `updateStatus` lança `BusinessException("Agendamento cancelado ou concluído não pode mudar de status.")` se o status atual for `CANCELED` ou `COMPLETED`.

- [ ] **Step 1: Ajustar `AppointmentServiceTest`:** mock de `AvailabilityService` no construtor. Os testes de horário (`shouldThrowExceptionWhenOutsideBusinessHours`, `shouldThrowExceptionWhenCrossingMidnight`, `shouldThrowExceptionWhenProfessionalIsClosedOnDay`, `shouldCreateAppointmentWhenWithinProfessionalCustomHours`, `shouldThrowExceptionWhenTimeOverlaps`) saem daqui: seus cenários já estão cobertos na Tarefa 3. Ficam/entram:
  - `shouldCreateAppointmentSuccessfully` (agora com `findByIdForUpdate`);
  - `shouldPropagateConflictFromAvailability`: `assertBookable` lança `ConflictException` → nada é salvo;
  - `shouldNotChangeStatusOfCanceledAppointment` e `shouldNotChangeStatusOfCompletedAppointment`.
- [ ] **Step 2: Testes de integração que falham** em `AppointmentIntegrationTest`:
  - `dayListingReturnsOnlyThatDaySorted`: agendamentos na segunda 14:00, 09:00 e na terça 09:00; `date=<segunda>` → 09:00, 14:00.
  - `dayListingIncludesCanceled`.
  - `availabilityEndpointReturnsHHmmSlots`: o primeiro item tem `time == "08:00"` e o `professionalId` certo.
  - `availabilityWithMalformedDateReturns400` (`date=12-10-2026`) e `availabilityWithUnknownServiceReturns404`.
  - `concurrentBookingsOfSameSlotYieldOne201AndOne409`: dois `POST` idênticos disparados juntos (`ExecutorService` + `CountDownLatch`) → um 201 e um 409.
  - `canceledAppointmentFreesTheSlot`: cancelar e então criar no mesmo horário → 201.
  - Em `TenantIsolationIntegrationTest`: `availabilityRejectsAnotherTenantsProfessional` (salão B pede disponibilidade com profissional do A → 404).
- [ ] **Step 3: Rodar e ver falhar:** `./mvnw test -Dtest='AppointmentServiceTest,AppointmentIntegrationTest,TenantIsolationIntegrationTest'`.
- [ ] **Step 4: Implementar** os endpoints e a criação com trava; atualizar `test_api.ps1` e a tabela da API no `README.md`.
- [ ] **Step 5: Verificar:** `./mvnw test` → verde. Com o backend rodando contra o Postgres local, `.\test_api.ps1` → todos os passos sem erro.
- [ ] **Step 6: Commit:** `feat: agenda do dia, disponibilidade e criação de agendamento com trava`

---

### Task 5: Front: Vitest e utilitários de data e telefone

**Files:**
- Modify: `frontend/package.json` (devDependency `vitest` na versão estável mais recente compatível com o `vite ^8` do projeto, conferindo os peer deps no `npm install`; script `"test": "vitest run"`)
- Create: `frontend/src/shared/utils/date.ts`, `date.test.ts`, `phone.ts`, `phone.test.ts`

**Interfaces:**
- Produces:
  - `toApiDate(date: Date): string`: `aaaa-mm-dd` no fuso local.
  - `formatDayLabel(date: Date): string`: ex. `"seg 12/10"` (resumo do agendamento).
  - `maskPhone(input: string): string`: aplica `(DD) 99999-9999` ou `(DD) 9999-9999` a qualquer entrada; ignora não-dígitos; aceita colar `+55 …` e remove o 55 inicial quando sobram 12-13 dígitos.
  - `phoneToApi(masked: string): string`: `"55" + dígitos`.
  - `formatPhone(apiPhone: string): string`: `"5586999990000"` → `"(86) 99999-0000"`.

- [ ] **Step 1: Testes que falham:**
  - `toApiDate(new Date(2026, 9, 12, 23, 30))` → `"2026-10-12"` (não pode virar dia 13).
  - `formatDayLabel(new Date(2026, 9, 12))` → `"seg 12/10"`.
  - `maskPhone("86999990000")` → `"(86) 99999-0000"`; `maskPhone("8633334444")` → `"(86) 3333-4444"`; `maskPhone("+55 86 99999-0000")` → `"(86) 99999-0000"`; `maskPhone("869")` → `"(86) 9"`.
  - `phoneToApi("(86) 99999-0000")` → `"5586999990000"`.
  - `formatPhone("5586999990000")` → `"(86) 99999-0000"`.
- [ ] **Step 2: Rodar e ver falhar:** `npm test` → falha por módulo inexistente.
- [ ] **Step 3: Implementar** as cinco funções.
- [ ] **Step 4: Rodar:** `npm test` → verde; `npm run build` → sem erros.
- [ ] **Step 5: Commit:** `test(frontend): Vitest e utilitários de data e telefone`

---

### Task 6: Front: aba Clientes

**Files:**
- Create: `modules/customers/api/customers.ts`, `modules/customers/components/CustomerForm.tsx`, `modules/customers/components/CustomerFormSheet.tsx`
- Modify: `modules/customers/pages/customers-page.tsx`

**Interfaces:**
- Consumes: `GET/POST /api/customers`, `PUT /api/customers/{id}` (Tarefa 2); `maskPhone`, `phoneToApi`, `formatPhone` (Tarefa 5); `toast`, `getApiErrorMessage`.
- Produces:
  - `interface Customer { id: string; name: string; phone: string; email: string | null }`, `interface CustomerRequest { name: string; phone: string; email?: string }`.
  - `customersApi.search(term: string): Promise<Customer[]>`, `customersApi.create(req: CustomerRequest): Promise<Customer>`, `customersApi.update(id: string, req: CustomerRequest): Promise<Customer>`.
  - `getDuplicateCustomer(error: unknown): { id: string; name: string } | null`: lê `details.existingCustomerId/Name` de um 409.
  - `<CustomerForm variant="full" | "short" initial?: Customer onSubmit(req: CustomerRequest) submitting: boolean error: string | null />`: `short` mostra só nome e telefone.
  - Chave de query `['customers', term]`.

- [ ] **Step 1: Implementar** a página: busca com debounce de 300 ms, lista (nome, telefone via `formatPhone`, e-mail), estado vazio ("Nenhum cliente cadastrado" / "Nenhum cliente encontrado"), botão "+ Novo cliente" e toque na linha abrindo o `CustomerFormSheet` (padrão Radix Dialog dos `*FormSheet` de Configurações). Toast ao salvar; erro de validação no próprio formulário; 409 mostra "Já existe: <nome>".
- [ ] **Step 2: Verificar:** `npm run build` sem erros; no navegador, cadastrar, buscar por nome e por telefone, editar, tentar telefone repetido (aparece "Já existe: …"), conferir a largura de 375px.
- [ ] **Step 3: Commit:** `feat(frontend): aba Clientes com busca, cadastro e edição`

---

### Task 7: Front: Agenda com dados reais

**Files:**
- Create: `modules/agenda/api/appointments.ts`
- Modify: `modules/agenda/pages/agenda-page.tsx`, `components/AgendaDayCarousel.tsx`, `components/AgendaList.tsx`, `components/AppointmentCard.tsx`
- Modify: `modules/settings/api/services.ts`, `modules/settings/api/professionals.ts` (`id: number` → `id: string`, UUID) e as telas que usam esses tipos

**Interfaces:**
- Consumes: `GET /api/appointments?date=`, `PATCH /api/appointments/{id}/status`, `GET /api/appointments/availability` (Tarefa 4); `toApiDate` (Tarefa 5).
- Produces:
  - `type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED'`.
  - `interface AppointmentDto { id: string; customerName: string; serviceName: string; professionalId: string; professionalName: string; startTime: string; endTime: string; durationMinutes: number; status: AppointmentStatus }`.
  - `interface AvailableSlot { time: string; professionalId: string; professionalName: string }`.
  - `appointmentsApi.listByDay(date: string)`, `appointmentsApi.updateStatus(id: string, status: AppointmentStatus)`, `appointmentsApi.availability(params: { date: string; serviceId: string; professionalId?: string })`, `appointmentsApi.create(req: { customerId: string; serviceId: string; professionalId: string; startTime: string })` (`startTime` como `aaaa-mm-ddTHH:mm:00`).
  - Chave de query `['appointments', date]` (`date` = `toApiDate(...)`).
  - `AgendaDayCarousel` controlado: props `selectedDate: Date` e `onSelectDate(date: Date)`; o estado interno de seleção sai.
  - `AgendaPage` expõe ao painel a função `onCreated(date: Date)`, que seleciona o dia e invalida a query daquele dia.

- [ ] **Step 1: Implementar:** a lista vem de `listByDay` (o `time` do card é o `HH:mm` de `startTime`); as ações do card chamam `updateStatus` com toast de sucesso/erro e invalidam a query do dia; o item "Editar" e a prop `onEdit` saem do card e da lista; o mock e o `setTimeout` saem da página.
- [ ] **Step 2: Verificar:** `npm run build` sem erros; no navegador, um agendamento criado pelo `test_api.ps1` aparece no dia certo; confirmar, concluir e cancelar persistem após recarregar; um dia sem agendamentos mostra "Agenda Livre".
- [ ] **Step 3: Commit:** `feat(frontend): agenda com dados reais e troca de status`

---

### Task 8: Front: painel de novo agendamento

**Files:**
- Create: `modules/agenda/components/new-appointment/NewAppointmentSheet.tsx`, `CustomerStep.tsx`, `ServiceStep.tsx`, `ProfessionalStep.tsx`, `WhenStep.tsx`
- Delete: `modules/agenda/components/NewAppointmentSheet.tsx`
- Modify: `modules/agenda/pages/agenda-page.tsx` (import novo)

**Interfaces:**
- Consumes: `customersApi`, `CustomerForm variant="short"`, `getDuplicateCustomer` (Tarefa 6); `appointmentsApi.availability/create`, `onCreated` (Tarefa 7); `toApiDate`, `formatDayLabel` (Tarefa 5).
- Produces: `<NewAppointmentSheet isOpen onOpenChange initialDate: Date onCreated(date: Date) />`. Estado do painel: `customer: Customer | null`, `service: ServiceData | null`, `professionalId: string | 'ANY'`, `date: Date`, `slot: AvailableSlot | null`; trocar serviço, profissional ou dia limpa `slot`.

- [ ] **Step 1: Implementar as etapas** conforme a spec §6.1:
  - **Cliente:** busca com debounce; cliente escolhido destacado com "Trocar"; botão "+ Cadastrar novo cliente" abre o `CustomerForm` curto; 409 mostra "Já existe: <nome>" e "Usar este cliente".
  - **Serviço:** como hoje.
  - **Profissional:** "Qualquer profissional" primeiro.
  - **Quando:** faixa de 15 dias a partir de hoje, grade de `availability` (no modo "qualquer", com o nome do profissional), estado vazio "Nenhum horário livre neste dia" e resumo `Maria · Corte · Carlos · seg 12/10 às 10:00`.
  - **Próximo** e **Confirmar Agendamento** ficam desabilitados até a etapa estar completa.
  - **Ao confirmar:** sucesso dá toast "Agendamento criado.", chama `onCreated(date)` e fecha o painel; 409 dá toast com a mensagem da API, refaz a query de `availability` e limpa `slot`; outro erro dá toast com `getApiErrorMessage`.
- [ ] **Step 2: Verificar:** `npm run build` sem erros e `npm test` verde. No navegador:
  - criar agendamento com cliente novo e com cliente existente;
  - modo "qualquer" mostra nomes na grade;
  - dia fechado mostra o estado vazio;
  - hoje não oferece horário passado;
  - o agendamento criado aparece na Agenda do dia escolhido;
  - criar o mesmo horário em duas abas: a segunda recebe toast de conflito e a grade atualiza;
  - largura de 375px.
- [ ] **Step 3: Commit:** `feat(frontend): novo agendamento com cliente, dia e horários livres`
