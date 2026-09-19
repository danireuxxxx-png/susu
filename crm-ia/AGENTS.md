# IA.centrism CRM — notas para agentes

- **Só frontend nesta etapa.** Nada de backend, banco, auth, WhatsApp real ou chamada
  a LLM. Se uma funcionalidade precisar disso, deixe a interface pronta e o caminho
  aberto em `src/services`, sem implementar a integração.
- **Nenhuma tela conhece o mock.** As páginas leem `useCrm`/`useCrmData`; os dados
  entram pelo `CrmProvider`, que fala com `src/services`. Não importe `src/mock`
  dentro de `src/pages` ou `src/components` (a exceção são catálogos estáticos de
  demonstração, como `mock/agents` e `mock/whatsapp`).
- **Dados coerentes.** A base de `src/mock` é derivada: receita vem do MRR + ganhos do
  mês, pipeline vem das oportunidades abertas, metas leem o realizado. Ao mexer em um
  gerador, confira se os indicadores das outras telas continuam contando a mesma história.
- **Design tokens, não cores soltas.** Use as classes de token (`bg-surface`, `text-fg-muted`,
  `border-line`, `text-accent`...). Cores de gráfico vêm de `useChartTheme()`, nunca de
  hex no componente. Os dois temas precisam continuar funcionando.
- **Gráficos** seguem `src/constants/charts.ts`: sem eixo duplo, legenda para duas ou mais
  séries, rótulo direto no lugar de número em todo ponto, texto em tom neutro (a cor fica
  na marca).
- **Componentes pequenos e reutilizáveis.** Primitivos em `components/ui`, domínio em
  `components/crm`, layout em `components/layout`. Evite arquivo monolítico e lógica
  misturada com UI.
- Antes de entregar: `npm run build` (typecheck + build) e `npm run lint`.
