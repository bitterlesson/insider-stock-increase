'use client';

import { Portfolio } from '@/types/database';

interface PortfolioTableProps {
  items: Portfolio[];
  onDelete: (stockCode: string) => Promise<void>;
}

export default function PortfolioTable({ items, onDelete }: PortfolioTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        포트폴리오가 비어있습니다. 종목을 추가해주세요.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              종목코드
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              회사명
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              추가일
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                {item.stock_code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {item.corp_name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString('ko-KR')
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => onDelete(item.stock_code)}
                  className="text-red-600 hover:text-red-900"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
