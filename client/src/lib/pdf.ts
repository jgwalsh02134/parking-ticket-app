// Render the first page of a PDF to a JPEG data URL so a saved-as-PDF portal
// page can flow through the SAME image OCR pipeline as a screenshot/photo.
//
// pdfjs-dist is imported dynamically so its (sizable) code is only fetched when
// a user actually uploads a PDF — it stays out of the main bundle.
export async function pdfFirstPageToImage(file: File): Promise<string> {
  const pdfjsLib: any = await import("pdfjs-dist");
  // Vite resolves this worker URL at build time; no separate config needed.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  // Scale up for OCR legibility, but cap the longest side to keep the upload
  // under the server's body limit.
  let scale = 2;
  const base = page.getViewport({ scale: 1 });
  const longest = Math.max(base.width, base.height);
  if (longest * scale > 2200) scale = 2200 / longest;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not render the PDF page.");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.9);
}
