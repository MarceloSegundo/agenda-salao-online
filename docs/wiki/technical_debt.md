# Débitos Técnicos (Technical Debt)

Este documento registra os pontos de melhoria, refatorações pendentes e problemas conhecidos no projeto que devem ser abordados no futuro para garantir a escalabilidade e a manutenibilidade do sistema.

## 1. Notificações Síncronas Bloqueantes (Prioridade: Média)

**Descrição:** 
Atualmente, no `AppointmentService.java`, a chamada para `notificationService.sendAppointmentConfirmation()` ocorre de forma síncrona dentro de um bloco transacional (`@Transactional`). 
Se o serviço externo (WhatsApp API) demorar para responder ou apresentar instabilidade, a conexão com o banco de dados ficará retida por muito tempo (connection pool exhaustion), degradando a performance geral da API para outros usuários.

**Solução Proposta:**
- Implementar o padrão *Publish/Subscribe* interno do Spring (`ApplicationEventPublisher`). O `AppointmentService` apenas dispara o evento `AppointmentCreatedEvent`.
- O listener deste evento deve ser anotado com `@Async` para processar a notificação em uma *thread pool* separada.
- Alternativa futura: Filas externas (ex: RabbitMQ/SQS) para maior resiliência e retentativas em caso de falha.

## 2. Externalização de Mensagens / Suporte a i18n (Prioridade: Baixa)

**Descrição:**
Mensagens de exceções de negócio (ex: `"O profissional já possui um agendamento neste horário."`) estão "hardcoded" (embutidas) diretamente nas classes de serviço.

**Solução Proposta:**
- Mover as strings para arquivos de propriedades (ex: `messages.properties` padrão do Spring).
- Criar utilitários para resolver as chaves de mensagem, permitindo que a API ofereça suporte a Internacionalização (i18n) e que alterações de mensagens de erro possam ser feitas sem recompilar código.

---

## 3. Gerenciamento do JWT no Frontend (XSS) (Prioridade: Média)

**Descrição:**
Atualmente, o token JWT (`agenda-salao-token`) está sendo armazenado no `localStorage`. Embora seja uma prática muito comum em MVPs e SPA, o `localStorage` é vulnerável a ataques XSS (Cross-Site Scripting). Um script malicioso executado no lado do cliente poderia facilmente capturar os tokens dos usuários.

**Solução Proposta:**
- Refatorar o fluxo de autenticação para armazenar o JWT em um **Cookie HttpOnly e Secure**.
- O backend (`AuthService` / `AuthController`) deverá devolver o token não no corpo da resposta JSON, mas sim em um header `Set-Cookie`.
- Isso previne que o JavaScript client-side tenha acesso ao token, delegando ao navegador a função de enviá-lo automaticamente em cada requisição para o domínio seguro.

## 4. Ausência de Rate Limiting no Login (Prioridade: Média)

**Descrição:**
O endpoint público de login (`/api/auth/login`) não possui nenhum limite de taxa de requisições. Como o algoritmo de hashing da senha (BCrypt) é propositalmente custoso em CPU, um ataque massivo de força bruta de credenciais poderia onerar severamente a CPU do servidor, além de viabilizar a adivinhação de senhas fracas.

**Solução Proposta:**
- Implementar **Rate Limiting** para os endpoints de autenticação e registro.
- Uma biblioteca sugerida para ecossistemas Spring é o **Bucket4j**.
- Limitar por endereço IP, por exemplo, a um máximo de 5 a 10 tentativas de login por minuto.

---
*Este documento deve ser revisado periodicamente (ex: a cada ciclo/sprint) e itens resolvidos devem ser movidos para uma seção de Histórico ou apagados.*

## 5. Busca por id ignora o filtro de tenant (Prioridade: Alta)

**Problema:**
O filtro do Hibernate (`@Filter(name = "tenantFilter")`) só é aplicado a consultas (JPQL/Criteria). Buscas por chave primária, como `repository.findById(id)` (que usa `EntityManager.find`), **não** passam pelo filtro. Nos serviços de clientes, profissionais, serviços e agendamentos, um salão que conheça o UUID de um registro de outro salão consegue lê-lo ou alterá-lo.

**Solução Proposta:**
- Trocar `findById` por métodos derivados `findByIdAndTenantId(id, TenantContext.getCurrentTenant())` nos repositórios, ou validar o `tenantId` da entidade carregada antes de devolvê-la.
- Adicionar um teste de integração que crie dois salões e garanta `404` ao acessar o recurso de um pelo token do outro.
- Atualizar o ADR 0001, que hoje descreve o filtro como mitigação suficiente.

