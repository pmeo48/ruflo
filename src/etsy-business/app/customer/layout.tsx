export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  // Customer-facing page — no admin sidebar
  return <>{children}</>
}
