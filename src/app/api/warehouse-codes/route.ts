import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");

  const where: Record<string, unknown> = {};
  if (area) where.areaCode = area;
  if (status) where.codeStatus = status;

  const [codes, total] = await Promise.all([
    prisma.warehouseCode.findMany({
      where,
      orderBy: [{ areaCode: "asc" }, { seqNo: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.warehouseCode.count({ where }),
  ]);

  return NextResponse.json({ codes, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { areaCode, startSeq, endSeq } = body;

  if (!areaCode || !startSeq || !endSeq) {
    return NextResponse.json({ error: "区域代码、起始序号、结束序号为必填项" }, { status: 400 });
  }

  if (startSeq > endSeq) {
    return NextResponse.json({ error: "起始序号不能大于结束序号" }, { status: 400 });
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (let seq = startSeq; seq <= endSeq; seq++) {
    const warehouseCode = `${areaCode}${seq}`;
    const existing = await prisma.warehouseCode.findUnique({ where: { warehouseCode } });

    if (existing) {
      skipped.push(warehouseCode);
      continue;
    }

    await prisma.warehouseCode.create({
      data: { areaCode, seqNo: seq, warehouseCode, codeStatus: "unused" },
    });
    created.push(warehouseCode);
  }

  return NextResponse.json({ created: created.length, skipped: skipped.length, skippedCodes: skipped });
}
