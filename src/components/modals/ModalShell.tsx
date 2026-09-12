import type { ReactNode } from "react";

type ModalShellProps = {
  children: ReactNode;
  widthClass?: string;
};

export function ModalShell({ children, widthClass = "max-w-lg" }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
      <div className={`card w-full ${widthClass} max-h-[90vh] overflow-y-auto p-6`}>{children}</div>
    </div>
  );
}
