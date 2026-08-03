import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, createHmac } from 'crypto';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';

type Sort = { column: string; ascending?: boolean };

type TableConfig = {
  columns: string[];
  writable: string[];
  defaultOrder?: Sort[];
};

const TABLES: Record<string, TableConfig> = {
  site_data: {
    columns: ['id', 'data_key', 'label', 'value', 'value_type', 'group_name', 'is_public', 'created_at', 'updated_at'],
    writable: ['data_key', 'label', 'value', 'value_type', 'group_name', 'is_public'],
    defaultOrder: [{ column: 'group_name' }, { column: 'label' }],
  },
  website_content: {
    columns: ['id', 'section_key', 'title', 'content', 'metadata', 'updated_at', 'updated_by'],
    writable: ['section_key', 'title', 'content', 'metadata', 'updated_by'],
    defaultOrder: [{ column: 'section_key' }],
  },
  speakers: {
    columns: ['id', 'name', 'title', 'organization', 'topic', 'bio', 'image_url', 'session_type', 'display_order', 'is_visible', 'created_at', 'updated_at'],
    writable: ['name', 'title', 'organization', 'topic', 'bio', 'image_url', 'session_type', 'display_order', 'is_visible'],
    defaultOrder: [{ column: 'display_order' }, { column: 'created_at' }],
  },
  media_partners: {
    columns: ['id', 'name', 'description', 'logo_url', 'website_url', 'tier', 'display_order', 'is_visible', 'created_at', 'updated_at'],
    writable: ['name', 'description', 'logo_url', 'website_url', 'tier', 'display_order', 'is_visible'],
    defaultOrder: [{ column: 'display_order' }, { column: 'created_at' }],
  },
  information_blocks: {
    columns: ['id', 'title', 'subtitle', 'content', 'category', 'cta_label', 'cta_url', 'display_order', 'is_visible', 'created_at', 'updated_at'],
    writable: ['title', 'subtitle', 'content', 'category', 'cta_label', 'cta_url', 'display_order', 'is_visible'],
    defaultOrder: [{ column: 'display_order' }, { column: 'created_at' }],
  },
  contact_messages: {
    columns: ['id', 'name', 'email', 'subject', 'message', 'status', 'created_at'],
    writable: ['name', 'email', 'subject', 'message', 'status'],
    defaultOrder: [{ column: 'created_at', ascending: false }],
  },
  abstract_submissions: {
    columns: ['id', 'full_name', 'email', 'phone', 'affiliation', 'country', 'abstract_title', 'abstract_text', 'presentation_type', 'keywords', 'supporting_text', 'drive_url', 'website_url', 'file_paths', 'voice_file_name', 'voice_file_path', 'status', 'created_at'],
    writable: ['full_name', 'email', 'phone', 'affiliation', 'country', 'abstract_title', 'abstract_text', 'presentation_type', 'keywords', 'supporting_text', 'drive_url', 'website_url', 'file_paths', 'voice_file_name', 'voice_file_path', 'status'],
    defaultOrder: [{ column: 'created_at', ascending: false }],
  },
  registration_intents: {
    columns: ['id', 'full_name', 'email', 'phone', 'country', 'affiliation', 'designation', 'plan_key', 'plan_name', 'amount_usd', 'currency', 'payment_provider', 'payment_status', 'payment_reference', 'payment_session_id', 'payment_order_id', 'gateway_response', 'status', 'notes', 'redirect_url', 'redirected_at', 'completed_at', 'cancelled_at', 'created_at', 'updated_at', 'coupon_code'],
    writable: ['full_name', 'email', 'phone', 'country', 'affiliation', 'designation', 'plan_key', 'plan_name', 'amount_usd', 'currency', 'payment_provider', 'payment_status', 'payment_reference', 'payment_session_id', 'payment_order_id', 'gateway_response', 'status', 'notes', 'redirect_url', 'redirected_at', 'completed_at', 'cancelled_at', 'coupon_code'],
    defaultOrder: [{ column: 'created_at', ascending: false }],
  },
  coupon_codes: {
    columns: ['id', 'code', 'description', 'discount_percent', 'discount_amount', 'max_uses', 'current_uses', 'is_active', 'valid_from', 'valid_until', 'created_at'],
    writable: ['code', 'description', 'discount_percent', 'discount_amount', 'max_uses', 'current_uses', 'is_active', 'valid_from', 'valid_until'],
    defaultOrder: [{ column: 'created_at', ascending: false }],
  },
};

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async list(table: string, filters: Record<string, unknown> = {}, order: Sort[] = []) {
    const config = this.getTable(table);
    const where = this.buildWhere(config, filters);
    const sorts = order.length ? order : config.defaultOrder ?? [];
    const sql = [
      `SELECT ${config.columns.map((column) => `\`${column}\``).join(', ')} FROM \`${table}\``,
      where.sql,
      this.buildOrder(config, sorts),
    ].filter(Boolean).join(' ');

    return (this.prisma as any).$queryRawUnsafe(sql, ...where.values);
  }

  async insert(table: string, payload: Record<string, unknown> | Record<string, unknown>[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const created = [];

    for (const row of rows) {
      const data = this.pickWritable(table, row, true);
      if (!data.id) data.id = randomUUID();
      const columns = Object.keys(data);
      if (!columns.length) throw new BadRequestException('No writable fields provided');

      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`;
      await (this.prisma as any).$executeRawUnsafe(sql, ...columns.map((column) => this.normalizeValue(data[column])));
      const [inserted] = await this.list(table, { id: data.id }) as any[];
      created.push(inserted);
    }

    return Array.isArray(payload) ? created : created[0];
  }

  async upsert(table: string, payload: Record<string, unknown> | Record<string, unknown>[], onConflict?: string) {
    const config = this.getTable(table);
    const conflictColumn = onConflict || 'id';
    if (!config.columns.includes(conflictColumn)) throw new BadRequestException(`Unknown conflict column: ${conflictColumn}`);

    const rows = Array.isArray(payload) ? payload : [payload];
    const saved = [];

    for (const row of rows) {
      const data = this.pickWritable(table, row, true);
      if (!data.id) data.id = randomUUID();
      const columns = Object.keys(data);
      if (!columns.length) throw new BadRequestException('No writable fields provided');
      if (data[conflictColumn] === undefined) throw new BadRequestException(`Conflict column is required: ${conflictColumn}`);

      const updateColumns = columns.filter((column) => column !== 'id' && column !== conflictColumn);
      const placeholders = columns.map(() => '?').join(', ');
      const updateClause = updateColumns.length
        ? updateColumns.map((column) => `\`${column}\` = VALUES(\`${column}\`)`).join(', ')
        : `\`${conflictColumn}\` = VALUES(\`${conflictColumn}\`)`;
      const sql = [
        `INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(', ')}) VALUES (${placeholders})`,
        `ON DUPLICATE KEY UPDATE ${updateClause}`,
      ].join(' ');

      await (this.prisma as any).$executeRawUnsafe(sql, ...columns.map((column) => this.normalizeValue(data[column])));
      const [latest] = await this.list(table, { [conflictColumn]: data[conflictColumn] }) as any[];
      saved.push(latest);
    }

    return Array.isArray(payload) ? saved : saved[0];
  }

  async update(table: string, id: string, payload: Record<string, unknown>) {
    const data = this.pickWritable(table, payload);
    const columns = Object.keys(data);
    if (!columns.length) throw new BadRequestException('No writable fields provided');

    const setClause = columns.map((column) => `\`${column}\` = ?`).join(', ');
    await (this.prisma as any).$executeRawUnsafe(
      `UPDATE \`${table}\` SET ${setClause} WHERE \`id\` = ?`,
      ...columns.map((column) => this.normalizeValue(data[column])),
      id,
    );
    const rows = await this.list(table, { id });
    return (rows as any[])[0] ?? null;
  }

  async delete(table: string, id: string) {
    this.getTable(table);
    await (this.prisma as any).$executeRawUnsafe(`DELETE FROM \`${table}\` WHERE \`id\` = ?`, id);
    return { id };
  }

  async createStripeCheckout(payload: Record<string, unknown>) {
    return this.createHostedCheckout('stripe', payload);
  }

  async createPayPalOrder(payload: Record<string, unknown>) {
    return this.createHostedCheckout('paypal', payload);
  }

  async capturePayPalOrder(payload: Record<string, unknown>) {
    const registrationId = String(payload.registrationId ?? payload.p_registration_id ?? payload.registration_id ?? '');
    const orderId = String(payload.orderId ?? payload.p_payment_order_id ?? payload.payment_order_id ?? '');

    if (!registrationId) throw new BadRequestException('Registration id is required');
    if (!orderId) throw new BadRequestException('PayPal order id is required');

    const result = await this.updateRegistrationPayment({
      p_registration_id: registrationId,
      p_payment_status: 'paid',
      p_payment_provider: 'paypal',
      p_payment_order_id: orderId,
      p_gateway_response: {
        provider: 'paypal',
        orderId,
        capturedAt: new Date().toISOString(),
        source: 'backend-capture',
        payload,
      },
    });

    return {
      status: 'paid',
      provider: 'paypal',
      registrationId,
      orderId,
      data: result,
    };
  }

  async validateCoupon(code: string, amountUsd = 0) {
    if (!code) return { valid: false, message: 'Coupon code is required' };
    const rows = await this.list('coupon_codes', { code: code.trim().toUpperCase(), is_active: true }) as any[];
    const coupon = rows[0];
    if (!coupon) return { valid: false, message: 'Invalid coupon code' };

    const now = Date.now();
    if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) return { valid: false, message: 'Coupon is not active yet' };
    if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) return { valid: false, message: 'Coupon has expired' };
    if (coupon.max_uses && Number(coupon.current_uses ?? 0) >= Number(coupon.max_uses)) return { valid: false, message: 'Coupon usage limit reached' };

    const percent = Number(coupon.discount_percent ?? 0);
    const amount = Number(coupon.discount_amount ?? 0);
    const discount = amount || Math.round((Number(amountUsd) * percent) / 100);
    return {
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      coupon,
      discount_percent: coupon.discount_percent,
      discount_amount: discount,
      final_amount: Math.max(0, Number(amountUsd) - discount),
    };
  }

  async updateRegistrationPayment(payload: Record<string, unknown>) {
    const id = String(payload.p_registration_id ?? payload.registrationId ?? '');
    if (!id) throw new BadRequestException('Registration id is required');

    const nextPaymentStatus = String(payload.p_payment_status ?? payload.payment_status ?? 'pending');
    const dataToUpdate: Record<string, unknown> = {
      payment_status: nextPaymentStatus,
      payment_provider: payload.p_payment_provider ?? payload.payment_provider,
      payment_reference: payload.p_payment_reference,
      payment_session_id: payload.p_payment_session_id,
      payment_order_id: payload.p_payment_order_id,
      gateway_response: payload.p_gateway_response ?? payload.gateway_response,
      status: payload.p_status ?? payload.status ?? (nextPaymentStatus === 'paid' ? 'confirmed' : 'pending'),
      notes: payload.p_notes ?? payload.notes,
    };

    if (nextPaymentStatus === 'paid') {
      dataToUpdate.completed_at = new Date().toISOString();
    }

    const updated = await this.update('registration_intents', id, dataToUpdate);

    if (nextPaymentStatus === 'paid') {
      await this.sendPaymentSuccessNotification(id, updated as Record<string, unknown>);
    }

    return updated;
  }

  async verifyPaymentWebhook(provider: string, payload: Record<string, unknown>, signature?: string) {
    const normalizedProvider = (provider || 'stripe').toLowerCase();
    const secret = this.getWebhookSecret(normalizedProvider);
    const providerReference = this.getProviderReference(payload, normalizedProvider);

    if (!secret) {
      return {
        valid: true,
        skipped: true,
        provider: normalizedProvider,
        message: 'Webhook verification skipped because no secret is configured yet.',
      };
    }

    const signedPayload = JSON.stringify(payload ?? {});
    const expectedSignature = createHmac('sha256', secret).update(signedPayload).digest('hex');
    const providedSignature = String(signature || '').trim();

    if (!providedSignature) {
      return { valid: false, provider: normalizedProvider, message: 'Missing webhook signature' };
    }

    const valid = this.safeCompare(expectedSignature, providedSignature);

    if (!valid) {
      return { valid: false, provider: normalizedProvider, message: 'Invalid webhook signature' };
    }

    if (providerReference) {
      const existing = await this.list('registration_intents', { payment_reference: providerReference }) as any[];
      if (existing.length > 0) {
        return {
          valid: true,
          duplicate: true,
          provider: normalizedProvider,
          message: 'Duplicate webhook event ignored.',
          registrationId: existing[0].id,
        };
      }
    }

    const registrationId = String(payload.registrationId ?? payload.registration_id ?? payload.id ?? '');
    if (registrationId) {
      await this.updateRegistrationPayment({
        p_registration_id: registrationId,
        p_payment_status: 'paid',
        p_payment_provider: normalizedProvider,
        p_payment_reference: providerReference || `webhook-${normalizedProvider}-${Date.now()}`,
        p_gateway_response: {
          provider: normalizedProvider,
          event: payload,
          verifiedAt: new Date().toISOString(),
        },
      });
    }

    return {
      valid: true,
      provider: normalizedProvider,
      message: 'Webhook verified successfully.',
    };
  }

  async getPaymentProviderStatus() {
    return {
      stripe: {
        configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
        mode: process.env.PAYMENT_MODE || 'sandbox',
      },
      paypal: {
        configured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && process.env.PAYPAL_WEBHOOK_SECRET),
        mode: process.env.PAYMENT_MODE || 'sandbox',
      },
      razorpay: {
        configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET),
        mode: process.env.PAYMENT_MODE || 'sandbox',
      },
      phonepe: {
        configured: Boolean(process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY),
        mode: process.env.PAYMENT_MODE || 'sandbox',
      },
    };
  }

  async generateReceipt(payload: Record<string, unknown>) {
    const registrationId = String(payload.registrationId ?? payload.p_registration_id ?? payload.registration_id ?? '');
    if (!registrationId) throw new BadRequestException('Registration id is required');

    const rows = await this.list('registration_intents', { id: registrationId }) as any[];
    const registration = rows[0];
    if (!registration) throw new NotFoundException('Registration not found');

    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => undefined);

    doc.fontSize(22).text('Conference Registration Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${this.generateReceiptNumber(registrationId)}`);
    doc.text(`Acknowledgement Number: ${this.generateAcknowledgementNumber(registrationId)}`);
    doc.text(`Registration ID: ${registration.id}`);
    doc.text(`Attendee: ${registration.full_name || 'N/A'}`);
    doc.text(`Email: ${registration.email || 'N/A'}`);
    doc.text(`Plan: ${registration.plan_name || 'N/A'}`);
    doc.text(`Amount: $${Number(registration.amount_usd ?? registration.amount ?? 0).toFixed(2)}`);
    doc.text(`Payment Provider: ${registration.payment_provider || 'N/A'}`);
    doc.text(`Status: ${registration.payment_status || 'pending'}`);
    doc.text(`Issued At: ${new Date().toLocaleString()}`);
    doc.moveDown();
    doc.text('Thank you for registering. Please keep this receipt for your records.');
    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const bufferChunks: Buffer[] = [];
      doc.on('data', (chunk) => bufferChunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(bufferChunks)));
      doc.on('error', reject);
    });

    return {
      registrationId,
      receiptNumber: this.generateReceiptNumber(registrationId),
      acknowledgementNumber: this.generateAcknowledgementNumber(registrationId),
      pdfBase64: pdfBuffer.toString('base64'),
      mimeType: 'application/pdf',
      url: `/api/functions/receipt/${registrationId}`,
    };
  }

  async getReceipt(registrationId: string) {
    const rows = await this.list('registration_intents', { id: registrationId }) as any[];
    const registration = rows[0];
    if (!registration) throw new NotFoundException('Registration not found');

    const result = await this.generateReceipt({ registrationId });
    return {
      registrationId,
      receiptNumber: result.receiptNumber,
      acknowledgementNumber: result.acknowledgementNumber,
      pdfBase64: result.pdfBase64,
      mimeType: result.mimeType,
    };
  }

  private async sendPaymentSuccessNotification(registrationId: string, registration: Record<string, unknown> | null) {
    const rows = await this.list('registration_intents', { id: registrationId }) as any[];
    const row = rows[0] || registration;
    if (!row || !row.email) return null;

    const acknowledgementNumber = this.generateAcknowledgementNumber(registrationId);
    const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(registrationId).slice(0, 8).toUpperCase()}`;
    const amount = Number(row.amount_usd ?? row.amount ?? 0).toFixed(2);
    const provider = String(row.payment_provider ?? 'gateway');

    const html = `
      <h1>Registration confirmed</h1>
      <p>Thank you for registering. Your payment has been successfully received.</p>
      <p><strong>Registration ID:</strong> ${row.id ?? registrationId}</p>
      <p><strong>Acknowledgement Number:</strong> ${acknowledgementNumber}</p>
      <p><strong>Receipt Number:</strong> ${receiptNumber}</p>
      <p><strong>Payment Provider:</strong> ${provider}</p>
      <p><strong>Amount:</strong> $${amount}</p>
      <p>You can present this acknowledgement number during check-in.</p>
    `;

    await this.emailService.send({
      to: String(row.email),
      subject: 'Conference Registration Payment Confirmed',
      html,
    });

    return {
      acknowledgementNumber,
      receiptNumber,
      emailSent: true,
    };
  }

  private generateAcknowledgementNumber(registrationId: string) {
    const prefix = 'CONF';
    const suffix = String(registrationId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'PAY';
    return `${prefix}-${suffix}-${new Date().getFullYear()}`;
  }

  private generateReceiptNumber(registrationId: string) {
    const suffix = String(registrationId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'RECEIPT';
    return `RCPT-${suffix}-${new Date().getFullYear()}`;
  }

  private getProviderReference(payload: Record<string, unknown>, provider: string) {
    const data = payload.data as Record<string, unknown> | undefined;
    const event = payload.event as Record<string, unknown> | undefined;

    const candidates = [
      payload.reference,
      payload.payment_reference,
      payload.paymentReference,
      payload.id,
      payload.event_id,
      payload.session_id,
      payload.order_id,
      payload.orderId,
      payload.transaction_id,
      payload.transactionId,
      payload.paymentId,
      payload.payment_id,
      data?.payment_id,
      data?.id,
      event?.id,
    ];

    const value = candidates.find((item) => typeof item === 'string' && item.trim());
    if (!value) return '';

    return `${provider}:${String(value).trim()}`;
  }

  private getWebhookSecret(provider: string) {
    const configMap: Record<string, string> = {
      stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
      razorpay: process.env.RAZORPAY_WEBHOOK_SECRET || '',
      paypal: process.env.PAYPAL_WEBHOOK_SECRET || '',
      phonepe: process.env.PHONEPE_WEBHOOK_SECRET || '',
    };
    return configMap[provider] || '';
  }

  private safeCompare(expected: string, actual: string) {
    if (expected.length !== actual.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
    return diff === 0;
  }

  private async createHostedCheckout(provider: 'stripe' | 'paypal', payload: Record<string, unknown>) {
    const registrationId = String(payload.registrationId ?? payload.p_registration_id ?? payload.registration_id ?? '');
    if (!registrationId) throw new BadRequestException('Registration id is required');

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
    const registration = await this.list('registration_intents', { id: registrationId }) as any[];
    const registrationRow = registration[0] ?? {};
    const amount = Number(registrationRow.amount_usd ?? payload.amountUsd ?? payload.amount ?? 0);
    const email = String(registrationRow.email ?? payload.email ?? '');
    const providerConfig = provider === 'stripe'
      ? {
          envKey: 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SPEAKER',
          defaultBase: 'https://buy.stripe.com',
          fallbackUrl: `${frontendUrl}/registration/success?provider=stripe&registration_id=${encodeURIComponent(registrationId)}`,
        }
      : {
          envKey: 'NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_SPEAKER',
          defaultBase: 'https://www.paypal.com',
          fallbackUrl: `${frontendUrl}/registration/success?provider=paypal&registration_id=${encodeURIComponent(registrationId)}`,
        };

    const configuredLink = process.env[providerConfig.envKey] || process.env[provider === 'stripe' ? 'NEXT_PUBLIC_STRIPE_PAYMENT_LINK_DELEGATE' : 'NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_DELEGATE'];
    const paymentLink = configuredLink && configuredLink.trim() ? configuredLink.trim() : providerConfig.fallbackUrl;
    const finalUrl = this.appendPaymentParams(paymentLink, {
      registration_id: registrationId,
      provider,
      email,
      amount: Number.isFinite(amount) ? amount.toFixed(2) : '0.00',
      plan_key: registrationRow.plan_key ?? payload.planKey ?? 'standard',
      plan_name: registrationRow.plan_name ?? payload.planName ?? 'conference-registration',
      coupon_code: registrationRow.coupon_code ?? payload.couponCode ?? '',
    });

    await this.updateRegistrationPayment({
      p_registration_id: registrationId,
      p_payment_provider: provider,
      p_payment_status: 'pending',
      p_payment_reference: `checkout-${provider}-${Date.now()}`,
      p_gateway_response: {
        provider,
        registrationId,
        url: finalUrl,
        createdAt: new Date().toISOString(),
        mode: 'hosted-link',
      },
    });

    return {
      provider,
      registrationId,
      url: finalUrl,
      status: 'pending',
      mock: paymentLink === providerConfig.fallbackUrl,
      message: paymentLink === providerConfig.fallbackUrl ? 'Using local fallback success route because no provider URL is configured.' : 'Payment session created successfully.',
    };
  }

  private appendPaymentParams(paymentUrl: string, params: Record<string, string | number | null | undefined>) {
    try {
      const url = new URL(paymentUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim()) {
          url.searchParams.set(key, String(value));
        }
      });
      return url.toString();
    } catch {
      return paymentUrl;
    }
  }

  private getTable(table: string) {
    const config = TABLES[table];
    if (!config) throw new NotFoundException(`Unknown table: ${table}`);
    return config;
  }

  private buildWhere(config: TableConfig, filters: Record<string, unknown>) {
    const clauses: string[] = [];
    const values: unknown[] = [];

    Object.entries(filters).forEach(([column, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (!config.columns.includes(column)) throw new BadRequestException(`Unknown column: ${column}`);
      if (Array.isArray(value)) {
        if (!value.length) return;
        clauses.push(`\`${column}\` IN (${value.map(() => '?').join(', ')})`);
        values.push(...value);
        return;
      }
      clauses.push(`\`${column}\` = ?`);
      values.push(value);
    });

    return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values };
  }

  private buildOrder(config: TableConfig, order: Sort[]) {
    const safe = order.filter((item) => config.columns.includes(item.column));
    if (!safe.length) return '';
    return `ORDER BY ${safe.map((item) => `\`${item.column}\` ${item.ascending === false ? 'DESC' : 'ASC'}`).join(', ')}`;
  }

  private pickWritable(table: string, payload: Record<string, unknown>, includeId = false) {
    const config = this.getTable(table);
    const data: Record<string, unknown> = {};
    if (includeId && payload.id !== undefined) data.id = payload.id;
    config.writable.forEach((column) => {
      if (payload[column] !== undefined) data[column] = payload[column];
    });
    return data;
  }

  private normalizeValue(value: unknown) {
    if (value === undefined) return null;
    if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      return JSON.stringify(value);
    }
    return value;
  }
}
