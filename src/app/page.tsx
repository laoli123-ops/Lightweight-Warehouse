import Link from "next/link";

const modules = [
  { href: "/customers", label: "客户管理", desc: "管理客户信息，支持搜索和编辑", icon: "👤", color: "bg-blue-500" },
  { href: "/customers/import", label: "客户导入", desc: "从 Excel/CSV 批量导入客户", icon: "📥", color: "bg-green-500" },
  { href: "/warehouse-codes", label: "仓库码池", desc: "生成和管理仓库码", icon: "🏷️", color: "bg-purple-500" },
  { href: "/inbound", label: "入库登记", desc: "登记包裹入库信息", icon: "📦", color: "bg-orange-500" },
  { href: "/records", label: "库存记录", desc: "查看入库记录，一键出库", icon: "📋", color: "bg-teal-500" },
  { href: "/labels", label: "标签预览", desc: "预览仓库码标签，准备打印", icon: "🖨️", color: "bg-rose-500" },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">轻量仓库管理系统</h1>
        <p className="mt-2 text-gray-500">快速入库 · 快速查询 · 高效管理</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${m.color} text-lg text-white`}>
              {m.icon}
            </div>
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">{m.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
