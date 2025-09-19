import prisma from '../lib/db';

export interface CreateMessageData {
  content: string;
  userId: string;
  channelId?: string;
  dmUserId?: string;
  threadId?: string;
  type?: string;
}

export class MessageService {
  async createMessage(data: CreateMessageData) {
    try {
      let dmId: string | undefined;

      // Handle direct message
      if (data.dmUserId) {
        // Find or create DM conversation
        const existingDm = await prisma.directMessage.findFirst({
          where: {
            OR: [
              { user1Id: data.userId, user2Id: data.dmUserId },
              { user1Id: data.dmUserId, user2Id: data.userId }
            ]
          }
        });

        if (existingDm) {
          dmId = existingDm.id;
        } else {
          const newDm = await prisma.directMessage.create({
            data: {
              user1Id: data.userId,
              user2Id: data.dmUserId
            }
          });
          dmId = newDm.id;
        }
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          userId: data.userId,
          channelId: data.channelId,
          dmId: dmId,
          threadId: data.threadId,
          type: data.type || 'text'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          },
          attachments: true
        }
      });

      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  async canUserAccessChannel(userId: string, channelId: string): Promise<boolean> {
    try {
      const membership = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId
          }
        }
      });

      return !!membership;
    } catch (error) {
      console.error('Error checking channel access:', error);
      return false;
    }
  }

  async getChannelMessages(channelId: string, userId: string, limit: number = 50, cursor?: string) {
    try {
      // Verify user has access
      const hasAccess = await this.canUserAccessChannel(userId, channelId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const messages = await prisma.message.findMany({
        where: {
          channelId,
          ...(cursor && {
            id: {
              lt: cursor
            }
          })
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          },
          attachments: true,
          threadReplies: {
            take: 3,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return messages.reverse();
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async getDMMessages(userId: string, otherUserId: string, limit: number = 50, cursor?: string) {
    try {
      // Find DM conversation
      const dmConversation = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { user1Id: userId, user2Id: otherUserId },
            { user1Id: otherUserId, user2Id: userId }
          ]
        }
      });

      if (!dmConversation) {
        return [];
      }

      const messages = await prisma.message.findMany({
        where: {
          dmId: dmConversation.id,
          ...(cursor && {
            id: {
              lt: cursor
            }
          })
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          },
          attachments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return messages.reverse();
    } catch (error) {
      console.error('Error fetching DM messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      const reaction = await prisma.reaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji
          }
        },
        update: {},
        create: {
          messageId,
          userId,
          emoji
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      });

      return reaction;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      await prisma.reaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji
          }
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw new Error('Failed to remove reaction');
    }
  }

  async updateMessage(messageId: string, userId: string, content: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message || message.userId !== userId) {
        throw new Error('Message not found or access denied');
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          edited: true
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true
                }
              }
            }
          },
          attachments: true
        }
      });

      return updatedMessage;
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message || message.userId !== userId) {
        throw new Error('Message not found or access denied');
      }

      await prisma.message.delete({
        where: { id: messageId }
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }
}

export const messageService = new MessageService();
