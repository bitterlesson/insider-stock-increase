import nodemailer from 'nodemailer';
import { InsiderReport } from '@/types/database';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send email notification for new insider buying events
 */
export async function sendInsiderAlert(
  events: InsiderReport[]
): Promise<EmailResult> {
  if (events.length === 0) {
    return { success: true };
  }

  const recipient = process.env.NOTIFICATION_EMAIL;
  if (!recipient) {
    return { success: false, error: 'NOTIFICATION_EMAIL not configured' };
  }

  const today = new Date().toISOString().split('T')[0];

  // Build HTML table
  const tableRows = events
    .map(
      (e) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.corp_name || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.stock_code || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.repror || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.isu_exctv_ofcps || '-'}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: green; font-weight: bold;">
        +${(e.delta_cnt || 0).toLocaleString()}
      </td>
      <td style="padding: 8px; border: 1px solid #ddd;">${e.rcept_dt || '-'}</td>
    </tr>
  `
    )
    .join('');

  const html = `
    <h2>📈 내부자 주식 매수 알림 (${today})</h2>
    <p>오늘 ${events.length}건의 내부자 주식 매수가 감지되었습니다.</p>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">회사명</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">종목코드</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">보고자</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">직위</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">증가 주식수</th>
          <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">접수일</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      본 이메일은 자동 발송되었습니다.
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipient,
      subject: `[내부자 매수] ${events.length}건 감지 - ${today}`,
      html,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email send failed',
    };
  }
}
