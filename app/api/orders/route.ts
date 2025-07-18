import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, productInventory, stockMovements, products, productVariants, user } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { getStockManagementSettingDirect } from '@/lib/stockManagement';

export async function GET() {
  try {
    // Fetch orders with their items and customer information
    const ordersWithDetails = await db
      .select({
        order: orders,
        user: user,
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      ordersWithDetails.map(async (orderData) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderData.order.id));

        // Parse addons JSON for each item
        const itemsWithParsedAddons = items.map(item => ({
          ...item,
          addons: item.addons ? JSON.parse(item.addons as string) : null
        }));

        return {
          ...orderData.order,
          user: orderData.user,
          items: itemsWithParsedAddons
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      email,
      phone,
      status = 'pending',
      paymentStatus = 'pending',
      subtotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      totalAmount,
      currency = 'USD',
      notes,
      
      // Billing address
      billingFirstName,
      billingLastName,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingPostalCode,
      billingCountry,
      
      // Shipping address
      shippingFirstName,
      shippingLastName,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      
      // Order items
      items
    } = body;

    // Validate required fields
    if (!email || !items || items.length === 0) {
      return NextResponse.json({ error: 'Email and items are required' }, { status: 400 });
    }

    if (!subtotal || !totalAmount) {
      return NextResponse.json({ error: 'Subtotal and total amount are required' }, { status: 400 });
    }

    // Generate order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    const orderId = uuidv4();

    // Check if stock management is enabled
    const stockManagementEnabled = await getStockManagementSettingDirect();

    // Validate inventory for all items before creating order (only if stock management is enabled)
    if (stockManagementEnabled) {
      for (const item of items) {
        const inventoryConditions = [eq(productInventory.productId, item.productId)];
        
        if (item.variantId) {
          inventoryConditions.push(eq(productInventory.variantId, item.variantId));
        } else {
          inventoryConditions.push(isNull(productInventory.variantId));
        }

        const currentInventory = await db
          .select()
          .from(productInventory)
          .where(and(...inventoryConditions))
          .limit(1);

        // When stock management is enabled, require inventory records for all products
        if (currentInventory.length === 0) {
          return NextResponse.json({ 
            error: `No inventory record found for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Please create an inventory record first or disable stock management.` 
          }, { status: 400 });
        }

        const inventory = currentInventory[0];
        const availableStock = inventory.availableQuantity || 
          (inventory.quantity - (inventory.reservedQuantity || 0));

        if (availableStock < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient stock for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Available: ${availableStock}, Requested: ${item.quantity}` 
          }, { status: 400 });
        }

        // Additional validation: Check if the product is active and available
        if (inventory.quantity <= 0) {
          return NextResponse.json({ 
            error: `${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''} is out of stock. Total quantity: ${inventory.quantity}` 
          }, { status: 400 });
        }
      }
    }

    // Create the order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      userId: userId || null,
      email,
      phone: phone || null,
      status,
      paymentStatus,
      fulfillmentStatus: 'pending',
      subtotal,
      taxAmount: taxAmount || 0,
      shippingAmount: shippingAmount || 0,
      discountAmount: discountAmount || 0,
      totalAmount,
      currency,
      
      // Billing address
      billingFirstName: billingFirstName || null,
      billingLastName: billingLastName || null,
      billingAddress1: billingAddress1 || null,
      billingAddress2: billingAddress2 || null,
      billingCity: billingCity || null,
      billingState: billingState || null,
      billingPostalCode: billingPostalCode || null,
      billingCountry: billingCountry || null,
      
      // Shipping address
      shippingFirstName: shippingFirstName || null,
      shippingLastName: shippingLastName || null,
      shippingAddress1: shippingAddress1 || null,
      shippingAddress2: shippingAddress2 || null,
      shippingCity: shippingCity || null,
      shippingState: shippingState || null,
      shippingPostalCode: shippingPostalCode || null,
      shippingCountry: shippingCountry || null,
      
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create order items and manage inventory
    for (const item of items) {
      const orderItemId = uuidv4();

      // Ensure addons are properly structured before saving
      let addonsToSave = null;
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        // Validate and clean addon data
        addonsToSave = item.addons.map((addon: any) => ({
          addonId: addon.addonId,
          addonTitle: addon.addonTitle || addon.title || addon.name || 'Unknown Addon',
          price: Number(addon.price) || 0,
          quantity: Number(addon.quantity) || 1
        }));
      }

      // Create order item
      await db.insert(orderItems).values({
        id: orderItemId,
        orderId,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.productName,
        variantTitle: item.variantTitle || null,
        sku: item.sku || null,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        productImage: null, // TODO: Get from product/variant
        addons: addonsToSave ? JSON.stringify(addonsToSave) : null,
        createdAt: new Date(),
      });

      // Reserve inventory if order is confirmed (only if stock management is enabled)
      if (stockManagementEnabled && (status === 'confirmed' || paymentStatus === 'paid')) {
        const inventoryConditions = [eq(productInventory.productId, item.productId)];
        
        if (item.variantId) {
          inventoryConditions.push(eq(productInventory.variantId, item.variantId));
        } else {
          inventoryConditions.push(isNull(productInventory.variantId));
        }

        const currentInventory = await db
          .select()
          .from(productInventory)
          .where(and(...inventoryConditions))
          .limit(1);

        if (currentInventory.length > 0) {
          const inventory = currentInventory[0];
          const newReservedQuantity = (inventory.reservedQuantity || 0) + item.quantity;
          const newAvailableQuantity = inventory.quantity - newReservedQuantity;

          // Update inventory
          await db
            .update(productInventory)
            .set({
              reservedQuantity: newReservedQuantity,
              availableQuantity: newAvailableQuantity,
              updatedAt: new Date(),
            })
            .where(eq(productInventory.id, inventory.id));

          // Create stock movement record
          await db.insert(stockMovements).values({
            id: uuidv4(),
            inventoryId: inventory.id,
            productId: item.productId,
            variantId: item.variantId || null,
            movementType: 'out',
            quantity: item.quantity,
            previousQuantity: inventory.quantity,
            newQuantity: inventory.quantity, // Quantity stays same, but reserved changes
            reason: 'Order Reservation',
            reference: orderNumber,
            notes: `Reserved for order ${orderNumber}`,
            processedBy: null, // TODO: Add current admin user
            createdAt: new Date(),
          });
        } else {
          console.warn(`No inventory record found for product: ${item.productName}. Skipping inventory reservation.`);
        }
      }
    }

    // Fetch the created order with its items for response
    const createdOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const createdItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({
      ...createdOrder[0],
      items: createdItems
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
} 