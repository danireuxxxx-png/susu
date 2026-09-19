import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Tooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'

  return (
    <Tooltip content={label}>
      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={label}>
        {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </Button>
    </Tooltip>
  )
}
