import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const codes = await prisma.warehouseCode.findMany({
    where: { codeStatus: "unused" },
    orderBy: [{ areaCode: "asc" }, { seqNo: "asc" }],
  });

  return NextResponse.json(codes);
}
