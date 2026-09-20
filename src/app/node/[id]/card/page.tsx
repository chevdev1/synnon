import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CardPage from "@/components/card/CardPage";

export const metadata: Metadata = { title: "Animated card | SYNNOD", robots: { index: false } };

// Bare full-width animated card (used for recording clips). ?record=1 records straight away.
export default async function Page(props: PageProps<"/node/[id]/card">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id < 1 || id > 128) notFound();
  const sp = await props.searchParams;
  return <CardPage id={id} autoRecord={sp.record === "1"} />;
}
