'use client';

import { useState } from 'react';

interface PortfolioFormProps {
  onAdd: (stockCode: string) => Promise<void>;
}

export default function PortfolioForm({ onAdd }: PortfolioFormProps) {
  const [stockCode, setStockCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(stockCode)) {
      setError('종목코드는 6자리 숫자여야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await onAdd(stockCode);
      setStockCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={stockCode}
        onChange={(e) => setStockCode(e.target.value)}
        placeholder="종목코드 (예: 005930)"
        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        maxLength={6}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '추가 중...' : '추가'}
      </button>
      {error && <span className="text-red-500 self-center ml-2">{error}</span>}
    </form>
  );
}
