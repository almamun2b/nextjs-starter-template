import { cn } from '@/lib/utils'
import { PASSWORD_RULES } from '@/validation/auth.validation'
import { CheckCircle2Icon, MinusCircleIcon } from 'lucide-react'

interface PasswordStrengthMeterProps {
  /** Current password value — pass `field.value` from the form. */
  value: string
  /** The password input's id; wire this component's id to its `aria-describedby`. */
  inputId: string
  className?: string
}

/**
 * Requirements checklist + a decorative summary bar, driven entirely by
 * `PASSWORD_RULES` so it can never drift from `passwordSchema`.
 *
 * The theme is fully achromatic (no green/amber tokens), so state is carried
 * by icon shape and foreground/muted contrast rather than colour.
 *
 * Renders unconditionally regardless of `value` so its height never changes —
 * a conditionally-mounted meter would itself be the layout shift it's meant
 * to avoid.
 */
export function PasswordStrengthMeter({
  value,
  inputId,
  className,
}: PasswordStrengthMeterProps) {
  const metCount = PASSWORD_RULES.filter((rule) => rule.test(value)).length

  return (
    <div
      id={`${inputId}-requirements`}
      className={cn('flex flex-col gap-2', className)}
    >
      <div aria-hidden="true" className="flex gap-1">
        {PASSWORD_RULES.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              rule.test(value) ? 'bg-primary' : 'bg-border'
            )}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value)
          const Icon = met ? CheckCircle2Icon : MinusCircleIcon
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-1.5',
                met ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {rule.label}
              <span className="sr-only">{met ? ' — met' : ' — not met'}</span>
            </li>
          )
        })}
      </ul>

      {/* Announced on change only (not per keystroke of unrelated rules),
          since this is the only element in the block whose text mutates. */}
      <p aria-live="polite" className="sr-only">
        {metCount} of {PASSWORD_RULES.length} password requirements met
      </p>
    </div>
  )
}
