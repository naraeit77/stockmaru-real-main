'use client';

import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { recommendationApi } from '@/lib/api';
import { CombinedRecommendationResponse } from '@/types';
import { TrendingUp, Sparkles, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const fetcher = () =>
  recommendationApi.getWithTechnicalAndSentiment().then((res) => res.data);

export default function RecommendationsCard() {
  const { data, error, isLoading, mutate } = useSWR<CombinedRecommendationResponse>(
    '/recommendations/combined',
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
          <CardTitle>추천 종목</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">추천 종목을 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>추천 종목</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendations = data?.results || [];
  const topRecommendations = recommendations.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI 추천 종목
          </CardTitle>
          <CardDescription>
            종합 분석 기반 매수 추천 ({recommendations.length}개)
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
          {topRecommendations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              현재 추천 가능한 종목이 없습니다.
            </p>
          ) : (
            topRecommendations.map((item, index) => {
              const priceChange = ((item.predicted_price - item.last_price) / item.last_price) * 100;

              return (
                <div
                  key={index}
                  className="rounded-lg border p-4 hover:bg-accent transition-colors space-y-3"
                >
                  {/* 헤더 */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{item.stock_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.ticker}
                        </Badge>
                        <Badge
                          variant="default"
                          className="bg-gradient-to-r from-yellow-500 to-orange-500"
                        >
                          추천 #{index + 1}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.analysis}</p>
                    </div>
                  </div>

                  {/* 가격 정보 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">현재가</p>
                      <p className="text-sm font-medium">${item.last_price.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">예상가</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">${item.predicted_price.toFixed(2)}</p>
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

                  {/* 지표 정보 */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      정확도 {item.accuracy.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      상승확률 {item.rise_probability.toFixed(1)}%
                    </Badge>
                    {item.golden_cross && (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        골든크로스
                      </Badge>
                    )}
                    {item.macd_buy_signal && (
                      <Badge variant="default" className="bg-blue-600 text-xs">
                        MACD 매수신호
                      </Badge>
                    )}
                    {item.rsi < 50 && (
                      <Badge variant="default" className="bg-purple-600 text-xs">
                        RSI {item.rsi.toFixed(0)}
                      </Badge>
                    )}
                    {item.sentiment_score !== null && item.sentiment_score >= 0.15 && (
                      <Badge variant="default" className="bg-yellow-600 text-xs">
                        긍정 뉴스 {item.sentiment_score.toFixed(2)}
                      </Badge>
                    )}
                  </div>

                  {/* 종합 점수 */}
                  {item.composite_score !== undefined && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">종합 점수</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all"
                              style={{ width: `${Math.min(item.composite_score * 10, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {item.composite_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
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
