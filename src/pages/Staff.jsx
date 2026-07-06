import CrudPage from '../components/CrudPage'

export default function Staff() {
  return (
    <CrudPage
      table="staff"
      title="Staff"
      subtitle="Dashboard / Staff"
      addLabel="Add Staff"
      searchKeys={['name', 'employee_id', 'phone', 'email']}
      columns={['name', 'employee_id', 'department', 'role', 'phone', 'status']}
      defaultValues={{
        name: '',
        employee_id: '',
        department: 'Operations',
        role: '',
        phone: '',
        email: '',
        status: 'Active',
        join_date: new Date().toISOString().slice(0, 10),
        salary: 0
      }}
      fields={[
        { key: 'name', label: 'Full name', type: 'text', required: true },
        { key: 'employee_id', label: 'Employee ID', type: 'text' },
        {
          key: 'department',
          label: 'Department',
          type: 'select',
          options: ['Operations', 'Customer Service', 'Laundry', 'Delivery', 'Accounts']
        },
        { key: 'role', label: 'Role', type: 'text', required: true },
        { key: 'phone', label: 'Phone', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'join_date', label: 'Join date', type: 'date' },
        { key: 'salary', label: 'Salary (₹/month)', type: 'number', prefix: '₹' },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          options: ['Active', 'On Leave', 'Inactive'],
          statusBadge: true
        }
      ]}
    />
  )
}
