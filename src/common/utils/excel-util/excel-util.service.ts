import { BadRequestException, Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { File, GenerateExcelParams } from './dto/excel-util.interface';

const toCamelCase = (value: string): string =>
  value
    .trim()
    .replace(/[_\s]+(.)/g, (_, char: string) => char.toUpperCase())
    .replace(/^(.)/, (char) => char.toLowerCase());

const toStartCase = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

@Injectable()
export class ExcelUtilService {
  private customHeaders(worksheet: import('exceljs').Worksheet) {
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  // Tạo file Excel từ dữ liệu => EXPORT
  generateExcel({ worksheets = [] }: GenerateExcelParams): Workbook {
    if (worksheets.length === 0) throw new BadRequestException('Worksheets is empty!');

    const workbook = new Workbook();

    for (const worksheetData of worksheets) {
      const { sheetName = 'Sheet1', data = [], fieldsInclude, fieldsMapping } = worksheetData;

      const worksheet = workbook.addWorksheet(sheetName);

      const columns = fieldsInclude.map((field) => ({
        header: toStartCase(fieldsMapping?.[field] ?? field),
        key: field,
        width: Math.max(15, Math.floor(100 / fieldsInclude.length)),
      }));

      worksheet.columns = columns;
      worksheet.addRows(data);

      this.customHeaders(worksheet);
    }

    return workbook;
  }

  // (Đọc file Excel → convert thành object[] => IMPORT)
  async read(file: File): Promise<Record<string, unknown>[]> {
    if (!file) throw new BadRequestException('File not found!');

    const workbook = new Workbook();
    await workbook.xlsx.load(file.buffer as any);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new BadRequestException('Excel file has no worksheet!');

    const headerRow = worksheet.getRow(1);
    const headers = (headerRow.values as unknown[])
      .filter((value): value is string => typeof value === 'string')
      .map((value) => toCamelCase(value));

    const rows: Record<string, unknown>[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowValues = row.values as unknown[];
      const rowData = headers.reduce<Record<string, unknown>>((acc, field, index) => {
        const cellValue = rowValues[index + 1];
        acc[field] = this.cleanCellValue(cellValue);
        return acc;
      }, {});
      rows.push(rowData);
    });

    return rows;
  }

  private cleanCellValue(value: unknown): unknown {
    if (value && typeof value === 'object' && 'hyperlink' in value) {
      return (value as { text?: string }).text;
    }
    if (value && typeof value === 'object' && 'result' in value) {
      return (value as { result?: unknown }).result;
    }
    return value;
  }
}
