import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { pinyin } from "pinyin-pro";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function toPinyin(chinese: string): string {
  return pinyin(chinese, { toneType: "none", type: "array" }).join("");
}

function getPhoneLast4(phone: string): string {
  return phone.replace(/\D/g, "").slice(-4);
}

function buildSearchText(nameCn: string, namePinyin: string, phone: string): string {
  return `${nameCn} ${namePinyin} ${phone} ${getPhoneLast4(phone)}`.toLowerCase();
}

async function main() {
  console.log("Seeding database...");

  const customersData = [
    { nameCn: "张三", phone: "13800138001" },
    { nameCn: "李四", phone: "13900139002" },
    { nameCn: "王五", phone: "13700137003" },
    { nameCn: "赵六", phone: "13600136004" },
    { nameCn: "刘七", phone: "13500135005" },
    { nameCn: "陈八", phone: "13800138001" },
    { nameCn: "杨九", phone: "13200132006" },
    { nameCn: "黄十", phone: "13100131007" },
  ];

  for (const c of customersData) {
    const namePy = toPinyin(c.nameCn);
    const phoneLast4 = getPhoneLast4(c.phone);
    const searchText = buildSearchText(c.nameCn, namePy, c.phone);
    await prisma.customer.create({
      data: { nameCn: c.nameCn, namePinyin: namePy, phone: c.phone, phoneLast4, searchText },
    });
  }
  console.log(`Created ${customersData.length} customers`);

  for (const area of ["A", "B"]) {
    for (let seq = 101; seq <= 120; seq++) {
      await prisma.warehouseCode.create({
        data: {
          areaCode: area,
          seqNo: seq,
          warehouseCode: `${area}${seq}`,
          codeStatus: "unused",
        },
      });
    }
  }
  console.log("Created warehouse codes A101-A120, B101-B120");

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
