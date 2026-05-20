import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { signToken } from '@/utils/jwt';
import { z } from 'zod';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate inputs
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json(
        { message: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      email,
      passwordHash,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`,
      bio: 'Hey there! I am using ChatApp.',
      isOnline: true,
      lastActive: new Date(),
    });

    // Generate JWT token
    const token = signToken({ userId: newUser._id.toString(), email: newUser.email });

    // Set cookie
    const response = NextResponse.json(
      {
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
          bio: newUser.bio,
          isOnline: newUser.isOnline,
          lastActive: newUser.lastActive,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error occurred during registration' },
      { status: 500 }
    );
  }
}
