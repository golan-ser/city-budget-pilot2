import React, { useState } from 'react';
import ReportsDashboard from '../modules/reports/pages/ReportsDashboard';
import ReportsCenter from '../components/ReportsCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, TrendingUp } from 'lucide-react';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">דיווחים ואנליטיקה</h1>
        <p className="text-muted-foreground">מרכז הדיווחים והאנליטיקה של המערכת</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            דשבורד דיווחים
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            דיווחים מתקדמים
          </TabsTrigger>
          <TabsTrigger value="classic" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            דיווחים קלאסיים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>דשבורד דיווחים</CardTitle>
              <CardDescription>
                סקירה כללית של כל הדיווחים במערכת עם גרפים ונתונים סטטיסטיים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <ReportsCenter />
        </TabsContent>

        <TabsContent value="classic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>דיווחים קלאסיים</CardTitle>
              <CardDescription>
                הגישה הקלאסית לניהול דיווחים - הוספה, עריכה ומחיקה של דיווחים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">בקרוב...</h3>
                <p className="text-muted-foreground">
                  הממשק הקלאסי לניהול דיווחים יהיה זמין בקרוב
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
