---
name: agenda-salao-guidelines
description: Diretrizes arquiteturais e regras fundamentais para o projeto Agenda Salão Online (DDD, TDD, Segurança e Observabilidade).
---

# Diretrizes Arquiteturais - Agenda Salão Online

As seguintes regras devem ser rigorosamente seguidas em todas as interações e modificações no código deste projeto. Ao perceber que uma tarefa se enquadra em um dos tópicos abaixo, ative proativamente as skills relacionadas e siga as instruções.

## 1. Documentação e Design
Mantenha as regras de negócio claras e explícitas.
- Utilize **Domain-Driven Design (DDD)** para nomenclatura e modelagem de entidades, garantindo que reflitam fielmente o domínio de agendamentos.
- Documente decisões importantes em ADRs (Architecture Decision Records) ou no Wiki do projeto.
- **Skills relacionadas a ativar:** `brain-to-docs`, `wiki-architect`, `domain-driven-design`.

## 2. Qualidade e Regressão
Nenhum código vai para produção sem testes automatizados.
- A cobertura de testes unitários para as regras de negócio é inegociável.
- Use **TDD (Test-Driven Development)** sempre que possível para implementar as regras antes do código final.
- Garanta que a integração contínua (CI) possa validar suas mudanças.
- **Skills relacionadas a ativar:** `test-driven-development`, `ci-cd-and-automation`.

## 3. Segurança e Configuração
Nunca insira credenciais, chaves de API ou senhas fixas no código-fonte.
- Separe os ambientes rigorosamente utilizando arquivos `.env` ignorados pelo versionamento e utilize variáveis de ambiente adequadamente injetadas em produção.
- Aplique o padrão 12-factor app para configurações externas.
- **Skills relacionadas a ativar:** `secrets-management`, `varlock`.

## 4. Observabilidade e Erros
Padronize a tratativa de exceções para não vazar informações sensíveis do servidor para o cliente.
- Implemente tratamentos globais de erros na API (ex: `@ControllerAdvice` no Spring Boot).
- Garanta que logs bem estruturados com `trace ids` sejam gerados no backend.
- Deixe o sistema pronto para integração com ferramentas de monitoramento em produção, como o Sentry.
- **Skills relacionadas a ativar:** `error-handling-patterns`, `sentry-automation`, `observability-and-instrumentation`.
