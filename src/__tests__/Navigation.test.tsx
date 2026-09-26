import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navbar } from '@/components/layout/Navbar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

vi.mock('@/lib/config', () => ({ CONFIG: { GITHUB_REPO_URL: 'https://example.test/repo' } }));
vi.mock('next/navigation', () => ({ usePathname: () => '/stats' }));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({ matches: false })),
});

describe('navigation', () => {
  it('marks the current route in desktop and mobile navigation', () => {
    render(
      <>
        <Navbar />
        <MobileTabBar />
      </>,
    );

    const statsLinks = screen.getAllByRole('link', { name: 'สถิติ' });
    expect(statsLinks).toHaveLength(2);
    statsLinks.forEach((link) => expect(link.className).toContain('text-faculty'));
  });
});
