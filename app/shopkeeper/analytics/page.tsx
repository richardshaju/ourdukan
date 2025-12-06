'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ReactMarkdown from 'react-markdown';

interface FeedbackData {
  _id: string;
  rating: number;
  comment: string;
  userId: {
    name: string;
    email: string;
  };
  orderId: {
    total: number;
    createdAt: string;
  };
  createdAt: string;
}

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenue7Days: number;
    revenue30Days: number;
    orders7Days: number;
    orders30Days: number;
  };
  feedback?: {
    feedbacks: FeedbackData[];
    averageRating: string;
    totalFeedbacks: number;
    aiSummary?: string;
  };
  productPerformance: Array<{
    id?: string;
    name: string;
    category: string;
    sales: number;
    revenue: number;
    stock: number;
    stockStatus: string;
    turnoverRate: number;
    averagePrice: number;
    orderCount: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  dailySalesTrend: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    stock: number;
  }>;
  topRevenueProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    stock: number;
  }>;
  lowStockProducts: Array<{
    name: string;
    stock: number;
    stockStatus: string;
    sales: number;
  }>;
  slowMovingProducts: Array<{
    name: string;
    stock: number;
    sales: number;
    revenue: number;
  }>;
  aiInsights: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'feedback'>('analytics');

  const generateInsights = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    try {
      const analyticsResponse = await fetch('/api/analytics', { method: 'POST' });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'feedback'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Feedback
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : analytics ? (
        <div className="space-y-6">
          {activeTab === 'analytics' && (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.summary.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {analytics.summary.orders30Days} orders (30 days)
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Revenue (7 Days)</p>
                <p className="text-2xl font-bold text-green-600">
                  ${analytics.summary.revenue7Days.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {analytics.summary.orders7Days} orders
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.summary.totalOrders}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  All time
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${analytics.summary.averageOrderValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Per order
                </p>
              </div>
            </Card>
          </div>

          {/* Top Selling Products */}
          <Card title="Top Selling Products (By Quantity)">
            <div className="space-y-3">
              {analytics.topSellingProducts.length > 0 ? (
                analytics.topSellingProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.stock} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{product.sales} sold</p>
                      <p className="text-sm text-gray-500">
                        ${product.revenue.toFixed(2)} revenue
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No sales data available</p>
              )}
            </div>
          </Card>

          {/* Top Revenue Products */}
          <Card title="Top Revenue Products">
            <div className="space-y-3">
              {analytics.topRevenueProducts.length > 0 ? (
                analytics.topRevenueProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.sales} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${product.revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No revenue data available</p>
              )}
            </div>
          </Card>

          {/* Low Stock Alerts */}
          {analytics.lowStockProducts.length > 0 && (
            <Card title="Low Stock Alerts">
              <div className="space-y-3">
                {analytics.lowStockProducts.map((product, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      product.stockStatus === 'out_of_stock'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.sales} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          product.stockStatus === 'out_of_stock'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {product.stockStatus === 'out_of_stock'
                          ? 'Out of Stock'
                          : `${product.stock} left`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Category Performance */}
          {analytics.categoryPerformance.length > 0 && (
            <Card title="Category Performance">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.categoryPerformance.map((category, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.category}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {category.sales}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          ${category.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Daily Sales Trend */}
          {analytics.dailySalesTrend.length > 0 && (
            <Card title="Daily Sales Trend (Last 7 Days)">
              <div className="space-y-2">
                {analytics.dailySalesTrend.map((day, idx) => {
                  const date = new Date(day.date);
                  const dateStr = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{dateStr}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Units</p>
                          <p className="font-semibold text-gray-900">{day.sales}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="font-semibold text-green-600">
                            ${day.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Slow Moving Products */}
          {analytics.slowMovingProducts.length > 0 && (
            <Card title="Slow Moving Products (No Sales)">
              <div className="space-y-3">
                {analytics.slowMovingProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        No sales recorded
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-600">
                        {product.stock} in stock
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detailed Product Performance Table */}
          <Card title="Complete Product Performance">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.productPerformance.map((product, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.stockStatus === 'out_of_stock'
                              ? 'bg-red-100 text-red-800'
                              : product.stockStatus === 'low_stock'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.sales}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${product.revenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${product.averagePrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>


              {/* AI Insights */}
              <Card title="AI-Powered Insights">
                <div className="prose max-w-none text-black prose-headings:text-black prose-p:text-black prose-strong:text-black prose-ul:text-black prose-ol:text-black prose-li:text-black">
                  <ReactMarkdown>{analytics.aiInsights}</ReactMarkdown>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'feedback' && (
            <>
              {/* Customer Feedback & Ratings */}
              <Card title="Customer Feedback & Ratings">
                {analytics.feedback && analytics.feedback.totalFeedbacks > 0 ? (
                  <>
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm text-gray-600 mb-2">Average Rating</p>
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-bold text-gray-900">
                            {analytics.feedback.averageRating}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-6 h-6 ${
                                  star <= Math.round(parseFloat(analytics.feedback!.averageRating))
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Out of 5.0 stars</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-600 mb-2">Total Reviews</p>
                        <p className="text-4xl font-bold text-gray-900">
                          {analytics.feedback.totalFeedbacks}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Customer feedbacks</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">Rating Distribution</p>
                        <div className="space-y-1 mt-2">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = analytics.feedback!.feedbacks.filter(
                              (f) => f.rating === rating
                            ).length;
                            const percentage =
                              (count / analytics.feedback!.totalFeedbacks) * 100;
                            return (
                              <div key={rating} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-4">{rating}★</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 w-8 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* AI Summary of Feedbacks */}
                    {analytics.feedback.aiSummary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          <h3 className="text-lg font-semibold text-blue-900">AI Feedback Summary</h3>
                        </div>
                        <div className="prose max-w-none text-blue-900 prose-headings:text-blue-900 prose-p:text-blue-900 prose-strong:text-blue-900 prose-ul:text-blue-900 prose-ol:text-blue-900 prose-li:text-blue-900">
                          <ReactMarkdown>{analytics.feedback.aiSummary}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Individual Reviews */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {analytics.feedback.feedbacks.slice(0, 10).map((feedbackItem) => (
                          <div
                            key={feedbackItem._id}
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {feedbackItem.userId.name || feedbackItem.userId.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(feedbackItem.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-5 h-5 ${
                                      star <= feedbackItem.rating
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                                <span className="ml-1 text-sm font-medium text-gray-700">
                                  {feedbackItem.rating}/5
                                </span>
                              </div>
                            </div>
                            {feedbackItem.comment && (
                              <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                                {feedbackItem.comment}
                              </p>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-400">
                                Order Value: ${feedbackItem.orderId.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {analytics.feedback.totalFeedbacks > 10 && (
                        <p className="text-sm text-gray-500 text-center mt-4">
                          Showing 10 of {analytics.feedback.totalFeedbacks} reviews
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Customer feedback and ratings will appear here once customers submit reviews.
                    </p>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-gray-500">No analytics data available.</p>
        </Card>
      )}
    </div>
  );
}

