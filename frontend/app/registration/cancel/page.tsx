import { redirect } from "next/navigation";

type RegistrationCancelPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegistrationCancel({ searchParams }: RegistrationCancelPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  params.set("payment", "cancel");

  const registrationId = Array.isArray(resolvedSearchParams?.registration_id)
    ? resolvedSearchParams.registration_id[0]
    : resolvedSearchParams?.registration_id;

  if (registrationId) {
    params.set("registration_id", registrationId);
  }

  redirect(`/?${params.toString()}`);
}
