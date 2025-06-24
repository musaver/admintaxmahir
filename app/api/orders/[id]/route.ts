import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, productInventory, stockMovements, user } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // Fetch order with customer information
    const orderData = await db
      .select({
        order: orders,
        user: user,
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Parse addons JSON for each item
    const itemsWithParsedAddons = items.map(item => ({
      ...item,
      addons: item.addons ? JSON.parse(item.addons as string) : null
    }));

    const order = {
      ...orderData[0].order,
      user: orderData[0].user,
      items: itemsWithParsedAddons
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    
    const {
      status,
      paymentStatus,
      fulfillmentStatus,
      shippingAmount,
      discountAmount,
      notes,
      shippingMethod,
      trackingNumber,
      cancelReason,
      previousStatus,
      previousPaymentStatus
    } = body;

    // Get current order and items for stock management
    const currentOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (currentOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const order = currentOrder[0];

    // Check if stock management is enabled
    let stockManagementEnabled = true;
    try {
      const stockSettingRes = await fetch(new URL('/api/settings/stock-management', req.url));
      if (stockSettingRes.ok) {
        const stockData = await stockSettingRes.json();
        stockManagementEnabled = stockData.stockManagementEnabled;
      }
    } catch (error) {
      console.warn('Could not fetch stock management setting, defaulting to enabled');
    }

    // Handle stock management based on status changes (only if stock management is enabled)
    if (stockManagementEnabled && status && status !== previousStatus) {
      // If changing to confirmed status, validate inventory availability first
      if (status === 'confirmed' && previousStatus !== 'confirmed') {
        for (const item of orderItemsData) {
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

          if (currentInventory.length === 0) {
            return NextResponse.json({ 
              error: `Cannot confirm order: No inventory record found for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Please create an inventory record first.` 
            }, { status: 400 });
          }

          const inventory = currentInventory[0];
          const availableStock = inventory.availableQuantity || 
            (inventory.quantity - (inventory.reservedQuantity || 0));

          if (availableStock < item.quantity) {
            return NextResponse.json({ 
              error: `Cannot confirm order: Insufficient stock for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Available: ${availableStock}, Required: ${item.quantity}` 
            }, { status: 400 });
          }
        }
      }

      await handleStockManagement(
        orderItemsData,
        previousStatus,
        status,
        order.orderNumber
      );
    }

    // Handle payment status changes (only if stock management is enabled)
    if (stockManagementEnabled && paymentStatus && paymentStatus !== previousPaymentStatus) {
      // If payment is now successful and order is pending, validate inventory before reserving
      if (paymentStatus === 'paid' && previousPaymentStatus !== 'paid' && (status || order.status) === 'pending') {
        for (const item of orderItemsData) {
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

          if (currentInventory.length === 0) {
            return NextResponse.json({ 
              error: `Cannot process payment: No inventory record found for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Please create an inventory record first.` 
            }, { status: 400 });
          }

          const inventory = currentInventory[0];
          const availableStock = inventory.availableQuantity || 
            (inventory.quantity - (inventory.reservedQuantity || 0));

          if (availableStock < item.quantity) {
            return NextResponse.json({ 
              error: `Cannot process payment: Insufficient stock for ${item.productName}${item.variantTitle ? ` (${item.variantTitle})` : ''}. Available: ${availableStock}, Required: ${item.quantity}` 
            }, { status: 400 });
          }
        }
      }

      await handlePaymentStatusChange(
        orderItemsData,
        previousPaymentStatus,
        paymentStatus,
        order.orderNumber,
        status || order.status
      );
    }

    // Calculate new total if shipping or discount changed
    let newTotalAmount = order.totalAmount;
    if (shippingAmount !== undefined || discountAmount !== undefined) {
      const newShipping = shippingAmount !== undefined ? shippingAmount : order.shippingAmount;
      const newDiscount = discountAmount !== undefined ? discountAmount : order.discountAmount;
      
      // Recalculate: subtotal - discount + tax + shipping
      const subtotalAfterDiscount = Number(order.subtotal) - newDiscount;
      newTotalAmount = subtotalAfterDiscount + Number(order.taxAmount || 0) + newShipping;
    }

    // Update the order
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (fulfillmentStatus !== undefined) updateData.fulfillmentStatus = fulfillmentStatus;
    if (shippingAmount !== undefined) updateData.shippingAmount = shippingAmount;
    if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
    if (notes !== undefined) updateData.notes = notes;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (cancelReason !== undefined) updateData.cancelReason = cancelReason;
    if (newTotalAmount !== order.totalAmount) updateData.totalAmount = newTotalAmount;

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    // Fetch updated order with items
    const updatedOrderData = await db
      .select({
        order: orders,
        user: user,
      })
      .from(orders)
      .leftJoin(user, eq(orders.userId, user.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    const updatedItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const updatedOrder = {
      ...updatedOrderData[0].order,
      user: updatedOrderData[0].user,
      items: updatedItems
    };

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // Get order items for stock restoration
    const orderItemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if stock management is enabled for deletion
    let stockManagementEnabledForDeletion = true;
    try {
      const stockSettingRes = await fetch(new URL('/api/settings/stock-management', req.url));
      if (stockSettingRes.ok) {
        const stockData = await stockSettingRes.json();
        stockManagementEnabledForDeletion = stockData.stockManagementEnabled;
      }
    } catch (error) {
      console.warn('Could not fetch stock management setting for deletion, defaulting to enabled');
    }

    // Restore inventory if order was confirmed/paid (only if stock management is enabled)
    if (stockManagementEnabledForDeletion && order[0].status !== 'cancelled' && order[0].status !== 'pending') {
      await restoreInventoryFromOrder(orderItemsData, order[0].orderNumber);
    }

    // Delete order items first (foreign key constraint)
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    
    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderId));

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

// Helper function to handle stock management based on status changes
async function handleStockManagement(
  orderItems: any[],
  previousStatus: string,
  newStatus: string,
  orderNumber: string
) {
  for (const item of orderItems) {
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

    if (currentInventory.length === 0) continue;

    const inventory = currentInventory[0];
    let updateNeeded = false;
    let newQuantity = inventory.quantity;
    let newReservedQuantity = inventory.reservedQuantity || 0;
    let newAvailableQuantity = inventory.availableQuantity || 0;
    let movementType = '';
    let reason = '';

    // Handle status transitions
    if (previousStatus === 'pending' && newStatus === 'confirmed') {
      // Reserve inventory
      newReservedQuantity += item.quantity;
      newAvailableQuantity = newQuantity - newReservedQuantity;
      movementType = 'out';
      reason = 'Order Confirmed - Inventory Reserved';
      updateNeeded = true;
    } else if (previousStatus === 'confirmed' && newStatus === 'pending') {
      // Unreserve inventory
      newReservedQuantity = Math.max(0, newReservedQuantity - item.quantity);
      newAvailableQuantity = newQuantity - newReservedQuantity;
      movementType = 'in';
      reason = 'Order Pending - Inventory Unreserved';
      updateNeeded = true;
    } else if (newStatus === 'cancelled') {
      // Restore all inventory
      if (previousStatus === 'confirmed' || previousStatus === 'processing' || previousStatus === 'shipped') {
        newReservedQuantity = Math.max(0, newReservedQuantity - item.quantity);
        newAvailableQuantity = newQuantity - newReservedQuantity;
        movementType = 'in';
        reason = 'Order Cancelled - Inventory Restored';
        updateNeeded = true;
      }
    } else if (newStatus === 'delivered') {
      // Finalize the inventory reduction
      if (previousStatus !== 'delivered') {
        newQuantity -= item.quantity;
        newReservedQuantity = Math.max(0, newReservedQuantity - item.quantity);
        newAvailableQuantity = newQuantity - newReservedQuantity;
        movementType = 'out';
        reason = 'Order Delivered - Final Inventory Reduction';
        updateNeeded = true;
      }
    }

    if (updateNeeded) {
      // Update inventory
      await db
        .update(productInventory)
        .set({
          quantity: newQuantity,
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
        movementType,
        quantity: item.quantity,
        previousQuantity: inventory.quantity,
        newQuantity: newQuantity,
        reason,
        reference: orderNumber,
        notes: `Status changed from ${previousStatus} to ${newStatus}`,
        processedBy: null, // TODO: Add current admin user
        createdAt: new Date(),
      });
    }
  }
}

// Helper function to handle payment status changes
async function handlePaymentStatusChange(
  orderItems: any[],
  previousPaymentStatus: string,
  newPaymentStatus: string,
  orderNumber: string,
  currentOrderStatus: string
) {
  // If payment is now successful and order is pending, reserve inventory
  if (previousPaymentStatus === 'pending' && newPaymentStatus === 'paid' && currentOrderStatus === 'pending') {
    for (const item of orderItems) {
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

      if (currentInventory.length === 0) continue;

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
        newQuantity: inventory.quantity,
        reason: 'Payment Received - Inventory Reserved',
        reference: orderNumber,
        notes: `Payment status changed to ${newPaymentStatus}`,
        processedBy: null,
        createdAt: new Date(),
      });
    }
  }
}

// Helper function to restore inventory when order is deleted
async function restoreInventoryFromOrder(orderItems: any[], orderNumber: string) {
  for (const item of orderItems) {
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

    if (currentInventory.length === 0) continue;

    const inventory = currentInventory[0];
    const newReservedQuantity = Math.max(0, (inventory.reservedQuantity || 0) - item.quantity);
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
      movementType: 'in',
      quantity: item.quantity,
      previousQuantity: inventory.quantity,
      newQuantity: inventory.quantity,
      reason: 'Order Deleted - Inventory Restored',
      reference: orderNumber,
      notes: `Order ${orderNumber} was deleted`,
      processedBy: null,
      createdAt: new Date(),
    });
  }
} 