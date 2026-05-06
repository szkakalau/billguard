import { LandingPage } from "@/components/marketing/LandingPage";

export default async function Home(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await props.searchParams) ?? {};

  const read1 = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <LandingPage
      variant={{
        src: read1(sp.src),
        sub: read1(sp.sub),
        ab: read1(sp.ab),
      }}
    />
  );
}
