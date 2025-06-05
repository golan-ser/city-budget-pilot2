
import * as React from "react"
import { ChevronUp, ChevronDown, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  filterable?: boolean
  type?: 'text' | 'number' | 'date' | 'status' | 'currency'
}

interface TableData {
  [key: string]: any
}

interface EnhancedTableProps {
  columns: TableColumn[]
  data: TableData[]
  title?: string
  searchable?: boolean
  className?: string
}

export function EnhancedTable({ 
  columns, 
  data, 
  title = "טבלת נתונים",
  searchable = true,
  className 
}: EnhancedTableProps) {
  const [sortField, setSortField] = React.useState<string>('')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedData = React.useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue && filterValue !== 'all') {
        result = result.filter(row =>
          String(row[field]).toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    // Apply sorting
    if (sortField) {
      result.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }

    return result
  }, [data, searchTerm, filters, sortField, sortDirection])

  const renderCellContent = (value: any, type: TableColumn['type'] = 'text') => {
    switch (type) {
      case 'currency':
        return `₪${Number(value).toLocaleString()}`
      case 'status':
        const statusConfig = {
          'completed': { icon: '✔️', color: 'bg-green-100 text-green-800 border-green-200' },
          'pending': { icon: '⚠️', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
          'delayed': { icon: '❌', color: 'bg-red-100 text-red-800 border-red-200' },
          'active': { icon: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-200' }
        }
        const config = statusConfig[value as keyof typeof statusConfig]
        return (
          <Badge className={cn("text-xs font-medium", config?.color)}>
            {config?.icon} {value}
          </Badge>
        )
      case 'date':
        return new Date(value).toLocaleDateString('he-IL')
      case 'number':
        return `${value}%`
      default:
        return value
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with title and search */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-right">{title}</h3>
        {searchable && (
          <div className="relative w-64">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right transition-all duration-200 focus:shadow-md"
            />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 justify-end">
        {columns.filter(col => col.filterable).map(column => (
          <Select
            key={column.key}
            value={filters[column.key] || 'all'}
            onValueChange={(value) => setFilters(prev => ({ ...prev, [column.key]: value }))}
          >
            <SelectTrigger className="w-32 text-right">
              <SelectValue placeholder={`סנן ${column.title}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {/* Add dynamic options based on data */}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Enhanced Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-right font-semibold text-sm text-muted-foreground",
                      column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {column.title}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={cn(
                              "h-3 w-3 transition-colors",
                              sortField === column.key && sortDirection === 'asc' 
                                ? "text-primary" 
                                : "text-muted-foreground/50"
                            )} 
                          />
                          <ChevronDown 
                            className={cn(
                              "h-3 w-3 -mt-1 transition-colors",
                              sortField === column.key && sortDirection === 'desc' 
                                ? "text-primary" 
                                : "text-muted-foreground/50"
                            )} 
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((row, index) => (
                <tr 
                  key={index}
                  className={cn(
                    "border-b border-border/30 transition-all duration-200 hover:bg-muted/20",
                    index % 2 === 1 && "bg-muted/10"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-right text-sm"
                    >
                      {renderCellContent(row[column.key], column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground text-right">
        מציג {filteredAndSortedData.length} מתוך {data.length} רשומות
      </div>
    </div>
  )
}
