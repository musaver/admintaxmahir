import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { suppliers } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allSuppliers = await db
      .select()
      .from(suppliers)
      .orderBy(suppliers.name);
      
    return NextResponse.json(allSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { 
      name,
      companyName,
      email,
      phone,
      fax,
      website,
      taxId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      primaryContactMobile,
      secondaryContactName,
      secondaryContactEmail,
      secondaryContactPhone,
      secondaryContactMobile,
      address,
      city,
      state,
      postalCode,
      country,
      paymentTerms,
      currency,
      notes,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
      isActive
    } = await req.json();
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Check if supplier with this email already exists
    const existingSupplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.email, email))
      .limit(1);
    
    if (existingSupplier.length > 0) {
      return NextResponse.json({ error: 'Supplier with this email already exists' }, { status: 400 });
    }
    
    const newSupplier = {
      id: uuidv4(),
      name,
      companyName: companyName || null,
      email,
      phone: phone || null,
      fax: fax || null,
      website: website || null,
      taxId: taxId || null,
      primaryContactName: primaryContactName || null,
      primaryContactEmail: primaryContactEmail || null,
      primaryContactPhone: primaryContactPhone || null,
      primaryContactMobile: primaryContactMobile || null,
      secondaryContactName: secondaryContactName || null,
      secondaryContactEmail: secondaryContactEmail || null,
      secondaryContactPhone: secondaryContactPhone || null,
      secondaryContactMobile: secondaryContactMobile || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      paymentTerms: paymentTerms || null,
      currency: currency || 'USD',
      notes: notes || null,
      sellerNTNCNIC: sellerNTNCNIC || null,
      sellerBusinessName: sellerBusinessName || null,
      sellerProvince: sellerProvince || null,
      sellerAddress: sellerAddress || null,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(suppliers).values(newSupplier);
    
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
