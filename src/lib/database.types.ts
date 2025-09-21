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
      agenda_events: {
        Row: {
          id: string
          title: string
          description: string | null
          date: string
          time: string | null
          type: string
          priority: string
          status: string
          reminder_date: string | null
          observations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          date?: string
          time?: string | null
          type?: string
          priority?: string
          status?: string
          reminder_date?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          date?: string
          time?: string | null
          type?: string
          priority?: string
          status?: string
          reminder_date?: string | null
          observations?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      boletos: {
        Row: {
          id: string
          sale_id: string | null
          debt_id: string | null
          client: string
          value: number
          due_date: string
          status: string
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
          is_company_payable: boolean | null
          company_name: string | null
          payment_date: string | null
          interest_paid: number | null
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
          status?: string
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
          is_company_payable?: boolean | null
          company_name?: string | null
          payment_date?: string | null
          interest_paid?: number | null
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
          status?: string
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
          is_company_payable?: boolean | null
          company_name?: string | null
          payment_date?: string | null
          interest_paid?: number | null
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
          type: string
          amount: number
          description: string
          category: string
          related_id: string | null
          payment_method: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          type: string
          amount: number
          description: string
          category: string
          related_id?: string | null
          payment_method?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          type?: string
          amount?: number
          description?: string
          category?: string
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
          status: string
          is_own_check: boolean
          is_company_payable: boolean | null
          company_name: string | null
          payment_date: string | null
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
          status?: string
          is_own_check?: boolean
          is_company_payable?: boolean | null
          company_name?: string | null
          payment_date?: string | null
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
          status?: string
          is_own_check?: boolean
          is_company_payable?: boolean | null
          company_name?: string | null
          payment_date?: string | null
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
      create_sale_errors: {
        Row: {
          id: string
          payload: Json | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          payload?: Json | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          payload?: Json | null
          error_message?: string | null
          created_at?: string
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
          date?: string
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
          payment_method: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          amount?: number
          date?: string
          description?: string | null
          payment_method?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          date?: string
          description?: string | null
          payment_method?: string
          status?: string
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
          status: string
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
          date?: string
          status?: string
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
          status?: string
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
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          hours?: number
          hourly_rate?: number
          total_amount?: number
          date?: string
          description: string
          status?: string
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
          status?: string
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
          payment_date?: string
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
          hire_date?: string
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
      pix_fees: {
        Row: {
          id: string
          date: string
          amount: number
          description: string
          bank: string
          transaction_type: string
          related_transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          amount?: number
          description: string
          bank: string
          transaction_type?: string
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
          transaction_type?: string
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
          products: Json | null
          observations: string | null
          total_value: number
          payment_methods: Json
          received_amount: number
          pending_amount: number
          status: string
          payment_description: string | null
          payment_observations: string | null
          custom_commission_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          delivery_date?: string | null
          client: string
          seller_id?: string | null
          products?: Json | null
          observations?: string | null
          total_value?: number
          payment_methods?: Json
          received_amount?: number
          pending_amount?: number
          status?: string
          payment_description?: string | null
          payment_observations?: string | null
          custom_commission_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          delivery_date?: string | null
          client?: string
          seller_id?: string | null
          products?: Json | null
          observations?: string | null
          total_value?: number
          payment_methods?: Json
          received_amount?: number
          pending_amount?: number
          status?: string
          payment_description?: string | null
          payment_observations?: string | null
          custom_commission_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      taxes: {
        Row: {
          id: string
          date: string
          tax_type: string
          description: string
          amount: number
          due_date: string | null
          payment_method: string
          reference_period: string | null
          document_number: string | null
          observations: string | null
          receipt_file: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          tax_type: string
          description: string
          amount?: number
          due_date?: string | null
          payment_method?: string
          reference_period?: string | null
          document_number?: string | null
          observations?: string | null
          receipt_file?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          tax_type?: string
          description?: string
          amount?: number
          due_date?: string | null
          payment_method?: string
          reference_period?: string | null
          document_number?: string | null
          observations?: string | null
          receipt_file?: string | null
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
      create_sale: {
        Args: {
          payload: Json
        }
        Returns: string
      }
      get_current_cash_balance: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          current_balance: number
          initial_balance: number
          initial_date: string
          last_updated: string
        }[]
      }
      initialize_cash_balance: {
        Args: {
          initial_amount: number
        }
        Returns: string
      }
      recalculate_cash_balance: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  acertos: {
    Row: {
      id: string
      client_name: string
      total_amount: number
      paid_amount: number
      pending_amount: number
      status: string
      payment_date: string | null
      payment_method: string | null
      payment_installments: number | null
      payment_installment_value: number | null
      payment_interval: number | null
      observations: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      client_name: string
      total_amount?: number
      paid_amount?: number
      pending_amount?: number
      status?: string
      payment_date?: string | null
      payment_method?: string | null
      payment_installments?: number | null
      payment_installment_value?: number | null
      payment_interval?: number | null
      observations?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      client_name?: string
      total_amount?: number
      paid_amount?: number
      pending_amount?: number
      status?: string
      payment_date?: string | null
      payment_method?: string | null
      payment_installments?: number | null
      payment_installment_value?: number | null
      payment_interval?: number | null
      observations?: string | null
      created_at?: string
      updated_at?: string
    }
  }
}