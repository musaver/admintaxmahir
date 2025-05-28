import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { adminUsers, adminRoles } from '../../../lib/db/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allAdmins = await db
      .select({
        admin: adminUsers,
        role: {
          id: adminRoles.id,
          name: adminRoles.name
        }
      })
      .from(adminUsers)
      .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id));
      
    return NextResponse.json(allAdmins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, roleId } = await request.json();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      roleId,
    };
    
    await db.insert(adminUsers).values(newAdmin);
    
    // Remove password from response
    const { password: _, ...adminWithoutPassword } = newAdmin;
    
    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
} 