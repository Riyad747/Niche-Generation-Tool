import { SignUp } from '@clerk/nextjs';
import { DeveloperBadge } from '@/components/layout/developer-badge';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <SignUp forceRedirectUrl="/overview" signInForceRedirectUrl="/overview" />
      <DeveloperBadge />
    </div>
  );
}
