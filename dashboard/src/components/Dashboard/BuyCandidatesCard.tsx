'use client';

import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { recommendationApi } from '@/lib/api';
import { CombinedRecommendationResponse } from '@/types';
import { ShoppingCart, TrendingUp, RefreshCw, Activity, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const fetcher = () =>
  recommendationApi.getWithTechnicalAndSentiment().then((res) => res.data);

export default function BuyCandidatesCard() {
  const { data, error, isLoading, mutate } = useSWR<CombinedRecommendationResponse>(
    '/buy-candidates',
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
          <CardTitle>매수 대상</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">매수 대상을 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매수 대상</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const candidates = data?.results || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            매수 대상 종목
          </CardTitle>
          <CardDescription>
            {candidates.length > 0
              ? `${candidates.length}개 종목이 매수 조건을 충족했습니다`
              : '현재 매수 대상 종목이 없습니다'}
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
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>매수 대상 종목이 없습니다</p>
            </div>
          ) : (
            candidates.map((item, index) => {
              const priceChange = ((item.predicted_price - item.last_price) / item.last_price) * 100;
              const isTopPick = index < 3;

              return (
                <div
                  key={index}
                  className={`rounded-lg border p-4 space-y-3 transition-colors ${
                    isTopPick
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'hover:bg-accent'
                  }`}
                >
                  {/* 헤더 */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">{item.stock_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.ticker}
                        </Badge>
                        {isTopPick && (
                          <Badge
                            variant="default"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-xs"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            추천 #{index + 1}
                          </Badge>
                        )}
                        <Badge
                          variant="default"
                          className="bg-blue-600 text-xs"
                        >
                          잔고 5% 투자
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.analysis}
                      </p>
                    </div>
                  </div>

                  {/* 가격 정보 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="text-base font-medium">${item.last_price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">예상가 (14일)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium">${item.predicted_price.toFixed(2)}</p>
                        <Badge
                          variant={priceChange >= 0 ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {priceChange >= 0 ? '+' : ''}
                          {priceChange.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* AI 지표 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">정확도:</span>
                      <span className="font-medium">{item.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">상승확률:</span>
                      <span className="font-medium">{item.rise_probability.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* 매수 근거 */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">매수 근거:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.golden_cross && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          골든크로스
                        </Badge>
                      )}
                      {item.macd_buy_signal && (
                        <Badge variant="default" className="bg-blue-600 text-xs">
                          MACD 매수
                        </Badge>
                      )}
                      {item.rsi < 50 && (
                        <Badge variant="default" className="bg-purple-600 text-xs">
                          RSI {item.rsi.toFixed(0)}
                        </Badge>
                      )}
                      {item.sentiment_score !== null && item.sentiment_score >= 0.15 && (
                        <Badge variant="default" className="bg-yellow-600 text-xs">
                          긍정 뉴스 ({item.sentiment_score.toFixed(2)})
                        </Badge>
                      )}
                      {item.accuracy >= 80 && (
                        <Badge variant="default" className="bg-indigo-600 text-xs">
                          고정확도 ({item.accuracy.toFixed(0)}%)
                        </Badge>
                      )}
                      {item.rise_probability >= 3 && (
                        <Badge variant="default" className="bg-emerald-600 text-xs">
                          상승예상 ({item.rise_probability.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* 종합 점수 */}
                  {item.composite_score !== undefined && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          종합 매수 점수
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {item.composite_score.toFixed(1)} / 10
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                          style={{ width: `${Math.min(item.composite_score * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 예상 수익률 */}
                  <div className="pt-2 border-t bg-green-50 dark:bg-green-950/30 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        14일 예상 수익률
                      </span>
                      <span className="text-base font-bold text-green-700 dark:text-green-400">
                        +{priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
