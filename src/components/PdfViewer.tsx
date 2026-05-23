import React, { useEffect, useRef, useState, useCallback } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface PdfViewerProps {
  url: string;
  page: number;
  lessonNodeId?: string;
  onPageCount?: (count: number) => void;
  onRenderState?: (state: 'loading' | 'ready' | 'error') => void;
  onRenderError?: (detail: string) => void;
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
      mod.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return mod;
    })();
  }
  pdfjsLib = await loadingPromise;
  return pdfjsLib;
}

const MAX_CACHE_SIZE = 5;

type PdfErrorCategory = 'network' | 'parse' | 'render' | 'unknown';

function categorizePdfError(err: any): PdfErrorCategory {
  const n = err?.name || '';
  const m = (err?.message || '').toLowerCase();
  if (n === 'NetworkError' || m.includes('network') || m.includes('fetch') || m.includes('abort')) return 'network';
  if (n === 'InvalidPDFException' || m.includes('invalid pdf') || m.includes('corrupt') || m.includes('格式错误')) return 'parse';
  if (n === 'MissingPDFException' || m.includes('404') || m.includes('not found')) return 'network';
  return 'render';
}

function describePdfError(err: any) {
  const name = err?.name ? `${err.name}: ` : '';
  const message = err?.message || String(err || 'unknown error');
  return `${name}${message}`;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url, page, lessonNodeId, onPageCount, onRenderState, onRenderError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const renderQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const pageCacheRef = useRef<Map<number, PageCacheEntry>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const renderPage = useCallback((num: number, targetCanvas?: HTMLCanvasElement): Promise<boolean> => {
    const executeRender = async (): Promise<boolean> => {
      const doc = docRef.current;
      const canvas = targetCanvas || canvasRef.current;
      if (!doc || !canvas) return false;

      try {
        const pdfPage = await doc.getPage(num);
        const wrapper = wrapperRef.current;
        if (!wrapper) return false;

        const maxW = Math.max(wrapper.clientWidth || 800, 320);
        const maxH = Math.max(wrapper.clientHeight || 600, 240);
        const vp = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(maxW / vp.width, maxH / vp.height);
        const outputScale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);

        const viewport = pdfPage.getViewport({ scale });
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const task = pdfPage.render({
          canvasContext: ctx,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        if (!targetCanvas) renderTaskRef.current = task;
        await task.promise;
        if (!targetCanvas && renderTaskRef.current === task) {
          renderTaskRef.current = null;
        }

        if (!targetCanvas) {
          const cacheCanvas = document.createElement('canvas');
          cacheCanvas.width = canvas.width;
          cacheCanvas.height = canvas.height;
          const cacheCtx = cacheCanvas.getContext('2d');
          if (cacheCtx) cacheCtx.drawImage(canvas, 0, 0);
          const entry: PageCacheEntry = { pageNum: num, canvas: cacheCanvas, rendered: true };
          pageCacheRef.current.set(num, entry);
          if (pageCacheRef.current.size > MAX_CACHE_SIZE) {
            const oldest = pageCacheRef.current.keys().next().value;
            pageCacheRef.current.delete(oldest);
          }
        }
        return true;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          const detail = describePdfError(err);
          const category = categorizePdfError(err);
          if (!targetCanvas) {
            console.error(`PDF render error [${category}]: ${detail}`, { url, page: num, lessonNodeId });
            setError('render_failed');
            onRenderError?.(`[${category}] ${detail}`);
          }
        }
        return false;
      }
    };

    if (targetCanvas) {
      return executeRender();
    }

    const queuedRender = renderQueueRef.current
      .catch(() => false)
      .then(() => executeRender());
    renderQueueRef.current = queuedRender;
    return queuedRender;
  }, [onRenderError, url, lessonNodeId]);

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
        
        // Handle CORS and network errors gracefully
        const loadingTask = lib.getDocument({
          url,
          cMapPacked: true,
          disableAutoFetch: false,
          disableStream: false,
        });
        
        const doc = await loadingTask.promise;
        if (cancelled) return;
        docRef.current = doc;
        onPageCount?.(doc.numPages);
        setReady(true);
        setError(null);
        onRenderState?.('ready');
      } catch (err: any) {
        if (!cancelled) {
          const detail = describePdfError(err);
          const category = categorizePdfError(err);
          console.error(`PDF load error [${category}]: ${detail}`, { url, lessonNodeId, err });
          setError(category === 'network' ? 'load_failed' : 'load_failed');
          onRenderState?.('error');
          onRenderError?.(`[${category}] ${detail}`);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url, onRenderState, onRenderError]);

  // Render current page when ready or page changes — clamp to valid range
  useEffect(() => {
    if (!ready) return;
    const doc = docRef.current;
    const maxPage = doc?.numPages || 1;
    const clampedPage = Math.max(1, Math.min(page, maxPage));
    if (clampedPage !== page) {
      onPageCount?.(maxPage);
    }
    setRendering(true);
    setError(null);
    onRenderState?.('loading');

    renderPage(clampedPage).then((ok) => {
      setRendering(false);
      onRenderState?.(ok ? 'ready' : 'error');
    });
  }, [ready, page, renderPage, onRenderState, onPageCount]);

  // Pre-render adjacent pages using actual doc page count
  useEffect(() => {
    if (!ready || !docRef.current) return;
    const total = docRef.current.numPages;
    const timer = setTimeout(() => {
      preRenderAdjacent(page, total);
    }, 300);
    return () => clearTimeout(timer);
  }, [ready, page, preRenderAdjacent]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !ready) return;
    const ro = new ResizeObserver(() => renderPage(page));
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [ready, page, renderPage]);

  if (error === 'load_failed' || error === 'render_failed') {
    return (
      <div ref={wrapperRef} data-testid="pdf-error" className="relative w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {error === 'load_failed' ? '课件加载失败，请检查网络或确认 PDF 文件有效后重试' : 'PDF 页面渲染失败，请切换页码或重新加载'}
          </p>
          <p className="text-xs text-gray-400 mb-4 break-all">{url}</p>
          <p className="text-xs text-red-400 mb-4 font-mono">{error}</p>
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
        data-testid="pdf-page-canvas"
        className="block shadow-md bg-white"
        style={{ maxWidth: '100%', maxHeight: '100%', opacity: rendering ? 0.5 : 1, transition: 'opacity 150ms' }}
      />
    </div>
  );
};

export default PdfViewer;
