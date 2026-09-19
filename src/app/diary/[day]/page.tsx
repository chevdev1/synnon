import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DiaryView from "@/components/diary/DiaryView";
import { isDay } from "@/lib/diary";

export async function generateMetadata(props: PageProps<"/diary/[day]">): Promise<Metadata> {
  const { day } = await props.params;
  return { title: `Diary ${day} — SYNNOD`, description: "One day in the diary of the SYNNOD mind." };
}

export default async function Page(props: PageProps<"/diary/[day]">) {
  const { day } = await props.params;
  if (!isDay(day)) notFound();
  return <DiaryView day={day} />;
}
