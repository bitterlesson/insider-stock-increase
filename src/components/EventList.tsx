'use client';

import { InsiderReport } from '@/types/database';

interface EventListProps {
  events: InsiderReport[];
  loading: boolean;
}

export default function EventList({ events, loading }: EventListProps) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">이벤트 로딩 중...</div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        오늘 감지된 내부자 매수 이벤트가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              회사명
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              종목코드
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              보고자
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              직위
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              증가 주식수
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              접수일
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {event.corp_name || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">
                {event.stock_code || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                {event.repror || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {event.isu_exctv_ofcps || '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                +{(event.delta_cnt || 0).toLocaleString()}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {event.rcept_dt || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
