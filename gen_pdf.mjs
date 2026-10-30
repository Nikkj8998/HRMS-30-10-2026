import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 300]);
    const { width, height } = page.getSize();

    page.drawText('Sample Document Preview', {
        x: 50,
        y: height - 100,
        size: 24,
        color: rgb(0.2, 0.2, 0.4),
    });

    page.drawText('This is a system-generated document for demonstration purposes.', {
        x: 50,
        y: height - 150,
        size: 14,
        color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
    fs.writeFileSync('b64.txt', pdfBytes);
}

createPdf();
