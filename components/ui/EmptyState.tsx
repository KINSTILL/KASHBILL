import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d="M3 7h18M3 12h12M3 17h8" />
          </svg>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-5 max-w-xs text-[13px] leading-relaxed text-slate-500">{description}</p>
      {action &&
        (typeof action === 'object' && 'label' in action ? (
          <Button onClick={action.onClick}>{action.label}</Button>
        ) : (
          action
        ))}
    </div>
  );
}
