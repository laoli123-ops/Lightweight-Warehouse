import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.inboundRecord.findUnique({
    where: { id: parseInt(id) },
    include: { customer: true, warehouseCode: true },
  });

  if (!record) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { inboundOrderNo } = body;

  const record = await prisma.inboundRecord.update({
    where: { id: parseInt(id) },
    data: { inboundOrderNo },
    include: { customer: true, warehouseCode: true },
  });

  return NextResponse.json(record);
}
