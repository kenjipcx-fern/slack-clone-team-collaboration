import prisma from '../lib/db';

export interface SearchFilters {
  query: string;
  userId: string;
  channelId?: string;
  fromUser?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  messageType?: string;
}

export interface SearchResults {
  messages: any[];
  channels: any[];
  users: any[];
  totalCount: number;
}

export class SearchService {
  async searchMessages(filters: SearchFilters, limit: number = 20, offset: number = 0) {
    try {
      const { query, userId, channelId, fromUser, dateFrom, dateTo, hasAttachments, messageType } = filters;

      // Get user's accessible channels
      const userChannels = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true }
      });
      const accessibleChannelIds = userChannels.map(cm => cm.channelId);

      // Build search conditions
      const searchConditions: any = {
        AND: [
          {
            OR: [
              // Messages in channels user has access to
              {
                channelId: {
                  in: accessibleChannelIds
                }
              },
              // Messages in DMs where user is participant
              {
                dm: {
                  OR: [
                    { user1Id: userId },
                    { user2Id: userId }
                  ]
                }
              }
            ]
          },
          // Text search
          {
            content: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      };

      // Apply additional filters
      if (channelId) {
        searchConditions.AND.push({ channelId });
      }

      if (fromUser) {
        searchConditions.AND.push({ 
          user: {
            OR: [
              { username: { contains: fromUser, mode: 'insensitive' } },
              { name: { contains: fromUser, mode: 'insensitive' } }
            ]
          }
        });
      }

      if (dateFrom || dateTo) {
        const dateFilter: any = {};
        if (dateFrom) dateFilter.gte = dateFrom;
        if (dateTo) dateFilter.lte = dateTo;
        searchConditions.AND.push({ createdAt: dateFilter });
      }

      if (hasAttachments) {
        searchConditions.AND.push({
          attachments: {
            some: {}
          }
        });
      }

      if (messageType) {
        searchConditions.AND.push({ type: messageType });
      }

      // Execute search
      const messages = await prisma.message.findMany({
        where: searchConditions,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          dm: {
            select: {
              id: true,
              user1: {
                select: { id: true, username: true, name: true }
              },
              user2: {
                select: { id: true, username: true, name: true }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: { id: true, username: true, name: true }
              }
            }
          },
          attachments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      // Get total count for pagination
      const totalCount = await prisma.message.count({
        where: searchConditions
      });

      return {
        messages,
        totalCount
      };
    } catch (error) {
      console.error('Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  async searchChannels(query: string, userId: string, limit: number = 10) {
    try {
      // Get user's accessible channels
      const userChannels = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true }
      });
      const accessibleChannelIds = userChannels.map(cm => cm.channelId);

      const channels = await prisma.channel.findMany({
        where: {
          AND: [
            {
              id: {
                in: accessibleChannelIds
              }
            },
            {
              OR: [
                {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  description: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          members: {
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
          },
          _count: {
            select: {
              messages: true,
              members: true
            }
          }
        },
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      return channels;
    } catch (error) {
      console.error('Error searching channels:', error);
      throw new Error('Failed to search channels');
    }
  }

  async searchUsers(query: string, userId: string, limit: number = 10) {
    try {
      // Get users from the same channels as the searching user
      const userChannels = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true }
      });
      const channelIds = userChannels.map(cm => cm.channelId);

      const channelMembers = await prisma.channelMember.findMany({
        where: {
          channelId: {
            in: channelIds
          },
          userId: {
            not: userId // Exclude the searching user
          }
        },
        select: { userId: true }
      });

      const accessibleUserIds = [...new Set(channelMembers.map(cm => cm.userId))];

      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                in: accessibleUserIds
              }
            },
            {
              OR: [
                {
                  username: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  name: {
                    contains: query,
                    mode: 'insensitive'
                  }
                },
                {
                  email: {
                    contains: query,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatar: true,
          status: true,
          lastSeen: true
        },
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  async globalSearch(query: string, userId: string, limit: number = 20): Promise<SearchResults> {
    try {
      const [messagesResult, channels, users] = await Promise.all([
        this.searchMessages({ query, userId }, Math.floor(limit * 0.6)),
        this.searchChannels(query, userId, Math.floor(limit * 0.2)),
        this.searchUsers(query, userId, Math.floor(limit * 0.2))
      ]);

      return {
        messages: messagesResult.messages,
        channels,
        users,
        totalCount: messagesResult.totalCount + channels.length + users.length
      };
    } catch (error) {
      console.error('Error performing global search:', error);
      throw new Error('Failed to perform search');
    }
  }

  async getRecentMessages(userId: string, limit: number = 20) {
    try {
      // Get user's accessible channels
      const userChannels = await prisma.channelMember.findMany({
        where: { userId },
        select: { channelId: true }
      });
      const accessibleChannelIds = userChannels.map(cm => cm.channelId);

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            // Messages in channels user has access to
            {
              channelId: {
                in: accessibleChannelIds
              }
            },
            // Messages in DMs where user is participant
            {
              dm: {
                OR: [
                  { user1Id: userId },
                  { user2Id: userId }
                ]
              }
            }
          ]
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
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          dm: {
            select: {
              id: true,
              user1: {
                select: { id: true, username: true, name: true }
              },
              user2: {
                select: { id: true, username: true, name: true }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: { id: true, username: true, name: true }
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

      return messages;
    } catch (error) {
      console.error('Error getting recent messages:', error);
      throw new Error('Failed to get recent messages');
    }
  }

  async searchWithHighlights(query: string, userId: string, limit: number = 20) {
    try {
      const result = await this.searchMessages({ query, userId }, limit);
      
      // Add search highlights to messages
      const messagesWithHighlights = result.messages.map(message => ({
        ...message,
        highlightedContent: this.highlightSearchTerms(message.content, query)
      }));

      return {
        ...result,
        messages: messagesWithHighlights
      };
    } catch (error) {
      console.error('Error searching with highlights:', error);
      throw new Error('Failed to search with highlights');
    }
  }

  private highlightSearchTerms(text: string, query: string): string {
    if (!query.trim()) return text;

    const terms = query.trim().split(/\s+/);
    let highlightedText = text;

    terms.forEach(term => {
      const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export const searchService = new SearchService();
