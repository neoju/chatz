import { Link } from '@react-email/components';
import type { ReactNode } from 'react';

interface ButtonProps {
  href: string;
  children: ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <Link
      href={href}
      className="inline-block rounded-lg bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white no-underline"
    >
      {children}
    </Link>
  );
}
