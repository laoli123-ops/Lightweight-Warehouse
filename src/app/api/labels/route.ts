import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "";
  const count = parseInt(searchParams.get("count") || "0");

  if (!area || count <= 0) {
    return NextResponse.json({ error: "请选择区域和数量" }, { status: 400 });
  }

  const codes = await prisma.warehouseCode.findMany({
    where: {
      areaCode: area,
      codeStatus: "unused",
    },
    orderBy: { seqNo: "asc" },
    take: count,
  });

  return NextResponse.json(codes);
}
