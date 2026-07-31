import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPinyin, normalizePhone, validatePhone, getPhoneLast4, buildSearchText } from "@/lib/pinyin";

type CustomerSearchResult = Awaited<ReturnType<typeof prisma.customer.findMany>>[number];

function getCustomerSearchRank(customer: CustomerSearchResult, q: string): number {
  const query = q.trim().toLowerCase();
  const queryDigits = query.replace(/\D/g, "");
  const phoneDigits = customer.phone.replace(/\D/g, "");
  const phoneLast4 = customer.phoneLast4.toLowerCase();
  const nameCn = customer.nameCn.toLowerCase();
  const namePinyin = customer.namePinyin.toLowerCase();

  if (queryDigits) {
    if (phoneLast4 === queryDigits) return 0;
    if (phoneLast4.endsWith(queryDigits)) return 1;
    if (phoneDigits.endsWith(queryDigits)) return 2;
    if (phoneLast4.includes(queryDigits)) return 3;
    if (phoneDigits.includes(queryDigits)) return 4;
  }

  if (nameCn === query || namePinyin === query) return 5;
  if (nameCn.startsWith(query) || namePinyin.startsWith(query)) return 6;
  return 7;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const where = q
    ? { searchText: { contains: q } }
    : {};

  const [matchedCustomers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  const customers = q
    ? matchedCustomers
        .sort((a, b) => {
          const rankDiff = getCustomerSearchRank(a, q) - getCustomerSearchRank(b, q);
          if (rankDiff !== 0) return rankDiff;
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .slice((page - 1) * pageSize, page * pageSize)
    : matchedCustomers.slice((page - 1) * pageSize, page * pageSize);

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
