import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productVariants, productAddons } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      variants, 
      variationAttributes, 
      variantsToDelete,
      addons,
      ...productData 
    } = await req.json();

    // Convert numeric fields to strings for decimal storage
    if (productData.price) productData.price = productData.price.toString();
    if (productData.comparePrice) productData.comparePrice = productData.comparePrice.toString();
    if (productData.costPrice) productData.costPrice = productData.costPrice.toString();
    if (productData.weight) productData.weight = productData.weight.toString();

    // Convert arrays/objects to JSON strings
    if (productData.images) productData.images = JSON.stringify(productData.images);
    if (productData.tags) productData.tags = JSON.stringify(productData.tags);
    if (productData.dimensions) productData.dimensions = JSON.stringify(productData.dimensions);
    if (variationAttributes) productData.variationAttributes = JSON.stringify(variationAttributes);

    // Update the main product
    await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id));

    // Handle variant management for variable products
    if (productData.productType === 'variable' && variants) {
      // Delete variants marked for deletion
      if (variantsToDelete && variantsToDelete.length > 0) {
        for (const variantId of variantsToDelete) {
          await db
            .delete(productVariants)
            .where(eq(productVariants.id, variantId));
        }
      }

      // Process variants (update existing, create new)
      for (const variant of variants) {
        const variantData = {
          productId: id,
          title: variant.title,
          sku: variant.sku || null,
          price: variant.price ? variant.price.toString() : productData.price,
          comparePrice: variant.comparePrice ? variant.comparePrice.toString() : null,
          costPrice: variant.costPrice ? variant.costPrice.toString() : null,
          weight: variant.weight ? variant.weight.toString() : null,
          image: variant.image || null,
          inventoryQuantity: variant.inventoryQuantity || 0,
          inventoryManagement: true,
          allowBackorder: false,
          isActive: variant.isActive !== undefined ? variant.isActive : true,
          position: 0,
          variantOptions: variant.attributes ? JSON.stringify(variant.attributes) : null,
        };

        if (variant.id) {
          // Update existing variant
          await db
            .update(productVariants)
            .set(variantData)
            .where(eq(productVariants.id, variant.id));
        } else {
          // Create new variant
          await db.insert(productVariants).values({
            id: uuidv4(),
            ...variantData,
          });
        }
      }
    } else if (productData.productType === 'simple') {
      // If changed from variable to simple, delete all variants
      await db
        .delete(productVariants)
        .where(eq(productVariants.productId, id));
    }

    // Handle addon management for group products
    if (productData.productType === 'group' && addons) {
      // First, delete all existing product addons
      await db
        .delete(productAddons)
        .where(eq(productAddons.productId, id));

      // Then create new product addons
      if (addons.length > 0) {
        const addonData = addons.map((addon: any) => ({
          id: uuidv4(),
          productId: id,
          addonId: addon.addonId,
          price: addon.price ? addon.price.toString() : '0',
          isRequired: addon.isRequired || false,
          sortOrder: addon.sortOrder || 0,
          isActive: addon.isActive !== undefined ? addon.isActive : true,
        }));
        
        await db.insert(productAddons).values(addonData);
      }
    } else if (productData.productType !== 'group') {
      // If changed from group to another type, delete all product addons
      await db
        .delete(productAddons)
        .where(eq(productAddons.productId, id));
    }

    const updatedProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db
      .delete(products)
      .where(eq(products.id, id));

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 