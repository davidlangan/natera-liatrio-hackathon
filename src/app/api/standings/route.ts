import { NextResponse } from "next/server";
import { computeTopThreeWithOthers } from "@/lib/standings";

export const dynamic = "force-dynamic";

export async function GET() {
  const { top, otherCount } = await computeTopThreeWithOthers();
  return NextResponse.json(
    { top, otherCount },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
