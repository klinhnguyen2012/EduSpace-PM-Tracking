export type DashboardPage = 'dashboard' | 'timeline' | 'bugs'

export const pageTitles: Record<DashboardPage, string> = {
  dashboard: 'Dashboard',
  timeline: 'Task Timeline',
  bugs: 'Bug Tracker',
}
