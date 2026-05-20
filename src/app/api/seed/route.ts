import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/db/connect';
import User from '@/db/models/User';
import Conversation from '@/db/models/Conversation';
import Message from '@/db/models/Message';

export async function GET() {
  try {
    await dbConnect();

    // 1. Wipe existing databases
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

    console.log('Database wiped for seeding.');

    // 2. Generate a standard password hash for all seed users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Create Seed Users
    const usersData = [
      {
        username: 'alex_rivera',
        email: 'alex@convo.com',
        passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex',
        bio: 'Senior UX Designer | Co-working fan 🎨',
        isOnline: true,
        lastActive: new Date(),
      },
      {
        username: 'sophia_chen',
        email: 'sophia@convo.com',
        passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sophia',
        bio: 'Fullstack Dev @ Stripe. Coffee addict! ☕',
        isOnline: true,
        lastActive: new Date(),
      },
      {
        username: 'marcus_bell',
        email: 'marcus@convo.com',
        passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=marcus',
        bio: 'DevOps Engineer. Cloud enthusiast ☁️',
        isOnline: false,
        lastActive: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      },
      {
        username: 'emily_watson',
        email: 'emily@convo.com',
        passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=emily',
        bio: 'Product Manager. Cat mom 🐈',
        isOnline: false,
        lastActive: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
      {
        username: 'convo_assistant',
        email: 'assistant@convo.com',
        passwordHash,
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=convo',
        bio: 'Your Convo Onboarding Assistant 🤖',
        isOnline: true,
        lastActive: new Date(),
      },
    ];

    const users = await User.insertMany(usersData);
    console.log('Seeded users:', users.length);

    const alex = users[0];
    const sophia = users[1];
    const marcus = users[2];
    const emily = users[3];
    const assistant = users[4];

    // 4. Create Active Conversations
    const convosData = [
      {
        participants: [alex._id, sophia._id],
        unreadCounts: new Map([
          [alex._id.toString(), 0],
          [sophia._id.toString(), 0],
        ]),
      },
      {
        participants: [alex._id, marcus._id],
        unreadCounts: new Map([
          [alex._id.toString(), 0],
          [marcus._id.toString(), 0],
        ]),
      },
      {
        participants: [alex._id, assistant._id],
        unreadCounts: new Map([
          [alex._id.toString(), 2], // Alex has 2 unread welcome messages!
          [assistant._id.toString(), 0],
        ]),
      },
    ];

    const convos = await Conversation.insertMany(convosData);
    console.log('Seeded conversations:', convos.length);

    // 5. Seed Historical Messages
    const messagesData = [
      // Chat between Alex and Sophia
      {
        conversationId: convos[0]._id,
        senderId: sophia._id,
        text: "Hey Alex! Did you get a chance to review the new design files we finalized yesterday?",
        isRead: true,
        readBy: [alex._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
      },
      {
        conversationId: convos[0]._id,
        senderId: alex._id,
        text: "Hey Sophia! Yes, I just checked them out. The responsive sidebar looks super sleek. Here is a quick screenshot of how I styled it in glassmorphism!",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
        isRead: true,
        readBy: [alex._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 1.8),
      },
      {
        conversationId: convos[0]._id,
        senderId: sophia._id,
        text: "Oh wow, that glass look is incredible! It fits the premium theme perfectly. Let's merge the codebase this afternoon.",
        isRead: true,
        readBy: [alex._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 1.5),
      },
      {
        conversationId: convos[0]._id,
        senderId: alex._id,
        text: "Absolutely! I will push my CSS updates now so they are ready for the build.",
        isRead: true,
        readBy: [alex._id, sophia._id],
        createdAt: new Date(Date.now() - 3600000 * 1.2),
      },

      // Chat between Alex and Marcus
      {
        conversationId: convos[1]._id,
        senderId: alex._id,
        text: "Marcus, are we good to deploy the custom Node HTTP socket server to Railway?",
        isRead: true,
        readBy: [alex._id, marcus._id],
        createdAt: new Date(Date.now() - 3600000 * 6),
      },
      {
        conversationId: convos[1]._id,
        senderId: marcus._id,
        text: "Yep, Docker configs are all set. DB pools are fully cached and WebSocket ports are exposed correctly.",
        isRead: true,
        readBy: [alex._id, marcus._id],
        createdAt: new Date(Date.now() - 3600000 * 5.8),
      },
      {
        conversationId: convos[1]._id,
        senderId: alex._id,
        text: "Awesome, thanks for the quick turnaround! 🚀",
        isRead: true,
        readBy: [alex._id, marcus._id],
        createdAt: new Date(Date.now() - 3600000 * 5.5),
      },

      // Chat between Alex and Assistant (Welcome chat)
      {
        conversationId: convos[2]._id,
        senderId: assistant._id,
        text: "Welcome to Convo, Alex! I am your real-time onboarding helper. Here, you can test immediate WebSockets concurrency.",
        isRead: true,
        readBy: [assistant._id],
        createdAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        conversationId: convos[2]._id,
        senderId: assistant._id,
        text: "Try opening this app in a second browser window and register a separate account. You can send pictures, toggle pins, and see typing ellipses instantly!",
        isRead: false, // Unread message!
        readBy: [assistant._id],
        createdAt: new Date(Date.now() - 3600000 * 23.9),
      },
      {
        conversationId: convos[2]._id,
        senderId: assistant._id,
        text: "Let me know if you have any questions! Chat away! 💬",
        isRead: false, // Unread message!
        readBy: [assistant._id],
        createdAt: new Date(Date.now() - 3600000 * 23.8),
      },
    ];

    const messages = await Message.insertMany(messagesData);
    console.log('Seeded messages:', messages.length);

    // 6. Update Last Message references in conversations
    convos[0].lastMessage = messages[3]._id; // Sophia's last message
    convos[1].lastMessage = messages[6]._id; // Alex's last message
    convos[2].lastMessage = messages[9]._id; // Assistant's welcome message
    
    await convos[0].save();
    await convos[1].save();
    await convos[2].save();

    console.log('Conversations updated with lastMessage references.');

    // Pin one conversation for Alex's profile (welcome assistant chat)
    alex.pinnedConversations.push(convos[2]._id);
    await alex.save();

    return NextResponse.json({
      success: true,
      message: 'Database successfully reset and seeded with rich conversational data!',
      accounts: [
        { email: 'alex@convo.com', username: 'alex_rivera', password: 'password123' },
        { email: 'sophia@convo.com', username: 'sophia_chen', password: 'password123' },
        { email: 'marcus@convo.com', username: 'marcus_bell', password: 'password123' },
        { email: 'emily@convo.com', username: 'emily_watson', password: 'password123' },
      ],
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, message: 'Seeding failed: ' + error.message },
      { status: 500 }
    );
  }
}
