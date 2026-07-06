export default function StatCard({ icon, label, value, hint, hintPositive = true }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {hint && (
          <p className={`text-xs mt-1 ${hintPositive ? 'text-green-600' : 'text-red-500'}`}>
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}
