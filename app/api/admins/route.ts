import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const admins = await db.query.adminUsers.findMany({
      with: {
        role: true
      }
    });

    // Remove passwords from response
    const adminsWithoutPasswords = admins.map(({ password, ...admin }) => admin);

    return NextResponse.json(adminsWithoutPasswords);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, roleId, role } = await req.json();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      roleId,
      role,
    };

    await db.insert(adminUsers).values(newAdmin);

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
} 