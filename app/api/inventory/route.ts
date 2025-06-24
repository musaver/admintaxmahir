import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productInventory, products, productVariants } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allInventory = await db
      .select({
        inventory: productInventory,
        product: {
          id: products.id,
          name: products.name
        },
        variant: {
          id: productVariants.id,
          title: productVariants.title
        }
      })
      .from(productInventory)
      .leftJoin(products, eq(productInventory.productId, products.id))
      .leftJoin(productVariants, eq(productInventory.variantId, productVariants.id));
      
    return NextResponse.json(allInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      productId, 
      variantId, 
      quantity, 
      reservedQuantity, 
      reorderPoint, 
      reorderQuantity, 
      location, 
      supplier, 
      lastRestockDate 
    } = await req.json();
    
    // Calculate available quantity
    const availableQuantity = (quantity || 0) - (reservedQuantity || 0);
    
    const newInventory = {
      id: uuidv4(),
      productId: productId || null,
      variantId: variantId || null,
      quantity: quantity || 0,
      reservedQuantity: reservedQuantity || 0,
      availableQuantity,
      reorderPoint: reorderPoint || 0,
      reorderQuantity: reorderQuantity || 0,
      location: location || null,
      supplier: supplier || null,
      lastRestockDate: lastRestockDate ? new Date(lastRestockDate) : null,
    };
    
    await db.insert(productInventory).values(newInventory);
    
    return NextResponse.json(newInventory, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory record:', error);
    return NextResponse.json({ error: 'Failed to create inventory record' }, { status: 500 });
  }
} 