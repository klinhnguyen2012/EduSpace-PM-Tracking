import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  const appUrl = Deno.env.get('APP_URL') ?? 'https://eduspace-pm-dashboard.vercel.app'
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !emailFrom) {
    return json({ error: 'Thiếu cấu hình email ở Supabase Edge Function.' }, 500)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Chưa đăng nhập.' }, 401)

  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: { user }, error: authError } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Phiên đăng nhập không hợp lệ.' }, 401)

  let body: { event?: string; taskId?: string; recipients?: string[]; eventId?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, 400)
  }
  if (!body.taskId || !body.eventId || !['assigned', 'qa'].includes(body.event ?? '')) {
    return json({ error: 'Thiếu thông tin task hoặc loại thông báo.' }, 400)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select('id,title,status,deadline,assignee_names,assignee_emails,qa_assignee_email')
    .eq('id', body.taskId)
    .maybeSingle()
  if (taskError || !task) return json({ error: 'Không tìm thấy task.' }, 404)

  let recipients: string[]
  let subject: string
  if (body.event === 'qa') {
    if (task.status !== 'qa' || !task.qa_assignee_email) return json({ error: 'Task chưa có người QA hoặc chưa chuyển sang QA.' }, 409)
    recipients = [task.qa_assignee_email]
    subject = `EduSpace · Cần QA: ${task.title}`
  } else {
    const emailByName: Record<string, string> = {
      Khoa: 'nhkhoa2101@gmail.com',
      Chiến: 'phungtrongchien102@gmail.com',
      Trân: 'tranbui.290703@gmail.com',
      Linh: 'klinhnguyen2012@gmail.com',
    }
    const resolvedEmails = task.assignee_emails?.length
      ? task.assignee_emails
      : (task.assignee_names ?? []).map((name: string) => emailByName[name]).filter(Boolean)
    const assignedEmails = new Set(resolvedEmails.map((email: string) => email.toLowerCase()))
    recipients = [...new Set((body.recipients ?? []).map((email) => email.toLowerCase()))]
      .filter((email) => assignedEmails.has(email))
    subject = `EduSpace · Bạn được giao task: ${task.title}`
  }

  if (!recipients.length) return json({ sent: 0 })
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('email,display_name')
    .in('email', recipients)
  if (profileError) return json({ error: 'Không lấy được thông tin thành viên.' }, 500)
  if ((profiles ?? []).length !== recipients.length) {
    return json({ error: 'Một số người nhận chưa có tài khoản EduSpace. Tạo tài khoản email trước khi gửi thông báo.' }, 409)
  }

  let sent = 0
  for (const profile of profiles ?? []) {
    const eventKey = `${body.event}:${body.eventId}:${profile.email.toLowerCase()}`
    const { data: existing } = await admin.from('task_email_notifications')
      .select('id').eq('event_key', eventKey).eq('recipient_email', profile.email).maybeSingle()
    if (existing) continue

    const deadline = task.deadline
      ? new Date(`${task.deadline}T12:00:00+07:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Chưa có deadline'
    const message = body.event === 'qa'
      ? `Chào ${profile.display_name},\n\nTask “${task.title}” đã chuyển sang trạng thái Đang QA và đang chờ bạn kiểm tra.\nDeadline: ${deadline}\n\nMở task: ${appUrl}/task-timeline`
      : `Chào ${profile.display_name},\n\nBạn vừa được giao task “${task.title}”.\nNgười phụ trách: ${(task.assignee_names ?? []).join(', ') || profile.display_name}\nDeadline: ${deadline}\n\nMở task: ${appUrl}/task-timeline`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: emailFrom, to: [profile.email], subject, text: message }),
    })
    if (!response.ok) {
      const detail = await response.text()
      return json({ error: `Không gửi được email tới ${profile.email}: ${detail}` }, 502)
    }

    const { error: logError } = await admin.from('task_email_notifications').insert({
      task_id: task.id,
      event_key: eventKey,
      recipient_email: profile.email,
    })
    if (logError) return json({ error: 'Email đã gửi nhưng chưa ghi nhận được lịch sử gửi.' }, 500)
    sent += 1
  }

  return json({ sent })
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
