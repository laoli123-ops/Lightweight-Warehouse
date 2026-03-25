import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = parseInt(id);

  const record = await prisma.inboundRecord.findUnique({
    where: { id: recordId },
    include: { warehouseCode: true },
  });

  if (!record) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  if (record.outboundStatus === "shipped") {
    return NextResponse.json({ error: "已出库" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const rec = await tx.inboundRecord.update({
      where: { id: recordId },
      data: { outboundStatus: "shipped" },
      include: { customer: true, warehouseCode: true },
    });

    await tx.warehouseCode.update({
      where: { id: record.warehouseCodeId },
      data: { codeStatus: "shipped" },
    });

    return rec;
  });

  return NextResponse.json(updated);
}
