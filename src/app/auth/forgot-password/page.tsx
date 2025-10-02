import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Forgot Password
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your email address and we&apos;ll send you a link to reset your password
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
