'use client';

import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { recommendationApi } from '@/lib/api';
import { SellCandidatesResponse } from '@/types';
import { AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const fetcher = () => recommendationApi.getSellCandidates().then((res) => res.data);

export default function SellCandidatesCard() {
  const { data, error, isLoading, mutate } = useSWR<SellCandidatesResponse>(
    '/sell-candidates',
    fetcher,
    {
      refreshInterval: 30000, // 30초마다 자동 갱신
    }
  );

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
          <CardTitle>매도 대상</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">매도 대상을 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매도 대상</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const candidates = data?.sell_candidates || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            매도 대상 종목
          </CardTitle>
          <CardDescription>
            {candidates.length > 0
              ? `${candidates.length}개 종목이 매도 조건을 충족했습니다`
              : '현재 매도 대상 종목이 없습니다'}
          </CardDescription>
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
        <div className="space-y-3">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>매도 대상 종목이 없습니다</p>
            </div>
          ) : (
            candidates.map((item, index) => {
              const isProfit = item.price_change_percent >= 0;
              const isStopLoss = item.price_change_percent <= -5;
              const isTakeProfit = item.price_change_percent >= 5;

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 space-y-3 ${
                    isStopLoss
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : isTakeProfit
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  }`}
                >
                  {/* 헤더 */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{item.stock_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.ticker}
                        </Badge>
                        {isStopLoss && (
                          <Badge variant="destructive" className="text-xs">
                            손절
                          </Badge>
                        )}
                        {isTakeProfit && (
                          <Badge variant="default" className="bg-green-600 text-xs">
                            익절
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={isProfit ? 'default' : 'destructive'}
                      className="text-base px-3"
                    >
                      {isProfit ? '+' : ''}
                      {item.price_change_percent.toFixed(2)}%
                    </Badge>
                  </div>

                  {/* 가격 정보 */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">매수가</p>
                      <p className="font-medium">${item.purchase_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="font-medium">${item.current_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">보유수량</p>
                      <p className="font-medium">{item.quantity}주</p>
                    </div>
                  </div>

                  {/* 매도 사유 */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">매도 사유:</p>
                    <div className="space-y-1">
                      {item.sell_reasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 기술적 지표 */}
                  {item.technical_sell_details && item.technical_sell_details.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        기술적 매도 신호 ({item.technical_sell_signals}개):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.technical_sell_details.map((signal, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {signal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 감성 점수 */}
                  {item.sentiment_score !== null && (
                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">뉴스 감성</span>
                      <Badge
                        variant={item.sentiment_score >= 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {item.sentiment_score.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
