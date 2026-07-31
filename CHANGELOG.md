# Changelog do Projeto (MVP)

Este arquivo documenta as implementações e ajustes finos realizados durante o desenvolvimento do MVP.

## Implementações de Fluxo de Autenticação e Cadastro (Fase 1)

### Backend
- **Tratamento de Exceções Globais (`GlobalExceptionHandler`)**: Implementado tratamento para `DataIntegrityViolationException`, permitindo que erros de chaves únicas (como e-mail já cadastrado) retornem um status 400 (Bad Request) com uma mensagem amigável em vez de um erro 500 genérico.
- **Isolamento e Geração de Slugs (`TenantService`)**: O campo `name` do salão deixou de ser obrigatório como chave única (permitindo salões homônimos). A unicidade técnica foi passada para o `slug` (ex: `salao-da-maria`), que é gerado automaticamente pelo backend.
- **Correção de Vazamento de Contexto (`JwtAuthenticationFilter`)**: Implementada uma regra de *bypass* para rotas públicas (como `/api/auth/**` e `/api/tenants/register`). Isso previne que tokens JWT expirados ou irrelevantes que estavam no `localStorage` poluíssem o `TenantContext` (o que causava o erro `Bad credentials` logo após criar uma nova conta e tentar logar).
- **Validação de Força de Senha e Campos**: Mensagens de erro de validação (ex: senha com menos de 6 dígitos) configuradas no nível da DTO (Data Transfer Object) agora são capturadas e enviadas de forma estruturada.

### Frontend
- **Parseador de Erros de API**: O client HTTP (`api-client`) agora processa os erros estruturados retornados pelo backend. Quando há um erro do tipo `validation_error`, os campos problemáticos e as respectivas mensagens são extraídos (ex: erro no campo `password`).
- **UI de Feedback Imediato no Cadastro**: Adicionada exibição de mensagens claras diretamente no formulário caso haja validações reprovadas no frontend/backend.
- **Mensagem de Sucesso (Banners)**: Após o cadastro com sucesso, o usuário é redirecionado para a página de Login (`LoginPage`), onde um *banner* ou *toast* visual informa que a conta foi criada com sucesso, garantindo clareza para o usuário.
- **Prevenção de Enumeração de Usuários**: A interface de login retorna a mensagem genérica *"E-mail ou senha incorretos"* para evitar que usuários mal intencionados descubram se um determinado e-mail está cadastrado ou não.

---
