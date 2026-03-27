import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPinyin, normalizePhone, validatePhone, getPhoneLast4, buildSearchText } from "@/lib/pinyin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { nameCn, namePinyin: customPinyin } = body;
  const phone = normalizePhone(String(body.phone || ""));

  if (!nameCn || !phone) {
    return NextResponse.json({ error: "姓名和手机号为必填项" }, { status: 400 });
  }

  const phoneErr = validatePhone(phone);
  if (phoneErr) {
    return NextResponse.json(
      { error: "手机号格式不正确，需 8-15 位数字（可含国际区号前缀 +）" },
      { status: 400 }
    );
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
