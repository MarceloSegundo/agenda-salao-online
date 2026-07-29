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
*Este documento deve ser revisado periodicamente (ex: a cada ciclo/sprint) e itens resolvidos devem ser movidos para uma seção de Histórico ou apagados.*
