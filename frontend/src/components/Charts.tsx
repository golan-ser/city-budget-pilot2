
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusData = [
  { name: 'פעיל', value: 12, color: '#22c55e' },
  { name: 'בהמתנה', value: 8, color: '#f59e0b' },
  { name: 'הושלם', value: 15, color: '#3b82f6' },
  { name: 'מעוכב', value: 3, color: '#ef4444' }
]

const budgetData = [
  { name: 'תשתיות', budget: 2500000, used: 1800000 },
  { name: 'חינוך', budget: 1200000, used: 950000 },
  { name: 'תרבות', budget: 800000, used: 650000 },
  { name: 'ספורט', budget: 600000, used: 320000 },
  { name: 'רווחה', budget: 900000, used: 750000 }
]

export function StatusChart() {
  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {statusData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: any, name: any) => [`${value} פרויקטים`, name]}
          labelStyle={{ direction: 'rtl' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function BudgetChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `₪${(value / 1000)}K`}
        />
        <Tooltip 
          formatter={(value: any, name: any) => [
            `₪${Number(value).toLocaleString()}`, 
            name === 'budget' ? 'תקציב מאושר' : 'תקציב נוצל'
          ]}
          labelStyle={{ direction: 'rtl' }}
        />
        <Bar dataKey="budget" fill="#3b82f6" name="budget" />
        <Bar dataKey="used" fill="#22c55e" name="used" />
      </BarChart>
    </ResponsiveContainer>
  )
}
