import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PdfViewerProps {
  url: string;
  page: number;
  onPageCount?: (count: number) => void;
}

let pdfjsLib: any = null;
let loadingPromise: Promise<any> | null = null;

async function ensurePdfjs() {
  if (pdfjsLib) return pdfjsLib;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      const mod = await import('pdfjs-dist');
      mod.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      return mod;
    })();
  }
  pdfjsLib = await loadingPromise;
  return pdfjsLib;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, page, onPageCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const renderPage = useCallback(async (num: number) => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }

    try {
      const pdfPage = await doc.getPage(num);
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const maxW = wrapper.clientWidth || 800;
      const maxH = wrapper.clientHeight || 600;
      const vp = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(maxW / vp.width, maxH / vp.height, 2);

      const viewport = pdfPage.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const task = pdfPage.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
      }
    }
  }, []);

  // Load document
  useEffect(() => {
    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        const lib = await ensurePdfjs();
        if (cancelled) return;
        const doc = await lib.getDocument(url).promise;
        if (cancelled) return;
        docRef.current = doc;
        onPageCount?.(doc.numPages);
        setReady(true);
      } catch (err) {
        console.error('PDF load error:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render when ready, page changes, or resize
  useEffect(() => {
    if (!ready) return;
    renderPage(page);
  }, [ready, page, renderPage]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !ready) return;
    const ro = new ResizeObserver(() => renderPage(page));
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [ready, page, renderPage]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block shadow-md"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
};

export default PdfViewer;
