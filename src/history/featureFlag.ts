/** Opt-in development slice. Production builds always retain the legacy path. */
export function selectedTaskHistoryEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_SELECTED_TASK_HISTORY === 'true'
}
