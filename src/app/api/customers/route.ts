import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPinyin, normalizePhone, validatePhone, getPhoneLast4, buildSearchText } from "@/lib/pinyin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where = q
    ? { searchText: { contains: q } }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, pageSize });
}

export async function POST(request: NextRequest) {
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

  const customer = await prisma.customer.create({
    data: { nameCn, namePinyin, phone, phoneLast4, searchText },
  });

  return NextResponse.json(customer, { status: 201 });
}
