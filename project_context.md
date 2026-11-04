# Agenda Salão Online - Contexto do Projeto

Este documento resume o estado atual do projeto **Agenda Salão Online** para ser utilizado como base (contexto) em novas sessões de desenvolvimento, especialmente para o início do desenvolvimento do **Frontend**.

## 1. Visão Geral
A aplicação é um sistema de agendamento para salões de beleza em modelo **SaaS Multi-Tenant**. Cada salão que se cadastra ganha seu próprio isolamento de dados (Tenant). O objetivo principal é que o dono do salão possa se cadastrar, gerenciar profissionais, serviços e clientes, e registrar agendamentos.

## 2. Stack Tecnológica Atual
- **Backend:** Java 21+, Spring Boot 3.4.1, Maven.
- **Banco de Dados:** PostgreSQL 15 (rodando via Docker Compose no localhost:5432). Schema versionado com **Flyway** (`backend/src/main/resources/db/migration`, V1–V3); os testes usam H2 em modo PostgreSQL com as mesmas migrações.
- **Autenticação:** JWT (JSON Web Token) sem estado.
- **Testes da API:** Script PowerShell (`test_api.ps1`) que valida o fluxo E2E (Cadastro, Login e CRUDs).

## 3. Arquitetura e Multi-Tenancy (Backend)
O isolamento de dados por salão foi implementado a nível de banco de dados usando a estratégia de **Discriminator Column** (`tenant_id`).
- **Filtro do Hibernate:** Um aspecto (`TenantFilterAspect`) injeta automaticamente o `@Filter(name = "tenantFilter")` nas sessões do Hibernate baseando-se no ID do tenant logado.
- **Injeção de Tenant:** A classe `BaseTenantEntity` utiliza a anotação `@PrePersist` para buscar o tenant logado através do `TenantContext.getCurrentTenant()` e preencher a coluna `tenant_id` automaticamente.
- **JWT:** O ID do tenant vem embutido no token JWT durante o login, sendo extraído pelo `JwtAuthenticationFilter` e colocado na thread atual.

## 4. Estrutura de Entidades e Endpoints da API (Testados e Aprovados)

As seguintes rotas base estão configuradas em `http://localhost:8080/api`:

| Entidade | Funcionalidade | Rota | Autenticação Exigida? |
| :--- | :--- | :--- | :--- |
| **Tenant** | Cadastro de um novo salão e usuário admin | `POST /tenants/register` | Não |
| **Auth** | Login no sistema para obter o token JWT | `POST /auth/login` | Não |
| **Customer** | Clientes (busca com `?search=`, telefone único por salão) | `/customers` | Sim (JWT) |
| **Professional** | Profissionais e horário próprio por dia | `/professionals` | Sim (JWT) |
| **Service** | Serviços, preços e duração | `/services` | Sim (JWT) |
| **Appointment** | Agenda do dia, horários livres, criação com trava e troca de status | `/appointments?date=`, `/appointments/availability`, `PATCH /appointments/{id}/status` | Sim (JWT) |
| **Dashboard** | Operação do dia: resumo com R$, próximo atendimento, pendências e equipe | `GET /dashboard/today` | Sim (JWT) |

O agendamento guarda o preço do serviço no momento da criação (`appointments.price`, migração V3): reajustar o serviço não muda o histórico.

## 5. Estado do Frontend
Todas as abas do painel (`/app`, Bottom Tab Bar) estão implementadas com dados reais:
- `/app` - **Dashboard** da operação do dia: próximo atendimento (Confirmar, Concluir, WhatsApp), resumo com previsto e realizado, pendências (a confirmar e atrasadas) e equipe (livre, atendendo, fora). Recarrega a cada 60 s.
- `/app/agenda` - Agenda por dia, troca de status e novo agendamento em etapas (cliente, serviço, profissional ou "qualquer", dia e horário livre). Aceita `?data=aaaa-mm-dd` para abrir num dia.
- `/app/clientes` - Lista, busca, cadastro e edição de clientes.
- `/app/configuracoes` - Serviços, equipe, horários de funcionamento e dados do salão.

Specs e planos de cada entrega ficam em `docs/superpowers/`. Próximos passos e débitos: `docs/wiki/future_improvements.md` e `docs/wiki/technical_debt.md`.

## 6. Decisões de Design e UI (Frontend)
- **Soft Delete:** A exclusão de Profissionais e Serviços é feita através da inativação (`active = false`), com uma opção na interface (checkbox) para visualizar ou ocultar os registros desativados.
- **Formulários:** O uso de _Sheets_ (painéis laterais/inferiores usando `@radix-ui/react-dialog`) foi escolhido para os formulários de criação e edição, evitando trocas excessivas de página.
- **Confirmações e Notificações:** Alertas nativos (`window.confirm`) foram substituídos por um componente customizado `ConfirmDialog` usando Radix UI. Alertas de sucesso e mensagens de erro de validação (ex: campos obrigatórios não preenchidos devolvidos pela API) são renderizados de forma não-intrusiva diretamente no formulário ou na tela de listagem.
- **Máscaras e Entradas de Dados:** Entradas sensíveis, como o valor em Reais (R$) nos formulários, usam formatação automática estilo aplicativo de banco (ex: digitar `5000` transforma automaticamente para `50,00`).
- **TODOs Futuros:**
  - Criar CRUD e relacionamento de **Especialidades** para melhorar os relatórios (atualmente é um campo texto no Profissional - `specialization`).
  - Implementar upload de **Foto de Perfil** para os profissionais.

## 7. Dicas para a Próxima IA
- O projeto usa `java.util.UUID` para os IDs principais.
- O campo `active` (booleano) é obrigatório ao enviar o JSON de `Professional`.
- O campo `requiresOnlinePayment` (booleano) é obrigatório ao enviar o JSON de `Service`.
- Para iniciar o backend localmente: `.\mvnw spring-boot:run` na pasta `backend`.
- A documentação interativa Swagger está disponível (quando o backend roda) em: `http://localhost:8080/swagger-ui.html`.
