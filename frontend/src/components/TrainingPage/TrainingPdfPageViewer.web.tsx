import { useEffect, useRef, useState } from 'react';

type PdfJsModule = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (
    src: string,
  ) => {
    promise: Promise<PdfDocumentProxy>;
    destroy?: () => void;
  };
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy?: () => Promise<void> | void;
};

type PdfPageProxy = {
  getViewport: (params: { scale: number }) => {
    width: number;
    height: number;
  };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: {
      width: number;
      height: number;
    };
  }) => {
    promise: Promise<void>;
    cancel?: () => void;
  };
  cleanup?: () => void;
};

const PDF_JS_VERSION = '5.4.296';
const PDF_JS_MODULE_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.min.mjs`;
const PDF_JS_WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.mjs`;

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    const importModule = new Function(
      'moduleUrl',
      'return import(moduleUrl);',
    ) as (moduleUrl: string) => Promise<PdfJsModule>;

    pdfJsPromise = importModule(PDF_JS_MODULE_URL).then((module) => {
      module.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
      return module;
    });
  }

  return pdfJsPromise;
}

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
  title,
  loadingLabel,
  errorLabel,
  onDocumentLoadSuccess,
}: TrainingPdfPageViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.max(0, Math.floor(nextWidth - 24)));
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    let loadedDocument: PdfDocumentProxy | null = null;

    setIsLoading(true);
    setHasError(false);
    setPdfDocument(null);

    void loadPdfJsModule()
      .then((pdfjs) => pdfjs.getDocument(src).promise)
      .then((documentProxy) => {
        if (!isActive) {
          void documentProxy.destroy?.();
          return;
        }

        loadedDocument = documentProxy;
        setPdfDocument(documentProxy);
        setPageCount(documentProxy.numPages);
        onDocumentLoadSuccess?.(documentProxy.numPages);
      })
      .catch(() => {
        if (isActive) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      void loadedDocument?.destroy?.();
    };
  }, [onDocumentLoadSuccess, src]);

  useEffect(() => {
    if (!pdfDocument || !containerWidth || pageCount === 0) {
      return;
    }

    let isActive = true;
    const renderTasks: Array<{ cancel?: () => void }> = [];

    setIsLoading(true);
    setHasError(false);

    void Promise.all(
      Array.from({ length: pageCount }, (_, index) => index + 1).map(
        async (currentPageNumber) => {
          const page = await pdfDocument.getPage(currentPageNumber);
          const canvas = canvasRefs.current[currentPageNumber - 1];

          if (!isActive || !canvas) {
            page.cleanup?.();
            return;
          }

          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale =
            containerWidth > 0 ? containerWidth / unscaledViewport.width : 1;
          const viewport = page.getViewport({
            scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
          });
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('PDF_CANVAS_CONTEXT_UNAVAILABLE');
          }

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const renderTask = page.render({
            canvasContext: context,
            viewport,
          });
          renderTasks.push(renderTask);

          await renderTask.promise.finally(() => {
            page.cleanup?.();
          });
        },
      ),
    )
      .then(() => {
        if (isActive) {
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isActive) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
      renderTasks.forEach((task) => {
        task.cancel?.();
      });
    };
  }, [containerWidth, pageCount, pdfDocument]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '6px',
        backgroundColor: '#ffffff',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
    >
      {hasError ? <span>{errorLabel}</span> : null}
      {!hasError && isLoading ? <span>{loadingLabel}</span> : null}
      <div
        style={{
          display: hasError ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          visibility: isLoading ? 'hidden' : 'visible',
        }}
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <canvas
            key={`${src}-page-${index + 1}`}
            ref={(node) => {
              canvasRefs.current[index] = node;
            }}
            style={{
              display: 'block',
              maxWidth: '100%',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          />
        ))}
      </div>
      <span style={{ display: 'none' }}>{title}</span>
    </div>
  );
}
