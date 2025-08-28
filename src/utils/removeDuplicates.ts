import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DuplicateStats {
  table: string;
  totalRecords: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  uniqueRecordsKept: number;
}

export async function removeDuplicates(): Promise<DuplicateStats[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não está configurado. Configure as variáveis de ambiente primeiro.');
  }

  const stats: DuplicateStats[] = [];

  try {
    console.log('🔍 Iniciando remoção de duplicatas...');

    // 1. REMOVER DUPLICATAS DE VENDAS
    console.log('📊 Analisando vendas...');
    const salesStats = await removeSalesDuplicates();
    stats.push(salesStats);

    // 2. REMOVER DUPLICATAS DE DÍVIDAS
    console.log('💳 Analisando dívidas...');
    const debtsStats = await removeDebtsDuplicates();
    stats.push(debtsStats);

    // 3. REMOVER DUPLICATAS DE FUNCIONÁRIOS
    console.log('👥 Analisando funcionários...');
    const employeesStats = await removeEmployeesDuplicates();
    stats.push(employeesStats);

    // 4. REMOVER DUPLICATAS DE BOLETOS
    console.log('📄 Analisando boletos...');
    const boletosStats = await removeBoletosDuplicates();
    stats.push(boletosStats);

    // 5. REMOVER DUPLICATAS DE CHEQUES
    console.log('📝 Analisando cheques...');
    const checksStats = await removeChecksDuplicates();
    stats.push(checksStats);

    // 6. REMOVER DUPLICATAS DE COMISSÕES
    console.log('⭐ Analisando comissões...');
    const commissionsStats = await removeCommissionsDuplicates();
    stats.push(commissionsStats);

    console.log('✅ Remoção de duplicatas concluída!');
    return stats;

  } catch (error) {
    console.error('❌ Erro durante remoção de duplicatas:', error);
    throw error;
  }
}

async function removeSalesDuplicates(): Promise<DuplicateStats> {
  const { data: allSales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allSales?.length || 0;
  let duplicatesRemoved = 0;

  if (!allSales || allSales.length === 0) {
    return {
      table: 'sales',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (cliente, data, valor total)
  const salesGroups = new Map<string, any[]>();
  
  allSales.forEach(sale => {
    const key = `${sale.client}-${sale.date}-${sale.total_value}`;
    if (!salesGroups.has(key)) {
      salesGroups.set(key, []);
    }
    salesGroups.get(key)!.push(sale);
  });

  // Remover duplicatas (manter o primeiro de cada grupo)
  for (const [key, group] of salesGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontradas ${group.length} vendas duplicadas para: ${key}`);
      
      // Manter o primeiro (mais antigo) e remover os demais
      const toRemove = group.slice(1);
      
      for (const sale of toRemove) {
        const { error } = await supabase
          .from('sales')
          .delete()
          .eq('id', sale.id);
        
        if (error) {
          console.error(`❌ Erro ao remover venda ${sale.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Venda duplicada removida: ${sale.client} - ${sale.date}`);
        }
      }
    }
  }

  const uniqueRecordsKept = salesGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'sales',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

async function removeDebtsDuplicates(): Promise<DuplicateStats> {
  const { data: allDebts, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allDebts?.length || 0;
  let duplicatesRemoved = 0;

  if (!allDebts || allDebts.length === 0) {
    return {
      table: 'debts',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (empresa, data, valor total, descrição)
  const debtsGroups = new Map<string, any[]>();
  
  allDebts.forEach(debt => {
    const key = `${debt.company}-${debt.date}-${debt.total_value}-${debt.description}`;
    if (!debtsGroups.has(key)) {
      debtsGroups.set(key, []);
    }
    debtsGroups.get(key)!.push(debt);
  });

  // Remover duplicatas
  for (const [key, group] of debtsGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontradas ${group.length} dívidas duplicadas para: ${key}`);
      
      const toRemove = group.slice(1);
      
      for (const debt of toRemove) {
        const { error } = await supabase
          .from('debts')
          .delete()
          .eq('id', debt.id);
        
        if (error) {
          console.error(`❌ Erro ao remover dívida ${debt.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Dívida duplicada removida: ${debt.company} - ${debt.date}`);
        }
      }
    }
  }

  const uniqueRecordsKept = debtsGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'debts',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

async function removeEmployeesDuplicates(): Promise<DuplicateStats> {
  const { data: allEmployees, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allEmployees?.length || 0;
  let duplicatesRemoved = 0;

  if (!allEmployees || allEmployees.length === 0) {
    return {
      table: 'employees',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (nome, cargo, salário)
  const employeesGroups = new Map<string, any[]>();
  
  allEmployees.forEach(employee => {
    const key = `${employee.name}-${employee.position}-${employee.salary}`;
    if (!employeesGroups.has(key)) {
      employeesGroups.set(key, []);
    }
    employeesGroups.get(key)!.push(employee);
  });

  // Remover duplicatas
  for (const [key, group] of employeesGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontrados ${group.length} funcionários duplicados para: ${key}`);
      
      const toRemove = group.slice(1);
      
      for (const employee of toRemove) {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employee.id);
        
        if (error) {
          console.error(`❌ Erro ao remover funcionário ${employee.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Funcionário duplicado removido: ${employee.name} - ${employee.position}`);
        }
      }
    }
  }

  const uniqueRecordsKept = employeesGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'employees',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

async function removeBoletosDuplicates(): Promise<DuplicateStats> {
  const { data: allBoletos, error } = await supabase
    .from('boletos')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allBoletos?.length || 0;
  let duplicatesRemoved = 0;

  if (!allBoletos || allBoletos.length === 0) {
    return {
      table: 'boletos',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (cliente, valor, data de vencimento, parcela)
  const boletosGroups = new Map<string, any[]>();
  
  allBoletos.forEach(boleto => {
    const key = `${boleto.client}-${boleto.value}-${boleto.due_date}-${boleto.installment_number}-${boleto.total_installments}`;
    if (!boletosGroups.has(key)) {
      boletosGroups.set(key, []);
    }
    boletosGroups.get(key)!.push(boleto);
  });

  // Remover duplicatas
  for (const [key, group] of boletosGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontrados ${group.length} boletos duplicados para: ${key}`);
      
      const toRemove = group.slice(1);
      
      for (const boleto of toRemove) {
        const { error } = await supabase
          .from('boletos')
          .delete()
          .eq('id', boleto.id);
        
        if (error) {
          console.error(`❌ Erro ao remover boleto ${boleto.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Boleto duplicado removido: ${boleto.client} - ${boleto.due_date}`);
        }
      }
    }
  }

  const uniqueRecordsKept = boletosGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'boletos',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

async function removeChecksDuplicates(): Promise<DuplicateStats> {
  const { data: allChecks, error } = await supabase
    .from('checks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allChecks?.length || 0;
  let duplicatesRemoved = 0;

  if (!allChecks || allChecks.length === 0) {
    return {
      table: 'checks',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (cliente, valor, data de vencimento, parcela)
  const checksGroups = new Map<string, any[]>();
  
  allChecks.forEach(check => {
    const key = `${check.client}-${check.value}-${check.due_date}-${check.installment_number}-${check.total_installments}`;
    if (!checksGroups.has(key)) {
      checksGroups.set(key, []);
    }
    checksGroups.get(key)!.push(check);
  });

  // Remover duplicatas
  for (const [key, group] of checksGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontrados ${group.length} cheques duplicados para: ${key}`);
      
      const toRemove = group.slice(1);
      
      for (const check of toRemove) {
        const { error } = await supabase
          .from('checks')
          .delete()
          .eq('id', check.id);
        
        if (error) {
          console.error(`❌ Erro ao remover cheque ${check.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Cheque duplicado removido: ${check.client} - ${check.due_date}`);
        }
      }
    }
  }

  const uniqueRecordsKept = checksGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'checks',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

async function removeCommissionsDuplicates(): Promise<DuplicateStats> {
  const { data: allCommissions, error } = await supabase
    .from('employee_commissions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const totalRecords = allCommissions?.length || 0;
  let duplicatesRemoved = 0;

  if (!allCommissions || allCommissions.length === 0) {
    return {
      table: 'employee_commissions',
      totalRecords: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueRecordsKept: 0
    };
  }

  // Agrupar por critérios de duplicata (funcionário, venda, valor da comissão)
  const commissionsGroups = new Map<string, any[]>();
  
  allCommissions.forEach(commission => {
    const key = `${commission.employee_id}-${commission.sale_id}-${commission.commission_amount}`;
    if (!commissionsGroups.has(key)) {
      commissionsGroups.set(key, []);
    }
    commissionsGroups.get(key)!.push(commission);
  });

  // Remover duplicatas
  for (const [key, group] of commissionsGroups) {
    if (group.length > 1) {
      console.log(`🔍 Encontradas ${group.length} comissões duplicadas para: ${key}`);
      
      const toRemove = group.slice(1);
      
      for (const commission of toRemove) {
        const { error } = await supabase
          .from('employee_commissions')
          .delete()
          .eq('id', commission.id);
        
        if (error) {
          console.error(`❌ Erro ao remover comissão ${commission.id}:`, error);
        } else {
          duplicatesRemoved++;
          console.log(`✅ Comissão duplicada removida: ${commission.employee_id} - ${commission.sale_id}`);
        }
      }
    }
  }

  const uniqueRecordsKept = commissionsGroups.size;
  const duplicatesFound = totalRecords - uniqueRecordsKept;

  return {
    table: 'employee_commissions',
    totalRecords,
    duplicatesFound,
    duplicatesRemoved,
    uniqueRecordsKept
  };
}

// Função para executar limpeza completa
export async function cleanupDatabase(): Promise<void> {
  try {
    console.log('🧹 Iniciando limpeza completa do banco de dados...');
    
    const stats = await removeDuplicates();
    
    console.log('\n📊 RELATÓRIO DE LIMPEZA:');
    console.log('========================');
    
    let totalDuplicatesRemoved = 0;
    
    stats.forEach(stat => {
      console.log(`\n${stat.table.toUpperCase()}:`);
      console.log(`  Total de registros: ${stat.totalRecords}`);
      console.log(`  Duplicatas encontradas: ${stat.duplicatesFound}`);
      console.log(`  Duplicatas removidas: ${stat.duplicatesRemoved}`);
      console.log(`  Registros únicos mantidos: ${stat.uniqueRecordsKept}`);
      
      totalDuplicatesRemoved += stat.duplicatesRemoved;
    });
    
    console.log('\n========================');
    console.log(`🎉 LIMPEZA CONCLUÍDA!`);
    console.log(`📊 Total de duplicatas removidas: ${totalDuplicatesRemoved}`);
    console.log('✅ Banco de dados limpo e otimizado!');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}