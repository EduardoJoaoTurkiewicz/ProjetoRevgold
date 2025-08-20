import { 
  Sale, 
  Debt, 
  Check, 
  Boleto, 
  Employee, 
  EmployeePayment, 
  EmployeeAdvance, 
  EmployeeOvertime, 
  EmployeeCommission,
  Installment,
  User 
} from '../types';

export interface AppData {
  user: User | null;
  sales: Sale[];
  debts: Debt[];
  checks: Check[];
  boletos: Boleto[];
  installments: Installment[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  employeeAdvances: EmployeeAdvance[];
  employeeOvertimes: EmployeeOvertime[];
  employeeCommissions: EmployeeCommission[];
  lastSync: string;
  version: string;
}

const STORAGE_KEY = 'revgold-data';
const BACKUP_KEY = 'revgold-backup';
const CURRENT_VERSION = '2.0.0';

// Sistema de armazenamento robusto
export class RobustStorage {
  private static instance: RobustStorage;
  private data: AppData;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.data = this.getDefaultData();
  }

  public static getInstance(): RobustStorage {
    if (!RobustStorage.instance) {
      RobustStorage.instance = new RobustStorage();
    }
    return RobustStorage.instance;
  }

  private getDefaultData(): AppData {
    return {
      user: null,
      sales: [],
      debts: [],
      checks: [],
      boletos: [],
      installments: [],
      employees: [],
      employeePayments: [],
      employeeAdvances: [],
      employeeOvertimes: [],
      employeeCommissions: [],
      lastSync: new Date().toISOString(),
      version: CURRENT_VERSION
    };
  }

  // Inicializar sistema de armazenamento
  public async initialize(): Promise<AppData> {
    if (this.isInitialized) {
      return this.data;
    }

    console.log('🔄 Inicializando sistema de armazenamento robusto...');

    try {
      // Tentar carregar dados principais
      const savedData = this.loadFromStorage(STORAGE_KEY);
      
      if (savedData) {
        // Verificar se precisa de migração de versão
        if (this.needsMigration(savedData)) {
          console.log('🔄 Migrando dados para nova versão...');
          this.data = this.migrateData(savedData);
          await this.save();
        } else {
          this.data = savedData;
        }
        console.log('✅ Dados carregados do localStorage:', {
          sales: this.data.sales.length,
          debts: this.data.debts.length,
          checks: this.data.checks.length,
          boletos: this.data.boletos.length,
          employees: this.data.employees.length
        });
      } else {
        // Tentar carregar backup se dados principais não existem
        const backupData = this.loadFromStorage(BACKUP_KEY);
        if (backupData) {
          console.log('🔄 Restaurando dados do backup...');
          this.data = backupData;
          await this.save(); // Salvar como dados principais
        } else {
          console.log('📱 Iniciando com dados vazios');
          this.data = this.getDefaultData();
        }
      }

      // Criar backup inicial se não existe
      this.createBackup();
      
      this.isInitialized = true;
      return this.data;
    } catch (error) {
      console.error('❌ Erro ao inicializar armazenamento:', error);
      
      // Tentar recuperar do backup em caso de erro
      try {
        const backupData = this.loadFromStorage(BACKUP_KEY);
        if (backupData) {
          console.log('🔄 Recuperando dados do backup após erro...');
          this.data = backupData;
          this.isInitialized = true;
          return this.data;
        }
      } catch (backupError) {
        console.error('❌ Erro ao carregar backup:', backupError);
      }
      
      // Se tudo falhar, usar dados padrão
      this.data = this.getDefaultData();
      this.isInitialized = true;
      return this.data;
    }
  }

  // Carregar dados do localStorage com validação
  private loadFromStorage(key: string): AppData | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Validar estrutura básica
      if (!parsed || typeof parsed !== 'object') {
        console.warn('⚠️ Dados inválidos encontrados no localStorage');
        return null;
      }

      // Garantir que arrays existem
      const validatedData: AppData = {
        user: parsed.user || null,
        sales: Array.isArray(parsed.sales) ? parsed.sales : [],
        debts: Array.isArray(parsed.debts) ? parsed.debts : [],
        checks: Array.isArray(parsed.checks) ? parsed.checks : [],
        boletos: Array.isArray(parsed.boletos) ? parsed.boletos : [],
        installments: Array.isArray(parsed.installments) ? parsed.installments : [],
        employees: Array.isArray(parsed.employees) ? parsed.employees : [],
        employeePayments: Array.isArray(parsed.employeePayments) ? parsed.employeePayments : [],
        employeeAdvances: Array.isArray(parsed.employeeAdvances) ? parsed.employeeAdvances : [],
        employeeOvertimes: Array.isArray(parsed.employeeOvertimes) ? parsed.employeeOvertimes : [],
        employeeCommissions: Array.isArray(parsed.employeeCommissions) ? parsed.employeeCommissions : [],
        lastSync: parsed.lastSync || new Date().toISOString(),
        version: parsed.version || '1.0.0'
      };

      return validatedData;
    } catch (error) {
      console.error(`❌ Erro ao carregar dados de ${key}:`, error);
      return null;
    }
  }

  // Verificar se precisa migração
  private needsMigration(data: AppData): boolean {
    return !data.version || data.version !== CURRENT_VERSION;
  }

  // Migrar dados para nova versão
  private migrateData(oldData: any): AppData {
    console.log(`🔄 Migrando dados da versão ${oldData.version || '1.0.0'} para ${CURRENT_VERSION}`);
    
    // Aplicar migrações necessárias baseadas na versão
    let migratedData = { ...oldData };
    
    // Migração para versão 2.0.0 - garantir que todos os campos existem
    if (!oldData.version || oldData.version < '2.0.0') {
      // Garantir que todos os arrays existem
      migratedData = {
        ...migratedData,
        sales: Array.isArray(migratedData.sales) ? migratedData.sales : [],
        debts: Array.isArray(migratedData.debts) ? migratedData.debts : [],
        checks: Array.isArray(migratedData.checks) ? migratedData.checks : [],
        boletos: Array.isArray(migratedData.boletos) ? migratedData.boletos : [],
        installments: Array.isArray(migratedData.installments) ? migratedData.installments : [],
        employees: Array.isArray(migratedData.employees) ? migratedData.employees : [],
        employeePayments: Array.isArray(migratedData.employeePayments) ? migratedData.employeePayments : [],
        employeeAdvances: Array.isArray(migratedData.employeeAdvances) ? migratedData.employeeAdvances : [],
        employeeOvertimes: Array.isArray(migratedData.employeeOvertimes) ? migratedData.employeeOvertimes : [],
        employeeCommissions: Array.isArray(migratedData.employeeCommissions) ? migratedData.employeeCommissions : [],
        version: CURRENT_VERSION,
        lastSync: new Date().toISOString()
      };
      
      // Migrar vendas antigas que podem não ter todos os campos
      migratedData.sales = migratedData.sales.map((sale: any) => ({
        ...sale,
        customCommissionRate: sale.customCommissionRate || 5,
        paymentObservations: sale.paymentObservations || '',
        createdAt: sale.createdAt || new Date().toISOString()
      }));
      
      // Migrar funcionários antigos
      migratedData.employees = migratedData.employees.map((employee: any) => ({
        ...employee,
        isSeller: employee.isSeller || false,
        isActive: employee.isActive !== false,
        createdAt: employee.createdAt || new Date().toISOString()
      }));
    }
    
    console.log('✅ Migração concluída');
    return migratedData;
  }

  // Salvar dados com debounce
  public async save(): Promise<void> {
    // Cancelar save anterior se existir
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce para evitar muitas escritas
    this.saveTimeout = setTimeout(() => {
      this.performSave();
    }, 500);
  }

  // Executar salvamento
  private async performSave(): Promise<void> {
    try {
      this.data.lastSync = new Date().toISOString();
      this.data.version = CURRENT_VERSION;
      
      const dataToSave = JSON.stringify(this.data);
      
      // Salvar dados principais
      localStorage.setItem(STORAGE_KEY, dataToSave);
      
      // Criar backup a cada 5 salvamentos ou se não existe
      const shouldBackup = !localStorage.getItem(BACKUP_KEY) || 
                          Math.random() < 0.2; // 20% de chance de backup
      
      if (shouldBackup) {
        this.createBackup();
      }
      
      console.log('💾 Dados salvos com sucesso:', {
        size: `${(dataToSave.length / 1024).toFixed(1)}KB`,
        timestamp: this.data.lastSync,
        sales: this.data.sales.length,
        debts: this.data.debts.length,
        checks: this.data.checks.length,
        boletos: this.data.boletos.length,
        employees: this.data.employees.length
      });
      
      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent('revgold-data-saved', {
        detail: {
          timestamp: this.data.lastSync,
          size: dataToSave.length
        }
      }));
      
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      
      // Tentar limpar dados corrompidos e salvar novamente
      if (error instanceof Error && error.message.includes('quota')) {
        console.log('🔄 Quota excedida - limpando dados antigos...');
        this.cleanOldData();
        
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          console.log('✅ Dados salvos após limpeza');
        } catch (retryError) {
          console.error('❌ Erro mesmo após limpeza:', retryError);
        }
      }
    }
  }

  // Criar backup dos dados
  private createBackup(): void {
    try {
      const backupData = {
        ...this.data,
        backupDate: new Date().toISOString()
      };
      
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
      console.log('💾 Backup criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
    }
  }

  // Limpar dados antigos para liberar espaço
  private cleanOldData(): void {
    try {
      // Manter apenas os últimos 6 meses de dados
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoffDate = sixMonthsAgo.toISOString().split('T')[0];
      
      const originalCounts = {
        sales: this.data.sales.length,
        debts: this.data.debts.length,
        checks: this.data.checks.length,
        boletos: this.data.boletos.length,
        employeePayments: this.data.employeePayments.length
      };
      
      // Filtrar dados antigos
      this.data.sales = this.data.sales.filter(sale => sale.date >= cutoffDate);
      this.data.debts = this.data.debts.filter(debt => debt.date >= cutoffDate);
      this.data.checks = this.data.checks.filter(check => check.dueDate >= cutoffDate);
      this.data.boletos = this.data.boletos.filter(boleto => boleto.dueDate >= cutoffDate);
      this.data.employeePayments = this.data.employeePayments.filter(payment => payment.paymentDate >= cutoffDate);
      this.data.employeeAdvances = this.data.employeeAdvances.filter(advance => advance.date >= cutoffDate);
      this.data.employeeOvertimes = this.data.employeeOvertimes.filter(overtime => overtime.date >= cutoffDate);
      this.data.employeeCommissions = this.data.employeeCommissions.filter(commission => commission.date >= cutoffDate);
      
      // Remover parcelas órfãs
      const validSaleIds = new Set(this.data.sales.map(s => s.id));
      const validDebtIds = new Set(this.data.debts.map(d => d.id));
      this.data.installments = this.data.installments.filter(installment => 
        (installment.saleId && validSaleIds.has(installment.saleId)) ||
        (installment.debtId && validDebtIds.has(installment.debtId))
      );
      
      console.log('🧹 Limpeza de dados concluída:', {
        sales: `${originalCounts.sales} → ${this.data.sales.length}`,
        debts: `${originalCounts.debts} → ${this.data.debts.length}`,
        checks: `${originalCounts.checks} → ${this.data.checks.length}`,
        boletos: `${originalCounts.boletos} → ${this.data.boletos.length}`,
        payments: `${originalCounts.employeePayments} → ${this.data.employeePayments.length}`
      });
      
    } catch (error) {
      console.error('❌ Erro na limpeza de dados:', error);
    }
  }

  // Obter todos os dados
  public getData(): AppData {
    return { ...this.data };
  }

  // Atualizar dados
  public updateData(updates: Partial<AppData>): void {
    this.data = {
      ...this.data,
      ...updates,
      lastSync: new Date().toISOString()
    };
    
    this.save();
  }

  // Métodos específicos para cada entidade
  public addSale(sale: Sale): void {
    this.data.sales.push(sale);
    this.save();
  }

  public updateSale(sale: Sale): void {
    const index = this.data.sales.findIndex(s => s.id === sale.id);
    if (index !== -1) {
      this.data.sales[index] = sale;
      this.save();
    }
  }

  public deleteSale(id: string): void {
    this.data.sales = this.data.sales.filter(s => s.id !== id);
    // Remover dados relacionados
    this.data.installments = this.data.installments.filter(i => i.saleId !== id);
    this.data.employeeCommissions = this.data.employeeCommissions.filter(c => c.saleId !== id);
    this.data.checks = this.data.checks.filter(c => c.saleId !== id);
    this.data.boletos = this.data.boletos.filter(b => b.saleId !== id);
    this.save();
  }

  public addDebt(debt: Debt): void {
    this.data.debts.push(debt);
    this.save();
  }

  public updateDebt(debt: Debt): void {
    const index = this.data.debts.findIndex(d => d.id === debt.id);
    if (index !== -1) {
      this.data.debts[index] = debt;
      this.save();
    }
  }

  public deleteDebt(id: string): void {
    this.data.debts = this.data.debts.filter(d => d.id !== id);
    // Remover dados relacionados
    this.data.installments = this.data.installments.filter(i => i.debtId !== id);
    this.data.checks = this.data.checks.filter(c => c.debtId !== id);
    this.save();
  }

  public addCheck(check: Check): void {
    this.data.checks.push(check);
    this.save();
  }

  public updateCheck(check: Check): void {
    const index = this.data.checks.findIndex(c => c.id === check.id);
    if (index !== -1) {
      this.data.checks[index] = check;
      this.save();
    }
  }

  public deleteCheck(id: string): void {
    this.data.checks = this.data.checks.filter(c => c.id !== id);
    this.save();
  }

  public addBoleto(boleto: Boleto): void {
    this.data.boletos.push(boleto);
    this.save();
  }

  public updateBoleto(boleto: Boleto): void {
    const index = this.data.boletos.findIndex(b => b.id === boleto.id);
    if (index !== -1) {
      this.data.boletos[index] = boleto;
      this.save();
    }
  }

  public deleteBoleto(id: string): void {
    this.data.boletos = this.data.boletos.filter(b => b.id !== id);
    this.save();
  }

  public addEmployee(employee: Employee): void {
    this.data.employees.push(employee);
    this.save();
  }

  public updateEmployee(employee: Employee): void {
    const index = this.data.employees.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      this.data.employees[index] = employee;
      this.save();
    }
  }

  public deleteEmployee(id: string): void {
    this.data.employees = this.data.employees.filter(e => e.id !== id);
    // Remover dados relacionados
    this.data.employeePayments = this.data.employeePayments.filter(p => p.employeeId !== id);
    this.data.employeeAdvances = this.data.employeeAdvances.filter(a => a.employeeId !== id);
    this.data.employeeOvertimes = this.data.employeeOvertimes.filter(o => o.employeeId !== id);
    this.data.employeeCommissions = this.data.employeeCommissions.filter(c => c.employeeId !== id);
    this.save();
  }

  public addEmployeePayment(payment: EmployeePayment): void {
    this.data.employeePayments.push(payment);
    this.save();
  }

  public addEmployeeAdvance(advance: EmployeeAdvance): void {
    this.data.employeeAdvances.push(advance);
    this.save();
  }

  public updateEmployeeAdvance(advance: EmployeeAdvance): void {
    const index = this.data.employeeAdvances.findIndex(a => a.id === advance.id);
    if (index !== -1) {
      this.data.employeeAdvances[index] = advance;
      this.save();
    }
  }

  public addEmployeeOvertime(overtime: EmployeeOvertime): void {
    this.data.employeeOvertimes.push(overtime);
    this.save();
  }

  public updateEmployeeOvertime(overtime: EmployeeOvertime): void {
    const index = this.data.employeeOvertimes.findIndex(o => o.id === overtime.id);
    if (index !== -1) {
      this.data.employeeOvertimes[index] = overtime;
      this.save();
    }
  }

  public addEmployeeCommission(commission: EmployeeCommission): void {
    this.data.employeeCommissions.push(commission);
    this.save();
  }

  public updateEmployeeCommission(commission: EmployeeCommission): void {
    const index = this.data.employeeCommissions.findIndex(c => c.id === commission.id);
    if (index !== -1) {
      this.data.employeeCommissions[index] = commission;
      this.save();
    }
  }

  public addInstallment(installment: Installment): void {
    this.data.installments.push(installment);
    this.save();
  }

  public updateInstallment(installment: Installment): void {
    const index = this.data.installments.findIndex(i => i.id === installment.id);
    if (index !== -1) {
      this.data.installments[index] = installment;
      this.save();
    }
  }

  public setUser(user: User | null): void {
    this.data.user = user;
    this.save();
  }

  // Exportar dados para backup manual
  public exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  // Importar dados de backup manual
  public importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validar dados importados
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Dados inválidos');
      }
      
      // Criar backup antes de importar
      this.createBackup();
      
      // Migrar dados se necessário
      this.data = this.needsMigration(importedData) ? 
                  this.migrateData(importedData) : 
                  importedData;
      
      this.save();
      console.log('✅ Dados importados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  }

  // Restaurar backup
  public restoreBackup(): boolean {
    try {
      const backupData = this.loadFromStorage(BACKUP_KEY);
      if (!backupData) {
        console.warn('⚠️ Nenhum backup encontrado');
        return false;
      }
      
      this.data = backupData;
      this.save();
      console.log('✅ Backup restaurado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      return false;
    }
  }

  // Obter estatísticas do armazenamento
  public getStorageStats(): {
    totalSize: number;
    backupSize: number;
    lastSync: string;
    version: string;
    itemCounts: Record<string, number>;
  } {
    const mainData = localStorage.getItem(STORAGE_KEY) || '';
    const backupData = localStorage.getItem(BACKUP_KEY) || '';
    
    return {
      totalSize: mainData.length,
      backupSize: backupData.length,
      lastSync: this.data.lastSync,
      version: this.data.version,
      itemCounts: {
        sales: this.data.sales.length,
        debts: this.data.debts.length,
        checks: this.data.checks.length,
        boletos: this.data.boletos.length,
        employees: this.data.employees.length,
        employeePayments: this.data.employeePayments.length,
        employeeAdvances: this.data.employeeAdvances.length,
        employeeOvertimes: this.data.employeeOvertimes.length,
        employeeCommissions: this.data.employeeCommissions.length,
        installments: this.data.installments.length
      }
    };
  }

  // Limpar todos os dados
  public clearAllData(): void {
    this.data = this.getDefaultData();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    console.log('🗑️ Todos os dados foram limpos');
  }
}

// Instância singleton
export const storage = RobustStorage.getInstance();