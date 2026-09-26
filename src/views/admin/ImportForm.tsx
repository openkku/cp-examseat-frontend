'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Upload } from '@/components/icons';
import { adminApi, type RoundSummary } from '@/lib/adminApi';

interface ImportFormProps {
  token: string;
  busy: boolean;
  rounds: RoundSummary[];
  maxUploadMB?: number;
  run: (action: () => Promise<unknown>, success: string) => Promise<void>;
}

const ID_PATTERN = '[A-Za-z0-9_\\-]{1,64}';

/** Uploads a seating file (.xlsx, .xls, .pdf, .json) into a round. */
export function ImportForm({ token, busy, rounds, maxUploadMB, run }: ImportFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [custom, setCustom] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const round = String(form.get('round') ?? '');
    const existing = rounds.find((r) => r.id === round);
    const customId = String(form.get('custom_id') ?? '');
    const replaces = customId ? `ชุดข้อมูล ${customId} ของรอบ ${round}` : `ตารางสอบในตารางของรอบ ${round}`;
    if (existing && !window.confirm(`การนำเข้าจะแทนที่${replaces}ที่มีอยู่ ต้องการดำเนินการต่อหรือไม่?`)) return;

    run(async () => {
      const result = await adminApi.importFile(token, form);
      formRef.current?.reset();
      setCustom(false);
      return result;
    }, `นำเข้าไฟล์เข้ารอบ ${round} เรียบร้อย`);
  };

  return (
    <Card className="p-5">
      <h2 className="text-base font-black text-slate-800 dark:text-slate-100">นำเข้าตารางสอบ</h2>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 mb-4">
        รองรับ .xlsx, .xls, .pdf และ .json{maxUploadMB ? ` ขนาดไม่เกิน ${maxUploadMB} MB` : ''} ·
        นำเข้าซ้ำจะแทนที่ข้อมูลเดิมของรอบนั้น (หรือเฉพาะชุดข้อมูลเมื่อระบุ Custom ID)
      </p>

      <form ref={formRef} onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="sm:col-span-2 flex flex-col text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          ไฟล์
          <input
            name="file"
            type="file"
            required
            accept=".xlsx,.xls,.pdf,.json"
            className="mt-2 block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-faculty-light file:px-3 file:py-2 file:font-bold file:text-faculty dark:file:bg-blue-950 dark:file:text-blue-200 cursor-pointer"
          />
        </label>

        <Input
          name="round"
          label="รหัสรอบสอบ (Round ID)"
          placeholder="mid_1_2569"
          required
          pattern={ID_PATTERN}
          list="admin-round-ids"
          title="ตัวอักษร ตัวเลข _ และ - เท่านั้น เช่น mid_1_2569"
        />
        <datalist id="admin-round-ids">
          {rounds.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </datalist>

        <Input name="display" label="ชื่อที่แสดง (ไม่บังคับ)" placeholder="กลางภาค 1/2569" maxLength={200} />

        <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} className="w-4 h-4" />
          สอบนอกตาราง / ชุดข้อมูลเพิ่มเติม (Lab, สอบย่อย ฯลฯ)
        </label>

        {custom && (
          <>
            <Input name="custom_id" label="Custom ID" placeholder="FINAL_2_OOP_LAB_2026" required pattern={ID_PATTERN} />
            <Input name="labels" label="ป้ายกำกับ (คั่นด้วย ,)" placeholder="LAB,Lab" />
            <Input name="room_layout" label="ผังห้องเฉพาะ (ไม่บังคับ)" placeholder="CP9421_LAB" pattern={ID_PATTERN} />
          </>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} icon={<Upload className="w-4 h-4" />}>
            {busy ? 'กำลังดำเนินการ...' : 'นำเข้า'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
