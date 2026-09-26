import { PageTransition } from '@/components/layout/PageTransition';

// Templates re-mount on every navigation, replaying the page enter animation.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
