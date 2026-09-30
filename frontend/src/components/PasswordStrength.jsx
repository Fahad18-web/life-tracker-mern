import { getPasswordStrength, MIN_PASSWORD_LENGTH } from '../utils/passwordStrength';

export default function PasswordStrength({ password }) {
  const { score, label, color, checks } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              background:
                i < score ? color : 'var(--color-border)'
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium" style={{ color }}>
          {label}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Min {MIN_PASSWORD_LENGTH} chars · letter + number
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-1 text-[11px] text-[var(--color-text-muted)]">
        <li className={checks.length ? 'text-[var(--color-success)]' : ''}>
          {checks.length ? '✓' : '○'} {MIN_PASSWORD_LENGTH}+ characters
        </li>
        <li className={checks.letter ? 'text-[var(--color-success)]' : ''}>
          {checks.letter ? '✓' : '○'} Letter
        </li>
        <li className={checks.number ? 'text-[var(--color-success)]' : ''}>
          {checks.number ? '✓' : '○'} Number
        </li>
        <li className={checks.special ? 'text-[var(--color-success)]' : ''}>
          {checks.special ? '✓' : '○'} Symbol (optional)
        </li>
      </ul>
    </div>
  );
}