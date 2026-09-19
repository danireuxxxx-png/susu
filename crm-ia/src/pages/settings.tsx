import * as Tabs from '@radix-ui/react-tabs'
import { Building2, CalendarClock, Mail, MessageSquareText, Upload, Workflow } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { Switch } from '@/components/ui/switch'
import { useCrmData } from '@/hooks/use-crm'
import { useTheme } from '@/hooks/use-theme'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const TAB_TRIGGER = cn(
  'relative px-1 pb-2.5 text-[13px] font-medium text-fg-muted transition-colors duration-150',
  'hover:text-fg data-[state=active]:text-fg',
  'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-transparent',
  'data-[state=active]:after:bg-accent',
)

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Recebe as conversas e alimenta o agente de captação.',
    icon: MessageSquareText,
  },
  { id: 'crm', name: 'CRM externo', description: 'Sincroniza contas e negócios com outro CRM.', icon: Workflow },
  { id: 'email', name: 'E-mail', description: 'Registra e-mails enviados na timeline da oportunidade.', icon: Mail },
  {
    id: 'calendar',
    name: 'Calendário',
    description: 'Cria reuniões direto na agenda do time comercial.',
    icon: CalendarClock,
  },
]

export function SettingsPage() {
  const { currentUser } = useCrmData()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
  })
  const [company, setCompany] = useState({
    name: 'Nexo Inteligência Artificial LTDA',
    cnpj: '48.221.905/0001-32',
    site: 'www.nexo.ai',
  })
  const [preferences, setPreferences] = useState({
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    emailNotifications: true,
    whatsappNotifications: true,
    briefingNotifications: true,
    weeklyDigest: false,
  })

  function notifySaved(section: string) {
    toast({
      title: `${section} salvo`,
      description: 'A persistência real entra com o backend — por enquanto vale para esta sessão.',
      tone: 'sucesso',
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Configurações" description="Perfil, empresa, preferências e integrações do workspace." />

      <Tabs.Root defaultValue="perfil">
        <Tabs.List className="flex gap-5 overflow-x-auto border-b border-line scrollbar-thin">
          <Tabs.Trigger value="perfil" className={TAB_TRIGGER}>
            Perfil
          </Tabs.Trigger>
          <Tabs.Trigger value="empresa" className={TAB_TRIGGER}>
            Empresa
          </Tabs.Trigger>
          <Tabs.Trigger value="preferencias" className={TAB_TRIGGER}>
            Preferências
          </Tabs.Trigger>
          <Tabs.Trigger value="integracoes" className={TAB_TRIGGER}>
            Integrações
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="perfil" className="pt-5 focus:outline-none">
          <Card className="max-w-2xl">
            <CardHeader title="Seu perfil" description="Como você aparece para o time dentro do CRM." />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={profile.name} color={currentUser.avatarColor} size="lg" />
                <div>
                  <Button variant="secondary" size="sm" onClick={() => notifySaved('Avatar')}>
                    <Upload aria-hidden />
                    Trocar avatar
                  </Button>
                  <p className="mt-1.5 text-[12px] text-fg-subtle">PNG ou JPG até 2 MB.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" htmlFor="profile-name">
                  <Input
                    id="profile-name"
                    value={profile.name}
                    onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  />
                </Field>
                <Field label="Cargo" htmlFor="profile-role">
                  <Input
                    id="profile-role"
                    value={profile.role}
                    onChange={(event) => setProfile((current) => ({ ...current, role: event.target.value }))}
                  />
                </Field>
                <Field label="E-mail" htmlFor="profile-email" className="sm:col-span-2">
                  <Input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  />
                </Field>
              </div>
            </CardBody>
            <CardFooter>
              <p className="text-[12px] text-fg-subtle">Autenticação real será adicionada depois.</p>
              <Button variant="primary" size="sm" onClick={() => notifySaved('Perfil')}>
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="empresa" className="pt-5 focus:outline-none">
          <Card className="max-w-2xl">
            <CardHeader title="Dados da empresa" description="Aparecem em propostas e no cabeçalho dos relatórios." />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-fg">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <Button variant="secondary" size="sm" onClick={() => notifySaved('Logo')}>
                  <Upload aria-hidden />
                  Enviar logo
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Razão social" htmlFor="company-name" className="sm:col-span-2">
                  <Input
                    id="company-name"
                    value={company.name}
                    onChange={(event) => setCompany((current) => ({ ...current, name: event.target.value }))}
                  />
                </Field>
                <Field label="CNPJ" htmlFor="company-cnpj">
                  <Input
                    id="company-cnpj"
                    value={company.cnpj}
                    onChange={(event) => setCompany((current) => ({ ...current, cnpj: event.target.value }))}
                  />
                </Field>
                <Field label="Website" htmlFor="company-site">
                  <Input
                    id="company-site"
                    value={company.site}
                    onChange={(event) => setCompany((current) => ({ ...current, site: event.target.value }))}
                  />
                </Field>
              </div>
            </CardBody>
            <CardFooter>
              <p className="text-[12px] text-fg-subtle">Um workspace por empresa nesta versão.</p>
              <Button variant="primary" size="sm" onClick={() => notifySaved('Cadastro da empresa')}>
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="preferencias" className="pt-5 focus:outline-none">
          <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Aparência" description="O tema escuro tem paleta própria, não é uma inversão." />
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-fg">Tema</p>
                    <p className="text-[12px] text-fg-muted">Claro ou escuro, aplicado em todo o CRM.</p>
                  </div>
                  <Segmented
                    ariaLabel="Tema da interface"
                    options={[
                      { value: 'light' as const, label: '☀️ Claro' },
                      { value: 'dark' as const, label: '🌙 Escuro' },
                    ]}
                    value={theme}
                    onChange={setTheme}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Moeda" htmlFor="pref-currency">
                    <Select
                      id="pref-currency"
                      value={preferences.currency}
                      onChange={(event) =>
                        setPreferences((current) => ({ ...current, currency: event.target.value }))
                      }
                    >
                      <option value="BRL">Real (R$)</option>
                      <option value="USD">Dólar (US$)</option>
                      <option value="EUR">Euro (€)</option>
                    </Select>
                  </Field>
                  <Field label="Fuso horário" htmlFor="pref-timezone">
                    <Select
                      id="pref-timezone"
                      value={preferences.timezone}
                      onChange={(event) =>
                        setPreferences((current) => ({ ...current, timezone: event.target.value }))
                      }
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/New_York">Nova York (GMT-4)</option>
                    </Select>
                  </Field>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Notificações" description="Onde você quer ser avisado pelo CRM." />
              <CardBody className="space-y-1">
                {[
                  { key: 'emailNotifications' as const, label: 'Alertas por e-mail', hint: 'Propostas respondidas e metas em risco.' },
                  { key: 'whatsappNotifications' as const, label: 'Alertas por WhatsApp', hint: 'Depende da integração oficial.' },
                  { key: 'briefingNotifications' as const, label: 'Jornal matinal', hint: 'Briefing diário às 7h.' },
                  { key: 'weeklyDigest' as const, label: 'Resumo semanal', hint: 'Consolidado toda sexta-feira.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-fg">{item.label}</p>
                      <p className="text-[12px] text-fg-muted">{item.hint}</p>
                    </div>
                    <Switch
                      checked={preferences[item.key]}
                      onCheckedChange={(checked) =>
                        setPreferences((current) => ({ ...current, [item.key]: checked }))
                      }
                      aria-label={item.label}
                    />
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="integracoes" className="pt-5 focus:outline-none">
          <div className="grid max-w-4xl gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((integration) => (
              <article key={integration.id} className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-inset text-fg-muted">
                  <integration.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-fg">{integration.name}</h3>
                    <Badge tone="neutro" size="sm">
                      Em breve
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-fg-muted">{integration.description}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      toast({
                        title: `${integration.name} em breve`,
                        description: 'A conexão será liberada junto com o backend.',
                        tone: 'neutro',
                      })
                    }
                  >
                    Conectar
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
