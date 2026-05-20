import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { getUserIdFromRequest } from '@/utils/auth';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const filter: any = { _id: { $ne: userId } };

    if (query) {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('username email avatarUrl bio isOnline lastActive')
      .limit(20);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
