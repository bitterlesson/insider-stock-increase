'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Portfolio } from '@/types/database';
import PortfolioForm from '@/components/PortfolioForm';
import PortfolioTable from '@/components/PortfolioTable';

export default function PortfolioPage() {
  const [items, setItems] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleAdd = async (stockCode: string) => {
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_code: stockCode }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '추가 실패');
    }

    await fetchPortfolio();
  };

  const handleDelete = async (stockCode: string) => {
    if (!confirm(`${stockCode}을(를) 포트폴리오에서 삭제하시겠습니까?`)) {
      return;
    }

    const res = await fetch(`/api/portfolio?stock_code=${stockCode}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await fetchPortfolio();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">포트폴리오 관리</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            대시보드로 이동
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <PortfolioForm onAdd={handleAdd} />

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : (
            <PortfolioTable items={items} onDelete={handleDelete} />
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            종목코드는 6자리 숫자입니다. (예: 삼성전자 005930, 네이버 035420)
          </p>
        </div>
      </div>
    </div>
  );
}
