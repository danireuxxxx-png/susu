# Élan — Dashboard Clínica Estética Inteligente

Dashboard de gestão para clínicas de estética avançada: visão geral do faturamento,
ranking de profissionais, base de pacientes e um copiloto de IA que grava, transcreve
e analisa consultas de venda em tempo real.

Implementado em Next.js (App Router) + PostgreSQL/Prisma + NextAuth, a partir do
protótipo visual feito no Claude Design.

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)
- NextAuth v5 (Credentials + JWT)
- Anthropic API (`@anthropic-ai/sdk`, modelo `claude-sonnet-5`) para os recursos de IA
- Web Speech API (navegador) para transcrição ao vivo da consulta
- Tailwind CSS v4

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o `.env` (crie a partir do exemplo abaixo):

   ```bash
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/clinica_estetica?schema=public"
   AUTH_SECRET="gere com: openssl rand -base64 32"
   ANTHROPIC_API_KEY="sua chave da Anthropic"
   ```

   Sem `ANTHROPIC_API_KEY`, os recursos de IA (dicas em tempo real, análise de
   consulta, leitura de estilo de venda, sugestão para pacientes) retornam um erro
   claro na tela em vez de travar o app — o restante do dashboard funciona normalmente.

3. Rode as migrações e o seed (cria a diretora `Dra. Helena Viana`, 5 profissionais,
   6 pacientes e ~60 dias de histórico de consultas):

   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Suba o servidor:

   ```bash
   npm run dev
   ```

### Login de demonstração

- **E-mail:** `helena@elanclinic.com.br`
- **Senha:** `elan2026`

## Funcionalidades

- **Visão geral**: KPIs (faturamento, ticket médio, consultas, conversão) com
  variação vs. mês anterior, faturamento diário, top tratamentos, estatísticas de
  clientes e ranking resumido — tudo calculado a partir do banco de dados.
- **Profissionais**: ranking por score combinado (faturamento + conversão + nota de
  IA), perfil individual com consultas avaliadas e leitura de IA sobre o estilo de
  venda (gerada a partir do histórico real de consultas analisadas). CRUD completo.
- **Pacientes**: lista + painel de detalhe com LTV, ticket médio, histórico de
  tratamentos, observações clínicas e sugestão de IA regenerável. CRUD completo.
- **Consulta IA**: grava a consulta pelo microfone (transcrição ao vivo via Web
  Speech API — funciona melhor no Chrome/Edge; também aceita transcrição digitada
  manualmente), mostra sugestões de venda em tempo real geradas pela IA e, ao
  encerrar, gera uma análise completa (nota, resumo, notas por competência,
  transcrição comentada, o que dizer/evitar). O valor fechado e o plano de sessões
  são confirmados manualmente pela equipe após a análise, para manter os dados
  financeiros confiáveis.

## Observações

- A transcrição por microfone usa um único canal de áudio, então a IA reconstrói os
  turnos da conversa ("Profissional"/"Paciente") de forma inferida — não há
  separação real de locutores.
- Tema claro/escuro persiste em cookie por usuário.
