import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateApiAuth } from '@/lib/apiAuth'

// POST /api/credits/grant - Add/Grant credits to an employee (Secured)
export async function POST(request: Request) {
  const authErrorResponse = validateApiAuth(request)
  if (authErrorResponse) return authErrorResponse

  try {
    const body = await request.json()
    const { employee_id, amount, transaction_type = 'annual_grant', reference_note = '' } = body

    if (!employee_id || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'employee_id and amount are required' },
        { status: 400 }
      )
    }

    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Verify employee exists
    const { data: employee, error: empError } = await supabaseAdmin
      .from('employees')
      .select('id, status')
      .eq('id', employee_id)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (employee.status !== 'active') {
      return NextResponse.json(
        { error: `Employee is not active (status: ${employee.status})` },
        { status: 400 }
      )
    }

    // Insert positive ledger entry
    const { data: transaction, error: ledgerError } = await supabaseAdmin
      .from('credit_ledger')
      .insert([
        {
          employee_id,
          amount: parsedAmount,
          transaction_type,
          reference_note,
        },
      ])
      .select()
      .single()

    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 400 })
    }

    // Fetch updated balance
    const { data: newBalance } = await supabaseAdmin
      .rpc('get_employee_balance', { p_employee_id: employee_id })

    return NextResponse.json({
      success: true,
      message: `Granted $${parsedAmount} to employee`,
      transaction,
      new_balance: Number(newBalance || 0),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
