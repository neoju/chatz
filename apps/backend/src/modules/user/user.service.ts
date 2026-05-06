import { User } from './user.schema.js';
import { NotFoundException, UnauthorizedException } from '@/shared/errors.js';

export async function getUserProfile(userId: string) {
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }

  const user = await User.findById(userId).exec();

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return {
    id: user.id,
    email: user.email
  };
}
