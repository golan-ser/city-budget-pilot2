import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface OpenAIStatus {
  success: boolean;
  openaiConfigured: boolean;
  status: string;
  apiKeyPreview: string;
  model: string;
  timestamp: string;
}

export function OpenAIStatus() {
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/smart-query/openai-status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || 'שגיאה לא ידועה');
      }
    } catch (err) {
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>סטטוס OpenAI API</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        {status && !error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {status.openaiConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {status.openaiConfigured ? 'OpenAI מוגדר' : 'OpenAI לא מוגדר'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">סטטוס: </span>
                <Badge variant={status.openaiConfigured ? 'default' : 'secondary'}>
                  {status.status}
                </Badge>
              </div>
              
              <div>
                <span className="font-medium">API Key: </span>
                <code className="text-xs bg-gray-100 px-1 rounded">
                  {status.apiKeyPreview}
                </code>
              </div>
              
              <div>
                <span className="font-medium">Model: </span>
                <span>{status.model}</span>
              </div>
              
              <div className="text-xs text-gray-500">
                נבדק: {new Date(status.timestamp).toLocaleString('he-IL')}
              </div>
            </div>
            
            {!status.openaiConfigured && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>הערה:</strong> המערכת תעבוד במצב rule-based בלבד. 
                  להפעלת OpenAI, הגדר את OPENAI_API_KEY בקובץ .env
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 