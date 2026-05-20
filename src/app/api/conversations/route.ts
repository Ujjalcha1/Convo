import { NextResponse } from 'next/server';
import dbConnect from '@/db/connect';
import Conversation from '@/db/models/Conversation';
import Message from '@/db/models/Message';
import User from '@/db/models/User';
import { getUserIdFromRequest } from '@/utils/auth';

// GET all conversations for the authenticated user
export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find conversations containing user in participants list
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'username email avatarUrl bio isOnline lastActive')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST: Start a new conversation or retrieve an existing one
export async function POST(req: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId } = await req.json();
    if (!recipientId) {
      return NextResponse.json({ message: 'Recipient ID is required' }, { status: 400 });
    }

    if (recipientId === userId) {
      return NextResponse.json({ message: 'Cannot start a conversation with yourself' }, { status: 400 });
    }

    // Check if conversation already exists between this pair
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId], $size: 2 },
    })
      .populate('participants', 'username email avatarUrl bio isOnline lastActive')
      .populate('lastMessage');

    if (!conversation) {
      // Initialize a new conversation document
      const newConversation = new Conversation({
        participants: [userId, recipientId],
        unreadCounts: new Map([
          [userId, 0],
          [recipientId, 0],
        ]),
      });
      await newConversation.save();

      conversation = await Conversation.findById(newConversation._id)
        .populate('participants', 'username email avatarUrl bio isOnline lastActive');
    }

    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
