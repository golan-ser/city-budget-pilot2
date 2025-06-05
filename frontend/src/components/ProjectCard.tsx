
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  id: string
  name: string
  tavarNumber: string
  budget: number
  used: number
  status: "active" | "pending" | "completed" | "delayed"
  ministry: string
  lastUpdate: string
}

export function ProjectCard({ 
  id, 
  name, 
  tavarNumber, 
  budget, 
  used, 
  status, 
  ministry, 
  lastUpdate 
}: ProjectCardProps) {
  const percentage = Math.round((used / budget) * 100)
  
  const statusConfig = {
    active: { color: "bg-accent", text: "פעיל", variant: "default" as const },
    pending: { color: "bg-warning", text: "בהמתנה", variant: "secondary" as const },
    completed: { color: "bg-green-500", text: "הושלם", variant: "default" as const },
    delayed: { color: "bg-destructive", text: "מעוכב", variant: "destructive" as const }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 animate-slide-in cursor-pointer">
      <CardHeader className="text-right">
        <div className="flex justify-between items-start">
          <Badge variant={statusConfig[status].variant} className="text-xs">
            {statusConfig[status].text}
          </Badge>
          <div>
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">תב"ר {tavarNumber}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-right">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">₪{budget.toLocaleString()}</span>
            <span>תקציב מאושר:</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">₪{used.toLocaleString()}</span>
            <span>נוצל:</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{percentage}%</span>
            <span>אחוז ניצול:</span>
          </div>
          <Progress 
            value={percentage} 
            className={cn(
              "h-2",
              percentage > 90 && "bg-destructive/20",
              percentage > 70 && percentage <= 90 && "bg-warning/20"
            )}
          />
        </div>
        
        <div className="text-right text-xs text-muted-foreground space-y-1">
          <div>משרד: {ministry}</div>
          <div>עודכן: {lastUpdate}</div>
        </div>
      </CardContent>
    </Card>
  )
}
