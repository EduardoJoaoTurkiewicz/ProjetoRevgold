import { createClient } from 'npm:@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    const { data: dueInstallments, error: installmentsError } = await supabase
      .from('credit_card_sale_installments')
      .select('*, credit_card_sales(*)')
      .eq('status', 'pending')
      .lte('due_date', today);

    if (installmentsError) throw installmentsError;

    for (const installment of dueInstallments || []) {
      await supabase
        .from('credit_card_sale_installments')
        .update({
          status: 'received',
          received_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', installment.id);

      await supabase
        .from('cash_transactions')
        .insert({
          date: today,
          type: 'income',
          amount: installment.amount,
          description: `Recebimento cartão - ${installment.credit_card_sales.client_name} (${installment.installment_number}/${installment.credit_card_sales.installments})`,
          category: 'Vendas',
          payment_method: 'Cartão de Crédito',
        });
    }

    const { data: dueDebts, error: debtsError } = await supabase
      .from('credit_card_debt_installments')
      .select('*, credit_card_debts(*)')
      .eq('status', 'pending')
      .lte('due_date', today);

    if (debtsError) throw debtsError;

    for (const installment of dueDebts || []) {
      await supabase
        .from('credit_card_debt_installments')
        .update({
          status: 'paid',
          paid_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', installment.id);

      await supabase
        .from('cash_transactions')
        .insert({
          date: today,
          type: 'expense',
          amount: installment.amount,
          description: `Pagamento cartão - ${installment.credit_card_debts.supplier_name} (${installment.installment_number}/${installment.credit_card_debts.installments})`,
          category: 'Dívidas',
          payment_method: 'Cartão de Crédito',
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: {
          sales: dueInstallments?.length || 0,
          debts: dueDebts?.length || 0,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});