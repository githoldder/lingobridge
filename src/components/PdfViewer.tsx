import React, { useEffect, useRef, useState, useCallback } from 'react';

interface PdfViewerProps {
  url: string;
  page: number;
  onPageCount?: (count: number) => void;
  onRenderState?: (state: 'loading' | 'ready' | 'error') => void;
}

interface PageCacheEntry {
  pageNum: number;
  canvas: HTMLCanvasElement;
  rendered: boolean;
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

const MAX_CACHE_SIZE = 5;

const PdfViewer: React.FC<PdfViewerProps> = ({ url, page, onPageCount, onRenderState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const pageCacheRef = useRef<Map<number, PageCacheEntry>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const renderPage = useCallback(async (num: number, targetCanvas?: HTMLCanvasElement): Promise<boolean> => {
    const doc = docRef.current;
    const canvas = targetCanvas || canvasRef.current;
    if (!doc || !canvas) return false;

    if (renderTaskRef.current && !targetCanvas) {
      try { renderTaskRef.current.cancel(); } catch {}
    }

    try {
      const pdfPage = await doc.getPage(num);
      const wrapper = wrapperRef.current;
      if (!wrapper) return false;

      const maxW = wrapper.clientWidth || 800;
      const maxH = wrapper.clientHeight || 600;
      const vp = pdfPage.getViewport({ scale: 1 });
      const scale = Math.min(maxW / vp.width, maxH / vp.height, 1.5);

      const viewport = pdfPage.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const task = pdfPage.render({ canvasContext: ctx, viewport });
      if (!targetCanvas) renderTaskRef.current = task;
      await task.promise;

      if (!targetCanvas) {
        const entry: PageCacheEntry = { pageNum: num, canvas: canvas.cloneNode(true) as HTMLCanvasElement, rendered: true };
        (entry.canvas as any).getContext = canvas.getContext.bind(canvas);
        pageCacheRef.current.set(num, entry);
        if (pageCacheRef.current.size > MAX_CACHE_SIZE) {
          const oldest = pageCacheRef.current.keys().next().value;
          pageCacheRef.current.delete(oldest);
        }
      }
      return true;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', err);
        if (!targetCanvas) setError('render_failed');
      }
      return false;
    }
  }, []);

  const preRenderAdjacent = useCallback(async (current: number, total: number) => {
    const doc = docRef.current;
    if (!doc) return;

    const pagesToCache: number[] = [];
    if (current > 1) pagesToCache.push(current - 1);
    if (current < total) pagesToCache.push(current + 1);

    for (const p of pagesToCache) {
      if (pageCacheRef.current.has(p)) continue;
      const offscreen = document.createElement('canvas');
      await renderPage(p, offscreen);
    }
  }, [renderPage]);

  // Load document
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    onRenderState?.('loading');

    (async () => {
      try {
        const lib = await ensurePdfjs();
        if (cancelled) return;
        const doc = await lib.getDocument(url).promise;
        if (cancelled) return;
        docRef.current = doc;
        onPageCount?.(doc.numPages);
        setReady(true);
        setError(null);
        onRenderState?.('loading');
      } catch (err: any) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('load_failed');
          onRenderState?.('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // Render current page when ready or page changes
  useEffect(() => {
    if (!ready) return;
    setRendering(true);
    setError(null);
    onRenderState?.('loading');

    renderPage(page).then((ok) => {
      if (ok) {
        setRendering(false);
        onRenderState?.('ready');
      }
    });
  }, [ready, page, renderPage]);

  // Pre-render adjacent pages
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      preRenderAdjacent(page, pageCacheRef.current.size > 0 ? 999 : 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [ready, page, preRenderAdjacent]);

  // Get total pages for pre-rendering
  useEffect(() => {
    if (!ready || !docRef.current) return;
    const total = docRef.current.numPages;
    const timer = setTimeout(() => {
      preRenderAdjacent(page, total);
    }, 500);
    return () => clearTimeout(timer);
  }, [ready, page, preRenderAdjacent]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !ready) return;
    const ro = new ResizeObserver(() => renderPage(page));
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [ready, page, renderPage]);

  if (error === 'load_failed') {
    return (
      <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">课件加载失败，请重试</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      {(rendering || !ready) && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block shadow-md"
        style={{ maxWidth: '100%', maxHeight: '100%', opacity: rendering ? 0.5 : 1, transition: 'opacity 150ms' }}
      />
    </div>
  );
};

export default PdfViewer;
