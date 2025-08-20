import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { user, userLoyaltyPoints } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { ne, or, isNull, eq, and } from 'drizzle-orm';
import { withTenant, ErrorResponses } from '@/lib/api-helpers';

export const GET = withTenant(async (request: NextRequest, context) => {
  try {
    // Only fetch users that are not drivers (customer type or null for existing users) and belong to current tenant
    const allUsers = await db
      .select({
        user: user,
        loyaltyPoints: userLoyaltyPoints
      })
      .from(user)
      .leftJoin(userLoyaltyPoints, and(
        eq(user.id, userLoyaltyPoints.userId),
        eq(userLoyaltyPoints.tenantId, context.tenantId)
      ))
      .where(
        and(
          eq(user.tenantId, context.tenantId), // Filter by tenant
          or(
            ne(user.userType, 'driver'),
            isNull(user.userType)
          )
        )
      );

    // Transform the data to match the expected format
            const usersWithPoints = allUsers.map(record => ({
          ...record.user,
          loyaltyPoints: record.loyaltyPoints ? {
            availablePoints: record.loyaltyPoints.availablePoints,
            pendingPoints: record.loyaltyPoints.pendingPoints,
            totalPointsEarned: record.loyaltyPoints.totalPointsEarned,
            totalPointsRedeemed: record.loyaltyPoints.totalPointsRedeemed,
            pointsExpiringSoon: record.loyaltyPoints.pointsExpiringSoon
          } : {
            availablePoints: 0,
            pendingPoints: 0,
            totalPointsEarned: 0,
            totalPointsRedeemed: 0,
            pointsExpiringSoon: 0
          }
        }));

    return NextResponse.json(usersWithPoints);
  } catch (error) {
    console.error('Error fetching users:', error);
    return ErrorResponses.serverError('Failed to fetch users');
  }
});

export const POST = withTenant(async (request: NextRequest, context) => {
  try {
    const { 
      name, 
      email, 
      password, 
      firstName,
      lastName,
      buyerNTNCNIC, 
      buyerBusinessName, 
      buyerProvince, 
      buyerAddress, 
      buyerRegistrationType 
    } = await request.json();
    
    // Hash password only if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    const newUser = {
      id: uuidv4(),
      tenantId: context.tenantId, // Add tenant ID
      name,
      firstName: firstName || null,
      lastName: lastName || null,
      email,
      password: hashedPassword,
      userType: 'customer', // Set as customer by default
      buyerNTNCNIC: buyerNTNCNIC || null,
      buyerBusinessName: buyerBusinessName || null,
      buyerProvince: buyerProvince || null,
      buyerAddress: buyerAddress || null,
      buyerRegistrationType: buyerRegistrationType || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(user).values(newUser);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}); 