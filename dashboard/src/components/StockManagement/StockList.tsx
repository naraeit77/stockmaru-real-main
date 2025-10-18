'use client';

import { useEffect, useState } from 'react';
import { stockManagementApi } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Stock {
  ticker: string;
  korean_name: string;
}

export function StockList() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      setLoading(true);
      const response = await stockManagementApi.getStocks();
      setStocks(response.data);
      setLastUpdate(new Date().toLocaleTimeString('ko-KR'));
    } catch (error: any) {
      toast.error(`종목 목록을 불러오는데 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 bg-white/95 backdrop-blur">
        <div className="flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">종목 목록을 불러오는 중...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-white/95 backdrop-blur">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">📋 등록된 종목 목록</h2>
            <p className="text-gray-600">총 {stocks.length}개 종목</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">마지막 업데이트</p>
            <p className="text-lg font-semibold text-purple-600">{lastUpdate}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">#</th>
              <th className="px-6 py-4 text-left font-semibold">티커</th>
              <th className="px-6 py-4 text-left font-semibold">한글명</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, index) => (
              <tr
                key={stock.ticker}
                className="border-b border-gray-200 hover:bg-purple-50 transition-colors"
              >
                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                <td className="px-6 py-4">
                  <Badge className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1">
                    {stock.ticker}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-800 font-medium">{stock.korean_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stocks.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <p className="text-xl mb-2">📭 등록된 종목이 없습니다</p>
          <p className="text-sm">아래에서 종목을 추가해주세요</p>
        </div>
      )}
    </Card>
  );
}
