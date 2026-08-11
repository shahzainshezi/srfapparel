import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateApiAuth } from '@/lib/apiAuth'

// POST /api/credits/deduct - Deduct credits from an employee (Secured)
export async function POST(request: Request) {
  const authErrorResponse = validateApiAuth(request)
  if (authErrorResponse) return authErrorResponse

  try {
    const body = await request.json()
    const { employee_id, amount, reference_note = 'e-commerce purchase' } = body

    if (!employee_id || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'employee_id and amount are required' },
        { status: 400 }
      )
    }

    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number to deduct' },
        { status: 400 }
      )
    }

    // 1. Check current employee balance
    const { data: currentBalanceData, error: balanceError } = await supabaseAdmin
      .rpc('get_employee_balance', { p_employee_id: employee_id })

    if (balanceError) {
      return NextResponse.json({ error: balanceError.message }, { status: 400 })
    }

    const currentBalance = Number(currentBalanceData || 0)

    if (currentBalance < parsedAmount) {
      return NextResponse.json(
        {
          error: 'Insufficient credit balance',
          current_balance: currentBalance,
          requested_deduction: parsedAmount,
        },
        { status: 400 }
      )
    }

    // 2. Insert negative ledger entry (-parsedAmount)
    const { data: transaction, error: ledgerError } = await supabaseAdmin
      .from('credit_ledger')
      .insert([
        {
          employee_id,
          amount: -parsedAmount,
          transaction_type: 'purchase',
          reference_note,
        },
      ])
      .select()
      .single()

    if (ledgerError) {
      return NextResponse.json({ error: ledgerError.message }, { status: 400 })
    }

    // 3. Fetch new updated balance
    const { data: newBalance } = await supabaseAdmin
      .rpc('get_employee_balance', { p_employee_id: employee_id })

    return NextResponse.json({
      success: true,
      message: `Successfully deducted $${parsedAmount} from credit balance`,
      transaction,
      new_balance: Number(newBalance || 0),
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
