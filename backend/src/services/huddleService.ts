import prisma from '../lib/db';

export interface CreateHuddleData {
  creatorId: string;
  channelId?: string;
  name?: string;
}

export interface UpdateParticipantData {
  audioMuted?: boolean;
  videoOn?: boolean;
}

export class HuddleService {
  async createHuddle(data: CreateHuddleData) {
    try {
      const huddle = await prisma.huddle.create({
        data: {
          name: data.name,
          channelId: data.channelId,
          creatorId: data.creatorId,
          status: 'active'
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          participants: {
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
        }
      });

      // Add creator as the first participant
      await this.joinHuddle(huddle.id, data.creatorId);

      return huddle;
    } catch (error) {
      console.error('Error creating huddle:', error);
      throw new Error('Failed to create huddle');
    }
  }

  async joinHuddle(huddleId: string, userId: string) {
    try {
      // Check if user is already in the huddle
      const existingParticipant = await prisma.huddleParticipant.findUnique({
        where: {
          huddleId_userId: {
            huddleId,
            userId
          }
        }
      });

      if (existingParticipant && !existingParticipant.leftAt) {
        return existingParticipant;
      }

      // If participant left before, update their record
      if (existingParticipant && existingParticipant.leftAt) {
        const participant = await prisma.huddleParticipant.update({
          where: {
            id: existingParticipant.id
          },
          data: {
            leftAt: null,
            joinedAt: new Date(),
            audioMuted: false,
            videoOn: false
          },
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
        });

        return participant;
      }

      // Create new participant
      const participant = await prisma.huddleParticipant.create({
        data: {
          huddleId,
          userId,
          audioMuted: false,
          videoOn: false
        },
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
      });

      return participant;
    } catch (error) {
      console.error('Error joining huddle:', error);
      throw new Error('Failed to join huddle');
    }
  }

  async leaveHuddle(huddleId: string, userId: string) {
    try {
      await prisma.huddleParticipant.updateMany({
        where: {
          huddleId,
          userId,
          leftAt: null
        },
        data: {
          leftAt: new Date()
        }
      });

      // Check if huddle is empty and end it
      const activeParticipants = await prisma.huddleParticipant.count({
        where: {
          huddleId,
          leftAt: null
        }
      });

      if (activeParticipants === 0) {
        await prisma.huddle.update({
          where: { id: huddleId },
          data: {
            status: 'ended',
            endedAt: new Date()
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error leaving huddle:', error);
      throw new Error('Failed to leave huddle');
    }
  }

  async endHuddle(huddleId: string, userId: string) {
    try {
      // Verify user is the creator
      const huddle = await prisma.huddle.findUnique({
        where: { id: huddleId }
      });

      if (!huddle || huddle.creatorId !== userId) {
        throw new Error('Only the huddle creator can end the huddle');
      }

      // End the huddle
      await prisma.huddle.update({
        where: { id: huddleId },
        data: {
          status: 'ended',
          endedAt: new Date()
        }
      });

      // Mark all participants as left
      await prisma.huddleParticipant.updateMany({
        where: {
          huddleId,
          leftAt: null
        },
        data: {
          leftAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error ending huddle:', error);
      throw new Error('Failed to end huddle');
    }
  }

  async getHuddleParticipants(huddleId: string) {
    try {
      const participants = await prisma.huddleParticipant.findMany({
        where: {
          huddleId,
          leftAt: null
        },
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
      });

      return participants;
    } catch (error) {
      console.error('Error getting huddle participants:', error);
      throw new Error('Failed to get huddle participants');
    }
  }

  async updateParticipant(huddleId: string, userId: string, updates: UpdateParticipantData) {
    try {
      const participant = await prisma.huddleParticipant.findFirst({
        where: {
          huddleId,
          userId,
          leftAt: null
        }
      });

      if (!participant) {
        throw new Error('Participant not found in huddle');
      }

      const updatedParticipant = await prisma.huddleParticipant.update({
        where: { id: participant.id },
        data: updates,
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
      });

      return updatedParticipant;
    } catch (error) {
      console.error('Error updating participant:', error);
      throw new Error('Failed to update participant');
    }
  }

  async getActiveHuddles() {
    try {
      const huddles = await prisma.huddle.findMany({
        where: {
          status: 'active'
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          participants: {
            where: {
              leftAt: null
            },
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
        }
      });

      return huddles;
    } catch (error) {
      console.error('Error getting active huddles:', error);
      throw new Error('Failed to get active huddles');
    }
  }

  async getHuddleById(huddleId: string) {
    try {
      const huddle = await prisma.huddle.findUnique({
        where: { id: huddleId },
        include: {
          channel: {
            select: {
              id: true,
              name: true
            }
          },
          participants: {
            where: {
              leftAt: null
            },
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
        }
      });

      return huddle;
    } catch (error) {
      console.error('Error getting huddle by ID:', error);
      throw new Error('Failed to get huddle');
    }
  }
}

export const huddleService = new HuddleService();
