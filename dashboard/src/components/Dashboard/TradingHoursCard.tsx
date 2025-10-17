'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Globe } from 'lucide-react';

interface TradingStatus {
  isOpen: boolean;
  message: string;
}

export default function TradingHoursCard() {
  const [koreaTime, setKoreaTime] = useState<string>('');
  const [usTime, setUsTime] = useState<string>('');
  const [tradingStatus, setTradingStatus] = useState<TradingStatus>({
    isOpen: false,
    message: '장 마감',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // 한국 시간 (UTC+9)
      const koreaTimeString = now.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // 미국 동부 시간 (UTC-5/-4, EST/EDT)
      const usTimeString = now.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      setKoreaTime(koreaTimeString);
      setUsTime(usTimeString);

      // 매매 가능 시간 확인 (미국 동부 시간 기준)
      const usDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/New_York' })
      );
      const dayOfWeek = usDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
      const hours = usDate.getHours();
      const minutes = usDate.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      // 주말 체크
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setTradingStatus({
          isOpen: false,
          message: '주말 (장 마감)',
        });
        return;
      }

      // 나스닥 정규장: 09:30 ~ 16:00 (EST/EDT)
      const marketOpen = 9 * 60 + 30; // 09:30
      const marketClose = 16 * 60; // 16:00

      // 프리마켓: 04:00 ~ 09:30 (EST/EDT)
      const preMarketOpen = 4 * 60; // 04:00

      // 애프터마켓: 16:00 ~ 20:00 (EST/EDT)
      const afterMarketClose = 20 * 60; // 20:00

      if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        setTradingStatus({
          isOpen: true,
          message: '정규장 (매매 가능)',
        });
      } else if (currentMinutes >= preMarketOpen && currentMinutes < marketOpen) {
        setTradingStatus({
          isOpen: false,
          message: '프리마켓',
        });
      } else if (currentMinutes >= marketClose && currentMinutes < afterMarketClose) {
        setTradingStatus({
          isOpen: false,
          message: '애프터마켓',
        });
      } else {
        setTradingStatus({
          isOpen: false,
          message: '장 마감',
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // 1초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 매매 가능 상태 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">나스닥 거래 상태</span>
            </div>
            <Badge
              variant={tradingStatus.isOpen ? 'default' : 'secondary'}
              className={
                tradingStatus.isOpen
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-500 hover:bg-gray-600'
              }
            >
              {tradingStatus.message}
            </Badge>
          </div>

          {/* 한국 시간 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">한국 시간 (KST)</span>
            </div>
            <span className="font-mono font-semibold">{koreaTime}</span>
          </div>

          {/* 미국 동부 시간 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">미국 시간 (EST)</span>
            </div>
            <span className="font-mono font-semibold">{usTime}</span>
          </div>

          {/* 정규 거래 시간 안내 */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>정규장:</span>
                <span className="font-medium">09:30 ~ 16:00 (EST)</span>
              </div>
              <div className="flex justify-between">
                <span>한국 시간:</span>
                <span className="font-medium">23:30 ~ 06:00 (KST)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
