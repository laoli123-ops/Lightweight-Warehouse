import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ids: number[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请提供记录 ID 列表" }, { status: 400 });
  }

  const records = await prisma.inboundRecord.findMany({
    where: { id: { in: ids }, outboundStatus: "unshipped" },
    include: { warehouseCode: true },
  });

  if (records.length === 0) {
    return NextResponse.json({ error: "没有可出库的记录" }, { status: 400 });
  }

  const shipped = await prisma.$transaction(async (tx) => {
    const { count } = await tx.inboundRecord.updateMany({
      where: { id: { in: records.map((r) => r.id) }, outboundStatus: "unshipped" },
      data: {
        outboundStatus: "shipped",
        outboundAt: new Date(),
      },
    });

    const codeIds = records.map((r) => r.warehouseCodeId);
    await tx.warehouseCode.updateMany({
      where: { id: { in: codeIds } },
      data: { codeStatus: "shipped" },
    });

    return count;
  });

  return NextResponse.json({ shipped, requested: ids.length });
}
