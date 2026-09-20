import { CheckCircle2, MessageSquare, Plus, Sparkles, Users, Zap } from 'lucide-react'
import { useState } from 'react'
import { AiBadge } from '@/components/crm/ai-insight-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Delta } from '@/components/ui/delta'
import { PageHeader } from '@/components/ui/page-header'
import { ProgressBar } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { formatNumber, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { WHATSAPP_AGENT_STATUS, WHATSAPP_CONVERSATIONS, WHATSAPP_STATS } from '@/mock/whatsapp'
import { whatsappService } from '@/services'

const STAT_ICONS = [MessageSquare, Users, Sparkles, Zap]

export function WhatsAppAgentPage() {
  const { toast } = useToast()
  const [selectedId, setSelectedId] = useState(WHATSAPP_CONVERSATIONS[0]!.id)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<string[]>(
    WHATSAPP_CONVERSATIONS.filter((item) => item.addedToCrm).map((item) => item.id),
  )

  const conversation = WHATSAPP_CONVERSATIONS.find((item) => item.id === selectedId)!
  const alreadyImported = imported.includes(conversation.id)

  async function importToCrm() {
    setImporting(true)
    try {
      await whatsappService.importToCrm(conversation.id)
      setImported((current) => [...current, conversation.id])
      toast({
        title: 'Lead adicionado ao CRM',
        description: `${conversation.contactName} · ${conversation.companyName} entrou no pipeline.`,
        tone: 'sucesso',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agente WhatsApp"
        description="Como o agente lê as conversas, extrai dados e atualiza o CRM sozinho."
        actions={
          <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-good" />
            </span>
            <span className="font-medium text-fg">{WHATSAPP_AGENT_STATUS.label}</span>
            <span className="text-fg-subtle">{WHATSAPP_AGENT_STATUS.number}</span>
          </span>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {WHATSAPP_STATS.map((stat, index) => {
          const Icon = STAT_ICONS[index] ?? MessageSquare
          return (
            <div key={stat.label} className="rounded-card border border-line bg-surface p-4 shadow-elevated-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-fg-muted">{stat.label}</p>
                <span className="grid size-7 place-items-center rounded-lg bg-surface-inset text-fg-subtle">
                  <Icon className="size-3.5" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-fg">
                {formatNumber(stat.value)}
              </p>
              <div className="mt-3">
                <Delta value={stat.delta} suffix="vs. ontem" />
              </div>
            </div>
          )
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
        <Card className="h-fit">
          <CardHeader title="Conversas" description="Simulação das últimas interações." />
          <CardBody className="px-0 pb-0">
            <ul className="divide-y divide-line">
              {WHATSAPP_CONVERSATIONS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors duration-100',
                      item.id === selectedId ? 'bg-accent-soft' : 'hover:bg-surface-hover',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-fg">{item.contactName}</span>
                      {item.unread ? (
                        <span className="grid min-w-[18px] place-items-center rounded-full bg-good px-1 text-[10px] font-semibold text-white">
                          {item.unread}
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate text-[12px] text-fg-muted">{item.companyName}</span>
                    <span className="text-[11px] text-fg-subtle">{formatRelative(item.lastMessageAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title={conversation.contactName}
            description={`${conversation.companyName} · ${conversation.phone}`}
            action={<Badge tone="destaque">{conversation.stage}</Badge>}
          />
          <CardBody className="flex-1 space-y-3 bg-surface-muted/60 pt-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex', message.author === 'agente' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-elevated-sm',
                    message.author === 'agente'
                      ? 'rounded-br-md bg-accent text-accent-fg'
                      : 'rounded-bl-md border border-line bg-surface text-fg',
                  )}
                >
                  <p>{message.text}</p>
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      message.author === 'agente' ? 'text-accent-fg/70' : 'text-fg-subtle',
                    )}
                  >
                    {message.author === 'agente' ? 'Agente · ' : ''}
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </CardBody>
          <div className="border-t border-line px-5 py-3">
            <p className="text-[12px] text-fg-subtle">
              O envio real de mensagens depende da API oficial do WhatsApp Business — fora do escopo desta
              versão.
            </p>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader
            title="Dados detectados pela IA"
            description="O que o agente entendeu desta conversa."
            action={<AiBadge label="Extração automática" />}
          />
          <CardBody className="space-y-3 pt-0">
            <ul className="divide-y divide-line">
              {conversation.extracted.map((field) => (
                <li key={field.label} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] text-fg-muted">{field.label}</span>
                    <span className="text-[11px] text-fg-subtle tabular">{field.confidence}%</span>
                  </div>
                  <p className="mt-0.5 text-[13px] font-medium text-fg">{field.value}</p>
                  <ProgressBar
                    value={field.confidence}
                    size="sm"
                    className="mt-1.5"
                    tone={field.confidence >= 70 ? 'accent' : 'atencao'}
                    label={`Confiança em ${field.label}`}
                  />
                </li>
              ))}
            </ul>

            {alreadyImported ? (
              <div className="flex items-center gap-2 rounded-lg bg-good-soft px-3 py-2.5 text-[13px] text-good">
                <CheckCircle2 className="size-4" aria-hidden />
                Já adicionado ao CRM
              </div>
            ) : (
              <Button variant="primary" className="w-full" loading={importing} onClick={importToCrm}>
                <Plus aria-hidden />
                Adicionar ao CRM
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
