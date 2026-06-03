import { AppShellLayout } from "@/components/app-shell-layout";

export default function ShellRouteLayout({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>;
}
