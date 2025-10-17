'use client';

import BalanceCard from '@/components/Dashboard/BalanceCard';
import RecommendationsCard from '@/components/Dashboard/RecommendationsCard';
import BuyCandidatesCard from '@/components/Dashboard/BuyCandidatesCard';
import SellCandidatesCard from '@/components/Dashboard/SellCandidatesCard';
import SchedulerStatus from '@/components/Dashboard/SchedulerStatus';
import TradingHistoryCard from '@/components/Dashboard/TradingHistoryCard';
import TradingHoursCard from '@/components/Dashboard/TradingHoursCard';
import DepositCard from '@/components/Dashboard/DepositCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽: 타이틀 */}
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">StockMaru Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  AI 기반 NASDAQ 자동매매 시스템
                </p>
              </div>
            </div>

            {/* 오른쪽: 매매 가능 시간 */}
            <div className="w-80">
              <TradingHoursCard />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">전체 현황</TabsTrigger>
            <TabsTrigger value="trading">매매 현황</TabsTrigger>
            <TabsTrigger value="recommendations">추천 종목</TabsTrigger>
            <TabsTrigger value="control">제어</TabsTrigger>
          </TabsList>

          {/* 전체 현황 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 잔고 현황 */}
              <BalanceCard />

              {/* 스케줄러 상태 */}
              <SchedulerStatus />
            </div>

            {/* 매매 현황 */}
            <div className="grid grid-cols-1 gap-6">
              <TradingHistoryCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 매수 대상 */}
              <BuyCandidatesCard />

              {/* 매도 대상 */}
              <SellCandidatesCard />
            </div>

            {/* 예수금 현황 */}
            <div className="grid grid-cols-1 gap-6">
              <DepositCard />
            </div>
          </TabsContent>

          {/* 매매 현황 탭 */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <TradingHistoryCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BuyCandidatesCard />
              <SellCandidatesCard />
            </div>
            <div className="grid grid-cols-1 gap-6">
              <BalanceCard />
            </div>
          </TabsContent>

          {/* 추천 종목 탭 */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <BuyCandidatesCard />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecommendationsCard />
              <SellCandidatesCard />
            </div>
          </TabsContent>

          {/* 제어 탭 */}
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SchedulerStatus />
              <BalanceCard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
