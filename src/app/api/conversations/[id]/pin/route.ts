import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import { getUserIdFromRequest } from '@/utils/auth';
import mongoose from 'mongoose';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15 App Router dynamic routes
    const { id: conversationId } = await params;
    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const convObjId = new mongoose.Types.ObjectId(conversationId);
    const isPinnedIndex = user.pinnedConversations.findIndex(
      (pId: mongoose.Types.ObjectId) => pId.toString() === conversationId
    );

    let isPinned = false;
    if (isPinnedIndex > -1) {
      // Unpin the conversation
      user.pinnedConversations.splice(isPinnedIndex, 1);
    } else {
      // Pin the conversation
      user.pinnedConversations.push(convObjId);
      isPinned = true;
    }

    await user.save();

    return NextResponse.json({
      pinnedConversations: user.pinnedConversations,
      isPinned,
    });
  } catch (error: any) {
    console.error('Error toggling pin status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
