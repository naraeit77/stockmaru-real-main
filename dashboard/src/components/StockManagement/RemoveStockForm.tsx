'use client';

import { useState, useEffect } from 'react';
import { stockManagementApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RemoveStockFormProps {
  onSuccess: () => void;
}

export function RemoveStockForm({ onSuccess }: RemoveStockFormProps) {
  const [koreanName, setKoreanName] = useState('');
  const [stockNames, setStockNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStockNames();
  }, []);

  const loadStockNames = async () => {
    try {
      const response = await stockManagementApi.getStocks();
      const names = response.data.map((stock: any) => stock.korean_name);
      setStockNames(names);
    } catch (error) {
      // Silently fail - stock names are just for autocomplete
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!koreanName.trim()) {
      toast.error('삭제할 종목의 한글명을 입력해주세요');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(`정말로 '${koreanName}' 종목을 삭제하시겠습니까?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await stockManagementApi.removeStock(koreanName.trim());

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

      setKoreanName('');
      onSuccess();
    } catch (error: any) {
      toast.error(`❌ ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200">
      <h3 className="text-xl font-bold text-red-700 mb-4">🗑️ 종목 삭제</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="removeKoreanName" className="block text-sm font-semibold text-gray-700 mb-2">
            삭제할 종목의 한글명
          </label>
          <input
            id="removeKoreanName"
            type="text"
            value={koreanName}
            onChange={(e) => setKoreanName(e.target.value)}
            list="stockNamesList"
            placeholder="예: 페이팔"
            className="w-full px-4 py-3 border-2 border-red-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
          />
          <datalist id="stockNamesList">
            {stockNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? '삭제 중...' : '🗑️ 종목 삭제하기'}
        </Button>

        <p className="text-sm text-red-600 mt-2">
          ⚠️ 삭제 후 데이터 수집과 모델 재학습이 필요합니다
        </p>
      </form>
    </div>
  );
}
