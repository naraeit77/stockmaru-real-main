'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tradingHistoryApi } from '@/lib/api';
import { NccsResponse, OrderResvResponse } from '@/types';
import { RefreshCw, ShoppingCart, TrendingDown, Clock, CheckCircle } from 'lucide-react';

const nccsFetcher = () => tradingHistoryApi.getNccs().then((res) => res.data);
const resvFetcher = () => tradingHistoryApi.getReservations().then((res) => res.data);

export default function TradingHistoryCard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 미체결 내역 (실시간 주문)
  const {
    data: nccsData,
    error: nccsError,
    isLoading: nccsLoading,
    mutate: mutateNccs,
  } = useSWR<NccsResponse>('/trading/nccs', nccsFetcher, {
    refreshInterval: 10000, // 10초마다 자동 갱신
  });

  // 예약주문 내역
  const {
    data: resvData,
    error: resvError,
    isLoading: resvLoading,
    mutate: mutateResv,
  } = useSWR<OrderResvResponse>('/trading/resv', resvFetcher, {
    refreshInterval: 30000, // 30초마다 자동 갱신
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([mutateNccs(), mutateResv()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const nccsOrders = nccsData?.output || [];
  const resvOrders = resvData?.output || [];

  // 매수/매도 분리
  const buyOrders = nccsOrders.filter((order) => order.sll_buy_dvsn_cd === '02');
  const sellOrders = nccsOrders.filter((order) => order.sll_buy_dvsn_cd === '01');

  const buyResvOrders = resvOrders.filter((order) => order.sll_buy_dvsn_cd === '02');
  const sellResvOrders = resvOrders.filter((order) => order.sll_buy_dvsn_cd === '01');

  if (nccsError || resvError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매수/매도 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">거래 내역을 불러오는데 실패했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  if (nccsLoading && resvLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>매수/매도 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            매수/매도 현황
          </CardTitle>
          <CardDescription>
            실시간 주문 현황 및 예약 주문 ({buyOrders.length + sellOrders.length}건)
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
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              매수 ({buyOrders.length + buyResvOrders.length})
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              매도 ({sellOrders.length + sellResvOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* 매수 탭 */}
          <TabsContent value="buy" className="space-y-4">
            {/* 실시간 미체결 매수 */}
            {buyOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  미체결 매수 주문
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>종목</TableHead>
                        <TableHead>주문가</TableHead>
                        <TableHead>수량</TableHead>
                        <TableHead>미체결</TableHead>
                        <TableHead>시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buyOrders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{order.prdt_name}</div>
                              <div className="text-xs text-muted-foreground">{order.pdno}</div>
                            </div>
                          </TableCell>
                          <TableCell>${parseFloat(order.ord_unpr).toFixed(2)}</TableCell>
                          <TableCell>{order.ord_qty}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.nccs_qty}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {order.ord_tmd
                              ? `${order.ord_tmd.slice(0, 2)}:${order.ord_tmd.slice(2, 4)}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* 예약 매수 주문 */}
            {buyResvOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  예약 매수 주문
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>종목</TableHead>
                        <TableHead>주문가</TableHead>
                        <TableHead>수량</TableHead>
                        <TableHead>구분</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buyResvOrders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{order.prdt_name}</div>
                              <div className="text-xs text-muted-foreground">{order.pdno}</div>
                            </div>
                          </TableCell>
                          <TableCell>${parseFloat(order.ord_unpr).toFixed(2)}</TableCell>
                          <TableCell>{order.ord_qty}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.ord_dvsn_name}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {buyOrders.length === 0 && buyResvOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>매수 주문이 없습니다</p>
              </div>
            )}
          </TabsContent>

          {/* 매도 탭 */}
          <TabsContent value="sell" className="space-y-4">
            {/* 실시간 미체결 매도 */}
            {sellOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  미체결 매도 주문
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>종목</TableHead>
                        <TableHead>주문가</TableHead>
                        <TableHead>수량</TableHead>
                        <TableHead>미체결</TableHead>
                        <TableHead>시간</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellOrders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{order.prdt_name}</div>
                              <div className="text-xs text-muted-foreground">{order.pdno}</div>
                            </div>
                          </TableCell>
                          <TableCell>${parseFloat(order.ord_unpr).toFixed(2)}</TableCell>
                          <TableCell>{order.ord_qty}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.nccs_qty}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {order.ord_tmd
                              ? `${order.ord_tmd.slice(0, 2)}:${order.ord_tmd.slice(2, 4)}`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* 예약 매도 주문 */}
            {sellResvOrders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  예약 매도 주문
                </h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>종목</TableHead>
                        <TableHead>주문가</TableHead>
                        <TableHead>수량</TableHead>
                        <TableHead>구분</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellResvOrders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{order.prdt_name}</div>
                              <div className="text-xs text-muted-foreground">{order.pdno}</div>
                            </div>
                          </TableCell>
                          <TableCell>${parseFloat(order.ord_unpr).toFixed(2)}</TableCell>
                          <TableCell>{order.ord_qty}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.ord_dvsn_name}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {sellOrders.length === 0 && sellResvOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>매도 주문이 없습니다</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
