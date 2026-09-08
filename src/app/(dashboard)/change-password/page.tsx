import { ChangePasswordForm } from '@/components/modules/user/change-password-form'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Change password',
  description: 'Update your account password.',
}

const ChangePasswordPage = () => {
  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Change password
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your account password.
        </p>
      </header>

      <div className="w-full max-w-3xl">
        <ChangePasswordForm />
      </div>
    </div>
  )
}

export default ChangePasswordPage
