'use client'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from 'react-hook-form'

interface FormControllerProps<T extends FieldValues> {
  name: Path<T>
  control: Control<T>
  label: React.ReactNode
  description?: string
  /**
   * 'responsive' puts the label (and description/labelAction) beside the
   * field on wider screens — the layout the public auth forms use.
   * 'default' stacks label above field — the layout dashboard forms use.
   */
  orientation?: 'default' | 'responsive'
  /** Rendered next to the label instead of the description; 'responsive' only (e.g. login's "Forgot your password?" link). */
  labelAction?: React.ReactNode
  children: (
    field: ControllerRenderProps<T, Path<T>>,
    fieldState: ControllerFieldState
  ) => React.ReactNode
}

const FormController = <T extends FieldValues>({
  name,
  control,
  label,
  description,
  orientation = 'default',
  labelAction,
  children,
}: FormControllerProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const labelNode = <FieldLabel htmlFor={name}>{label}</FieldLabel>

        if (orientation === 'responsive') {
          return (
            <Field data-invalid={fieldState.invalid} orientation="responsive">
              <FieldContent
                className={
                  labelAction
                    ? 'flex flex-row items-center justify-between'
                    : 'flex flex-col gap-1'
                }
              >
                {labelNode}
                {labelAction ??
                  (description && (
                    <FieldDescription>{description}</FieldDescription>
                  ))}
              </FieldContent>
              {children(field, fieldState)}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )
        }

        return (
          <Field data-invalid={fieldState.invalid}>
            {labelNode}
            {children(field, fieldState)}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )
      }}
    />
  )
}

export { FormController }
