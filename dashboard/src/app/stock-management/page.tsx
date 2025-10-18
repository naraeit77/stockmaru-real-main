'use client';

import { useState } from 'react';
import { StockList } from '@/components/StockManagement/StockList';
import { AddStockForm } from '@/components/StockManagement/AddStockForm';
import { RemoveStockForm } from '@/components/StockManagement/RemoveStockForm';
import { RenameStockForm } from '@/components/StockManagement/RenameStockForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function StockManagementPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">📊 주식 종목 관리</h1>
            <p className="text-purple-100 text-lg">종목 추가, 삭제, 수정을 웹에서 간편하게</p>
          </div>
        </div>

        {/* Stock List */}
        <div className="mb-6">
          <StockList key={refreshTrigger} />
        </div>

        {/* Management Forms */}
        <Card className="p-6 bg-white/95 backdrop-blur">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-4 border-purple-600 pb-3">
            🛠️ 종목 관리
          </h2>

          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="add" className="text-lg">➕ 종목 추가</TabsTrigger>
              <TabsTrigger value="remove" className="text-lg">🗑️ 종목 삭제</TabsTrigger>
              <TabsTrigger value="rename" className="text-lg">✏️ 종목명 변경</TabsTrigger>
            </TabsList>

            <TabsContent value="add">
              <AddStockForm onSuccess={handleRefresh} />
            </TabsContent>

            <TabsContent value="remove">
              <RemoveStockForm onSuccess={handleRefresh} />
            </TabsContent>

            <TabsContent value="rename">
              <RenameStockForm onSuccess={handleRefresh} />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
          >
            ← 대시보드로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
