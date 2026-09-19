import { listDiary } from "@/server/diary";
import { json } from "@/server/http";

export async function GET() {
  return json({ entries: await listDiary() });
}
