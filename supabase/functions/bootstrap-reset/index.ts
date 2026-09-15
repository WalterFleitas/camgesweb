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
    const bootstrapSecret = Deno.env.get('BOOTSTRAP_SECRET')

    let body: { email?: unknown; password?: unknown; bootstrap_secret?: unknown }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Cuerpo de solicitud inválido' }, 400)
    }

    const provided = body.bootstrap_secret
    if (!bootstrapSecret || typeof provided !== 'string' || provided !== bootstrapSecret) {
      return json({ error: 'No autorizado' }, 401)
    }

    const email = body.email
    const password = body.password
    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$|^[^@\s]+@[^@\s]+$/.test(email)) {
      return json({ error: 'email inválido' }, 400)
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
      return json({ error: 'La contraseña debe tener entre 6 y 72 caracteres' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const target = email.toLowerCase().trim()
    let found: { id: string } | undefined
    for (let page = 1; page <= 20 && !found; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (error) return json({ error: error.message }, 500)
      found = data.users.find((u) => (u.email ?? '').toLowerCase() === target)
      if (data.users.length < 200) break
    }

    if (!found) return json({ error: 'Usuario no encontrado' }, 404)

    const { error: updateError } = await admin.auth.admin.updateUserById(found.id, { password })
    if (updateError) return json({ error: updateError.message }, 400)

    return json({ success: true, user_id: found.id }, 200)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error inesperado' }, 500)
  }
})
