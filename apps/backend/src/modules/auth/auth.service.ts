import { FastifyInstance } from 'fastify';
import { HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { User, type IUser } from '@/shared/schemas/user.schema.js';
import { JWTPayload } from '@/shared/types.js';
import { RegisterRequest } from '@chatz/dto';
import { UnauthorizedException, ConflictException } from '@/shared/errors.js';

export default (app: FastifyInstance) => ({
  generateToken(user: HydratedDocument<IUser>): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email
    };

    return jwt.sign(payload, app.config.JWT_SECRET, { expiresIn: '7d' });
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateToken(user);
  },

  async register(params: RegisterRequest) {
    const { email, password, nickname, avatarUrl } = params;
    const user = await User.findOne({ email });

    if (user) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      nickname,
      avatarUrl
    });
    await newUser.save();

    return this.generateToken(newUser);
  }
});
