// Placeholder shown while a client-rendered page (one that reads the URL query) hydrates.
export const PageLoading = () => (
  <div className="h-full w-full flex items-center justify-center" aria-busy="true" aria-label="กำลังโหลด">
    <svg className="animate-spin h-8 w-8 text-faculty dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);
