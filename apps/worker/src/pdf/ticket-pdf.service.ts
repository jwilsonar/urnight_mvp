import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface TicketPdfInput {
  orderId: string;
  ticketIds: string[];
}

/**
 * Genera el PDF de entradas (§1.1, async en el Worker — no bloquea checkout).
 * MVP: documento básico con la orden y sus entradas; el QR/diseño se enriquece
 * después. Devuelve el buffer para subir vía StoragePort.
 */
@Injectable()
export class TicketPdfService {
  generate(input: TicketPdfInput): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(22).text('UrNight — Entradas', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Orden: ${input.orderId}`);
      doc.moveDown();
      input.ticketIds.forEach((id, index) => {
        doc.text(`Entrada ${index + 1}: ${id}`);
      });
      doc.end();
    });
  }
}
