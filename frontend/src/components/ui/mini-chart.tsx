
import * as React from "react"
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from "@/lib/utils"

interface MiniChartProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
  className?: string
}

export function MiniChart({ 
  data, 
  color = "#3B82F6", 
  height = 40,
  className 
}: MiniChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground p-2 rounded-md shadow-md border text-xs">
                    <p>{`₪${Number(payload[0].value).toLocaleString()}`}</p>
                    <p className="text-muted-foreground">{label}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
