import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function inspectPdf() {
  const pdfBytes = fs.readFileSync('public/grain-receipt-en.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log("Fields found:");
  fields.forEach(f => {
    console.log(`- Name: "${f.getName()}", Type: ${f.constructor.name}`);
  });
}

inspectPdf();
