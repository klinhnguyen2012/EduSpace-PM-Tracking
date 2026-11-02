import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Server configuration missing' }, 500)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
  let deletedTasks = 0
  let deletedBugs = 0
  let retainedForStorageErrors = 0

  const { data: tasks, error: taskReadError } = await admin
    .from('tasks')
    .select('id,attachments')
    .lt('archived_at', cutoff)
    .limit(100)
  if (taskReadError) return json({ error: taskReadError.message }, 500)

  for (const task of tasks ?? []) {
    const paths = task.attachments ?? []
    if (paths.length) {
      const { error } = await admin.storage.from('task-images').remove(paths)
      if (error) {
        console.error('Could not remove archived task images', task.id, error.message)
        retainedForStorageErrors += 1
        continue
      }
    }
    const { error } = await admin.from('tasks').delete().eq('id', task.id).lt('archived_at', cutoff)
    if (error) return json({ error: error.message, deletedTasks, deletedBugs, retainedForStorageErrors }, 500)
    deletedTasks += 1
  }

  const { data: bugs, error: bugReadError } = await admin
    .from('bugs')
    .select('id,attachments,test_attachments')
    .lt('archived_at', cutoff)
    .limit(100)
  if (bugReadError) return json({ error: bugReadError.message }, 500)

  for (const bug of bugs ?? []) {
    const paths = [...(bug.attachments ?? []), ...(bug.test_attachments ?? [])]
    if (paths.length) {
      const { error } = await admin.storage.from('task-images').remove(paths)
      if (error) {
        console.error('Could not remove archived bug images', bug.id, error.message)
        retainedForStorageErrors += 1
        continue
      }
    }
    const { error } = await admin.from('bugs').delete().eq('id', bug.id).lt('archived_at', cutoff)
    if (error) return json({ error: error.message, deletedTasks, deletedBugs, retainedForStorageErrors }, 500)
    deletedBugs += 1
  }

  return json({ deletedTasks, deletedBugs, retainedForStorageErrors, cutoff })
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
