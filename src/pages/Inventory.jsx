import CrudPage from '../components/CrudPage'

export default function Inventory() {
  return (
    <CrudPage
      table="inventory"
      title="Inventory"
      subtitle="Dashboard / Inventory"
      addLabel="Add Item"
      searchKeys={['item_name', 'category', 'sku']}
      columns={['item_name', 'category', 'sku', 'stock', 'unit', 'unit_price']}
      defaultValues={{
        item_name: '',
        category: 'Cleaning Agents',
        sku: '',
        stock: 0,
        unit: 'Pcs',
        unit_price: 0,
        reorder_level: 10,
        supplier: ''
      }}
      fields={[
        { key: 'item_name', label: 'Item name', type: 'text', required: true },
        {
          key: 'category',
          label: 'Category',
          type: 'select',
          options: ['Cleaning Agents', 'Packaging', 'Stationery', 'Other Supplies']
        },
        { key: 'sku', label: 'SKU / Barcode', type: 'text' },
        { key: 'stock', label: 'Current stock', type: 'number', required: true },
        {
          key: 'unit',
          label: 'Unit',
          type: 'select',
          options: ['Litre', 'Kg', 'Pcs', 'Box', 'Roll']
        },
        { key: 'unit_price', label: 'Unit price (₹)', type: 'number', prefix: '₹' },
        { key: 'reorder_level', label: 'Reorder level', type: 'number' },
        { key: 'supplier', label: 'Supplier', type: 'text', full: true }
      ]}
    />
  )
}
