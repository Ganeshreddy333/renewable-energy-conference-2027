import { redirect } from "next/navigation";

type RegistrationSuccessPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegistrationSuccess({ searchParams }: RegistrationSuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  params.set("payment", "success");

  const registrationId = Array.isArray(resolvedSearchParams?.registration_id)
    ? resolvedSearchParams.registration_id[0]
    : resolvedSearchParams?.registration_id;
  const provider = Array.isArray(resolvedSearchParams?.provider)
    ? resolvedSearchParams.provider[0]
    : resolvedSearchParams?.provider;

  if (registrationId) {
    params.set("registration_id", registrationId);
  }

  if (provider) {
    params.set("provider", provider);
  }

  redirect(`/?${params.toString()}`);
}
