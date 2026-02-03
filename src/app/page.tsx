'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { InsiderReport } from '@/types/database';
import { CollectResult } from '@/types/collect';
import EventList from '@/components/EventList';
import Spinner from '@/components/Spinner';
import Toast from '@/components/Toast';

const COOLDOWN_SECONDS = 300; // 5 minutes

export default function Home() {
  const [events, setEvents] = useState<InsiderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastCollected, setLastCollected] = useState<Date | null>(null);
  const [collectResult, setCollectResult] = useState<CollectResult | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

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

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleManualCollect = async () => {
    if (collecting || cooldownRemaining > 0) return;

    setCollecting(true);
    setCollectResult(null);
    setShowToast(false);

    try {
      const res = await fetch('/api/manual-collect', { method: 'POST' });
      const data: CollectResult = await res.json();

      setCollectResult(data);
      setShowToast(true);
      setLastCollected(new Date());

      // Refresh events list if successful
      if (data.success) {
        await fetchEvents();
      }

      // Start cooldown after successful collection
      if (data.success) {
        startCooldown();
      }
    } catch (error) {
      setCollectResult({
        success: false,
        processed: 0,
        newEvents: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        emailSent: false,
        message: 'Collection failed',
      });
      setShowToast(true);
    } finally {
      setCollecting(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleString('ko-KR');
  };

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
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">최근 내부자 매수 이벤트</h2>

                {/* Collection status badge */}
                {collecting && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1.5 animate-pulse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                    OpenDART 데이터 수집 중
                  </span>
                )}

                {/* Success badge */}
                {collectResult?.success && showToast && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    ✓ 수집 완료
                  </span>
                )}
              </div>

              {/* Last collected time and actions */}
              <div className="flex items-center gap-4">
                {lastCollected && (
                  <div className="text-sm text-gray-500">
                    <span className="text-gray-400">마지막 수집:</span>{' '}
                    <span className="font-medium">
                      {formatRelativeTime(lastCollected)}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {/* Quick refresh button */}
                  <button
                    onClick={fetchEvents}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {loading ? <Spinner size="sm" /> : '🔄'}
                    새로고침
                  </button>

                  {/* Manual collect button */}
                  <button
                    onClick={handleManualCollect}
                    disabled={collecting || cooldownRemaining > 0}
                    className={`px-4 py-1.5 text-sm rounded-md shadow-md transition-all flex items-center gap-2 ${
                      collecting || cooldownRemaining > 0
                        ? 'bg-gray-300 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg'
                    }`}
                  >
                    {collecting ? (
                      <>
                        <Spinner size="sm" />
                        <span>수집 중...</span>
                      </>
                    ) : cooldownRemaining > 0 ? (
                      <>
                        <span>⏱️</span>
                        <span>
                          {Math.floor(cooldownRemaining / 60)}:
                          {(cooldownRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        <span>매수내역 감시 개시</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <EventList events={events} loading={loading} />
          </div>
        </div>

        {/* Toast notification */}
        <Toast
          show={showToast}
          type={
            collectResult?.success
              ? collectResult.newEvents > 0
                ? 'success'
                : 'info'
              : 'error'
          }
          title={
            collectResult?.success
              ? collectResult.newEvents > 0
                ? '수집 완료!'
                : '수집 완료'
              : '수집 실패'
          }
          message={
            collectResult
              ? collectResult.success
                ? collectResult.newEvents > 0
                  ? `🎉 ${collectResult.newEvents}건의 신규 매수 이벤트 발견!\n• 처리: ${collectResult.processed}개 종목`
                  : `ℹ️ 신규 매수 이벤트가 없습니다.\n(${collectResult.processed}개 종목 확인 완료)`
                : collectResult.message || '데이터 수집에 실패했습니다.'
              : ''
          }
          details={collectResult?.errors.length ? collectResult.errors : undefined}
          onClose={() => setShowToast(false)}
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's events card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">오늘 감지</p>
                <p className="text-3xl font-bold text-green-600">
                  {events.length}
                  <span className="text-lg text-gray-400 ml-1">건</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          {/* Total shares card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">총 매수</p>
                <p className="text-3xl font-bold text-blue-600">
                  {events
                    .reduce((sum, e) => sum + (e.delta_cnt || 0), 0)
                    .toLocaleString()}
                  <span className="text-lg text-gray-400 ml-1">주</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* How to use card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>💡</span>
              이용 방법
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600">
              <li>포트폴리오에서 종목 추가</li>
              <li>매일 07:30 자동 수집</li>
              <li>수동 수집 버튼 사용 가능</li>
              <li>신규 이벤트 이메일 알림</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
