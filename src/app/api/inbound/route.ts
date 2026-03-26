import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where: Record<string, unknown> = {};

  if (status) {
    where.outboundStatus = status;
  }

  if (q) {
    where.OR = [
      { inboundOrderNo: { contains: q } },
      { inboundName: { contains: q } },
      { inboundPhone: { contains: q } },
      { warehouseCode: { warehouseCode: { contains: q } } },
      { customer: { searchText: { contains: q } } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.inboundRecord.findMany({
      where,
      include: {
        customer: true,
        warehouseCode: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.inboundRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { customerId, inboundOrderNo, warehouseCodeId, forceCreate } = body;

  if (!customerId || !inboundOrderNo || !warehouseCodeId) {
    return NextResponse.json(
      { error: "客户、快递单号、仓库码为必填项" },
      { status: 400 }
    );
  }

  // Customer validation — safe outside transaction (immutable reference data)
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  // Duplicate order number check — safe outside transaction (read-only gate)
  const existingOrder = await prisma.inboundRecord.findFirst({
    where: { inboundOrderNo },
  });
  if (existingOrder && !forceCreate) {
    return NextResponse.json(
      { error: "快递单号已存在", duplicate: true },
      { status: 409 }
    );
  }

  try {
    const record = await prisma.$transaction(async (tx) => {
      // Step A: Atomic warehouse code reservation.
      // updateMany with a WHERE condition on codeStatus is the key —
      // only ONE concurrent request can flip "unused" → "used".
      // The loser gets count === 0.
      const reserved = await tx.warehouseCode.updateMany({
        where: { id: warehouseCodeId, codeStatus: "unused" },
        data: { codeStatus: "used" },
      });

      if (reserved.count === 0) {
        throw new Error("WAREHOUSE_CODE_UNAVAILABLE");
      }

      // Serial number generation inside transaction so SQLite's
      // write-lock serializes concurrent callers.
      const lastRecord = await tx.inboundRecord.findFirst({
        orderBy: { serialNo: "desc" },
      });
      const serialNo = (lastRecord?.serialNo || 0) + 1;

      // Step B: Create inbound record (same transaction — auto-rollback
      // reverts the code reservation if this fails).
      const rec = await tx.inboundRecord.create({
        data: {
          serialNo,
          inboundOrderNo,
          customerId,
          warehouseCodeId,
          outboundStatus: "unshipped",
          inboundName: customer.nameCn,
          inboundPhone: customer.phone,
        },
        include: { customer: true, warehouseCode: true },
      });

      return rec;
    });

    return NextResponse.json(
      { record, duplicateWarning: !!existingOrder },
      { status: 201 }
    );
  } catch (e: unknown) {
    // Business error: code was already taken by another request
    if (e instanceof Error && e.message === "WAREHOUSE_CODE_UNAVAILABLE") {
      return NextResponse.json(
        { error: "仓库码已被占用或不可用，请刷新后重新选择" },
        { status: 409 }
      );
    }

    // Safety net: partial unique index caught a race condition
    const errCode = (e as { code?: string })?.code;
    const errMsg = e instanceof Error ? e.message : String(e);
    if (errCode === "P2002" || errMsg.includes("UNIQUE constraint failed")) {
      return NextResponse.json(
        { error: "仓库码已被占用（并发冲突），请刷新后重新选择" },
        { status: 409 }
      );
    }

    throw e;
  }
}
