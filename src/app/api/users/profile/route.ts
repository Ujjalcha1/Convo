import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { getUserIdFromRequest } from '@/utils/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(160, 'Bio must be under 160 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
});

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
        pinnedConversations: user.pinnedConversations,
      },
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const updates = parsed.data;

    // If changing username, verify uniqueness
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return NextResponse.json({ message: 'Username is already taken' }, { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        isOnline: updatedUser.isOnline,
        lastActive: updatedUser.lastActive,
        pinnedConversations: updatedUser.pinnedConversations,
      },
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
