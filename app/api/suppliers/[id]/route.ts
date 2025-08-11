import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers, productInventory, stockMovements, orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    
    if (supplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    
    return NextResponse.json(supplier[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updateData = await req.json();
    
    // Check if supplier exists
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    
    if (existingSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    
    // If email is being updated, check for duplicates
    if (updateData.email && updateData.email !== existingSupplier[0].email) {
      const duplicateSupplier = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.email, updateData.email))
        .limit(1);
      
      if (duplicateSupplier.length > 0) {
        return NextResponse.json({ error: 'Supplier with this email already exists' }, { status: 400 });
      }
    }
    
    // Update supplier
    const updatedSupplier = {
      ...updateData,
      updatedAt: new Date(),
    };
    
    await db
      .update(suppliers)
      .set(updatedSupplier)
      .where(eq(suppliers.id, id));
    
    // Fetch and return updated supplier
    const result = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if supplier exists
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);
    
    if (existingSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    
    // Check if supplier is referenced in inventory
    const inventoryReferences = await db
      .select()
      .from(productInventory)
      .where(eq(productInventory.supplierId, id))
      .limit(1);
    
    if (inventoryReferences.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier as it is referenced in inventory records. Please remove all inventory references first.' 
      }, { status: 400 });
    }
    
    // Check if supplier is referenced in stock movements
    const stockMovementReferences = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.supplierId, id))
      .limit(1);
    
    if (stockMovementReferences.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier as it is referenced in stock movement records. Please remove all references first.' 
      }, { status: 400 });
    }
    
    // Check if supplier is referenced in orders
    const orderReferences = await db
      .select()
      .from(orders)
      .where(eq(orders.supplierId, id))
      .limit(1);
    
    if (orderReferences.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete supplier as it is referenced in order records. Please remove all references first.' 
      }, { status: 400 });
    }
    
    // Delete supplier
    await db
      .delete(suppliers)
      .where(eq(suppliers.id, id));
    
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
