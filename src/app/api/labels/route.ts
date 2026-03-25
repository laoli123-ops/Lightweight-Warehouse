import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "";
  const startSeq = parseInt(searchParams.get("startSeq") || "0");
  const endSeq = parseInt(searchParams.get("endSeq") || "0");

  if (!area || !startSeq || !endSeq) {
    return NextResponse.json({ error: "请选择区域和编号范围" }, { status: 400 });
  }

  const codes = await prisma.warehouseCode.findMany({
    where: {
      areaCode: area,
      seqNo: { gte: startSeq, lte: endSeq },
    },
    orderBy: { seqNo: "asc" },
  });

  return NextResponse.json(codes);
}
