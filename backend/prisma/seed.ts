import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data in correct order (respecting foreign key constraints)
  console.log('🗑️  Cleaning existing data...');
  await prisma.huddleParticipant.deleteMany();
  await prisma.huddle.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.customEmoji.deleteMany();
  await prisma.user.deleteMany();

  console.log('👥 Creating users...');
  
  // Hash password for all test users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sarah@teamapp.com',
        username: 'sarah_johnson',
        name: 'Sarah Johnson',
        password: hashedPassword,
        avatar: null,
        status: 'online',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@teamapp.com',
        username: 'mike_chen',
        name: 'Mike Chen',
        password: hashedPassword,
        avatar: null,
        status: 'online',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma@teamapp.com',
        username: 'emma_wilson',
        name: 'Emma Wilson',
        password: hashedPassword,
        avatar: null,
        status: 'away',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex@teamapp.com',
        username: 'alex_thompson',
        name: 'Alex Thompson',
        password: hashedPassword,
        avatar: null,
        status: 'offline',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  console.log('📢 Creating channels...');

  // Create channels
  const generalChannel = await prisma.channel.create({
    data: {
      name: 'general',
      description: 'General team discussions and announcements',
      type: 'public',
      createdById: users[0].id, // Sarah
    },
  });

  const devTeamChannel = await prisma.channel.create({
    data: {
      name: 'dev-team',
      description: 'Development team discussions and code reviews',
      type: 'public',
      createdById: users[1].id, // Mike
    },
  });

  const designChannel = await prisma.channel.create({
    data: {
      name: 'design',
      description: 'Design feedback and creative collaboration',
      type: 'public',
      createdById: users[2].id, // Emma
    },
  });

  const randomChannel = await prisma.channel.create({
    data: {
      name: 'random',
      description: 'Random chatter and team bonding',
      type: 'public',
      createdById: users[0].id, // Sarah
    },
  });

  const leadershipChannel = await prisma.channel.create({
    data: {
      name: 'leadership',
      description: 'Leadership team discussions',
      type: 'private',
      createdById: users[0].id, // Sarah
    },
  });

  console.log('✅ Created 5 channels');

  console.log('👥 Adding channel memberships...');

  // Add users to channels
  await prisma.channelMember.createMany({
    data: [
      // General channel - everyone
      { channelId: generalChannel.id, userId: users[0].id, role: 'admin' },
      { channelId: generalChannel.id, userId: users[1].id, role: 'member' },
      { channelId: generalChannel.id, userId: users[2].id, role: 'member' },
      { channelId: generalChannel.id, userId: users[3].id, role: 'member' },
      
      // Dev team channel
      { channelId: devTeamChannel.id, userId: users[0].id, role: 'member' },
      { channelId: devTeamChannel.id, userId: users[1].id, role: 'admin' },
      { channelId: devTeamChannel.id, userId: users[3].id, role: 'member' },
      
      // Design channel
      { channelId: designChannel.id, userId: users[0].id, role: 'member' },
      { channelId: designChannel.id, userId: users[1].id, role: 'member' },
      { channelId: designChannel.id, userId: users[2].id, role: 'admin' },
      
      // Random channel - everyone
      { channelId: randomChannel.id, userId: users[0].id, role: 'admin' },
      { channelId: randomChannel.id, userId: users[1].id, role: 'member' },
      { channelId: randomChannel.id, userId: users[2].id, role: 'member' },
      { channelId: randomChannel.id, userId: users[3].id, role: 'member' },
      
      // Leadership channel - restricted
      { channelId: leadershipChannel.id, userId: users[0].id, role: 'admin' },
    ],
  });

  console.log('✅ Added channel memberships');

  console.log('💬 Creating sample messages...');

  // Create sample messages
  const messages = await Promise.all([
    // General channel messages
    prisma.message.create({
      data: {
        content: 'Welcome to our team chat! 👋 This is where we coordinate our work and stay connected.',
        channelId: generalChannel.id,
        userId: users[0].id, // Sarah
        type: 'text',
      },
    }),
    prisma.message.create({
      data: {
        content: 'Thanks Sarah! Excited to be here and start collaborating with everyone. 🚀',
        channelId: generalChannel.id,
        userId: users[1].id, // Mike
        type: 'text',
      },
    }),
    prisma.message.create({
      data: {
        content: 'Let me know if you need any help getting started with our design system!',
        channelId: generalChannel.id,
        userId: users[2].id, // Emma
        type: 'text',
      },
    }),
    
    // Dev team messages
    prisma.message.create({
      data: {
        content: 'Just pushed the authentication system to the dev branch. Ready for review! 🔐',
        channelId: devTeamChannel.id,
        userId: users[1].id, // Mike
        type: 'text',
      },
    }),
    prisma.message.create({
      data: {
        content: 'Great work! I\'ll review it this afternoon and test the edge cases.',
        channelId: devTeamChannel.id,
        userId: users[3].id, // Alex
        type: 'text',
      },
    }),
    
    // Design channel messages
    prisma.message.create({
      data: {
        content: 'New color palette is live! Check out the updated design tokens. 🎨',
        channelId: designChannel.id,
        userId: users[2].id, // Emma
        type: 'text',
      },
    }),
    
    // Random channel messages
    prisma.message.create({
      data: {
        content: 'Coffee break in 10 minutes if anyone wants to join! ☕',
        channelId: randomChannel.id,
        userId: users[0].id, // Sarah
        type: 'text',
      },
    }),
  ]);

  console.log(`✅ Created ${messages.length} messages`);

  console.log('👍 Adding reactions...');

  // Add reactions to messages
  await prisma.reaction.createMany({
    data: [
      { messageId: messages[0].id, userId: users[1].id, emoji: '👍' },
      { messageId: messages[0].id, userId: users[2].id, emoji: '❤️' },
      { messageId: messages[0].id, userId: users[3].id, emoji: '👋' },
      
      { messageId: messages[1].id, userId: users[0].id, emoji: '🎉' },
      { messageId: messages[1].id, userId: users[2].id, emoji: '🚀' },
      
      { messageId: messages[3].id, userId: users[0].id, emoji: '👏' },
      { messageId: messages[3].id, userId: users[3].id, emoji: '🔥' },
      
      { messageId: messages[5].id, userId: users[0].id, emoji: '🎨' },
      { messageId: messages[5].id, userId: users[1].id, emoji: '👍' },
      
      { messageId: messages[6].id, userId: users[1].id, emoji: '☕' },
      { messageId: messages[6].id, userId: users[2].id, emoji: '👍' },
    ],
  });

  console.log('✅ Added reactions');

  console.log('📞 Creating direct message conversation...');

  // Create a direct message conversation
  const dmConversation = await prisma.directMessage.create({
    data: {
      user1Id: users[0].id, // Sarah
      user2Id: users[1].id, // Mike
    },
  });

  await prisma.message.create({
    data: {
      content: 'Hey Mike! Can we chat about the new project requirements when you have a moment?',
      dmId: dmConversation.id,
      userId: users[0].id, // Sarah
      type: 'text',
    },
  });

  await prisma.message.create({
    data: {
      content: 'Of course! I\'m free now if you want to start a huddle or continue here.',
      dmId: dmConversation.id,
      userId: users[1].id, // Mike
      type: 'text',
    },
  });

  console.log('✅ Created DM conversation');

  console.log('🎭 Adding custom emojis...');

  // Add some custom emojis
  await prisma.customEmoji.createMany({
    data: [
      {
        name: 'party-parrot',
        url: 'https://cultofthepartyparrot.com/parrots/hd/parrot.gif',
        createdBy: users[0].id,
      },
      {
        name: 'shipit',
        url: 'https://github.githubassets.com/images/icons/emoji/shipit.png',
        createdBy: users[1].id,
      },
      {
        name: 'team-win',
        url: 'https://github.githubassets.com/images/icons/emoji/trophy.png',
        createdBy: users[2].id,
      },
    ],
  });

  console.log('✅ Added custom emojis');

  // Create some threaded messages
  const threadMessage = await prisma.message.create({
    data: {
      content: 'This is a reply in the thread about authentication system.',
      channelId: devTeamChannel.id,
      userId: users[0].id, // Sarah
      threadId: messages[3].id, // Reply to Mike's auth message
      type: 'text',
    },
  });

  await prisma.message.create({
    data: {
      content: 'Perfect! The JWT implementation looks solid. Should we add refresh tokens too?',
      channelId: devTeamChannel.id,
      userId: users[3].id, // Alex
      threadId: messages[3].id, // Another reply to Mike's auth message
      type: 'text',
    },
  });

  console.log('✅ Added threaded messages');

  console.log('🎉 Database seed completed successfully!');
  
  // Print summary
  const userCount = await prisma.user.count();
  const channelCount = await prisma.channel.count();
  const messageCount = await prisma.message.count();
  const reactionCount = await prisma.reaction.count();
  
  console.log('\n📊 Seed Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Channels: ${channelCount}`);
  console.log(`   Messages: ${messageCount}`);
  console.log(`   Reactions: ${reactionCount}`);
  console.log('\n🔐 Test user credentials (all users):');
  console.log('   Email: sarah@teamapp.com, mike@teamapp.com, emma@teamapp.com, alex@teamapp.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
