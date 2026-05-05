import { Body, Container, Head, Html, Section, Text } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Tailwind>
        <Body className="m-0 bg-slate-100 px-4 py-8 font-sans text-slate-900">
          <Container className="mx-auto max-w-xl rounded-2xl bg-white px-8 py-10 shadow-sm">
            <Section className="mb-8">
              <Text className="m-0 text-2xl font-bold tracking-tight text-slate-950">chatz</Text>
            </Section>
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
