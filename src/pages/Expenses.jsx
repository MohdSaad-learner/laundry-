import CrudPage from '../components/CrudPage'

export default function Expenses() {
  return (
    <CrudPage
      table="expenses"
      title="Expenses"
      subtitle="Dashboard / Expenses"
      addLabel="Add Expense"
      searchKeys={['expense_name', 'category', 'vendor']}
      columns={['expense_name', 'category', 'vendor', 'expense_date', 'amount', 'status']}
      defaultValues={{
        expense_name: '',
        category: 'Supplies',
        vendor: '',
        amount: 0,
        payment_mode: 'Cash',
        status: 'Paid',
        expense_date: new Date().toISOString().slice(0, 10),
        notes: ''
      }}
      fields={[
        { key: 'expense_name', label: 'Expense name', type: 'text', required: true },
        {
          key: 'category',
          label: 'Category',
          type: 'select',
          options: ['Chemicals', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Transport', 'Marketing', 'Other']
        },
        { key: 'vendor', label: 'Vendor', type: 'text' },
        { key: 'amount', label: 'Amount (₹)', type: 'number', prefix: '₹', required: true },
        {
          key: 'payment_mode',
          label: 'Payment mode',
          type: 'select',
          options: ['Cash', 'UPI', 'Card', 'Bank Transfer']
        },
        { key: 'expense_date', label: 'Date', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: ['Paid', 'Unpaid'], statusBadge: true },
        { key: 'notes', label: 'Notes', type: 'textarea', full: true }
      ]}
    />
  )
}
