import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateApiAuth } from '@/lib/apiAuth'

// GET /api/credits/balance?employee_id=... OR ?employee_number=... (Secured)
export async function GET(request: Request) {
  const authErrorResponse = validateApiAuth(request)
  if (authErrorResponse) return authErrorResponse

  try {
    const { searchParams } = new URL(request.url)
    let employeeId = searchParams.get('employee_id')
    const employeeNumber = searchParams.get('employee_number')

    if (!employeeId && !employeeNumber) {
      return NextResponse.json(
        { error: 'Either employee_id or employee_number query parameter is required' },
        { status: 400 }
      )
    }

    // If employee_number is provided, lookup the employee_id
    if (!employeeId && employeeNumber) {
      const { data: emp, error: empError } = await supabaseAdmin
        .from('employees')
        .select('id, first_name, last_name, employee_number, status')
        .eq('employee_number', employeeNumber)
        .single()

      if (empError || !emp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      employeeId = emp.id
    }

    // 1. Fetch employee details
    const { data: employee, error: empFetchError } = await supabaseAdmin
      .from('employees')
      .select('id, first_name, last_name, employee_number, status')
      .eq('id', employeeId!)
      .single()

    if (empFetchError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // 2. Call the database function get_employee_balance
    const { data: balance, error: rpcError } = await supabaseAdmin
      .rpc('get_employee_balance', { p_employee_id: employeeId! })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    // 3. Fetch recent ledger history
    const { data: history } = await supabaseAdmin
      .from('credit_ledger')
      .select('*')
      .eq('employee_id', employeeId!)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      employee,
      balance: Number(balance || 0),
      recent_transactions: history || [],
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
