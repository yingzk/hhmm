import { type NextRequest, NextResponse } from "next/server";
import { GeoAbbreviationDB, GeoAbbreviation, supabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type"); // 获取 type 参数

  try {
    if (query) {
      // 支持多词查询，使用逗号、分号或换行符分隔
      const keywords = query
        .split(/[\r\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      let foundResults: GeoAbbreviation[] = [];
      const notFoundKeywords: string[] = [];

      const allSearchResults = await GeoAbbreviationDB.search(keywords);

      // Determine notFoundKeywords based on the original search input
      for (const kw of keywords) {
        const foundInResults = allSearchResults.some(
          (result) =>
            result.abbreviation.toLowerCase().includes(kw.toLowerCase()) ||
            result.full_name.toLowerCase().includes(kw.toLowerCase())
        );
        if (!foundInResults) {
          notFoundKeywords.push(kw);
        }
      }

      // Deduplicate the foundResults by _id to avoid sending duplicate GeoAbbreviation objects
      const uniqueById = new Map<string, GeoAbbreviation>();
      allSearchResults.forEach(item => {
        uniqueById.set(item._id, item);
      });
      foundResults = Array.from(uniqueById.values());

      return NextResponse.json({
        success: true,
        foundResults,
        notFoundKeywords,
      });
    } else if (type === "hot") {
      // 获取复制量最高的10条 (热词)
      const results = await GeoAbbreviationDB.getMostCopied(10);
      return NextResponse.json({ success: true, data: results });
    } else {
      // Handle pagination for admin panel
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
      const adminSearchQuery = searchParams.get('adminSearch') || undefined;

      const { data, total } = await GeoAbbreviationDB.getPaginated(page, pageSize, adminSearchQuery);
      return NextResponse.json({ success: true, data, total });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { abbreviation, fullName } = await request.json();

    if (!abbreviation || !fullName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await GeoAbbreviationDB.add(abbreviation, fullName);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, abbreviation, fullName } = await request.json();

    // Original update logic
    if (!id || !abbreviation || !fullName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updated = await GeoAbbreviationDB.update(id, abbreviation, fullName);
    if (updated) {
      return NextResponse.json({ success: true, data: updated });
    } else {
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Backend PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log("Backend DELETE received ID:", id);

    if (!id) {
      console.error("Backend DELETE: Missing ID");
      return NextResponse.json(
        { success: false, error: "Missing ID" },
        { status: 400 }
      );
    }

    const success = await GeoAbbreviationDB.delete(id);
    console.log("Backend DELETE operation success:", success);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Backend DELETE: Record not found for ID", id);
      return NextResponse.json(
        { success: false, error: "Record not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Backend DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Database error" },
      { status: 500 }
    );
  }
}
