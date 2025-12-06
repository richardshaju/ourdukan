'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AnalyticsData {
  productPerformance: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  aiInsights: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <Button onClick={generateInsights} isLoading={isGenerating}>
          Refresh Insights
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : analytics ? (
        <div className="space-y-6">
          <Card title="AI-Powered Insights">
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">
                {analytics.aiInsights}
              </p>
            </div>
          </Card>

          <Card title="Product Performance">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.productPerformance.map((product, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.sales}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-500">No analytics data available.</p>
        </Card>
      )}
    </div>
  );
}

