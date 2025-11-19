import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PDFViewerProps {
  pdfBytes: Uint8Array | null;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfBytes }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const urlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Create object URL from bytes - only update when necessary
  useEffect(() => {
    if (!pdfBytes) {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setPdfUrl(null);
      return;
    }

    // Revoke old URL if it exists
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
    }

    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    setPdfUrl(url);

    // Cleanup on unmount
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [pdfBytes]);

  // Calculate scale to fit viewport
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || numPages === 0) return;

      const containerHeight = window.innerHeight - 80; // Account for padding
      const containerWidth = containerRef.current.clientWidth - 80; // Account for padding

      // Assume standard PDF page dimensions (8.5 x 11 inches at 72 DPI)
      const pageHeight = 792; // 11 inches * 72 DPI
      const pageWidth = 612; // 8.5 inches * 72 DPI

      // Calculate total height needed for all pages with spacing
      const totalPageHeight = pageHeight * numPages + (numPages - 1) * 32; // 2rem spacing between pages

      // Calculate scale based on both width and height constraints
      const scaleByHeight = containerHeight / totalPageHeight;
      const scaleByWidth = containerWidth / pageWidth;

      // Use the smaller scale to ensure everything fits
      const newScale = Math.min(scaleByHeight, scaleByWidth, 1.2); // Cap at 1.2 for readability
      setScale(newScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [numPages]);

  if (!pdfUrl) return null;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-surface)',
        overflowY: 'auto'
      }}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div style={{ color: 'white' }}>Loading PDF...</div>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              scale={scale}
              className="shadow-lg"
              canvasBackground="white"
            />
          ))}
        </div>
      </Document>
    </div>
  );
};
