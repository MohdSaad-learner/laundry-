import CrudPage from '../components/CrudPage'

export default function Customers() {
  return (
    <CrudPage
      table="customers"
      title="Customers"
      subtitle="Dashboard / Customers"
      addLabel="Add Customer"
      searchKeys={['name', 'phone', 'email']}
      columns={['name', 'phone', 'email', 'tag', 'status']}
      defaultValues={{ name: '', phone: '', email: '', address: '', tag: 'Regular', status: 'Active' }}
      fields={[
        { key: 'name', label: 'Full name', type: 'text', required: true },
        { key: 'phone', label: 'Phone', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'address', label: 'Address', type: 'textarea', full: true },
        { key: 'tag', label: 'Tag', type: 'select', options: ['Regular', 'VIP'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], statusBadge: true }
      ]}
    />
  )
}
