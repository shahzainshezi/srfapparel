-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Option A: Drop existing tables and recreate cleanly (Recommended for fresh setup)
DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;

-- 1. Table: employees
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_employee_number ON public.employees(employee_number);

-- 2. Table: credit_ledger
CREATE TABLE public.credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reference_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast ledger sum lookups
CREATE INDEX idx_credit_ledger_employee_id ON public.credit_ledger(employee_id);

-- 3. Database Function: get_employee_balance
CREATE OR REPLACE FUNCTION public.get_employee_balance(p_employee_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO v_balance
    FROM public.credit_ledger
    WHERE employee_id = p_employee_id;
    
    RETURN v_balance;
END;
$$;

-- 4. Security & Row Level Security (RLS) Setup
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Service role full access on employees" ON public.employees;
DROP POLICY IF EXISTS "Service role full access on credit_ledger" ON public.credit_ledger;

-- Create policies restricting access ONLY to service_role (Next.js backend API)
CREATE POLICY "Service role full access on employees"
    ON public.employees
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access on credit_ledger"
    ON public.credit_ledger
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
