import { type NextRequest, NextResponse } from "next/server";
import { GeoAbbreviationDB, GeoAbbreviation } from "@/lib/database";

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
      const uniqueFoundAbbreviations = new Set<string>();

      for (const kw of keywords) {
        const part = await GeoAbbreviationDB.search(kw);
        if (part.length > 0) {
          part.forEach((item) => {
            if (!uniqueFoundAbbreviations.has(item.abbreviation)) {
              foundResults.push(item);
              uniqueFoundAbbreviations.add(item.abbreviation);
            }
          });
        } else {
          notFoundKeywords.push(kw);
        }
      }
      // 限制结果数量
      foundResults = foundResults.slice(0, 10);
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
      // 默认获取所有数据的前10条
      const results = await GeoAbbreviationDB.getAll();
      return NextResponse.json({ success: true, data: results.slice(0, 10) });
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
