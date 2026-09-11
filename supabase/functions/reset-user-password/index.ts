import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Falta el encabezado de autorización' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate caller JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Token inválido' }, 401)

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Confirm caller is admin
    const { data: roleRow, error: roleError } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError) return json({ error: 'No se pudo verificar el rol' }, 500)
    if (!roleRow) return json({ error: 'Solo los administradores pueden restablecer contraseñas' }, 403)

    // Validate body
    let body: { target_user_id?: unknown; new_password?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Cuerpo de solicitud inválido' }, 400)
    }

    const targetUserId = body.target_user_id
    const newPassword = body.new_password
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (typeof targetUserId !== 'string' || !uuidRe.test(targetUserId)) {
      return json({ error: 'target_user_id inválido' }, 400)
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 72) {
      return json({ error: 'La contraseña debe tener entre 6 y 72 caracteres' }, 400)
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    })
    if (updateError) return json({ error: updateError.message }, 400)

    return json({ success: true }, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error inesperado' }, 500)
  }
})
