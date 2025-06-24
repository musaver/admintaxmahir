import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, subcategories, productVariants, productAddons } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allProducts = await db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name
        },
        subcategory: {
          id: subcategories.id,
          name: subcategories.name
        }
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id));
      
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      name, 
      slug, 
      description, 
      shortDescription, 
      sku, 
      price, 
      comparePrice, 
      costPrice, 
      images, 
      categoryId, 
      subcategoryId, 
      tags, 
      weight, 
      dimensions, 
      isFeatured, 
      isActive, 
      isDigital, 
      requiresShipping, 
      taxable, 
      metaTitle, 
      metaDescription,
      productType,
      variationAttributes,
      variants,
      addons
    } = await req.json();
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Price validation - required for all product types except group products
    if (productType !== 'group' && (price === undefined || price === null)) {
      return NextResponse.json({ error: 'Price is required for this product type' }, { status: 400 });
    }
    
    // For group products with zero price, ensure they have addons
    if (productType === 'group' && (!price || price === 0) && (!addons || addons.length === 0)) {
      return NextResponse.json({ error: 'Group products with zero price must have at least one addon' }, { status: 400 });
    }
    
    const newProduct = {
      id: uuidv4(),
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      shortDescription: shortDescription || null,
      sku: sku || null,
      price: (price || 0).toString(),
      comparePrice: comparePrice ? comparePrice.toString() : null,
      costPrice: costPrice ? costPrice.toString() : null,
      images: images ? JSON.stringify(images) : null,
      categoryId: categoryId || null,
      subcategoryId: subcategoryId || null,
      tags: tags ? JSON.stringify(tags) : null,
      weight: weight ? weight.toString() : null,
      dimensions: dimensions ? JSON.stringify(dimensions) : null,
      isFeatured: isFeatured || false,
      isActive: isActive !== undefined ? isActive : true,
      isDigital: isDigital || false,
      requiresShipping: requiresShipping !== undefined ? requiresShipping : true,
      taxable: taxable !== undefined ? taxable : true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      productType: productType || 'simple',
      variationAttributes: variationAttributes ? JSON.stringify(variationAttributes) : null,
    };
    
    // Start transaction for product and variants
    await db.insert(products).values(newProduct);
    
    // If it's a variable product, create variants
    if (productType === 'variable' && variants && variants.length > 0) {
      const variantData = variants.map((variant: any) => ({
        id: uuidv4(),
        productId: newProduct.id,
        title: variant.title,
        sku: variant.sku || null,
        price: variant.price ? variant.price.toString() : newProduct.price,
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
      }));
      
      await db.insert(productVariants).values(variantData);
    }
    
    // If it's a group product, create product addons
    if (productType === 'group' && addons && addons.length > 0) {
      const addonData = addons.map((addon: any) => ({
        id: uuidv4(),
        productId: newProduct.id,
        addonId: addon.addonId,
        price: addon.price ? addon.price.toString() : '0',
        isRequired: addon.isRequired || false,
        sortOrder: addon.sortOrder || 0,
        isActive: addon.isActive !== undefined ? addon.isActive : true,
      }));
      
      await db.insert(productAddons).values(addonData);
    }
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
} 