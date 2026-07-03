'use client'

import {
  Field,
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
  label: string
  description?: string
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
  children,
}: FormControllerProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {children(field, fieldState)}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.error && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

export { FormController }
