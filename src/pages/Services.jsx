import CrudPage from '../components/CrudPage'

export default function Services() {
  return (
    <CrudPage
      table="services"
      title="Services"
      subtitle="Dashboard / Services"
      addLabel="Add Service"
      searchKeys={['name', 'category']}
      columns={['name', 'category', 'price', 'est_time', 'status']}
      defaultValues={{
        name: '',
        category: 'Cleaning',
        price: 0,
        est_time: '24 - 48 hrs',
        description: '',
        status: 'Active'
      }}
      fields={[
        { key: 'name', label: 'Service name', type: 'text', required: true },
        {
          key: 'category',
          label: 'Category',
          type: 'select',
          options: ['Cleaning', 'Pressing', 'Dyeing', 'Special']
        },
        { key: 'price', label: 'Starting price (₹)', type: 'number', prefix: '₹', required: true },
        { key: 'est_time', label: 'Estimated time', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea', full: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], statusBadge: true }
      ]}
    />
  )
}
