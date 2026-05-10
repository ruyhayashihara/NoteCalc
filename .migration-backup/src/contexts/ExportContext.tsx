import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
}

export const exportFormats: ExportFormat[] = [
  { id: 'txt', name: 'Plain Text', extension: 'txt', mimeType: 'text/plain' },
  { id: 'md', name: 'Markdown', extension: 'md', mimeType: 'text/markdown' },
  { id: 'pdf', name: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
  { id: 'html', name: 'HTML', extension: 'html', mimeType: 'text/html' },
  { id: 'csv', name: 'CSV', extension: 'csv', mimeType: 'text/csv' },
  { id: 'json', name: 'JSON', extension: 'json', mimeType: 'application/json' },
];

interface ExportContextType {
  exportContent: (content: string, format: ExportFormat, filename?: string) => void;
  exportToClipboard: (content: string) => Promise<void>;
  shareContent: (content: string, title: string) => Promise<boolean>;
  isExporting: boolean;
}

const ExportContext = createContext<ExportContextType | undefined>(undefined);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportContent = useCallback((content: string, format: ExportFormat, filename?: string) => {
    setIsExporting(true);
    
    try {
      let processedContent = content;
      
      // Process content based on format
      if (format.id === 'md') {
        processedContent = `# Exported Content\n\n\`\`\`\n${content}\n\`\`\``;
      } else if (format.id === 'html') {
        processedContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export</title></head><body><pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body></html>`;
      } else if (format.id === 'json') {
        processedContent = JSON.stringify({ content, exportedAt: new Date().toISOString() }, null, 2);
      }
      
      const blob = new Blob([processedContent], { type: format.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename || 'export'}.${format.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Clipboard export failed:', error);
      throw error;
    }
  }, []);

  const shareContent = useCallback(async (content: string, title: string): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: content,
        });
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  const value = {
    exportContent,
    exportToClipboard,
    shareContent,
    isExporting,
  };

  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}

export function useExport() {
  const context = useContext(ExportContext);
  if (context === undefined) {
    throw new Error('useExport must be used within an ExportProvider');
  }
  return context;
}
