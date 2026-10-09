# Agenda Salão Online - Contexto do Projeto

Este documento resume o estado atual do projeto **Agenda Salão Online** para ser utilizado como base (contexto) em novas sessões de desenvolvimento, especialmente para o início do desenvolvimento do **Frontend**.

## 1. Visão Geral
A aplicação é um sistema de agendamento para salões de beleza em modelo **SaaS Multi-Tenant**. Cada salão que se cadastra ganha seu próprio isolamento de dados (Tenant). O objetivo principal é que o dono do salão possa se cadastrar, gerenciar profissionais, serviços e clientes, e registrar agendamentos.

## 2. Stack Tecnológica Atual
- **Backend:** Java 25, Spring Boot 3.4.1, Maven.
- **Banco de Dados:** PostgreSQL 15 (rodando via Docker Compose no localhost:5432).
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
| **Customer** | Gestão de clientes do salão | `POST /customers`, `GET /customers/{id}` | Sim (JWT) |
| **Professional** | Gestão de profissionais (barbeiros, manicures, etc) | `POST /professionals`, `GET /professionals/{id}` | Sim (JWT) |
| **Service** | Gestão de serviços prestados e preços | `POST /services`, `GET /services/{id}` | Sim (JWT) |
| **Appointment** | Criação e consulta de agendamentos | `POST /appointments` | Sim (JWT) |

## 5. Próximos Passos (Foco no Frontend)
A API já está pronta, validada e servindo dados corretamente. Os próximos objetivos para o frontend devem abranger (A maior parte já está em andamento/concluída):
1. **Página de Landing/Cadastro:** Onde um dono de salão fará o seu registro (consumindo `POST /tenants/register`). *(Concluído)*
2. **Página de Login:** Para autenticação e armazenamento do token JWT localmente. *(Concluído)*
3. **Painel do Salão (AppLayout):** Consumindo as rotas autenticadas enviando o header `Authorization: Bearer <token>`. A navegação funciona via Bottom Tab Bar dentro do caminho `/app`:
   - `/app` - Dashboard Principal
   - `/app/agenda` - Calendário para Agendamentos.
   - `/app/clientes` - Cadastrar/Listar Clientes.
   - `/app/configuracoes` - Cadastrar/Listar Profissionais e Serviços.

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
