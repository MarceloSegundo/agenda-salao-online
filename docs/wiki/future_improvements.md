# Melhorias Futuras

Funcionalidades e limitações conhecidas que ficaram fora do escopo atual por decisão de produto. Diferente dos [débitos técnicos](technical_debt.md), aqui não há nada quebrado: são próximos passos.

## Agendamento

- **Vínculo entre profissional e serviço.** Hoje todo profissional pode fazer todo serviço: a disponibilidade e o modo "qualquer profissional" consideram todos os profissionais ativos. O próximo passo é cadastrar quais serviços cada profissional atende (e, opcionalmente, a duração por profissional) e filtrar a disponibilidade por isso.
- **Remarcar/editar agendamento.** Trocar dia, hora, profissional ou serviço de um agendamento existente, reaproveitando o fluxo de novo agendamento já preenchido.
- **Intervalo de horários configurável por salão.** Hoje os horários são oferecidos de 30 em 30 minutos, fixo.
- **Link público de agendamento.** Página em que o cliente final escolhe serviço, profissional e horário sozinho, sem passar pela recepção do salão.

## Cadastros

- **Especialidades como cadastro próprio.** Hoje é um campo de texto livre no profissional (`specialization`), o que dificulta relatórios.
- **Foto de perfil dos profissionais.**
- **Exclusão de clientes.** Exige decidir o que acontece com os agendamentos do cliente (anonimizar ou impedir a exclusão).
