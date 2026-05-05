import { Heading, Hr, Link, Section, Text } from '@react-email/components';

import { Button } from '../components/button.js';
import { Layout } from '../components/layout.js';

export interface PasswordResetEmailProps {
  username: string;
  resetLink: string;
  expiresInMinutes: number;
}

export function PasswordResetEmail({
  username,
  resetLink,
  expiresInMinutes
}: PasswordResetEmailProps) {
  return (
    <Layout>
      <Heading className="mb-6 mt-0 text-2xl font-semibold leading-8 text-slate-950">
        Reset your password
      </Heading>

      <Text className="mb-4 text-base leading-7 text-slate-700">Hi {username},</Text>

      <Text className="mb-6 text-base leading-7 text-slate-700">
        We received a request to reset the password for your chatz account. Use the button below to
        choose a new password.
      </Text>

      <Section className="mb-6 text-center">
        <Button href={resetLink}>Reset password</Button>
      </Section>

      <Text className="mb-6 text-base leading-7 text-slate-700">
        This link expires in {expiresInMinutes} minutes. If the button does not work, copy and paste
        this link into your browser:
      </Text>

      <Text className="mb-8 break-all text-sm leading-6 text-slate-600">
        <Link href={resetLink} className="text-slate-950 underline">
          {resetLink}
        </Link>
      </Text>

      <Hr className="my-8 border-slate-200" />

      <Text className="m-0 text-sm leading-6 text-slate-500">
        If you did not request this, ignore this email. Your password will stay the same.
      </Text>
    </Layout>
  );
}
