import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 50 characters',
    'any.required': 'Name is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  username: Joi.string().alphanum().min(3).max(30),
  avatar: Joi.string().uri(),
  status: Joi.string().valid('online', 'away', 'offline'),
}).min(1);

export const channelSchema = Joi.object({
  name: Joi.string().min(1).max(80).required().pattern(/^[a-z0-9_-]+$/).messages({
    'string.pattern.base': 'Channel name must contain only lowercase letters, numbers, hyphens, and underscores',
    'string.min': 'Channel name must be at least 1 character long',
    'string.max': 'Channel name must not exceed 80 characters',
    'any.required': 'Channel name is required',
  }),
  description: Joi.string().max(250).allow(''),
  type: Joi.string().valid('public', 'private').default('public'),
});

export const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message content cannot be empty',
    'string.max': 'Message content must not exceed 2000 characters',
    'any.required': 'Message content is required',
  }),
  channelId: Joi.string().optional(),
  dmUserId: Joi.string().optional(),
  threadId: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).max(10).optional(),
}).xor('channelId', 'dmUserId'); // Either channelId OR dmUserId must be present, but not both


export const createChannelSchema = Joi.object({
  name: Joi.string().min(1).max(80).required().pattern(/^[a-z0-9_-]+$/).messages({
    'string.pattern.base': 'Channel name must contain only lowercase letters, numbers, hyphens, and underscores',
    'string.min': 'Channel name must be at least 1 character long',
    'string.max': 'Channel name must not exceed 80 characters',
    'any.required': 'Channel name is required',
  }),
  description: Joi.string().max(250).allow(''),
  type: Joi.string().valid('PUBLIC', 'PRIVATE').default('PUBLIC'),
});

export const updateChannelSchema = Joi.object({
  name: Joi.string().min(1).max(80).pattern(/^[a-z0-9_-]+$/),
  description: Joi.string().max(250).allow(''),
  type: Joi.string().valid('PUBLIC', 'PRIVATE'),
}).min(1);
