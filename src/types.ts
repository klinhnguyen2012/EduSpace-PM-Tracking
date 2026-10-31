type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

type Profile = {
  id: string
  display_name: string
  email: string
  role: string
  created_at: string
}

type TaskStatus = 'todo' | 'in_progress' | 'qa' | 'done' | 'paused'
type TaskPriority = 'P0' | 'P1' | 'P2'

type Task = {
  id: string
  title: string
  description: string | null
  output: string | null
  acceptance_criteria: string[]
  assignee_name: string | null
  assignee_names: string[]
  priority: TaskPriority | null
  status: TaskStatus
  start_date: string | null
  deadline: string | null
  links: string[]
  notes: string | null
  feedback: string | null
  is_blocked: boolean
  blocker_reason: string | null
  source_note: string | null
  attachments: string[]
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type Bug = {
  id: string
  title: string
  description: string | null
  steps_to_reproduce: string | null
  expected_result: string | null
  actual_result: string | null
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'fixed' | 'retesting' | 'closed'
  assignee_id: string | null
  related_task_id: string | null
  environment: 'staging' | 'production' | null
  evidence_link: string | null
  notes: string | null
  test_result: string | null
  attachments: string[]
  test_attachments: string[]
  pic_ids: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Pick<Profile, 'id' | 'display_name' | 'email'> & Partial<Pick<Profile, 'role' | 'created_at'>>>
      tasks: Table<Task, {
        id?: string
        title: string
        description?: string | null
        output?: string | null
        acceptance_criteria?: string[]
        assignee_name?: string | null
        assignee_names?: string[]
        priority?: TaskPriority | null
        status?: TaskStatus
        start_date?: string | null
        deadline?: string | null
        links?: string[]
        notes?: string | null
        feedback?: string | null
        is_blocked?: boolean
        blocker_reason?: string | null
        source_note?: string | null
        attachments?: string[]
        created_by?: string | null
        created_at?: string
        updated_at?: string
        completed_at?: string | null
      }>
      bugs: Table<Bug, {
        id?: string
        title: string
        description?: string | null
        steps_to_reproduce?: string | null
        expected_result?: string | null
        actual_result?: string | null
        severity?: Bug['severity']
        status?: Bug['status']
        assignee_id?: string | null
        related_task_id?: string | null
        environment?: Bug['environment']
        evidence_link?: string | null
        notes?: string | null
        test_result?: string | null
        attachments?: string[]
        test_attachments?: string[]
        pic_ids?: string[]
        created_by?: string | null
        created_at?: string
        updated_at?: string
      }>
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type DashboardPage = 'dashboard' | 'timeline' | 'bugs'

export const pageTitles: Record<DashboardPage, string> = {
  dashboard: 'Dashboard',
  timeline: 'Task Timeline',
  bugs: 'Bug Tracker',
}
