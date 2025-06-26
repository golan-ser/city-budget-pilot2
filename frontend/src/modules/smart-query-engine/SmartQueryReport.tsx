import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Brain, Sparkles, AlertCircle } from 'lucide-react';
import { SmartQueryInput } from './components/SmartQueryInput';
import { SmartQueryResult } from './components/SmartQueryResult';
import { useQueryParser } from './hooks/useQueryParser';
import { cityBudgetSchema } from './config/cityBudgetSchema';
import { ParsedIntent, SmartQueryResult as QueryResult } from './types/querySchema';
import { OpenAIService } from '@/services/openaiService';

export default function SmartQueryReport() {
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Use the new two-stage architecture hook
  const {
    processQuery,
    isLoading,
    error: parseError,
    queryResult: newQueryResult,
    parsedIntent,
    showConfirmation,
    confirmQuery,
    rejectQuery,
    clearResults
  } = useQueryParser();

  const handleQuery = useCallback(async (queryText: string) => {
    setExecutionError(null);
    setQueryResult(null);
    
    try {
      // Use the new two-stage architecture
      const result = await processQuery(queryText);
      
      if (result.lowConfidence) {
        // Handle low confidence - let the hook manage this
        return;
      }
      
      if (result.stage === 'complete' && result.queryResult) {
        console.log('🔍 Backend Result Data:', result.queryResult);
        console.log('🔍 Rows:', result.queryResult.rows);
        console.log('🔍 Summary:', result.queryResult.summary);
        
        // Convert the new format to the old format for compatibility
        const convertedResult: QueryResult = {
          data: result.queryResult.rows,
          parsed: result.parsedIntent!,
          suggestedGraphs: [],
          insights: [result.queryResult.summary.message],
          totalCount: result.queryResult.summary.totalRows,
          executionTime: parseInt(result.processingTime?.replace('ms', '') || '0')
        };
        
        console.log('🔍 Converted Result:', convertedResult);
        setQueryResult(convertedResult);
        return;
      }
      
      // Fallback to old logic if needed
      const intent = result.parsedIntent;
      if (!intent) {
        setExecutionError('לא הצלחתי להבין את השאילתה. נסה לנסח אותה אחרת.');
        return;
      }

      console.log('🔍 Parsed Intent:', intent);

      // Step 2: Execute the parsed query
      setIsExecuting(true);
      const startTime = Date.now();

      const queryMapping = cityBudgetSchema.intentToQueryMapping[intent.domain];
      if (!queryMapping) {
        throw new Error(`לא נמצא מיפוי עבור תחום: ${intent.domain}`);
      }

      const apiQuery = queryMapping(intent);
      console.log('📤 API Query being sent:', apiQuery);
      
      // Add special handling for utilization calculations in budget_items
      if (intent.domain === 'budget_items') {
        // Add calculated utilization field
        if (!apiQuery.fields.includes('utilization_percent')) {
          apiQuery.fields.push('utilization_percent');
        }
        
        // Convert utilization filters to proper format
        if (intent.filters.utilization_gt) {
          apiQuery.filters.utilization_gt = intent.filters.utilization_gt;
          delete apiQuery.filters.utilization_gt;
        }
        if (intent.filters.utilization_lt) {
          apiQuery.filters.utilization_lt = intent.filters.utilization_lt;
          delete apiQuery.filters.utilization_lt;
        }
      }

      const response = await fetch(`/api/report-schemas/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024'
        },
        body: JSON.stringify(apiQuery)
      });

      if (!response.ok) {
        throw new Error(`שגיאה בביצוע השאילתה: ${response.status}`);
      }

      const rawData = await response.json();
      const executionTime = Date.now() - startTime;

      // Process the data and add calculated fields
      const processedData = rawData.map((item: any) => {
        if (intent.domain === 'budget_items') {
          // Calculate utilization percentage
          const approved = Number(item.approved_budget) || 0;
          const executed = Number(item.executed_budget) || 0;
          item.utilization_percent = approved > 0 ? (executed / approved) * 100 : 0;
        }
        return item;
      });

      // Generate insights
      const insights = generateInsights(processedData, intent);

      // Suggest appropriate charts
      const suggestedGraphs = generateChartSuggestions(processedData, intent);

      const queryResultData: QueryResult = {
        data: processedData,
        parsed: intent,
        suggestedGraphs,
        insights,
        totalCount: processedData.length,
        executionTime
      };

      setQueryResult(queryResultData);
      
    } catch (error) {
      console.error('Error executing query:', error);
      setExecutionError(error instanceof Error ? error.message : 'שגיאה לא צפויה בביצוע השאילתה');
    } finally {
      setIsExecuting(false);
    }
  }, [processQuery]);

  // Generate insights based on the data and query
  const generateInsights = (data: any[], intent: ParsedIntent): string[] => {
    const insights: string[] = [];
    
    if (data.length === 0) return insights;

    // General insights
    insights.push(`נמצאו ${data.length} רשומות המתאימות לחיפוש`);

    if (intent.domain === 'budget_items') {
      // Budget-specific insights
      const totalApproved = data.reduce((sum, item) => sum + (Number(item.approved_budget) || 0), 0);
      const totalExecuted = data.reduce((sum, item) => sum + (Number(item.executed_budget) || 0), 0);
      const overBudget = data.filter(item => (item.utilization_percent || 0) > 100);
      const underUtilized = data.filter(item => (item.utilization_percent || 0) < 50);

      if (totalApproved > 0) {
        const overallUtilization = (totalExecuted / totalApproved) * 100;
        insights.push(`אחוז ניצול כולל: ${overallUtilization.toFixed(1)}%`);
      }

      if (overBudget.length > 0) {
        insights.push(`${overBudget.length} סעיפים חורגים מהתקציב המאושר`);
      }

      if (underUtilized.length > 0) {
        insights.push(`${underUtilized.length} סעיפים עם ניצול נמוך (מתחת ל-50%)`);
      }

      // Department insights
      const departmentStats = data.reduce((acc, item) => {
        const dept = item.department || 'לא מוגדר';
        if (!acc[dept]) acc[dept] = { count: 0, approved: 0, executed: 0 };
        acc[dept].count++;
        acc[dept].approved += Number(item.approved_budget) || 0;
        acc[dept].executed += Number(item.executed_budget) || 0;
        return acc;
      }, {} as Record<string, any>);

      const topDepartment = Object.entries(departmentStats)
        .sort(([,a], [,b]) => (b as any).approved - (a as any).approved)[0];
      
      if (topDepartment) {
        insights.push(`המחלקה עם התקציב הגבוה ביותר: ${topDepartment[0]} (${(topDepartment[1] as any).approved.toLocaleString('he-IL')} ₪)`);
      }
    }

    if (intent.domain === 'tabarim') {
      // Tabarim-specific insights
      const totalBudget = data.reduce((sum, item) => sum + (Number(item.total_authorized) || 0), 0);
      const activeProjects = data.filter(item => item.status === 'פעיל');
      const closedProjects = data.filter(item => item.status === 'סגור');

      insights.push(`סה"כ תקציב מאושר: ${totalBudget.toLocaleString('he-IL')} ₪`);
      
      if (activeProjects.length > 0) {
        insights.push(`${activeProjects.length} פרויקטים פעילים`);
      }
      
      if (closedProjects.length > 0) {
        insights.push(`${closedProjects.length} פרויקטים סגורים`);
      }

      // Ministry insights
      const ministryStats = data.reduce((acc, item) => {
        const ministry = item.ministry || 'לא מוגדר';
        if (!acc[ministry]) acc[ministry] = { count: 0, budget: 0 };
        acc[ministry].count++;
        acc[ministry].budget += Number(item.total_authorized) || 0;
        return acc;
      }, {} as Record<string, any>);

      const topMinistry = Object.entries(ministryStats)
        .sort(([,a], [,b]) => (b as any).budget - (a as any).budget)[0];
      
      if (topMinistry) {
        insights.push(`המשרד עם התקציב הגבוה ביותר: ${topMinistry[0]} (${(topMinistry[1] as any).budget.toLocaleString('he-IL')} ₪)`);
      }
    }

    return insights.slice(0, 5); // Limit to 5 insights
  };

  // Generate chart suggestions based on data
  const generateChartSuggestions = (data: any[], intent: ParsedIntent) => {
    if (data.length === 0) return [];

    const suggestions = [];

    if (intent.domain === 'budget_items') {
      // Department budget distribution
      const departmentData = data.reduce((acc, item) => {
        const dept = item.department || 'לא מוגדר';
        acc[dept] = (acc[dept] || 0) + (Number(item.approved_budget) || 0);
        return acc;
      }, {} as Record<string, number>);

      if (Object.keys(departmentData).length > 1) {
        suggestions.push({
          type: 'pie' as const,
          xField: 'department',
          yField: 'approved_budget',
          title: 'התפלגות תקציב לפי מחלקות'
        });
      }

      // Budget vs execution
      if (data.some(item => item.executed_budget > 0)) {
        suggestions.push({
          type: 'bar' as const,
          xField: 'name',
          yField: 'approved_budget',
          title: 'תקציב מאושר לעומת מבוצע'
        });
      }
    }

    if (intent.domain === 'tabarim') {
      // Ministry distribution
      const ministryData = data.reduce((acc, item) => {
        const ministry = item.ministry || 'לא מוגדר';
        acc[ministry] = (acc[ministry] || 0) + (Number(item.total_authorized) || 0);
        return acc;
      }, {} as Record<string, number>);

      if (Object.keys(ministryData).length > 1) {
        suggestions.push({
          type: 'pie' as const,
          xField: 'ministry',
          yField: 'total_authorized',
          title: 'התפלגות תקציב לפי משרדים'
        });
      }

      // Timeline
      if (data.some(item => item.year)) {
        suggestions.push({
          type: 'bar' as const,
          xField: 'year',
          yField: 'total_authorized',
          title: 'תקציב לפי שנים'
        });
      }
    }

    return suggestions.slice(0, 2); // Limit to 2 chart suggestions
  };

  const currentDomain = queryResult?.parsed.domain;
  // Use fields from server response instead of local schema
  const currentFields = queryResult?.data && Array.isArray(queryResult.data) && queryResult.data.length > 0 
    ? Object.keys(queryResult.data[0]).map(key => ({
        key,
        label: key,
        type: 'text',
        format: key.includes('budget') || key.includes('authorized') || key.includes('utilized') ? 'currency' : 
               key.includes('percent') || key.includes('utilization') ? 'percentage' : 'text'
      }))
    : (currentDomain ? cityBudgetSchema.domains.find(d => d.key === currentDomain)?.fields || [] : []);

  // Debug logging
  console.log('🔍 SmartQueryReport Debug:', {
    hasQueryResult: !!queryResult,
    queryResultData: queryResult?.data,
    dataLength: queryResult?.data?.length,
    currentFields,
    firstDataItem: queryResult?.data?.[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { type: 'user', content: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await OpenAIService.executeSmartQuery({
        query: userMessage.content,
        context: 'budget_analysis'
      });

      const aiMessage = {
        type: 'ai',
        content: response.answer || 'לא הצלחתי לעבד את השאילתה. נסה שוב.',
        timestamp: Date.now(),
        data: response.data
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error executing smart query:', error);
      const errorMessage = {
        type: 'ai',
        content: 'אירעה שגיאה בעיבוד השאילתה. אנא נסה שוב.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">מחולל דוחות חכם</h1>
            <p className="text-gray-600 mt-1">שאל אותי כל שאלה על התקציב בשפה חופשית</p>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">דוגמאות לשאילתות:</span>
            </div>
            <div className="mt-2 text-sm text-blue-600 space-y-1">
              <div>"הראה לי תב״רים של חינוך מ-2024"</div>
              <div>"סעיפי תקציב עם ניצול מתחת ל-60%"</div>
              <div>"כמה פרויקטים פעילים יש של משרד התחבורה?"</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Input */}
      <div className="mb-8">
        <SmartQueryInput
          schema={cityBudgetSchema}
          onQuery={handleQuery}
          loading={isLoading || isExecuting}
          className="max-w-4xl mx-auto"
        />
      </div>

      {/* Error Display */}
      {(parseError || executionError) && (
        <Alert className="mb-6 max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {parseError || executionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {(isLoading || isExecuting) && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-gray-600">
                {isLoading ? 'מנתח את השאילתה...' : 'מבצע חיפוש בנתונים...'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {queryResult && !isLoading && !isExecuting && (
        <SmartQueryResult
          result={queryResult}
          fields={currentFields}
          className="max-w-7xl mx-auto"
        />
      )}

      {/* Empty State */}
      {!queryResult && !isLoading && !isExecuting && !parseError && !executionError && (
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">מוכן לענות על השאלות שלך</h3>
            <p className="text-gray-500">
              השתמש בתיבת החיפוש למעלה כדי לשאול שאלות על התקציב העירוני.
              <br />
              המערכת תבין את השאלה שלך ותציג את התוצאות המתאימות.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 