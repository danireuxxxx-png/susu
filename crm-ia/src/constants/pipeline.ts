import type { PipelineStage, PipelineStageId } from '@/types'

/** Ordem canonica do funil — usada no Kanban, nos graficos e nos filtros. */
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'novo-lead', label: 'Novo Lead', shortLabel: 'Lead', probability: 10, kind: 'aberto' },
  { id: 'qualificacao', label: 'Qualificação', shortLabel: 'Qualificação', probability: 25, kind: 'aberto' },
  { id: 'reuniao-agendada', label: 'Reunião Agendada', shortLabel: 'Reunião', probability: 40, kind: 'aberto' },
  { id: 'diagnostico', label: 'Diagnóstico', shortLabel: 'Diagnóstico', probability: 55, kind: 'aberto' },
  { id: 'proposta-enviada', label: 'Proposta Enviada', shortLabel: 'Proposta', probability: 70, kind: 'aberto' },
  { id: 'negociacao', label: 'Negociação', shortLabel: 'Negociação', probability: 85, kind: 'aberto' },
  { id: 'ganho', label: 'Fechado / Ganho', shortLabel: 'Ganho', probability: 100, kind: 'ganho' },
  { id: 'perdido', label: 'Fechado / Perdido', shortLabel: 'Perdido', probability: 0, kind: 'perdido' },
]

export const OPEN_STAGES = PIPELINE_STAGES.filter((stage) => stage.kind === 'aberto')

export const STAGE_BY_ID = Object.fromEntries(
  PIPELINE_STAGES.map((stage) => [stage.id, stage]),
) as Record<PipelineStageId, PipelineStage>

export function stageLabel(id: PipelineStageId) {
  return STAGE_BY_ID[id]?.label ?? id
}
