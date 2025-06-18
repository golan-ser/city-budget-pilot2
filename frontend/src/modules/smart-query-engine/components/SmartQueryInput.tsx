import React, { useState, useRef, useEffect } from 'react';
import { Search, Zap, Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { QuerySchema } from '../types/querySchema';
import { generateSuggestions } from '../hooks/useQueryParser';

interface SmartQueryInputProps {
  schema: QuerySchema;
  onQuery: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SmartQueryInput({ 
  schema, 
  onQuery, 
  loading = false, 
  placeholder,
  className = '' 
}: SmartQueryInputProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  const actualPlaceholder = placeholder || schema.labels.searchPlaceholder;

  useEffect(() => {
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    suggestionTimeoutRef.current = setTimeout(() => {
      const newSuggestions = generateSuggestions(query, schema);
      setSuggestions(newSuggestions);
      setShowSuggestions(query.length > 0 && newSuggestions.length > 0);
    }, 300);

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [query, schema]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onQuery(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    onQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const helpExamples = [
    {
      category: 'חשבוניות ותשלומים 💰',
      examples: [
        'חשבוניות מתב״ר 2211',
        'חשבוניות שלא שולמו',
        'תשלומים שלא דווחו',
        'ספק חברת הבנייה המובילה'
      ]
    },
    {
      category: 'תב"רים ופרויקטים 🏗️',
      examples: [
        'תב"רים של חינוך',
        'פרויקטים פעילים',
        'תב"ר 2211',
        'פרויקטים של הנדסה'
      ]
    },
    {
      category: 'חיפוש מתקדם 🔍',
      examples: [
        'כל הנתונים של תב״ר 2211',
        'חיפוש נרחב בכל הטבלאות',
        'הכל על ספק חברת הבנייה',
        'כל חשבוניות חינוך שלא שולמו'
      ]
    },
    {
      category: 'סעיפי תקציב 📊',
      examples: [
        'סעיפי תקציב של חינוך',
        'תקציב מבוצע',
        'ניצול תקציב מתחת ל-60%',
        'סעיפים פעילים'
      ]
    }
  ];

  return (
    <div className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={actualPlaceholder}
            className="pl-4 pr-24 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 transition-colors"
            disabled={loading}
            dir="rtl"
          />

          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuery}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
              title="עזרה ודוגמאות"
            >
              <Zap className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              disabled={!query.trim() || loading}
              className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'חפש'
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Auto-suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <div className="p-2">
            <div className="text-sm text-gray-600 mb-2">הצעות:</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-right p-2 hover:bg-gray-50 rounded text-sm transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Help panel */}
      {showHelp && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 border shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">איך לשאול שאלות חכמות?</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {helpExamples.map((category, index) => (
                <div key={index}>
                  <Badge variant="outline" className="mb-2">
                    {category.category}
                  </Badge>
                  <div className="space-y-1">
                    {category.examples.map((example, exIndex) => (
                      <button
                        key={exIndex}
                        onClick={() => {
                          handleSuggestionClick(example);
                          setShowHelp(false);
                        }}
                        className="block w-full text-right text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              <p>💡 <strong>טיפים:</strong></p>
              <ul className="mt-1 space-y-1">
                <li>• השתמש במילים כמו "מעל", "מתחת", "של", "עם"</li>
                <li>• ציין שנים, סכומים ומחלקות</li>
                <li>• שאל "כמה" לספירה או "סה״כ" לסיכומים</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 