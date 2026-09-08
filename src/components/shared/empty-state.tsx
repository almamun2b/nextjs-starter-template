import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: React.ReactNode
  /** Use 'destructive' for error states, 'neutral' for empty/nothing-yet states. */
  tone?: 'neutral' | 'destructive'
  action?: React.ReactNode
  /** Renders the title as a page-level `h2` instead of an inline `p`. */
  headingTitle?: boolean
  /** Wraps the block in the `rounded-xl border bg-card` card treatment. Set to false when already inside one. */
  bordered?: boolean
  className?: string
}

/**
 * The icon-in-circle + title + description (+ action) formula shared by
 * every empty/error surface in the app (dashboard, settings, users list and
 * its error boundaries, profile). Consolidating it here keeps new empty
 * states from re-deriving it by hand.
 */
function EmptyState({
  icon: Icon,
  title,
  description,
  tone = 'neutral',
  action,
  headingTitle = false,
  bordered = true,
  className,
}: EmptyStateProps) {
  const TitleTag = headingTitle ? 'h2' : 'p'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-20 text-center',
        bordered && 'rounded-xl border bg-card',
        className
      )}
    >
      <div
        className={cn(
          'flex size-11 items-center justify-center rounded-full',
          tone === 'destructive' ? 'bg-destructive/10' : 'bg-muted'
        )}
      >
        <Icon
          className={cn(
            'size-5',
            tone === 'destructive'
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        />
      </div>
      <div className="space-y-1">
        <TitleTag
          className={
            headingTitle
              ? 'text-lg font-semibold'
              : 'font-medium text-foreground'
          }
        >
          {title}
        </TitleTag>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
