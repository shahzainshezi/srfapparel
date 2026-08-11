import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateApiAuth } from '@/lib/apiAuth'

// GET /api/employees - List all employees (Secured)
export async function GET(request: Request) {
  const authErrorResponse = validateApiAuth(request)
  if (authErrorResponse) return authErrorResponse

  try {
    const { data: employees, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, employees })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/employees - Register employee with conditional Supabase Auth (Secured)
export async function POST(request: Request) {
  const authErrorResponse = validateApiAuth(request)
  if (authErrorResponse) return authErrorResponse

  try {
    const body = await request.json()
    const {
      employee_number,
      first_name,
      last_name,
      email,
      password,
      status = 'active',
    } = body

    if (!employee_number || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'employee_number, first_name, and last_name are required' },
        { status: 400 }
      )
    }

    let authUserId: string | null = null
    let authMethodUsed: 'password' | 'invite' | 'none' = 'none'

    // Conditional Auth Creation if email is provided
    if (email && email.trim() !== '') {
      if (password && password.trim() !== '') {
        // Option 1: Create user with provided password
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password.trim(),
            email_confirm: true,
            user_metadata: { first_name, last_name, employee_number },
          })

        if (authError) {
          return NextResponse.json(
            { error: `Supabase Auth Error: ${authError.message}` },
            { status: 400 }
          )
        }

        authUserId = authData.user?.id || null
        authMethodUsed = 'password'
      } else {
        // Option 2: No password provided -> Send Magic Invite Link via email
        const { data: inviteData, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
            data: { first_name, last_name, employee_number },
          })

        if (inviteError) {
          return NextResponse.json(
            { error: `Supabase Auth Invite Error: ${inviteError.message}` },
            { status: 400 }
          )
        }

        authUserId = inviteData.user?.id || null
        authMethodUsed = 'invite'
      }
    }

    // Insert into public.employees table with the newly created user_id
    const { data: employeeData, error: dbError } = await supabaseAdmin
      .from('employees')
      .insert([
        {
          employee_number,
          first_name,
          last_name,
          status,
          user_id: authUserId,
        },
      ])
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message:
          authMethodUsed === 'invite'
            ? 'Employee created and magic invite link sent to email.'
            : authMethodUsed === 'password'
            ? 'Employee created with password authentication.'
            : 'Employee record created without auth account.',
        auth_method: authMethodUsed,
        employee: employeeData,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
