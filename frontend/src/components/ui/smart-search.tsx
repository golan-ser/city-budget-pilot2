
import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchSuggestion {
  id: string
  label: string
  category?: string
}

interface SmartSearchProps {
  placeholder?: string
  suggestions?: SearchSuggestion[]
  onSearch?: (query: string) => void
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  className?: string
}

export function SmartSearch({
  placeholder = "חיפוש...",
  suggestions = [],
  onSearch,
  onSuggestionSelect,
  className
}: SmartSearchProps) {
  const [query, setQuery] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<SearchSuggestion[]>([])

  React.useEffect(() => {
    if (query.trim()) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
      setFilteredSuggestions([])
    }
  }, [query, suggestions])

  const handleSearch = () => {
    onSearch?.(query)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label)
    onSuggestionSelect?.(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery("")
    setShowSuggestions(false)
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="pr-10 pl-10 text-right transition-all duration-200 focus:shadow-md"
        />
        {query && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSearch}
            className="absolute left-1 top-1.5 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 text-right cursor-pointer hover:bg-muted/50 transition-colors duration-150 border-b border-border/30 last:border-b-0"
            >
              <div className="font-medium text-sm">{suggestion.label}</div>
              {suggestion.category && (
                <div className="text-xs text-muted-foreground">{suggestion.category}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
