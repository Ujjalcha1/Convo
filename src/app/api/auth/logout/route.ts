import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { verifyToken } from '@/utils/jwt';

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Parse the token from request cookies to set the user offline
    const cookieHeader = req.headers.get('cookie') || '';
    const tokenCookie = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='));

    if (tokenCookie) {
      const token = tokenCookie.split('=')[1];
      if (token) {
        const decoded = verifyToken(decodeURIComponent(token));
        if (decoded) {
          await User.findByIdAndUpdate(decoded.userId, {
            isOnline: false,
            lastActive: new Date(),
          });
        }
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Invalidate the session cookie by setting its expiration in the past
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error occurred during logout' },
      { status: 500 }
    );
  }
}
