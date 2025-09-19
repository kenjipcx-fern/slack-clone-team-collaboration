import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/db';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { email, username, name, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email is already registered' 
          : 'Username is already taken',
        code: existingUser.email === email ? 'EMAIL_EXISTS' : 'USERNAME_EXISTS',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        status: 'online',
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        createdAt: true,
      },
    });

    // Auto-join the user to the general channel if it exists
    const generalChannel = await prisma.channel.findFirst({
      where: { name: 'general' },
    });

    if (generalChannel) {
      await prisma.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId: user.id,
          role: 'member',
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR',
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Update user status and last seen
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'online',
        lastSeen: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        lastSeen: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: updatedUser,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR',
    });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: {
            sentMessages: true,
            channelMembers: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      code: 'PROFILE_ERROR',
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const updates = req.body;

    // If username is being updated, check if it's available
    if (updates.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updates.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken',
          code: 'USERNAME_EXISTS',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        status: true,
        lastSeen: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      code: 'UPDATE_PROFILE_ERROR',
    });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;

    // Update user status to offline
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'offline',
        lastSeen: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      code: 'LOGOUT_ERROR',
    });
  }
}
