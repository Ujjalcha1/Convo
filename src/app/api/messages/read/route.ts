import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import Message from '@/db/models/Message';
import Conversation from '@/db/models/Conversation';
import { getUserIdFromRequest } from '@/utils/auth';

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user belongs to conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 403 });
    }

    // Update unread count for this user to 0
    conversation.unreadCounts.set(userId, 0);
    await conversation.save();

    // Mark messages as read by adding userId to readBy array and setting isRead to true
    // (only for messages sent by others, where we aren't already in readBy)
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        $set: { isRead: true },
      }
    );

    return NextResponse.json({ message: 'Conversation messages marked as read successfully' });
  } catch (error: any) {
    console.error('Error marking messages read:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
