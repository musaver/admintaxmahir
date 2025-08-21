import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers, adminRoles } from '@/lib/schema';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get the current session to determine the user context
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    let admins;

    if (currentUser.type === 'super-admin') {
      // Super admin can see all admins
      console.log('Super admin fetching all admins');
      admins = await db
        .select({
          admin: adminUsers,
          role: {
            id: adminRoles.id,
            name: adminRoles.name,
            permissions: adminRoles.permissions
          }
        })
        .from(adminUsers)
        .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id));
    } else {
      // Tenant admin can only see admins from their tenant
      console.log('Tenant admin fetching admins for tenant:', currentUser.tenantId);
      admins = await db
        .select({
          admin: adminUsers,
          role: {
            id: adminRoles.id,
            name: adminRoles.name,
            permissions: adminRoles.permissions
          }
        })
        .from(adminUsers)
        .leftJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
        .where(eq(adminUsers.tenantId, currentUser.tenantId));
    }

    // Remove passwords from response and format data
    const adminsWithoutPasswords = admins.map(({ admin, role }) => ({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        tenantId: admin.tenantId,
        type: admin.type,
        roleId: admin.roleId,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      },
      role
    }));

    return NextResponse.json(adminsWithoutPasswords);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the current session to determine the user context
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = session.user as any;
    const { email, password, name, roleId, tenantId, type } = await req.json();
    
    // Determine the tenant ID and type for the new admin
    let newAdminTenantId;
    let newAdminType;
    
    if (currentUser.type === 'super-admin') {
      // Super admin can specify the tenant ID and type
      newAdminTenantId = tenantId || 'super-admin';
      newAdminType = type || 'admin'; // Default to 'admin' unless specified
      console.log('Super admin creating admin for tenant:', newAdminTenantId, 'with type:', newAdminType);
    } else {
      // Tenant admin can only create regular admins for their own tenant
      newAdminTenantId = currentUser.tenantId;
      newAdminType = 'admin'; // Tenant admins can only create regular admins
      console.log('Tenant admin creating admin for their tenant:', newAdminTenantId);
    }
    
    // Get the role information
    const [roleData] = await db
      .select()
      .from(adminRoles)
      .where(eq(adminRoles.id, roleId))
      .limit(1);

    if (!roleData) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newAdmin = {
      id: uuidv4(),
      tenantId: newAdminTenantId,
      email,
      password: hashedPassword,
      name,
      type: newAdminType,
      roleId,
      role: roleData.name, // Set the role name
    };

    await db.insert(adminUsers).values(newAdmin);

    // Return admin without password
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return NextResponse.json(adminWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
} 