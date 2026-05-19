
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for pdfjs-dist
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts all text from a PDF file.
 * @param file The PDF file to extract text from.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
