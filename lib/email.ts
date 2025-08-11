import CurrencySymbol from '@/app/components/CurrencySymbol';

export async function sendTextEmail(to: string, subject: string, text: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'FBR Inventory Support', email: 'Support@hisaab360.com' },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Brevo Error:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return await res.json();
}

export async function sendHtmlEmail(to: string, subject: string, htmlContent: string, textContent?: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'FBR Inventory Support', email: 'Support@hisaab360.com' },
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Brevo Error:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return await res.json();
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'FBR Inventory Support', email: 'support@hisaab360.com' },
      to: [{ email: to }],
      subject: 'Welcome to FBR Inventory Management!',
      textContent: `Hello${name ? ` ${name}` : ''}, welcome to FBR Inventory Management System!`,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.error('Failed to send email via Brevo:', error);
    throw new Error(error.message || 'Brevo email failed');
  }

  return await res.json();
}

// Invoice email template interfaces
interface OrderItem {
  productName: string;
  variantTitle?: string;
  sku?: string;
  hsCode?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  isWeightBased?: boolean;
  weightQuantity?: number;
  weightUnit?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress1?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  createdAt: string;
  items: OrderItem[];
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  companyName?: string;
}

// Generate invoice HTML template
export function generateInvoiceHtml(order: Order, isForSupplier: boolean = false): string {
  const currencySymbol = order.currency === 'PKR' ? '₨' : order.currency === 'USD' ? '$' : order.currency === 'AED' ? 'د.إ' : order.currency;
  
  const formatAmount = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;
  
  const recipientType = isForSupplier ? 'Supplier' : 'Customer';
  const emailTitle = isForSupplier ? 'New Order Notification' : 'Order Confirmation';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailTitle} - ${order.orderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-info h3 { margin-top: 0; color: #495057; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .info-section h4 { margin-bottom: 10px; color: #6c757d; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .info-section p { margin: 5px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background: #f8f9fa; font-weight: 600; color: #495057; }
        .items-table .item-details { font-weight: 500; }
        .items-table .item-meta { font-size: 12px; color: #6c757d; margin-top: 4px; }
        .totals { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .totals-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .totals-row.total { font-weight: bold; font-size: 18px; color: #495057; border-top: 2px solid #dee2e6; padding-top: 12px; margin-top: 12px; }
        .footer { background: #495057; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
        .footer p { margin: 5px 0; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-confirmed { background: #d1ecf1; color: #0c5460; }
        .status-processing { background: #d4edda; color: #155724; }
        .weight-info { color: #007bff; font-size: 12px; font-weight: 500; }
        .hs-code { color: #6c757d; font-size: 11px; }
        @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .items-table { font-size: 14px; }
            .items-table th, .items-table td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${emailTitle}</h1>
        <p>Order #${order.orderNumber}</p>
    </div>
    
    <div class="content">
        <div class="order-info">
            <h3>Hello ${isForSupplier ? 'Supplier' : (order.billingFirstName ? `${order.billingFirstName} ${order.billingLastName || ''}`.trim() : 'Customer')},</h3>
            <p>${isForSupplier 
                ? `You have received a new order #${order.orderNumber}. Please review the details below and prepare the items for fulfillment.`
                : `Thank you for your order! Your order #${order.orderNumber} has been received and is being processed.`
            }</p>
            <p><strong>Order Status:</strong> <span class="status-badge status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>

        ${!isForSupplier && order.billingFirstName ? `
        <div class="info-grid">
            <div class="info-section">
                <h4>Billing Address</h4>
                <p><strong>${order.billingFirstName} ${order.billingLastName || ''}</strong></p>
                ${order.billingAddress1 ? `<p>${order.billingAddress1}</p>` : ''}
                ${order.billingCity ? `<p>${order.billingCity}${order.billingState ? `, ${order.billingState}` : ''} ${order.billingPostalCode || ''}</p>` : ''}
                ${order.billingCountry ? `<p>${order.billingCountry}</p>` : ''}
            </div>
            <div class="info-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> ${order.email}</p>
                ${order.phone ? `<p><strong>Phone:</strong> ${order.phone}</p>` : ''}
            </div>
        </div>
        ` : ''}

        <h3>Order Items</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td>
                            <div class="item-details">${item.productName}</div>
                            <div class="item-meta">
                                ${item.variantTitle ? `<div>Variant: ${item.variantTitle}</div>` : ''}
                                ${item.sku ? `<div>SKU: ${item.sku}</div>` : ''}
                                ${item.hsCode ? `<div class="hs-code">HS Code: ${item.hsCode}</div>` : ''}
                                ${item.isWeightBased && item.weightQuantity ? `<div class="weight-info">⚖️ Weight: ${item.weightQuantity}${item.weightUnit || 'g'}</div>` : ''}
                            </div>
                        </td>
                        <td>${item.isWeightBased && item.weightQuantity ? `${item.weightQuantity}${item.weightUnit || 'g'}` : item.quantity}</td>
                        <td>${formatAmount(item.price)}</td>
                        <td>${formatAmount(item.totalPrice)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Subtotal:</span>
                <span>${formatAmount(order.subtotal)}</span>
            </div>
            ${order.discountAmount > 0 ? `
            <div class="totals-row">
                <span>Discount:</span>
                <span>-${formatAmount(order.discountAmount)}</span>
            </div>
            ` : ''}
            ${order.taxAmount > 0 ? `
            <div class="totals-row">
                <span>Tax:</span>
                <span>${formatAmount(order.taxAmount)}</span>
            </div>
            ` : ''}
            ${order.shippingAmount > 0 ? `
            <div class="totals-row">
                <span>Shipping:</span>
                <span>${formatAmount(order.shippingAmount)}</span>
            </div>
            ` : ''}
            <div class="totals-row total">
                <span>Total Amount:</span>
                <span>${formatAmount(order.totalAmount)}</span>
            </div>
        </div>

        ${isForSupplier ? `
        <div class="order-info">
            <h4>📦 Next Steps for Supplier</h4>
            <ul>
                <li>Review the order items and quantities</li>
                <li>Check product availability and HS codes for customs</li>
                <li>Prepare items for shipment</li>
                <li>Update order status once items are ready</li>
            </ul>
        </div>
        ` : `
        <div class="order-info">
            <h4>📦 What happens next?</h4>
            <ul>
                <li>We'll process your order and prepare your items</li>
                <li>You'll receive a shipping confirmation when your order is dispatched</li>
                <li>Track your order status in your account</li>
                <li>Contact us if you have any questions</li>
            </ul>
        </div>
        `}
    </div>
    
    <div class="footer">
        <p><strong>FBR Inventory Management System</strong></p>
        <p>Thank you for your business!</p>
        <p>For support, contact us at Support@hisaab360.com</p>
    </div>
</body>
</html>
  `.trim();
}

// Send invoice email to customer
export async function sendCustomerInvoiceEmail(order: Order): Promise<void> {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  const htmlContent = generateInvoiceHtml(order, false);
  
  await sendHtmlEmail(order.email, subject, htmlContent);
}

// Send invoice email to supplier
export async function sendSupplierInvoiceEmail(order: Order, supplier: Supplier): Promise<void> {
  const subject = `New Order Notification - ${order.orderNumber}`;
  const htmlContent = generateInvoiceHtml(order, true);
  
  await sendHtmlEmail(supplier.email, subject, htmlContent);
}

// Send invoice emails to both customer and supplier
export async function sendInvoiceEmails(order: Order, supplier?: Supplier): Promise<{
  customerEmailSent: boolean;
  supplierEmailSent: boolean;
  errors: string[];
}> {
  const results = {
    customerEmailSent: false,
    supplierEmailSent: false,
    errors: [] as string[]
  };

  // Send email to customer
  try {
    await sendCustomerInvoiceEmail(order);
    results.customerEmailSent = true;
    console.log(`Invoice email sent to customer: ${order.email}`);
  } catch (error: any) {
    results.errors.push(`Failed to send email to customer (${order.email}): ${error.message}`);
    console.error('Customer email error:', error);
  }

  // Send email to supplier if provided
  if (supplier?.email) {
    try {
      await sendSupplierInvoiceEmail(order, supplier);
      results.supplierEmailSent = true;
      console.log(`Invoice email sent to supplier: ${supplier.email}`);
    } catch (error: any) {
      results.errors.push(`Failed to send email to supplier (${supplier.email}): ${error.message}`);
      console.error('Supplier email error:', error);
    }
  }

  return results;
}
