import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPinyin, getPhoneLast4, buildSearchText } from "@/lib/pinyin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { nameCn, phone, namePinyin: customPinyin } = body;

  if (!nameCn || !phone) {
    return NextResponse.json({ error: "姓名和手机号为必填项" }, { status: 400 });
  }

  const namePinyin = customPinyin || toPinyin(nameCn);
  const phoneLast4 = getPhoneLast4(phone);
  const searchText = buildSearchText(nameCn, namePinyin, phone);

  const customer = await prisma.customer.update({
    where: { id: parseInt(id) },
    data: { nameCn, namePinyin, phone, phoneLast4, searchText },
  });

  return NextResponse.json(customer);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.customer.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
