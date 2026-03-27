import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toPinyin, normalizePhone, validatePhone, getPhoneLast4, buildSearchText } from "@/lib/pinyin";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "请上传文件" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const nameCn = (row["姓名"] || row["name"] || row["中文名"] || row["客户姓名"] || "").toString().trim();
    const rawPhone = (row["手机号"] || row["电话"] || row["phone"] || row["手机"] || row["联系电话"] || "").toString().trim();
    const phone = normalizePhone(rawPhone);

    if (!nameCn || !phone) {
      failed++;
      errors.push(`第 ${i + 2} 行: 姓名或手机号为空`);
      continue;
    }

    if (validatePhone(phone)) {
      failed++;
      errors.push(`第 ${i + 2} 行: 手机号格式不正确 "${rawPhone}"，需 8-15 位数字`);
      continue;
    }

    try {
      const namePinyin = toPinyin(nameCn);
      const phoneLast4 = getPhoneLast4(phone);
      const searchText = buildSearchText(nameCn, namePinyin, phone);

      await prisma.customer.create({
        data: { nameCn, namePinyin, phone, phoneLast4, searchText },
      });
      success++;
    } catch (e) {
      failed++;
      errors.push(`第 ${i + 2} 行: 导入失败 - ${e instanceof Error ? e.message : "未知错误"}`);
    }
  }

  return NextResponse.json({
    total: rawData.length,
    success,
    failed,
    errors: errors.slice(0, 20),
  });
}
