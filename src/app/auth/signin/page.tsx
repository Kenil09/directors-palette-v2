import { SignInForm } from '@/features/auth/components/SignInForm';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Sign In
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Enter your credentials to access your account
        </p>
        <SignInForm />
      </div>
    </div>
  );
}
