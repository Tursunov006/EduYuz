// EduYuz Professional Excel (.xls) Jadval Generator
// Har qanday Windows / Mac Microsoft Excel va Google Sheets dasturida ustunlarga ajralgan,
// chiroyli chegarali (border), rangli sarlavhali va JAMI (Total) qatorli jadval bo'lib ochiladi!

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  isCurrency?: boolean;
  format?: (value: any, row: any, index: number) => string | number;
}

export interface ExportOptions {
  title?: string;
  subtitle?: string;
  summaryLabel?: string;
  summaryValue?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportToExcel(
  filename: string,
  columns: ExportColumn[],
  data: any[],
  options?: ExportOptions
) {
  if (!data || data.length === 0) {
    alert('Eksport qilish uchun ma’lumot topilmadi');
    return;
  }

  const nowStr = new Date().toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const reportTitle = options?.title || filename.replace(/_/g, ' ');
  const reportSubtitle = options?.subtitle || `EduYuz CRM • Yuklangan vaqt: ${nowStr} • Jami qatorlar: ${data.length} ta`;
  const totalCols = columns.length + 1; // +1 for № column

  const colWidthsHtml = [
    '<col width="55" />',
    ...columns.map((c) => `<col width="${c.width || 170}" />`),
  ].join('');

  const headersHtml = [
    `<th style="background-color:#1e1b4b; color:#ffffff; font-weight:bold; padding:10px 8px; border:1px solid #312e81; text-align:center; font-size:11pt;">№</th>`,
    ...columns.map(
      (c) =>
        `<th style="background-color:#1e1b4b; color:#ffffff; font-weight:bold; padding:10px 12px; border:1px solid #312e81; text-align:${
          c.align || 'left'
        }; font-size:11pt;">${escapeHtml(c.header)}</th>`
    ),
  ].join('');

  const rowsHtml = data
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = columns
        .map((col) => {
          let val = row[col.key];
          if (col.format) {
            val = col.format(val, row, idx);
          }
          if (val === null || val === undefined) {
            val = '';
          }
          const strVal = escapeHtml(String(val));
          const align = col.align || (col.isCurrency ? 'right' : 'left');
          const fontWeight = col.isCurrency ? 'bold' : 'normal';
          const color =
            col.isCurrency && String(val).startsWith('-')
              ? '#dc2626'
              : col.isCurrency
              ? '#047857'
              : '#0f172a';

          return `<td style="background-color:${bg}; color:${color}; font-weight:${fontWeight}; padding:8px 12px; border:1px solid #cbd5e1; text-align:${align}; font-size:10.5pt; mso-number-format:'\\@';">${strVal}</td>`;
        })
        .join('');

      return `<tr>
        <td style="background-color:${bg}; color:#475569; font-weight:bold; padding:8px; border:1px solid #cbd5e1; text-align:center; font-size:10pt;">${
          idx + 1
        }</td>
        ${cells}
      </tr>`;
    })
    .join('');

  const summaryHtml =
    options?.summaryLabel && options?.summaryValue
      ? `<tr>
          <td colspan="${totalCols - 1}" style="background-color:#ecfdf5; color:#065f46; font-weight:bold; padding:10px 12px; border:1px solid #6ee7b7; text-align:right; font-size:11pt;">
            ${escapeHtml(options.summaryLabel)}
          </td>
          <td style="background-color:#ecfdf5; color:#047857; font-weight:bold; padding:10px 12px; border:1px solid #6ee7b7; text-align:right; font-size:11.5pt;">
            ${escapeHtml(options.summaryValue)}
          </td>
        </tr>`
      : '';

  const excelTemplate = `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>EduYuz Hisobot</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
</head>
<body style="font-family: Calibri, Arial, sans-serif;">
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    ${colWidthsHtml}
    <tr>
      <td colspan="${totalCols}" style="background-color:#0f172a; color:#38bdf8; font-size:15pt; font-weight:bold; padding:14px 12px; border:1px solid #1e293b;">
        📊 ${escapeHtml(reportTitle)}
      </td>
    </tr>
    <tr>
      <td colspan="${totalCols}" style="background-color:#1e293b; color:#cbd5e1; font-size:10pt; padding:6px 12px; border:1px solid #334155;">
        ${escapeHtml(reportSubtitle)}
      </td>
    </tr>
    <tr><td colspan="${totalCols}" style="height:8px;"></td></tr>
    <thead>
      <tr>${headersHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
      ${summaryHtml}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([excelTemplate], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const baseName = filename.replace(/\.(csv|xlsx|xls)$/i, '');
  link.setAttribute('href', url);
  link.setAttribute('download', `${baseName}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
