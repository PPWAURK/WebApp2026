type TrainingPdfPageViewerProps = {
  src: string;
  pageNumber: number;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  onDocumentLoadSuccess?: (numPages: number) => void;
  watermarkText?: string;
};

export function TrainingPdfPageViewer({
  src,
  pageNumber,
  title,
  loadingLabel,
  errorLabel,
  onDocumentLoadSuccess,
  watermarkText,
}: TrainingPdfPageViewerProps) {
  void src;
  void pageNumber;
  void title;
  void loadingLabel;
  void errorLabel;
  void onDocumentLoadSuccess;
  void watermarkText;

  return null;
}
