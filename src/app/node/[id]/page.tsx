import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NodePage from "@/components/node/NodePage";

export async function generateMetadata(props: PageProps<"/node/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Node ${id} | SYNNOD`, description: "One voice of the SYNNOD mind: who holds this cell and how its words shaped the shared memory." };
}

export default async function Page(props: PageProps<"/node/[id]">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id) || id < 1 || id > 128) notFound();
  return <NodePage id={id} />;
}
