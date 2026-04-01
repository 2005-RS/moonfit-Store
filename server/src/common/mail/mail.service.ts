import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

type CreditDueReminderInput = {
  to: string;
  customerName: string;
  orderNumber: string;
  balanceDue: number;
  dueDate: Date;
  daysRemaining: number;
};

type OrderConfirmationInput = {
  to: string;
  customerName: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentType: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerCity?: string | null;
  notes?: string | null;
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string | null;

  constructor() {
    this.fromAddress = process.env.SMTP_FROM?.trim() || null;

    if (!this.isConfigured()) {
      this.transporter = null;
      this.logger.warn(
        'SMTP is not configured. Order confirmation and credit reminder emails are disabled until SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM are defined.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim(),
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS?.trim(),
      },
    });
  }

  isConfigured() {
    return Boolean(
      process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      this.fromAddress,
    );
  }

  async sendCreditDueReminder(input: CreditDueReminderInput) {
    if (!this.transporter || !this.fromAddress) {
      throw new Error('SMTP transport is not configured.');
    }

    const subject =
      input.daysRemaining <= 0
        ? `Tu credito ${input.orderNumber} vence hoy`
        : `Tu credito ${input.orderNumber} vence en ${input.daysRemaining} dia(s)`;

    const formattedDueDate = new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'full',
    }).format(input.dueDate);

    const formattedBalance = new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(input.balanceDue);

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.to,
      subject,
      text: [
        `Hola ${input.customerName},`,
        '',
        `Te recordamos que el pedido ${input.orderNumber} tiene un saldo pendiente de ${formattedBalance}.`,
        `La fecha de vencimiento es ${formattedDueDate}.`,
        '',
        'Si ya realizaste el pago, puedes responder con tu comprobante o registrarlo desde tu cuenta.',
        '',
        'Gracias por comprar con nosotros.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="margin-bottom: 12px;">Recordatorio de credito</h2>
          <p>Hola <strong>${this.escapeHtml(input.customerName)}</strong>,</p>
          <p>
            Te recordamos que tu pedido <strong>${this.escapeHtml(input.orderNumber)}</strong>
            tiene un saldo pendiente de <strong>${formattedBalance}</strong>.
          </p>
          <p>La fecha de vencimiento es <strong>${formattedDueDate}</strong>.</p>
          <p>
            Si ya realizaste el pago, puedes responder con tu comprobante
            o registrarlo desde tu cuenta dentro de la tienda.
          </p>
          <p>Gracias por comprar con nosotros.</p>
        </div>
      `,
    });
  }

  async sendOrderConfirmation(input: OrderConfirmationInput) {
    if (!this.transporter || !this.fromAddress) {
      throw new Error('SMTP transport is not configured.');
    }

    const formattedDate = this.formatDateTime(input.createdAt);
    const formattedSubtotal = this.formatCurrency(input.subtotal);
    const formattedShipping = this.formatCurrency(input.shipping);
    const formattedTotal = this.formatCurrency(input.total);
    const paymentTypeLabel = this.formatPaymentType(input.paymentType);
    const statusLabel = this.formatStatus(input.status);
    const deliveryLabel = input.customerCity?.trim() || 'Por coordinar';
    const noteText = input.notes?.trim();

    const itemLinesText = input.items
      .map((item, index) =>
        [
          `${index + 1}. ${item.name}`,
          `   ${item.description?.trim() || 'Seleccion Moonfit'}`,
          `   Cantidad: ${item.quantity}`,
          `   Unitario: ${this.formatCurrency(item.unitPrice)}`,
          `   Total: ${this.formatCurrency(item.total)}`,
        ].join('\n'),
      )
      .join('\n\n');

    const itemLinesHtml = input.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #e6ddd3; vertical-align: top;">
              <strong style="display: block; color: #15110f; margin-bottom: 6px;">
                ${this.escapeHtml(item.name)}
              </strong>
              <span style="color: #62564e; font-size: 13px; line-height: 1.5;">
                ${this.escapeHtml(item.description?.trim() || 'Seleccion Moonfit')}
              </span>
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e6ddd3; text-align: center; color: #15110f;">
              ${item.quantity}
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e6ddd3; text-align: right; color: #15110f;">
              ${this.formatCurrency(item.unitPrice)}
            </td>
            <td style="padding: 14px 0; border-bottom: 1px solid #e6ddd3; text-align: right; color: #15110f; font-weight: 700;">
              ${this.formatCurrency(item.total)}
            </td>
          </tr>
        `,
      )
      .join('');

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: input.to,
      subject: `Moonfit | Confirmacion de compra ${input.orderNumber}`,
      text: [
        `Hola ${input.customerName},`,
        '',
        'Gracias por tu compra y por ayudarnos a seguir creciendo junto a ti.',
        `Tu pedido ${input.orderNumber} fue registrado correctamente el ${formattedDate}.`,
        '',
        `Estado: ${statusLabel}`,
        `Tipo de pago: ${paymentTypeLabel}`,
        `Metodo de pago: ${input.paymentMethod}`,
        `Entrega: ${deliveryLabel}`,
        '',
        'Detalle de compra:',
        itemLinesText,
        '',
        `Subtotal: ${formattedSubtotal}`,
        `Envio: ${formattedShipping}`,
        `Total: ${formattedTotal}`,
        ...(noteText ? ['', `Indicaciones: ${noteText}`] : []),
        '',
        'Gracias por elegir Moonfit.',
      ].join('\n'),
      html: `
        <div style="margin: 0; padding: 32px 0; background: #f6f1ea;">
          <div style="width: min(100%, 720px); margin: 0 auto; background: #ffffff; border: 1px solid #e6ddd3; border-radius: 28px; overflow: hidden; font-family: Georgia, 'Times New Roman', serif; color: #15110f;">
            <div style="padding: 32px; background: linear-gradient(135deg, #15110f, #2b2421); color: #f8f4ef;">
              <p style="margin: 0 0 12px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">
                Ticket Moonfit
              </p>
              <h1 style="margin: 0 0 14px; font-size: 40px; line-height: 1.02; font-weight: 500;">
                Comprobante de compra
              </h1>
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.7; color: rgba(248, 244, 239, 0.84);">
                Gracias por tu compra y por ayudarnos a seguir creciendo junto a ti.
              </p>
            </div>

            <div style="padding: 28px 32px 18px;">
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;">
                <div style="padding: 18px; background: #f6efe8; border: 1px solid #e6ddd3; border-radius: 18px;">
                  <span style="display: block; margin-bottom: 8px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6d64;">Cliente</span>
                  <strong style="display: block; font-size: 18px; color: #15110f; margin-bottom: 6px;">${this.escapeHtml(input.customerName)}</strong>
                  <span style="display: block; font-family: Arial, sans-serif; font-size: 14px; color: #4b403a;">${this.escapeHtml(input.to)}</span>
                </div>
                <div style="padding: 18px; background: #f6efe8; border: 1px solid #e6ddd3; border-radius: 18px;">
                  <span style="display: block; margin-bottom: 8px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6d64;">Orden</span>
                  <strong style="display: block; font-size: 18px; color: #15110f; margin-bottom: 6px;">${this.escapeHtml(input.orderNumber)}</strong>
                  <span style="display: block; font-family: Arial, sans-serif; font-size: 14px; color: #4b403a;">${this.escapeHtml(formattedDate)}</span>
                </div>
                <div style="padding: 18px; background: #f6efe8; border: 1px solid #e6ddd3; border-radius: 18px;">
                  <span style="display: block; margin-bottom: 8px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6d64;">Pago</span>
                  <strong style="display: block; font-size: 18px; color: #15110f; margin-bottom: 6px;">${this.escapeHtml(input.paymentMethod)}</strong>
                  <span style="display: block; font-family: Arial, sans-serif; font-size: 14px; color: #4b403a;">${this.escapeHtml(paymentTypeLabel)}</span>
                </div>
                <div style="padding: 18px; background: #f6efe8; border: 1px solid #e6ddd3; border-radius: 18px;">
                  <span style="display: block; margin-bottom: 8px; font-family: Arial, sans-serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6d64;">Entrega</span>
                  <strong style="display: block; font-size: 18px; color: #15110f; margin-bottom: 6px;">${this.escapeHtml(deliveryLabel)}</strong>
                  <span style="display: block; font-family: Arial, sans-serif; font-size: 14px; color: #4b403a;">Estado: ${this.escapeHtml(statusLabel)}</span>
                </div>
              </div>
            </div>

            <div style="padding: 0 32px 18px;">
              <div style="padding: 22px; background: #fffdfa; border: 1px solid #e6ddd3; border-radius: 22px;">
                <p style="margin: 0 0 14px; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #7a6d64;">
                  Detalle de compra
                </p>
                <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
                  <thead>
                    <tr>
                      <th style="padding: 0 0 12px; text-align: left; color: #7a6d64; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Producto</th>
                      <th style="padding: 0 0 12px; text-align: center; color: #7a6d64; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Cant.</th>
                      <th style="padding: 0 0 12px; text-align: right; color: #7a6d64; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Unitario</th>
                      <th style="padding: 0 0 12px; text-align: right; color: #7a6d64; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemLinesHtml}
                  </tbody>
                </table>
              </div>
            </div>

            <div style="padding: 0 32px 32px;">
              <div style="display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 16px; align-items: start;">
                <div style="padding: 18px; background: #faf6f1; border: 1px solid #e6ddd3; border-radius: 18px; font-family: Arial, sans-serif; color: #4b403a;">
                  <strong style="display: block; margin-bottom: 8px; color: #15110f;">Moonfit</strong>
                  <span style="display: block; line-height: 1.7;">
                    Conserva este correo como comprobante de tu compra. Si necesitas ayuda para dar seguimiento a tu pedido, responde este mensaje.
                  </span>
                  ${
                    noteText
                      ? `<span style="display: block; margin-top: 12px; line-height: 1.7;"><strong>Indicaciones:</strong> ${this.escapeHtml(noteText)}</span>`
                      : ''
                  }
                </div>
                <div style="padding: 18px; background: #15110f; border-radius: 18px; color: #f8f4ef; font-family: Arial, sans-serif;">
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding-bottom: 10px;">
                    <span>Subtotal</span>
                    <strong>${formattedSubtotal}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(248, 244, 239, 0.12);">
                    <span>Envio</span>
                    <strong>${formattedShipping}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; gap: 12px; padding-top: 14px; margin-top: 10px; border-top: 1px solid rgba(248, 244, 239, 0.18); font-size: 18px;">
                    <span>Total</span>
                    <strong>${formattedTotal}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return true;
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private formatDateTime(value: Date) {
    return new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(value);
  }

  private formatPaymentType(value: string) {
    return value === 'CREDIT' ? 'Credito aprobado' : 'Pago inmediato';
  }

  private formatStatus(value: string) {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      PROCESSING: 'En preparacion',
      SHIPPED: 'En camino',
      DELIVERED: 'Entregado',
      CANCELLED: 'Cancelado',
    };

    return labels[value] ?? value;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
