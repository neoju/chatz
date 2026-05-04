import { User } from './user.schema.js';

export async function getUserProfile(userId: string) {
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId).exec();

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email
  };
}
