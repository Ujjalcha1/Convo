import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { verifyToken } from '@/utils/jwt';

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Parse the token from request cookies
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='));

    if (!tokenCookie) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const token = tokenCookie.split('=')[1];
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifyToken(decodeURIComponent(token));
    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
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
      },
    });
  } catch (error) {
    console.error('Check-session error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
