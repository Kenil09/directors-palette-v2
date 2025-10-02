import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Reset Password
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your new password below
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
