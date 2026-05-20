import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import Message from '@/db/models/Message';
import Conversation from '@/db/models/Conversation';
import { getUserIdFromRequest } from '@/utils/auth';

// GET: Fetch paginated messages for a conversation
export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 403 });
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    // Fetch messages descending (newest first)
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'username email avatarUrl bio isOnline lastActive');

    // Reverse array to render chronologically (oldest to newest)
    const chronologicalMessages = [...messages].reverse();

    // Check if there are more messages left
    const totalCount = await Message.countDocuments({ conversationId });
    const hasMore = skip + messages.length < totalCount;

    return NextResponse.json({
      messages: chronologicalMessages,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save and send a new message in a conversation
export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, text, imageUrl } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
    }

    if (!text && !imageUrl) {
      return NextResponse.json({ message: 'Message content or image is required' }, { status: 400 });
    }

    // Verify user belongs to conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return NextResponse.json({ message: 'Conversation not found or unauthorized' }, { status: 403 });
    }

    // Save message
    const newMessage = new Message({
      conversationId,
      senderId: userId,
      text: text || '',
      imageUrl: imageUrl || '',
      isRead: false,
      readBy: [userId],
    });
    await newMessage.save();

    // Populate sender details for immediate rendering
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'username email avatarUrl bio isOnline lastActive');

    // Update conversation metadata
    conversation.lastMessage = newMessage._id;

    // Bump unreadCounts map for other participants
    conversation.participants.forEach((pId: any) => {
      const pStr = pId.toString();
      if (pStr !== userId) {
        const currentCount = conversation.unreadCounts.get(pStr) || 0;
        conversation.unreadCounts.set(pStr, currentCount + 1);
      }
    });

    await conversation.save();

    return NextResponse.json({
      message: populatedMessage,
      conversation,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
