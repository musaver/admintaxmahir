import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productInventory, products, productVariants, stockMovements } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull, desc } from 'drizzle-orm';

// This would ideally be a separate table for stock movements
// For now, we'll create a mock implementation that updates inventory directly

export async function GET() {
  try {
    // Fetch stock movements with product and variant information
    const movements = await db
      .select({
        movement: stockMovements,
        product: products,
        variant: productVariants,
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(productVariants, eq(stockMovements.variantId, productVariants.id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(1000); // Limit to prevent too much data

    const formattedMovements = movements.map(({ movement, product, variant }) => ({
      id: movement.id,
      productName: product?.name || 'Unknown Product',
      variantTitle: variant?.title || null,
      movementType: movement.movementType,
      quantity: movement.quantity,
      previousQuantity: movement.previousQuantity,
      newQuantity: movement.newQuantity,
      reason: movement.reason,
      location: movement.location,
      reference: movement.reference,
      notes: movement.notes,
      costPrice: movement.costPrice,
      supplier: movement.supplier,
      processedBy: movement.processedBy,
      createdAt: movement.createdAt?.toISOString() || new Date().toISOString(),
    }));
    
    return NextResponse.json(formattedMovements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      productId, 
      variantId, 
      movementType, 
      quantity, 
      reason, 
      location, 
      reference, 
      notes,
      costPrice,
      supplier 
    } = await req.json();
    
    // Validate required fields
    if (!productId || !movementType || !quantity || !reason) {
      return NextResponse.json({ error: 'ProductId, movementType, quantity, and reason are required' }, { status: 400 });
    }

    // Find existing inventory record
    let whereConditions = [eq(productInventory.productId, productId)];
    
    if (variantId) {
      whereConditions.push(eq(productInventory.variantId, variantId));
    } else {
      whereConditions.push(isNull(productInventory.variantId));
    }

    const existingInventory = await db
      .select()
      .from(productInventory)
      .where(and(...whereConditions))
      .limit(1);
    
    let newQuantity = 0;
    let inventoryId = '';

    if (existingInventory.length > 0) {
      const current = existingInventory[0];
      inventoryId = current.id;
      
      switch (movementType) {
        case 'in':
          newQuantity = current.quantity + quantity;
          break;
        case 'out':
          newQuantity = current.quantity - quantity;
          if (newQuantity < 0) {
            return NextResponse.json({ error: 'Insufficient stock for this movement' }, { status: 400 });
          }
          break;
        case 'adjustment':
          newQuantity = quantity; // For adjustments, quantity is the new total
          break;
        default:
          return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
      }

      // Update existing inventory
      await db
        .update(productInventory)
        .set({
          quantity: newQuantity,
          availableQuantity: newQuantity - (current.reservedQuantity || 0),
          lastRestockDate: movementType === 'in' ? new Date() : current.lastRestockDate,
          supplier: (movementType === 'in' && supplier) ? supplier : current.supplier,
        })
        .where(eq(productInventory.id, current.id));
    } else {
      // Create new inventory record if it doesn't exist
      if (movementType === 'out') {
        return NextResponse.json({ error: 'Cannot remove stock from non-existent inventory' }, { status: 400 });
      }

      newQuantity = movementType === 'in' ? quantity : (movementType === 'adjustment' ? quantity : 0);
      inventoryId = uuidv4();

      await db.insert(productInventory).values({
        id: inventoryId,
        productId,
        variantId: variantId || null,
        quantity: newQuantity,
        reservedQuantity: 0,
        availableQuantity: newQuantity,
        reorderPoint: 0,
        reorderQuantity: 0,
        location: location || null,
        supplier: supplier || null,
        lastRestockDate: movementType === 'in' ? new Date() : null,
      });
    }

    // Insert record into stock_movements table for audit trail
    const movementId = uuidv4();
    const previousQuantity = existingInventory.length > 0 ? existingInventory[0].quantity : 0;
    
    await db.insert(stockMovements).values({
      id: movementId,
      inventoryId,
      productId,
      variantId: variantId || null,
      movementType,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      location: location || null,
      reference: reference || null,
      notes: notes || null,
      costPrice: costPrice || null,
      supplier: supplier || null,
      processedBy: null, // TODO: Add current admin user ID when authentication is implemented
      createdAt: new Date(),
    });
    
    const movementRecord = {
      id: movementId,
      inventoryId,
      productId,
      variantId: variantId || null,
      movementType,
      quantity,
      previousQuantity,
      newQuantity,
      reason,
      location: location || null,
      reference: reference || null,
      notes: notes || null,
      costPrice: costPrice || null,
      supplier: supplier || null,
      createdAt: new Date(),
    };
    
    return NextResponse.json(movementRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
} 