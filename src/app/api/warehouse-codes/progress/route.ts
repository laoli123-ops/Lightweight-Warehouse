import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const area = new URL(request.url).searchParams.get("area") || "";

  if (!area) {
    return NextResponse.json({ error: "area is required" }, { status: 400 });
  }

  const [lastUsed, firstUnused, unusedCount, maxSeq] = await Promise.all([
    prisma.warehouseCode.findFirst({
      where: { areaCode: area, codeStatus: { in: ["used", "shipped"] } },
      orderBy: { seqNo: "desc" },
      select: { seqNo: true },
    }),
    prisma.warehouseCode.findFirst({
      where: { areaCode: area, codeStatus: "unused" },
      orderBy: { seqNo: "asc" },
      select: { seqNo: true },
    }),
    prisma.warehouseCode.count({
      where: { areaCode: area, codeStatus: "unused" },
    }),
    prisma.warehouseCode.findFirst({
      where: { areaCode: area },
      orderBy: { seqNo: "desc" },
      select: { seqNo: true },
    }),
  ]);

  const maxSeqAll = maxSeq?.seqNo ?? null;
  const nextUnusedSeq = firstUnused?.seqNo ?? null;

  let suggestedStartSeq: number;
  if (nextUnusedSeq !== null) {
    suggestedStartSeq = nextUnusedSeq;
  } else if (maxSeqAll !== null) {
    suggestedStartSeq = maxSeqAll + 1;
  } else {
    suggestedStartSeq = 101;
  }

  return NextResponse.json({
    area,
    lastUsedSeq: lastUsed?.seqNo ?? null,
    nextUnusedSeq,
    unusedCount,
    maxSeqAll,
    suggestedStartSeq,
  });
}
