'use client';

import { useState, useEffect } from 'react';
import { stockManagementApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RenameStockFormProps {
  onSuccess: () => void;
}

export function RenameStockForm({ onSuccess }: RenameStockFormProps) {
  const [oldName, setOldName] = useState('');
  const [newName, setNewName] = useState('');
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

    if (!oldName.trim() || !newName.trim()) {
      toast.error('기존 한글명과 새로운 한글명을 모두 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      const response = await stockManagementApi.renameStock(oldName.trim(), newName.trim());

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

      setOldName('');
      setNewName('');
      onSuccess();
    } catch (error: any) {
      toast.error(`❌ ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-lg border-2 border-amber-200">
      <h3 className="text-xl font-bold text-amber-700 mb-4">✏️ 종목명 변경</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="oldName" className="block text-sm font-semibold text-gray-700 mb-2">
            기존 한글 종목명
          </label>
          <input
            id="oldName"
            type="text"
            value={oldName}
            onChange={(e) => setOldName(e.target.value)}
            list="stockNamesList2"
            placeholder="예: 구글 A"
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
          />
          <datalist id="stockNamesList2">
            {stockNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="newName" className="block text-sm font-semibold text-gray-700 mb-2">
            새로운 한글 종목명
          </label>
          <input
            id="newName"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="예: 알파벳 A"
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? '변경 중...' : '✏️ 종목명 변경하기'}
        </Button>
      </form>
    </div>
  );
}
