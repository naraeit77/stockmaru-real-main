'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { balanceApi } from '@/lib/api';
import { BalanceResponse, OverseasBalanceItem } from '@/types';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fetcher = () => balanceApi.getOverseas().then((res) => res.data);

export default function BalanceCard() {
  const { data, error, isLoading, mutate } = useSWR<BalanceResponse>('/balance/overseas', fetcher, {
    refreshInterval: 10000, // 10초마다 자동 갱신
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>잔고 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">잔고 정보를 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>잔고 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const holdings = (data?.output1 as OverseasBalanceItem[]) || [];
  const totalInfo = data?.output2;

  // 총 평가금액과 손익 계산
  const totalValue = holdings.reduce(
    (sum, item) => sum + parseFloat(item.frcr_evlu_amt2 || '0'),
    0
  );
  const totalProfitLoss = holdings.reduce(
    (sum, item) => sum + parseFloat(item.evlu_pfls_amt || '0'),
    0
  );
  const totalProfitLossRate =
    totalValue > 0 ? ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100).toFixed(2) : '0.00';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>해외주식 잔고 현황</CardTitle>
          <CardDescription>보유 종목: {holdings.length}개</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 총 평가 정보 */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">총 평가금액</span>
              <span className="text-lg font-bold">${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">평가손익</span>
              <div className="flex items-center gap-2">
                {parseFloat(totalProfitLossRate) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-lg font-bold ${
                    totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${Math.abs(totalProfitLoss).toLocaleString()} ({totalProfitLossRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* 보유 종목 리스트 */}
          <div className="space-y-2">
            {holdings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">보유 종목이 없습니다.</p>
            ) : (
              holdings.map((item, index) => {
                const profitLoss = parseFloat(item.evlu_pfls_amt || '0');
                const profitLossRate = parseFloat(item.evlu_pfls_rt || '0');
                const currentPrice = parseFloat(item.now_pric2 || '0');
                const quantity = parseInt(item.ovrs_cblc_qty || '0');

                return (
                  <div
                    key={index}
                    className="rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.ovrs_item_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.ovrs_pdno}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          보유: {quantity}주 @ ${parseFloat(item.pchs_avg_pric || '0').toFixed(2)}
                        </p>
                      </div>
                      <Badge
                        variant={profitLoss >= 0 ? 'default' : 'destructive'}
                        className="whitespace-nowrap"
                      >
                        {profitLoss >= 0 ? '+' : ''}
                        {profitLossRate.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">현재가</span>
                      <span className="font-medium">${currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">평가금액</span>
                      <span className="font-medium">
                        ${parseFloat(item.frcr_evlu_amt2 || '0').toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
