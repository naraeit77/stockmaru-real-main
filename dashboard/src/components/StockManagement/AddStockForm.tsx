'use client';

import { useState } from 'react';
import { stockManagementApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AddStockFormProps {
  onSuccess: () => void;
}

export function AddStockForm({ onSuccess }: AddStockFormProps) {
  const [ticker, setTicker] = useState('');
  const [koreanName, setKoreanName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker.trim() || !koreanName.trim()) {
      toast.error('티커와 한글명을 모두 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const response = await stockManagementApi.addStock(ticker.trim().toUpperCase(), koreanName.trim());

      toast.success(`✅ ${response.data.message}`, {
        description: '다음 단계를 진행해주세요',
      });

      // Show next steps
      if (response.data.next_steps) {
        setTimeout(() => {
          toast.info('📝 다음 단계', {
            description: (
              <div className="mt-2">
                <ol className="list-decimal list-inside space-y-1">
                  {response.data.next_steps.map((step: string, index: number) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>
            ),
            duration: 10000,
          });
        }, 1000);
      }

      setTicker('');
      setKoreanName('');
      onSuccess();
    } catch (error: any) {
      toast.error(`❌ ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border-2 border-purple-200">
      <h3 className="text-xl font-bold text-purple-700 mb-4">➕ 새로운 종목 추가</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticker" className="block text-sm font-semibold text-gray-700 mb-2">
            티커 심볼
          </label>
          <input
            id="ticker"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="예: AAPL, MSFT"
            maxLength={10}
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="koreanName" className="block text-sm font-semibold text-gray-700 mb-2">
            한글 종목명
          </label>
          <input
            id="koreanName"
            type="text"
            value={koreanName}
            onChange={(e) => setKoreanName(e.target.value)}
            placeholder="예: 애플, 마이크로소프트"
            className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? '추가 중...' : '➕ 종목 추가하기'}
        </Button>
      </form>
    </div>
  );
}
