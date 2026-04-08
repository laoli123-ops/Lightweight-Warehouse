import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const orderNos: string[] = body.orderNos;

  if (!Array.isArray(orderNos) || orderNos.length === 0) {
    return NextResponse.json({ error: "请提供快递单号列表" }, { status: 400 });
  }

  const trimmed = [...new Set(orderNos.map((s) => s.trim()).filter(Boolean))];

  if (trimmed.length === 0) {
    return NextResponse.json({ error: "快递单号列表为空" }, { status: 400 });
  }

  const records = await prisma.inboundRecord.findMany({
    where: { inboundOrderNo: { in: trimmed } },
    include: { customer: true, warehouseCode: true },
    orderBy: { createdAt: "desc" },
  });

  const recordMap = new Map<string, typeof records>();
  for (const r of records) {
    const existing = recordMap.get(r.inboundOrderNo) || [];
    existing.push(r);
    recordMap.set(r.inboundOrderNo, existing);
  }

  const results = trimmed.map((orderNo) => {
    const matches = recordMap.get(orderNo);
    if (!matches || matches.length === 0) {
      return { orderNo, status: "not_found" as const, records: [] };
    }
    const hasUnshipped = matches.some((m) => m.outboundStatus === "unshipped");
    return {
      orderNo,
      status: hasUnshipped ? ("unshipped" as const) : ("shipped" as const),
      records: matches,
    };
  });

  return NextResponse.json({ results });
}
