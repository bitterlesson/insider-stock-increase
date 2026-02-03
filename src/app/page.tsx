'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { InsiderReport } from '@/types/database';
import EventList from '@/components/EventList';

export default function Home() {
  const [events, setEvents] = useState<InsiderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              내부자 주식 매수 모니터
            </h1>
            <p className="text-gray-600 mt-1">
              포트폴리오 종목의 임원/주요주주 주식 매수 현황
            </p>
          </div>
          <Link
            href="/portfolio"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            포트폴리오 관리
          </Link>
        </header>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">최근 내부자 매수 이벤트</h2>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                </span>
              )}
              <button
                onClick={fetchEvents}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              >
                새로고침
              </button>
            </div>
          </div>
          <div className="p-6">
            <EventList events={events} loading={loading} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">이용 방법</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>포트폴리오 관리에서 모니터링할 종목을 추가합니다.</li>
              <li>매일 아침 (KST 07:30) 자동으로 데이터를 수집합니다.</li>
              <li>내부자 주식 매수 발생 시 이메일로 알림을 받습니다.</li>
              <li>대시보드에서 최근 이벤트를 확인할 수 있습니다.</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">오늘 감지된 매수 이벤트</span>
                <span className="font-semibold text-green-600">
                  {events.length}건
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">총 매수 주식수</span>
                <span className="font-semibold">
                  {events
                    .reduce((sum, e) => sum + (e.delta_cnt || 0), 0)
                    .toLocaleString()}
                  주
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
