// Excel / CSV Eksport Generator (UTF-8 BOM bilan, Microsoft Excel va Google Sheets uchun 100% mos)

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any, row: any) => string | number;
}

export function exportToExcel(
  filename: string,
  columns: ExportColumn[],
  data: any[]
) {
  if (!data || data.length === 0) {
    alert('Eksport qilish uchun ma’lumot topilmadi');
    return;
  }

  // 1. Sarlavhalar qatori
  const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(';');

  // 2. Ma'lumotlar qatorlari
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key];
        if (col.format) {
          val = col.format(val, row);
        }
        if (val === null || val === undefined) {
          val = '';
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(';');
  });

  // 3. UTF-8 BOM (\uFEFF) — bu Excelda kirill, o'zbek harflari (o‘, g‘, q, h) buzilib ketmasligi uchun muhim
  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

  // 4. Blob yaratish va brauzer orqali yuklab olish
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = filename.endsWith('.csv') || filename.endsWith('.xlsx')
    ? filename
    : `${filename}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
