import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CrmProvider } from '@/store/crm-provider'
import { ThemeProvider } from '@/store/theme-provider'
import { ToastProvider } from '@/store/toast-provider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <TooltipProvider delayDuration={260} skipDelayDuration={400}>
          <CrmProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </CrmProvider>
        </TooltipProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
