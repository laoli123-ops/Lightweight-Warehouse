# 轻量仓库出入库管理系统 (Lightweight Warehouse MVP)

本地运行的轻量级仓库包裹管理系统，通过浏览器访问。支持快速入库登记、包裹查询、仓库码绑定、出库管理及标签打印预览。

## 技术栈

- **Next.js 16** (App Router) + TypeScript
- **Prisma 7** ORM + SQLite
- **Tailwind CSS 4**
- **pinyin-pro** 中文转拼音
- **xlsx** Excel 文件解析

## 功能模块

| 模块 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 功能导航面板 |
| 客户管理 | `/customers` | 客户列表、搜索、新增、编辑、删除 |
| 客户导入 | `/customers/import` | 从 Excel/CSV 批量导入客户数据 |
| 仓库码池 | `/warehouse-codes` | 批量生成仓库码、按区域/状态筛选 |
| 入库登记 | `/inbound` | 搜索客户 → 输入单号 → 选仓库码 → 入库 |
| 库存记录 | `/records` | 查看入库记录、搜索、一键出库 |
| 标签预览 | `/labels` | 按范围生成标签预览、支持打印 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装

```bash
# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate
```

### 数据库初始化

```bash
# 运行迁移（创建数据库和表）
npx prisma migrate dev

# 如果迁移后数据库为空，手动初始化：
sqlite3 prisma/dev.db < prisma/migrations/*/migration.sql

# 填充示例数据（可选）
node --import tsx prisma/seed.ts
```

### 启动

```bash
# 开发模式
npm run dev

# 生产构建
npm run build && npm start
```

打开浏览器访问 http://localhost:3000

## 手机扫码（局域网 HTTPS 开发）

浏览器要求 **安全上下文（HTTPS 或 localhost）** 才能访问摄像头。在局域网内用手机扫码需要以 HTTPS 模式启动开发服务器。

### 启动方式

```bash
npm run dev
```

`dev` 脚本已配置为 `next dev -H 0.0.0.0 -p 3000 --experimental-https`。
首次运行时 Next.js 会自动生成本地自签名证书（需要输入系统密码）。

### 查找 Mac 局域网 IP

```bash
ipconfig getifaddr en0
```

假设输出 `192.168.0.107`。

### 手机访问

1. 确保手机和 Mac 连接到 **同一个 Wi-Fi**
2. 手机浏览器打开：`https://192.168.0.107:3000`
3. 浏览器会提示证书不受信任（自签名），选择「继续访问」即可
4. 进入入库登记页面，点击「扫码」按钮即可调起摄像头

> 如果换了网络导致 IP 变化，更新 `next.config.ts` 中的 `allowedDevOrigins`。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm start` | 生产运行 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:seed` | 填充示例数据 |
| `npm run db:studio` | 打开 Prisma Studio |

## 数据库结构

### customers（客户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键自增 |
| name_cn | TEXT | 中文名 |
| name_pinyin | TEXT | 拼音名（可自动生成，可手动修改） |
| phone | TEXT | 手机号（**不唯一**） |
| phone_last4 | TEXT | 手机尾号 |
| search_text | TEXT | 综合搜索文本 |

### warehouse_codes（仓库码表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键自增 |
| area_code | TEXT | 区域代码 (A/B/C/D) |
| seq_no | INT | 序号 |
| warehouse_code | TEXT | 仓库码 (A101)，**唯一** |
| code_status | TEXT | unused / used / shipped |

### inbound_records（入库记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键自增 |
| serial_no | INT | 流水号 |
| inbound_order_no | TEXT | 快递单号 |
| customer_id | INT | FK → customers |
| warehouse_code_id | INT | FK → warehouse_codes |
| outbound_status | TEXT | unshipped / shipped |

## 业务流程

```
1. 导入客户数据 (Excel/CSV)
        ↓
2. 批量生成仓库码 (A101~A150)
        ↓
3. 包裹到达 → 入库登记
   搜索客户 → 输入单号 → 选仓库码 → 保存
   系统自动: 仓库码 unused→used, 记录状态=unshipped
        ↓
4. 包裹出库 → 一键出库
   系统自动: 仓库码 used→shipped, 记录状态=shipped
```

## 状态流转

### 仓库码状态
- `unused` → `used`（入库时） → `shipped`（出库时）
- 仓库码出库后不可复用

### 入库记录状态
- `unshipped`（入库时） → `shipped`（出库时）

## Excel 导入说明

支持 `.xlsx` 和 `.csv` 格式，需要包含以下列名之一：

- 姓名列：`姓名`、`name`、`中文名`、`客户姓名`
- 手机列：`手机号`、`电话`、`phone`、`手机`、`联系电话`

导入后自动生成拼音、手机尾号和搜索文本。手机号允许重复。

## 搜索功能

支持以下方式模糊搜索客户：
- 中文名（如：张）
- 拼音（如：zhang、zhangsan）
- 完整手机号
- 手机尾号（如：8001）

## 未来扩展：Zebra ZD230 标签打印

系统已预留标签打印支持结构：

1. **标签预览页面** (`/labels`) 已实现基本预览和浏览器打印
2. 未来可在 `/api/labels` 路由中添加 ZPL 生成逻辑
3. ZPL 模板示例：

```
^XA
^FO50,50^A0N,80,80^FD{warehouseCode}^FS
^FO50,150^BY3^BCN,100,Y,N,N^FD{warehouseCode}^FS
^XZ
```

4. 通过 HTTP POST 将 ZPL 发送到打印机的网络端口，或使用 `node-usb` 直接连接

## 项目结构

```
├── prisma/
│   ├── schema.prisma        # 数据模型定义
│   ├── seed.ts              # 种子数据脚本
│   ├── migrations/          # 迁移文件
│   └── dev.db               # SQLite 数据库文件
├── src/
│   ├── app/
│   │   ├── page.tsx         # 首页
│   │   ├── layout.tsx       # 全局布局
│   │   ├── customers/       # 客户管理/导入
│   │   ├── warehouse-codes/ # 仓库码池
│   │   ├── inbound/         # 入库登记
│   │   ├── records/         # 库存记录
│   │   ├── labels/          # 标签预览
│   │   └── api/             # API 路由
│   ├── components/
│   │   └── Sidebar.tsx      # 侧边导航栏
│   ├── generated/prisma/    # Prisma 生成的客户端
│   └── lib/
│       ├── prisma.ts        # Prisma 实例
│       └── pinyin.ts        # 拼音工具函数
├── package.json
├── tsconfig.json
└── README.md
```
