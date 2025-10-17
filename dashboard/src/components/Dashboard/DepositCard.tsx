'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { balanceApi } from '@/lib/api';
import { RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepositInfo {
  rt_cd: string;
  msg1: string;
  domestic: {
    dnca_tot_amt: string;  // 예수금총액(원화)
    nxdy_excc_amt: string;  // 익일정산금액
    prvs_rcdl_excc_amt: string;  // 가수도정산금액
    cma_evlu_amt: string;  // CMA평가금액
    tot_evlu_amt: string;  // 총평가금액
  };
  overseas: {
    frcr_ord_psbl_amt1: string;  // 외화주문가능금액(USD)
    frcr_dncl_amt_2: string;  // 외화예수금액(USD)
    ovrs_ord_psbl_amt: string;  // 해외주문가능금액(원화환산)
  };
}

const fetcher = () => balanceApi.getDeposit().then((res) => res.data);

export default function DepositCard() {
  const { data, error, isLoading, mutate } = useSWR<DepositInfo>('/balance/deposit', fetcher, {
    refreshInterval: 30000, // 30초마다 자동 갱신
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
          <CardTitle>예수금 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">예수금 정보를 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>예수금 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 데이터 파싱
  const toNumber = (value?: string) => {
    const normalized = (value ?? '0').toString().replace(/,/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
  };

  const formatUSD = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatKRW = (value: number) =>
    value.toLocaleString('ko-KR', { maximumFractionDigits: 0 });

  const domesticDeposit = toNumber(data.domestic?.dnca_tot_amt);
  const domesticTotal = toNumber(data.domestic?.tot_evlu_amt);
  const overseasDepositUSD = toNumber(data.overseas?.frcr_dncl_amt_2);
  const overseasAvailableUSD = toNumber(data.overseas?.frcr_ord_psbl_amt1);
  const overseasAvailableKRW = toNumber(data.overseas?.ovrs_ord_psbl_amt);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>예수금 현황</CardTitle>
          <CardDescription>원화 및 외화 예수금 잔액</CardDescription>
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
        <div className="space-y-6">
          {/* 원화 예수금 */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">원화 (KRW)</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">예수금 총액</span>
                <span className="text-lg font-bold">₩{formatKRW(domesticDeposit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">총 평가금액</span>
                <span className="text-base font-medium">₩{formatKRW(domesticTotal)}</span>
              </div>
            </div>
          </div>

          {/* 외화 예수금 (USD) */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">외화 (USD)</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">외화 예수금</span>
                <span className="text-lg font-bold text-green-600">${formatUSD(overseasDepositUSD)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">주문가능금액 (USD)</span>
                <span className="text-base font-medium">${formatUSD(overseasAvailableUSD)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-muted-foreground">주문가능금액 (원화환산)</span>
                <span className="text-sm font-medium text-muted-foreground">₩{formatKRW(overseasAvailableKRW)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
