import { VerifyEmailContent } from "@/components/auth/verify-email-content";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string }>;
}) {
  const { token, type } = await searchParams;
  return (
    <VerifyEmailContent
      emailChangeToken={type === "email-change" ? (token ?? "") : undefined}
    />
  );
}
