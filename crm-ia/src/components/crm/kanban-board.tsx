import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PIPELINE_STAGES } from '@/constants/pipeline'
import { formatCompactCurrency } from '@/lib/format'
import { cn, sum } from '@/lib/utils'
import type { Opportunity, PipelineStageId } from '@/types'
import { OpportunityCard } from './opportunity-card'

interface KanbanBoardProps {
  opportunities: Opportunity[]
  onMove: (id: string, stage: PipelineStageId) => void
  onOpen: (opportunity: Opportunity) => void
  onCreate: (stage: PipelineStageId) => void
}

function DraggableCard({
  opportunity,
  onOpen,
}: {
  opportunity: Opportunity
  onOpen: (opportunity: Opportunity) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: opportunity.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('touch-none outline-none', isDragging && 'opacity-40')}
    >
      <OpportunityCard opportunity={opportunity} onOpen={onOpen} />
    </div>
  )
}

function Column({
  stage,
  opportunities,
  onOpen,
  onCreate,
}: {
  stage: (typeof PIPELINE_STAGES)[number]
  opportunities: Opportunity[]
  onOpen: (opportunity: Opportunity) => void
  onCreate: (stage: PipelineStageId) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  const total = sum(opportunities, (item) => item.value)

  return (
    <section className="flex w-[286px] shrink-0 flex-col rounded-xl border border-line bg-surface-muted">
      <header className="flex items-start justify-between gap-2 border-b border-line px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[13px] font-semibold text-fg">{stage.label}</h3>
            <span className="rounded-md bg-surface-inset px-1.5 py-0.5 text-[11px] font-medium text-fg-muted tabular">
              {opportunities.length}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-fg-subtle tabular">{formatCompactCurrency(total)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Nova oportunidade em ${stage.label}`}
          onClick={() => onCreate(stage.id)}
        >
          <Plus aria-hidden />
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-32 flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-thin',
          'max-h-[calc(100dvh-16rem)] transition-colors duration-150',
          isOver && 'bg-accent-soft/60',
        )}
      >
        {opportunities.map((opportunity) => (
          <DraggableCard key={opportunity.id} opportunity={opportunity} onOpen={onOpen} />
        ))}

        {!opportunities.length ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-fg-subtle">
            Arraste uma oportunidade para cá
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function KanbanBoard({ opportunities, onMove, onOpen, onCreate }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Ativacao por distancia: o clique para abrir o card continua funcionando.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
  )

  const active = opportunities.find((item) => item.id === activeId) ?? null

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const stage = event.over?.id as PipelineStageId | undefined
    const id = String(event.active.id)
    const current = opportunities.find((item) => item.id === id)
    if (!stage || !current || current.stage === stage) return
    onMove(id, stage)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {PIPELINE_STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            opportunities={opportunities.filter((item) => item.stage === stage.id)}
            onOpen={onOpen}
            onCreate={onCreate}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.16,1,0.3,1)' }}>
        {active ? <OpportunityCard opportunity={active} dragging className="w-[262px]" /> : null}
      </DragOverlay>
    </DndContext>
  )
}
