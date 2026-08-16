interface GenerateExcelWorksheet {
  sheetName?: string;
  data: Record<string, unknown>[];
  fieldsInclude: string[];
  fieldsMapping?: Record<string, string>;
}

interface GenerateExcelParams {
  worksheets: GenerateExcelWorksheet[];
}

type File = Express.Multer.File;

export type { File, GenerateExcelParams, GenerateExcelWorksheet };
