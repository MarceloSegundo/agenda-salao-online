# Fluxo de agendamento: design

**Data:** 2026-10-09
**Status:** aprovado em conversa; aguardando revisão da spec escrita

## 1. Contexto

O fluxo de novo agendamento existe só como interface: a etapa de cliente não busca nem cadastra, dá para avançar sem cliente, a etapa de horário não deixa escolher o dia, confirmar mostra um `alert()` sem salvar nada, e a lista da Agenda usa dados fictícios. A aba Clientes é um placeholder.

Na API faltam três coisas: buscar clientes (só existe busca por id), listar a agenda de um dia (só existe "todos os agendamentos") e saber quais horários estão livres (o front calcula horários sem conhecer os agendamentos existentes).

## 2. Objetivo e critérios de sucesso

Quem usa o fluxo é o salão (dono ou recepção), marcando para um cliente que ligou ou chegou. O agendamento pelo próprio cliente final (link público) fica fora.

Sucesso:
- criar um agendamento completo (cliente, serviço, profissional, dia e hora) que aparece na Agenda do dia certo;
- não ser possível escolher horário ocupado, no passado ou com o salão ou o profissional fechado;
- confirmar, concluir e cancelar pelo card ficam salvos;
- a aba Clientes lista, busca, cadastra e edita clientes.

## 3. Escopo

**Entra:**
1. Etapa de cliente com busca e cadastro rápido.
2. Escolha de dia e horário com disponibilidade calculada pelo backend.
3. Salvar o agendamento, com trava contra agendamento duplo.
4. Agenda com dados reais por dia e troca de status salva.
5. Tela Clientes (lista com busca, cadastro e edição).
6. Opção "Qualquer profissional".
7. Correções que encostam no fluxo: status `'CANCELLED'` na checagem de conflito (o enum é `CANCELED`), 405 devolvido como 500 e Swagger quebrado (springdoc 2.6.0 incompatível com Spring Boot 3.4).

**Fica fora** (registrado em [`docs/wiki/future_improvements.md`](../../wiki/future_improvements.md)): remarcar/editar agendamento, vínculo profissional ↔ serviço, intervalo de horários configurável, link público, exclusão de clientes.

## 4. Decisões

| Decisão | Escolha |
|---|---|
| Horário do profissional × horário do salão | **Interseção**: o profissional só atende quando ele e o salão estão abertos |
| Intervalo entre horários oferecidos | **Fixo de 30 min** |
| Onde calcular a disponibilidade | **Backend**, numa classe usada tanto para listar quanto para validar a criação |
| Concorrência na criação | **Trava pessimista** na linha do profissional (`SELECT … FOR UPDATE`) |
| Profissional ↔ serviço | Sem vínculo: todo profissional ativo faz todo serviço (limitação assumida) |

## 5. Backend

### 5.1 Clientes

- `GET /api/customers?search=<texto>`: clientes do salão ordenados por nome, no máximo 50. Sem `search`, os 50 primeiros por nome. Com `search`, filtra por trecho do nome (sem diferenciar maiúsculas) ou por trecho do telefone (comparando só dígitos).
- `POST /api/customers` (já existe) e `PUT /api/customers/{id}` (novo), com o mesmo `CustomerRequest`.
- **Telefone único por salão.** Restrição única em `(tenant_id, phone)`. O serviço verifica antes de salvar e, se já existir outro cliente com o telefone no salão, lança `ConflictException` com `details = { existingCustomerId, existingCustomerName }`. O mesmo telefone pode existir em salões diferentes.
- Telefone é guardado só com dígitos, com código do país (ex.: `5586999990000`), formato que a validação atual (`^\+?[1-9]\d{1,14}$`) já aceita.

### 5.2 Agendamentos

- `GET /api/appointments?date=aaaa-mm-dd`: agendamentos do salão naquele dia (início dentro do dia), ordenados por horário, incluindo cancelados. Substitui o `GET /api/appointments` que listava tudo.
- `GET /api/appointments/availability?date=aaaa-mm-dd&serviceId=<uuid>&professionalId=<uuid>`: `professionalId` é opcional. Resposta:
  ```json
  [{ "time": "09:00", "professionalId": "…", "professionalName": "Carlos" }]
  ```
  Sem `professionalId` (modo "qualquer profissional"), cada horário aparece uma vez, já com o profissional atribuído.
- `POST /api/appointments`: contrato atual. O front sempre envia `professionalId`; no modo "qualquer", usa o profissional que veio no horário escolhido.
- `PATCH /api/appointments/{id}/status`: contrato atual. Agendamento `CANCELED` ou `COMPLETED` não muda mais de status (422).

### 5.3 Regras de disponibilidade (`AvailabilityService`)

Uma classe concentra as regras e é usada pela listagem de horários e pela validação do `POST`.

1. **Expediente do profissional no dia:** interseção entre o horário do salão no dia e o horário do profissional no dia. Se o profissional não tem configuração para aquele dia da semana, vale o horário do salão. Dia fechado no salão ou no profissional, ou interseção vazia, significa sem horários.
2. **Horários candidatos:** de 30 em 30 minutos a partir da abertura do expediente, enquanto `início + duração do serviço ≤ fechamento`.
3. **Exclusões:**
   - horários cujo início já passou (o "agora" vem de um `Clock` no fuso `America/Sao_Paulo`);
   - horários que se sobrepõem a agendamento não cancelado do profissional (`início < fimExistente` e `fim > inícioExistente`);
   - profissional inativo não tem horários.
4. **Modo "qualquer profissional":** para cada horário candidato, entre os profissionais ativos livres, atribui o que tem menos agendamentos não cancelados no dia; empate desempata pelo nome. O horário aparece se ao menos um profissional estiver livre.

### 5.4 Criação com trava

O `POST` carrega o profissional com `@Lock(PESSIMISTIC_WRITE)` (busca por id restrita ao salão), revalida o horário pelo `AvailabilityService` (expediente, passado, sobreposição) e salva. Como todas as criações para o mesmo profissional disputam a mesma trava, a segunda espera a primeira terminar e então encontra a sobreposição. Horário que deixou de estar livre lança `ConflictException` (409); regra violada (dia fechado, fora do expediente, passado, profissional inativo) lança `BusinessException` (422).

### 5.5 Erros

| Situação | Status | Exceção |
|---|---|---|
| Horário não está mais livre | 409 | `ConflictException` (nova) |
| Telefone já cadastrado no salão | 409 | `ConflictException`, com `existingCustomerId` e `existingCustomerName` em `details` |
| Regra de negócio (dia fechado, fora do expediente, passado, profissional inativo, status final) | 422 | `BusinessException` (já existe) |
| Validação de campos / parâmetro inválido | 400 | já existe |
| Id inexistente ou de outro salão | 404 | já existe |
| Método HTTP não suportado | 405 | hoje vira 500; passa a ter handler próprio |

Também entra a correção do `hasOverlappingAppointment`, que compara com `'CANCELLED'` em vez de `CANCELED`; com o bug, agendamento cancelado continua bloqueando o horário.

## 6. Frontend

### 6.1 Novo agendamento (painel do botão "+")

- Abre no dia selecionado na Agenda. Sai todo `alert()`: **Próximo** fica desabilitado até a etapa estar completa.
- **Etapa 1, Cliente:** campo de busca (consulta a API 300 ms após parar de digitar) com resultados em cartões selecionáveis. O cliente escolhido fica destacado, com "Trocar". Abaixo, o botão **"+ Cadastrar novo cliente"** abre um mini-formulário (nome e telefone) no próprio painel; ao salvar, o cliente fica selecionado. Se a API responder 409 de telefone, aparece "Já existe: <nome>" com o botão **Usar este cliente**.
- **Etapa 2, Serviço:** como hoje.
- **Etapa 3, Profissional:** primeira opção **"Qualquer profissional"**, depois a lista.
- **Etapa 4, Quando:** faixa de dias (mesmo estilo do carrossel da Agenda) e, abaixo, a grade de horários vinda de `/availability`. No modo "qualquer", cada horário mostra o nome do profissional. Dia sem horário mostra "Nenhum horário livre neste dia". Acima do botão de confirmar, um resumo: *Maria · Corte · Carlos · seg 12/10 às 10:00*.
- **Confirmar:** sucesso mostra toast, fecha o painel e leva a Agenda para o dia do agendamento, já atualizada. Um 409 mostra toast de erro, recarrega a grade e mantém o painel aberto.

### 6.2 Agenda

- A lista do dia vem de `GET /api/appointments?date=` via React Query (chave `['appointments', data]`).
- Confirmar, concluir e cancelar pelo menu do card chamam o `PATCH` e mostram toast.
- O item "Editar" sai do menu até a rodada de remarcar.

### 6.3 Clientes

- Lista com busca (mesmo endpoint): nome, telefone formatado e e-mail.
- Tocar num cliente abre o painel de edição; **"+ Novo cliente"** abre o mesmo painel vazio. Toast ao salvar.
- Um único componente de formulário de cliente, usado na tela Clientes e, em versão curta (nome e telefone), na etapa 1.

### 6.4 Telefone e datas

- Telefone: o usuário digita com máscara `(86) 99999-0000`; o front envia só dígitos com `55` na frente.
- Datas vão para a API como `aaaa-mm-dd` no fuso local, por uma função utilitária. Não usar `toISOString()`, que converte para UTC e faz um horário noturno cair no dia seguinte.

## 7. Testes

**Backend, unitários (`AvailabilityService`, com `Clock` fixo):** interseção; dia fechado no salão e no profissional; profissional sem configuração no dia; horário no passado; sobreposição; agendamento cancelado não bloqueia; serviço que não cabe no fim do expediente; profissional inativo; modo "qualquer" (menos agendamentos, empate pelo nome).

**Backend, integração:**
- dois `POST` simultâneos no mesmo horário e profissional: um 201 e um 409;
- busca de clientes por nome e por telefone;
- telefone único no salão, mas permitido em outro salão;
- agenda por dia (só o dia pedido, ordenada);
- `TenantIsolationIntegrationTest` estendido para disponibilidade e busca de clientes.

**Frontend:** Vitest para as funções puras (máscara de telefone, data local `aaaa-mm-dd`). As telas são verificadas no navegador ao fim de cada etapa.

## 8. Riscos

- **Schema gerado pelo Hibernate (`ddl-auto: update`).** A restrição única de telefone falha em bancos que já tenham telefones repetidos no mesmo salão. O banco local atual é novo; a migração para Flyway, próxima na fila, passa a cuidar disso.
- **Trava pessimista no H2.** O teste de concorrência roda no H2; o comportamento de `FOR UPDATE` é equivalente no PostgreSQL, mas vale rodar o fluxo manualmente contra o Postgres local antes de fechar.
