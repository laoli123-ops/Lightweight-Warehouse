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
  const { customerId, inboundOrderNo, warehouseCodeId } = body;

  if (!customerId || !inboundOrderNo || !warehouseCodeId) {
    return NextResponse.json(
      { error: "客户、快递单号、仓库码为必填项" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  const wCode = await prisma.warehouseCode.findUnique({ where: { id: warehouseCodeId } });
  if (!wCode || wCode.codeStatus !== "unused") {
    return NextResponse.json({ error: "仓库码不可用" }, { status: 400 });
  }

  const existingOrder = await prisma.inboundRecord.findFirst({
    where: { inboundOrderNo },
  });
  let duplicateWarning = false;
  if (existingOrder) {
    const forceCreate = body.forceCreate;
    if (!forceCreate) {
      return NextResponse.json(
        { error: "快递单号已存在", duplicate: true },
        { status: 409 }
      );
    }
    duplicateWarning = true;
  }

  const lastRecord = await prisma.inboundRecord.findFirst({
    orderBy: { serialNo: "desc" },
  });
  const serialNo = (lastRecord?.serialNo || 0) + 1;

  const record = await prisma.$transaction(async (tx) => {
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

    await tx.warehouseCode.update({
      where: { id: warehouseCodeId },
      data: { codeStatus: "used" },
    });

    return rec;
  });

  return NextResponse.json({ record, duplicateWarning }, { status: 201 });
}
