import React, { useMemo } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Table as TableIcon, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { ParsedIntent, QueryField, SmartQueryResult as QueryResult } from '../types/querySchema';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SmartQueryResultProps {
  result: QueryResult;
  fields: QueryField[];
  onExport?: (format: 'excel' | 'pdf') => void;
  className?: string;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

export function SmartQueryResult({ result, fields, onExport, className = '' }: SmartQueryResultProps) {
  const { data, parsed, suggestedGraphs, insights, totalCount, executionTime } = result;

  // Format field values based on their type
  const formatValue = (value: any, field: QueryField): string => {
    if (value === null || value === undefined) return '-';
    
    switch (field.format) {
      case 'currency':
        return new Intl.NumberFormat('he-IL', {
          style: 'currency',
          currency: 'ILS',
          minimumFractionDigits: 0
        }).format(Number(value));
      
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      
      case 'date':
        return new Date(value).toLocaleDateString('he-IL');
      
      case 'datetime':
        return new Date(value).toLocaleString('he-IL');
      
      default:
        return String(value);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!suggestedGraphs.length || !data.length) return null;
    
    const graph = suggestedGraphs[0];
    const xField = fields.find(f => f.key === graph.xField);
    const yField = fields.find(f => f.key === graph.yField);
    
    if (!xField || !yField) return null;

    return data.map(item => ({
      name: formatValue(item[graph.xField], xField),
      value: Number(item[graph.yField]) || 0,
      fullItem: item
    }));
  }, [data, suggestedGraphs, fields]);

  // Export functions
  const exportAsExcel = () => {
    const exportData = data.map(row => {
      const exportRow: Record<string, any> = {};
      fields.forEach(field => {
        exportRow[field.label] = formatValue(row[field.key], field);
      });
      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'דוח חכם');
    XLSX.writeFile(workbook, `smart_query_${Date.now()}.xlsx`);
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("דוח חכם", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`נוצר בתאריך: ${new Date().toLocaleDateString("he-IL")}`, 14, 30);
    doc.text(`סה"כ רשומות: ${totalCount}`, 14, 35);
    doc.text(`זמן ביצוע: ${executionTime}ms`, 14, 40);

    const tableData = data.map(row => 
      fields.map(field => formatValue(row[field.key], field))
    );

    autoTable(doc, {
      head: [fields.map(f => f.label)],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });

    doc.save(`smart_query_${Date.now()}.pdf`);
  };

  if (!data.length) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>לא נמצאו תוצאות המתאימות לחיפוש שלך</p>
            <p className="text-sm mt-2">נסה לנסח את השאלה אחרת או להשתמש במילים אחרות</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Query interpretation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              פירוש השאילתה
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{totalCount} תוצאות</span>
              <span>•</span>
              <span>{executionTime}ms</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              📊 דוח: {parsed.domain === 'tabarim' ? 'תב"רים' : 'סעיפי תקציב'}
            </Badge>
            {Object.entries(parsed.filters).map(([key, value]) => (
              <Badge key={key} variant="secondary">
                {key}: {String(value)}
              </Badge>
            ))}
            {parsed.action !== 'list' && (
              <Badge variant="default">
                פעולה: {parsed.action}
              </Badge>
            )}
          </div>
          {parsed.explanation && (
            <p className="text-sm text-gray-600 mt-2">{parsed.explanation}</p>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תובנות</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData && suggestedGraphs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {suggestedGraphs[0].type === 'pie' ? (
                <PieChartIcon className="h-5 w-5 text-green-600" />
              ) : (
                <BarChart3 className="h-5 w-5 text-green-600" />
              )}
              {suggestedGraphs[0].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {suggestedGraphs[0].type === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatValue(value, fields.find(f => f.key === suggestedGraphs[0].yField)!), '']} />
                  </PieChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatValue(value, fields.find(f => f.key === suggestedGraphs[0].yField)!), '']} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-blue-600" />
              תוצאות ({totalCount})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsExcel}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAsPDF}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((field) => (
                    <TableHead key={field.key} className="text-right">
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    {fields.map((field) => (
                      <TableCell key={field.key} className="text-right">
                        {formatValue(row[field.key], field)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 