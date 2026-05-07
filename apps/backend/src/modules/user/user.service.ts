import { User } from './user.schema.js';
import { UnauthorizedException } from '@/shared/errors.js';

export async function getUserProfile(userId: string) {
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }

  const user = await User.findById(userId).exec();

  if (!user) {
    throw new UnauthorizedException('Bad credentials');
  }

  return {
    id: user.id,
    email: user.email
  };
}
