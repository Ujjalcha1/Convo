import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { signToken } from '@/utils/jwt';
import { z } from 'zod';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate inputs
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { emailOrUsername, password } = parsed.data;

    // Search user by email or username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials provided' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials provided' },
        { status: 401 }
      );
    }

    // Set online and update activity
    user.isOnline = true;
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isOnline: user.isOnline,
        lastActive: user.lastActive,
      },
    });

    // Write Secure HttpOnly cookie
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
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error occurred during login' },
      { status: 500 }
    );
  }
}
