import { NicheResults } from '@/components/niche/niche-results';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <NicheResults sessionId={sessionId} />;
}
