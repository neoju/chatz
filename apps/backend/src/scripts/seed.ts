import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '@/modules/user/user.schema.js';
import { Conversation } from '@/modules/conversation/conversation.schema.js';
import { ConversationMember } from '@/modules/conversation/conversation-member.schema.js';
import { Message } from '@/modules/conversation/message.schema.js';
import { MessageAttachment } from '@/modules/conversation/message-attachment.schema.js';
import { ConversationType, ConversationRole, MessageContentType, UserStatus } from '@chatz/shared';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatz';

const LOREM_SENTENCES = [
  "Hey, how are you doing?",
  "Did you see the new update?",
  "Let's meet tomorrow at 10 AM.",
  "I'm working on the seed script right now.",
  "Chatz is going to be awesome!",
  "Can you send me the files?",
  "Sure, I will send them in a minute.",
  "Don't forget to check the documentation.",
  "The backend is looking solid.",
  "I love SvelteKit for the frontend.",
  "Fastify is really fast indeed.",
  "MongoDB is great for chat applications.",
  "Redis for real-time notifications, perfect.",
  "What do you think about the design?",
  "It looks clean and modern.",
  "I agree, the dark mode is sweet.",
  "Any plans for the weekend?",
  "Just relaxing and coding a bit.",
  "Sounds good!",
  "Catch you later.",
  "How's the weather today?",
  "It's raining cats and dogs here.",
  "Perfect weather for coding then!",
  "Absolutely. I'm making great progress.",
  "Have you tried the new API endpoints?",
  "Yes, they are much more efficient now.",
  "Great to hear. Let me know if you need any help.",
  "Will do, thanks!",
  "By the way, did you finish the documentation?",
  "Almost there, just a few more sections to go."
];

const ATTACHMENTS = [
  { url: 'https://picsum.photos/seed/chatz1/800/600', filename: 'meeting-notes.jpg', mimeType: 'image/jpeg', size: 102400 },
  { url: 'https://picsum.photos/seed/chatz2/1024/768', filename: 'design-preview.jpg', mimeType: 'image/jpeg', size: 204800 },
  { url: 'https://picsum.photos/seed/chatz3/400/300', filename: 'screenshot.png', mimeType: 'image/png', size: 51200 },
  { url: 'https://picsum.photos/seed/chatz4/1200/800', filename: 'office.jpg', mimeType: 'image/jpeg', size: 307200 },
  { url: 'https://picsum.photos/seed/chatz5/600/400', filename: 'profile-bg.jpg', mimeType: 'image/jpeg', size: 153600 },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  // Clear data
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Conversation.deleteMany({}),
    ConversationMember.deleteMany({}),
    Message.deleteMany({}),
    MessageAttachment.deleteMany({})
  ]);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create main user
  console.log('Creating main user...');
  const mainUser = await User.create({
    email: 'test@example.com',
    password: hashedPassword,
    nickname: 'MainUser',
    avatarUrl: 'https://i.pravatar.cc/150?u=test@example.com',
    status: UserStatus.ONLINE
  });

  // Create contact users
  console.log('Creating contact users...');
  const contactData = [];
  const statuses = [UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.AWAY, UserStatus.BUSY];
  for (let i = 1; i <= 50; i++) {
    const id = i.toString().padStart(2, '0');
    contactData.push({
      email: `user${id}@example.com`,
      password: hashedPassword,
      nickname: `User${id}`,
      avatarUrl: `https://i.pravatar.cc/150?u=user${id}@example.com`,
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }
  const contacts = await User.insertMany(contactData);

  console.log(`Created ${contacts.length + 1} users.`);

  // Create DMs
  console.log('Seeding DM conversations...');
  for (const contact of contacts) {
    const conversation = await Conversation.create({
      type: ConversationType.DM
    });

    await ConversationMember.insertMany([
      { userId: mainUser._id, conversationId: conversation._id, role: ConversationRole.ADMIN },
      { userId: contact._id, conversationId: conversation._id, role: ConversationRole.ADMIN }
    ]);

    await seedMessages(conversation._id as mongoose.Types.ObjectId, [mainUser._id as mongoose.Types.ObjectId, contact._id as mongoose.Types.ObjectId], mainUser._id as mongoose.Types.ObjectId);
  }

  // Create Groups
  console.log('Seeding group conversations...');
  const GROUP_NAMES = [
    'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon',
    'Team Zeta', 'Team Eta', 'Team Theta', 'Team Iota', 'Team Kappa'
  ];

  for (const groupName of GROUP_NAMES) {
    const group = await Conversation.create({
      type: ConversationType.GROUP,
      name: groupName
    });

    const shuffled = [...contacts].sort(() => 0.5 - Math.random());
    const memberCount = Math.floor(Math.random() * 11) + 5;
    const selectedContacts = shuffled.slice(0, memberCount);

    const groupMembers = [
      { userId: mainUser._id, conversationId: group._id, role: ConversationRole.ADMIN },
      ...selectedContacts.map(c => ({ userId: c._id, conversationId: group._id, role: ConversationRole.MEMBER }))
    ];
    await ConversationMember.insertMany(groupMembers);

    await seedMessages(
      group._id as mongoose.Types.ObjectId,
      [mainUser._id as mongoose.Types.ObjectId, ...selectedContacts.map(c => c._id as mongoose.Types.ObjectId)],
      mainUser._id as mongoose.Types.ObjectId
    );
  }

  console.log('Seeding completed successfully.');
  await mongoose.disconnect();
}

async function seedMessages(conversationId: mongoose.Types.ObjectId, participantIds: mongoose.Types.ObjectId[], mainUserId: mongoose.Types.ObjectId) {
  const now = new Date();
  const startDate = new Date('2020-03-01T00:00:00.000Z');

  const messageCount = Math.floor(Math.random() * 50) + 50; // 50 to 100 messages per conversation
  const messages: any[] = [];

  for (let i = 0; i < messageCount; i++) {
    const sentAt = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
    const senderId = participantIds[Math.floor(Math.random() * participantIds.length)];
    const content = LOREM_SENTENCES[Math.floor(Math.random() * LOREM_SENTENCES.length)];

    const hasAttachment = Math.random() < 0.1; // 10% chance for attachment
    const contentType = hasAttachment ? MessageContentType.IMAGE : MessageContentType.TEXT;

    messages.push({
      conversationId,
      senderId,
      content,
      contentType,
      sentAt,
      createdAt: sentAt,
      updatedAt: sentAt
    });
  }

  // Sort messages by sentAt to properly handle read receipts
  messages.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  const insertedMessages = await Message.insertMany(messages);

  // Add attachments
  const attachmentDocs = [];
  for (const msg of insertedMessages) {
    if (msg.contentType === MessageContentType.IMAGE) {
      const attachmentData = ATTACHMENTS[Math.floor(Math.random() * ATTACHMENTS.length)];
      attachmentDocs.push({
        messageId: msg._id,
        conversationId,
        ...attachmentData
      });
    }
  }
  if (attachmentDocs.length > 0) {
    await MessageAttachment.insertMany(attachmentDocs);
  }

  // Set read receipt for main user (randomly leave some unread messages)
  const unreadCount = Math.floor(Math.random() * 10);
  const readMessages = insertedMessages.slice(0, Math.max(0, insertedMessages.length - unreadCount));
  const lastReadMessage = readMessages[readMessages.length - 1];

  if (lastReadMessage) {
    await ConversationMember.updateOne(
      { conversationId, userId: mainUserId },
      {
        lastReadMessageId: lastReadMessage._id,
        lastReadAt: lastReadMessage.sentAt,
        unreadCount: unreadCount
      }
    );
  }

  // Update conversation updatedAt to latest message
  const latestMessage = insertedMessages[insertedMessages.length - 1];
  if (latestMessage) {
    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: latestMessage.sentAt,
      lastActivityAt: latestMessage.sentAt,
      lastMessage: {
        content: latestMessage.content,
        senderId: latestMessage.senderId,
        sentAt: latestMessage.sentAt
      }
    });
    // Also update all members' updatedAt to keep things consistent if needed
    await ConversationMember.updateMany({ conversationId }, { updatedAt: latestMessage.sentAt });
  }
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
