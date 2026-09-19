import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'

/**
 * Cada rota vira um chunk proprio: o dashboard nao carrega o Kanban, e as
 * telas sem grafico nao pagam o custo do Recharts.
 */
const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })))
const PipelinePage = lazy(() => import('@/pages/pipeline').then((m) => ({ default: m.PipelinePage })))
const LeadsPage = lazy(() => import('@/pages/leads').then((m) => ({ default: m.LeadsPage })))
const CustomersPage = lazy(() => import('@/pages/customers').then((m) => ({ default: m.CustomersPage })))
const CompaniesPage = lazy(() => import('@/pages/companies').then((m) => ({ default: m.CompaniesPage })))
const CompanyDetailPage = lazy(() =>
  import('@/pages/company-detail').then((m) => ({ default: m.CompanyDetailPage })),
)
const ActivitiesPage = lazy(() => import('@/pages/activities').then((m) => ({ default: m.ActivitiesPage })))
const FinancePage = lazy(() => import('@/pages/finance').then((m) => ({ default: m.FinancePage })))
const GoalsPage = lazy(() => import('@/pages/goals').then((m) => ({ default: m.GoalsPage })))
const AgentsPage = lazy(() => import('@/pages/agents').then((m) => ({ default: m.AgentsPage })))
const WhatsAppAgentPage = lazy(() =>
  import('@/pages/whatsapp-agent').then((m) => ({ default: m.WhatsAppAgentPage })),
)
const MorningBriefingPage = lazy(() =>
  import('@/pages/morning-briefing').then((m) => ({ default: m.MorningBriefingPage })),
)
const SettingsPage = lazy(() => import('@/pages/settings').then((m) => ({ default: m.SettingsPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then((m) => ({ default: m.NotFoundPage })))

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/empresas" element={<CompaniesPage />} />
        <Route path="/empresas/:id" element={<CompanyDetailPage />} />
        <Route path="/atividades" element={<ActivitiesPage />} />
        <Route path="/financeiro" element={<FinancePage />} />
        <Route path="/metas" element={<GoalsPage />} />
        <Route path="/agentes" element={<AgentsPage />} />
        <Route path="/agentes/whatsapp" element={<WhatsAppAgentPage />} />
        <Route path="/jornal-matinal" element={<MorningBriefingPage />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
