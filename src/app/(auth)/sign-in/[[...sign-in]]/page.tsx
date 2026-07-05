import { SignIn } from '@clerk/nextjs';
import { DeveloperBadge } from '@/components/layout/developer-badge';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <SignIn forceRedirectUrl="/overview" signUpForceRedirectUrl="/overview" />
      <DeveloperBadge />
    </div>
  );
}
