#!/bin/bash

# Script to fix date display issues across all components

# List of files to fix
FILES=(
  "src/components/Dashboard.tsx"
  "src/components/Debts.tsx"
  "src/components/Permutas.tsx"
  "src/components/Agenda.tsx"
  "src/components/Boletos.tsx"
  "src/components/Checks.tsx"
  "src/components/CashManagement.tsx"
  "src/components/Acertos.tsx"
  "src/components/Employees.tsx"
  "src/components/Taxes.tsx"
  "src/components/PixFees.tsx"
  "src/components/Reports.tsx"
  "src/components/reports/PayablesReport.tsx"
  "src/components/reports/ReceivablesReport.tsx"
  "src/components/reports/EnhancedReceivablesReport.tsx"
  "src/components/forms/AcertoPaymentForm.tsx"
  "src/components/forms/CashTransactionForm.tsx"
  "src/components/forms/CompanyPaymentNegotiationForm.tsx"
  "src/components/forms/DebtForm.tsx"
  "src/components/forms/DiscountChecksForm.tsx"
  "src/components/forms/InstallmentPaymentForm.tsx"
  "src/components/forms/OverdueBoletoForm.tsx"
)

# For each file, check if it needs dbDateToDisplay import and add if missing
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Check if file uses toLocaleDateString
    if grep -q "toLocaleDateString" "$file"; then
      # Check if dbDateToDisplay is already imported
      if ! grep -q "dbDateToDisplay" "$file"; then
        echo "  Adding dbDateToDisplay import..."
        # Add import if dateUtils is already imported
        if grep -q "from.*dateUtils" "$file"; then
          sed -i "s/import {\\(.*\\)} from '\\(.*\\)dateUtils'/import {\\1, dbDateToDisplay} from '\\2dateUtils'/" "$file"
        else
          # Add new import line after first import
          sed -i "1a import { dbDateToDisplay } from '../utils/dateUtils';" "$file"
        fi
      fi

      echo "  File may need manual date fixing"
    fi
  fi
done

echo "Done! Files processed. Manual review needed for date replacements."
