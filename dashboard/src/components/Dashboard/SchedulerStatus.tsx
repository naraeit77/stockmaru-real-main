'use client';

import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { schedulerApi } from '@/lib/api';
import { SchedulerStatus as SchedulerStatusType } from '@/types';
import { Play, Pause, Zap, RefreshCw, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const fetcher = () => schedulerApi.getStatus().then((res) => res.data);

export default function SchedulerStatus() {
  const { data, error, isLoading, mutate } = useSWR<SchedulerStatusType>(
    '/scheduler/status',
    fetcher,
    {
      refreshInterval: 5000, // 5초마다 자동 갱신
    }
  );

  const [isProcessing, setIsProcessing] = useState<{
    buyNow: boolean;
    sellNow: boolean;
    startBuy: boolean;
    stopBuy: boolean;
    startSell: boolean;
    stopSell: boolean;
  }>({
    buyNow: false,
    sellNow: false,
    startBuy: false,
    stopBuy: false,
    startSell: false,
    stopSell: false,
  });

  const handleAction = async (
    action: keyof typeof isProcessing,
    apiCall: () => Promise<any>,
    successMessage: string
  ) => {
    setIsProcessing((prev) => ({ ...prev, [action]: true }));
    try {
      await apiCall();
      await mutate();
      toast.success(successMessage);
    } catch (error) {
      toast.error('작업 실행 중 오류가 발생했습니다');
    } finally {
      setIsProcessing((prev) => ({ ...prev, [action]: false }));
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자동매매 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">상태 정보를 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>자동매매 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const buySchedulerRunning = data?.buy_running || false;
  const sellSchedulerRunning = data?.sell_running || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          자동매매 제어
        </CardTitle>
        <CardDescription>매수/매도 스케줄러 상태 및 즉시 실행</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 매수 스케줄러 */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                매수 스케줄러
                <Badge variant={buySchedulerRunning ? 'default' : 'secondary'}>
                  {buySchedulerRunning ? '실행 중' : '중지됨'}
                </Badge>
              </h3>
              {data?.buy_next_run_time && buySchedulerRunning && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  다음 실행: {new Date(data.buy_next_run_time).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction(
                  'buyNow',
                  schedulerApi.runBuyNow,
                  '매수 작업을 즉시 실행했습니다'
                )
              }
              disabled={isProcessing.buyNow}
            >
              {isProcessing.buyNow ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              즉시 실행
            </Button>
            {buySchedulerRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleAction(
                    'stopBuy',
                    schedulerApi.stopBuy,
                    '매수 스케줄러를 중지했습니다'
                  )
                }
                disabled={isProcessing.stopBuy}
              >
                {isProcessing.stopBuy ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                중지
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  handleAction(
                    'startBuy',
                    schedulerApi.startBuy,
                    '매수 스케줄러를 시작했습니다'
                  )
                }
                disabled={isProcessing.startBuy}
              >
                {isProcessing.startBuy ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                시작
              </Button>
            )}
          </div>
        </div>

        {/* 매도 스케줄러 */}
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                매도 스케줄러
                <Badge variant={sellSchedulerRunning ? 'default' : 'secondary'}>
                  {sellSchedulerRunning ? '실행 중' : '중지됨'}
                </Badge>
              </h3>
              {data?.sell_next_run_time && sellSchedulerRunning && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  다음 실행: {new Date(data.sell_next_run_time).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction(
                  'sellNow',
                  schedulerApi.runSellNow,
                  '매도 작업을 즉시 실행했습니다'
                )
              }
              disabled={isProcessing.sellNow}
            >
              {isProcessing.sellNow ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              즉시 실행
            </Button>
            {sellSchedulerRunning ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  handleAction(
                    'stopSell',
                    schedulerApi.stopSell,
                    '매도 스케줄러를 중지했습니다'
                  )
                }
                disabled={isProcessing.stopSell}
              >
                {isProcessing.stopSell ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                중지
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  handleAction(
                    'startSell',
                    schedulerApi.startSell,
                    '매도 스케줄러를 시작했습니다'
                  )
                }
                disabled={isProcessing.startSell}
              >
                {isProcessing.startSell ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                시작
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
