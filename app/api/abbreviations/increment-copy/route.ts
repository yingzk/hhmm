import { type NextRequest, NextResponse } from "next/server";
import { GeoAbbreviationDB } from "@/lib/database";

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing ID for increment-copy" }, { status: 400 });
    }

    await GeoAbbreviationDB.incrementCopiedCount(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Increment copy error:", error);
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
} 