import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextExamBanner } from '@/components/search/NextExamBanner';
import type { ExamResult } from '@/types';

const exam = (extra: Partial<ExamResult>): ExamResult => ({
  sheet: 'S', date: '2030-01-12', time: '08.30-11.30', room: 'CP.9127', subject: 'CP1', subject_name: 'Intro',
  section: '1', student_id: '1', seat: 'A1', note: '', ...extra,
});

afterEach(() => vi.useRealTimers());

describe('NextExamBanner', () => {
  it('shows the next exam with a countdown', () => {
    vi.useFakeTimers({ now: Date.UTC(2030, 0, 10, 1, 30) }); // 10 Jan 08:30 Bangkok
    render(<NextExamBanner exams={[exam({ subject_name: 'Later', date: '2030-01-20' }), exam({})]} />);
    expect(screen.getByRole('status')).toHaveTextContent('สอบถัดไป · อีก 2 วัน');
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('hides the seat while it is still pending and renders nothing without upcoming exams', () => {
    vi.useFakeTimers({ now: Date.UTC(2030, 0, 10, 1, 30) });
    const { rerender, container } = render(<NextExamBanner exams={[exam({ room: 'แจ้งก่อนวันสอบ', seat: 'แจ้งก่อนวันสอบ' })]} />);
    expect(screen.getByRole('status')).not.toHaveTextContent('ที่นั่ง');

    rerender(<NextExamBanner exams={[exam({ date: '2020-01-01' })]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
