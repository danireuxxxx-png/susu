import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/store/session-provider'
import { ThemeProvider } from '@/store/theme-provider'
import { ToastProvider } from '@/store/toast-provider'
import './index.css'

/**
 * Hospedagens estáticas que não controlam as rotas do servidor (um protótipo
 * publicado, por exemplo) precisam de rotas em hash para o link direto não cair
 * em 404. Em produção o build normal usa o roteador de histórico.
 */
const Router = import.meta.env.VITE_ROUTER === 'hash' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={260} skipDelayDuration={400}>
          <SessionProvider>
            <Router>
              <App />
            </Router>
          </SessionProvider>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
