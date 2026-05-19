
import * as pdfjs from 'pdfjs-dist';

// Configure the worker for pdfjs-dist using a stable CDN version matching the package
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
}

/**
 * Extracts all text from a PDF file.
 * @param file The PDF file to extract text from.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    const trimmedText = fullText.trim();
    if (!trimmedText) {
      throw new Error('Nenhum texto pôde ser extraído deste PDF.');
    }

    return trimmedText;
  } catch (error: any) {
    console.error('PDF JS Error:', error);
    throw new Error(error.message || 'Falha ao processar o PDF.');
  }
}
