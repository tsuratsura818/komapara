export type PanelState = {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  url: string | null;
};

export type SeriesOption = { id: string; title: string };

export type ImportMethod = "x" | "instagram" | "direct";

export type UploadStep = "select-method" | "import" | "work-info";

export type ImportedData = {
  panels: PanelState[];
  panelCount: number;
  description: string;
  xPostUrl: string;
};

export const MIN_PANELS = 1;
export const MAX_PANELS = 16;
export const DEFAULT_PANELS = 4;

export function emptyPanel(): PanelState {
  return { file: null, preview: null, uploading: false, url: null };
}
