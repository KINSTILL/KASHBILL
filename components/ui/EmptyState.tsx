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
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-xs text-sm text-slate-600">{description}</p>
      {action &&
        (typeof action === 'object' && 'label' in action ? (
          <Button onClick={action.onClick}>{action.label}</Button>
        ) : (
          action
        ))}
    </div>
  );
}
