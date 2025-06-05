
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger"
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  chart?: React.ReactNode
  progress?: React.ReactNode
}

export function StatusCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = "default",
  trend,
  trendValue,
  chart,
  progress
}: StatusCardProps) {
  const variantClasses = {
    default: "border-border hover:shadow-lg",
    success: "border-green-200 bg-green-50 dark:bg-green-950 hover:shadow-lg hover:shadow-green-200/50",
    warning: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 hover:shadow-lg hover:shadow-yellow-200/50", 
    danger: "border-red-200 bg-red-50 dark:bg-red-950 hover:shadow-lg hover:shadow-red-200/50"
  }

  return (
    <Card className={cn(
      "transition-all duration-300 animate-fade-in cursor-pointer group",
      "transform hover:scale-[1.02] hover:-translate-y-1",
      variantClasses[variant]
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 text-right">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn(
            "h-4 w-4 transition-colors duration-200",
            variant === "success" && "text-green-600",
            variant === "warning" && "text-yellow-600",
            variant === "danger" && "text-red-600",
            "group-hover:scale-110"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold text-right">{value}</div>
        
        {chart && (
          <div className="h-10 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            {chart}
          </div>
        )}
        
        {progress && (
          <div className="flex justify-end">
            {progress}
          </div>
        )}
        
        {subtitle && (
          <p className="text-xs text-muted-foreground text-right mt-1">
            {subtitle}
          </p>
        )}
        
        {trend && trendValue && (
          <div className={cn(
            "text-xs mt-1 text-right font-medium",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-muted-foreground"
          )}>
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
