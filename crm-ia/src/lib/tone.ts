export type ProgressTone = 'accent' | 'positivo' | 'atencao' | 'critico'

/** Progresso por severidade: verde perto da meta, âmbar no meio, vermelho atrasado. */
export function toneForProgress(percent: number): ProgressTone {
  if (percent >= 100) return 'positivo'
  if (percent >= 70) return 'accent'
  if (percent >= 40) return 'atencao'
  return 'critico'
}
