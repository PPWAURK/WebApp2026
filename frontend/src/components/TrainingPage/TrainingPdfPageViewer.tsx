type TrainingPdfPageViewerProps = {
  src: string;
  pageNumber: number;
  title: string;
  loadingLabel: string;
  errorLabel: string;
  onDocumentLoadSuccess?: (numPages: number) => void;
};

export function TrainingPdfPageViewer({
  src,
  pageNumber,
  title,
  loadingLabel,
  errorLabel,
  onDocumentLoadSuccess,
}: TrainingPdfPageViewerProps) {
  void src;
  void pageNumber;
  void title;
  void loadingLabel;
  void errorLabel;
  void onDocumentLoadSuccess;

  return null;
}
