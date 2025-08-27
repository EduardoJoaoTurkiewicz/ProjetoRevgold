export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boletos: {
        Row: {
          id: string
          sale_id: string | null
          client: string
          value: number
          due_date: string
          status: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago'
          installment_number: number
          total_installments: number
          boleto_file: string | null
          observations: string | null
          overdue_action: string | null
          interest_amount: number | null
          penalty_amount: number | null
          notary_costs: number | null
          final_amount: number | null
          overdue_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id?: string | null
          client: string
          value?: number
          due_date: string
          status?: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago'
          installment_number?: number
          total_installments?: number
          boleto_file?: string | null
          observations?: string | null
          overdue_action?: string | null
          interest_amount?: number | null
          penalty_amount?: number | null
          notary_costs?: number | null
          final_amount?: number | null
          overdue_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string | null
          client?: string
          value?: number
          due_date?: string
          status?: 'pendente' | 'compensado' | 'vencido' | 'cancelado' | 'nao_pago'
          installment_number?: number
          total_installments?: number
          boleto_file?: string | null
          observations?: string | null
          overdue_action?: string | null
          interest_amount?: number | null
          penalty_amount?: number | null
          notary_costs?: number | null
          final_amount?: number | null
          overdue_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cash_balances: {
        Row: {
          id: string
          current_balance: number
          initial_balance: number
          initial_date: string
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          current_balance?: number
          initial_balance?: number
          initial_date?: string
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          current_balance?: number
          initial_balance?: number
          initial_date?: string
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      cash_transactions: {
        Row: {
          id: string
          date: string
          type: 'entrada' | 'saida'
          amount: number
          description: string
          category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro'
          related_id: string | null
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          type: 'entrada' | 'saida'
          amount?: number
          description: string
          category: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro'
          related_id?: string | null
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          type?: 'entrada' | 'saida'
          amount?: number
          description?: string
          category?: 'venda' | 'divida' | 'adiantamento' | 'salario' | 'comissao' | 'cheque' | 'boleto' | 'outro'
          related_id?: string | null
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checks: {
        Row: {
          id: string
          sale_id: string | null
          debt_id: string | null
          client: string
          value: number
          due_date: string
          status: 'pendente' | 'compensado' | 'devolvido' | 'reapresentado'
          is_own_check: boolean
          observations: string | null
          used_for: string | null
          installment_number: number | null
          total_installments: number | null
          front_image: string | null
          back_image: string | null
          selected_available_checks: Json | null
          used_in_debt: string | null
          discount_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id?: string | null
          debt_id?: string | null
          client: string
          value?: number
          due_date: string
          status?: 'pendente' | 'compensado' | 'devolvido' | 'reapresentado'
          is_own_check?: boolean
          observations?: string | null
          used_for?: string | null
          installment_number?: number | null
          total_installments?: number | null
          front_image?: string | null
          back_image?: string | null
          selected_available_checks?: Json | null
          used_in_debt?: string | null
          discount_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string | null
          debt_id?: string | null
          client?: string
          value?: number
          due_date?: string
          status?: 'pendente' | 'compensado' | 'devolvido' | 'reapresentado'
          is_own_check?: boolean
          observations?: string | null
          used_for?: string | null
          installment_number?: number | null
          total_installments?: number | null
          front_image?: string | null
          back_image?: string | null
          selected_available_checks?: Json | null
          used_in_debt?: string | null
          discount_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          date: string
          description: string
          company: string
          total_value: number
          payment_methods: Json
          is_paid: boolean
          paid_amount: number
          pending_amount: number
          checks_used: Json | null
          payment_description: string | null
          debt_payment_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          description: string
          company: string
          total_value?: number
          payment_methods?: Json
          is_paid?: boolean
          paid_amount?: number
          pending_amount?: number
          checks_used?: Json | null
          payment_description?: string | null
          debt_payment_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          description?: string
          company?: string
          total_value?: number
          payment_methods?: Json
          is_paid?: boolean
          paid_amount?: number
          pending_amount?: number
          checks_used?: Json | null
          payment_description?: string | null
          debt_payment_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_advances: {
        Row: {
          id: string
          employee_id: string
          amount: number
          date: string
          description: string | null
          payment_method: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha'
          status: 'pendente' | 'descontado'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          amount?: number
          date: string
          description?: string | null
          payment_method?: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha'
          status?: 'pendente' | 'descontado'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          date?: string
          description?: string | null
          payment_method?: 'dinheiro' | 'pix' | 'transferencia' | 'desconto_folha'
          status?: 'pendente' | 'descontado'
          created_at?: string
          updated_at?: string
        }
      }
      employee_commissions: {
        Row: {
          id: string
          employee_id: string
          sale_id: string
          sale_value: number
          commission_rate: number
          commission_amount: number
          date: string
          status: 'pendente' | 'pago'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          sale_id: string
          sale_value?: number
          commission_rate?: number
          commission_amount?: number
          date: string
          status?: 'pendente' | 'pago'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          sale_id?: string
          sale_value?: number
          commission_rate?: number
          commission_amount?: number
          date?: string
          status?: 'pendente' | 'pago'
          created_at?: string
          updated_at?: string
        }
      }
      employee_overtimes: {
        Row: {
          id: string
          employee_id: string
          hours: number
          hourly_rate: number
          total_amount: number
          date: string
          description: string
          status: 'pendente' | 'pago'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          hours?: number
          hourly_rate?: number
          total_amount?: number
          date: string
          description: string
          status?: 'pendente' | 'pago'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          hours?: number
          hourly_rate?: number
          total_amount?: number
          date?: string
          description?: string
          status?: 'pendente' | 'pago'
          created_at?: string
          updated_at?: string
        }
      }
      employee_payments: {
        Row: {
          id: string
          employee_id: string
          amount: number
          payment_date: string
          is_paid: boolean
          receipt: string | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          amount?: number
          payment_date: string
          is_paid?: boolean
          receipt?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          payment_date?: string
          is_paid?: boolean
          receipt?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          position: string
          is_seller: boolean
          salary: number
          payment_day: number
          next_payment_date: string | null
          is_active: boolean
          hire_date: string
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position: string
          is_seller?: boolean
          salary?: number
          payment_day?: number
          next_payment_date?: string | null
          is_active?: boolean
          hire_date: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          position?: string
          is_seller?: boolean
          salary?: number
          payment_day?: number
          next_payment_date?: string | null
          is_active?: boolean
          hire_date?: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      installments: {
        Row: {
          id: string
          sale_id: string | null
          debt_id: string | null
          amount: number
          due_date: string
          is_paid: boolean
          type: 'venda' | 'divida'
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sale_id?: string | null
          debt_id?: string | null
          amount?: number
          due_date: string
          is_paid?: boolean
          type: 'venda' | 'divida'
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_id?: string | null
          debt_id?: string | null
          amount?: number
          due_date?: string
          is_paid?: boolean
          type?: 'venda' | 'divida'
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      pix_fees: {
        Row: {
          id: string
          date: string
          amount: number
          description: string
          bank: string
          transaction_type: 'pix_out' | 'pix_in' | 'ted' | 'doc' | 'other'
          related_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          amount?: number
          description: string
          bank: string
          transaction_type?: 'pix_out' | 'pix_in' | 'ted' | 'doc' | 'other'
          related_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          amount?: number
          description?: string
          bank?: string
          transaction_type?: 'pix_out' | 'pix_in' | 'ted' | 'doc' | 'other'
          related_transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          date: string
          delivery_date: string | null
          client: string
          seller_id: string | null
          products: string | null
          observations: string | null
          total_value: number
          payment_methods: Json
          received_amount: number
          pending_amount: number
          status: 'pago' | 'pendente' | 'parcial'
          payment_description: string | null
          payment_observations: string | null
          custom_commission_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          delivery_date?: string | null
          client: string
          seller_id?: string | null
          products?: string | null
          observations?: string | null
          total_value?: number
          payment_methods?: Json
          received_amount?: number
          pending_amount?: number
          status?: 'pago' | 'pendente' | 'parcial'
          payment_description?: string | null
          payment_observations?: string | null
          custom_commission_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          delivery_date?: string | null
          client?: string
          seller_id?: string | null
          products?: string | null
          observations?: string | null
          total_value?: number
          payment_methods?: Json
          received_amount?: number
          pending_amount?: number
          status?: 'pago' | 'pendente' | 'parcial'
          payment_description?: string | null
          payment_observations?: string | null
          custom_commission_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      third_party_check_details: {
        Row: {
          id: string
          check_id: string
          bank: string
          agency: string
          account: string
          check_number: string
          issuer: string
          cpf_cnpj: string
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          check_id: string
          bank: string
          agency: string
          account: string
          check_number: string
          issuer: string
          cpf_cnpj: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          check_id?: string
          bank?: string
          agency?: string
          account?: string
          check_number?: string
          issuer?: string
          cpf_cnpj?: string
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}