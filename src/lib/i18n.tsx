"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Locale = "zh" | "ko";

const translations = {
  zh: {
    // Common
    search: "搜索",
    cancel: "取消",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    loading: "加载中...",
    noData: "暂无数据",
    totalRecords: (n: number) => `共 ${n} 条记录`,
    totalItems: (n: number) => `共 ${n} 条`,
    prevPage: "上一页",
    nextPage: "下一页",
    pageOf: (p: number, t: number) => `${p} / ${t}`,
    allAreas: "全部区域",
    areaLabel: (a: string) => `区域 ${a}`,
    allStatus: "全部状态",
    confirmDelete: "确定删除该客户？",
    confirmShip: "确认出库？",
    shipFailed: "出库失败",
    available: (n: number) => `可用: ${n} 个`,

    // Sidebar & system
    systemName: "仓库管理系统",
    systemTitle: "轻量仓库管理系统",
    systemSubtitle: "快速入库 · 快速查询 · 高效管理",

    // Nav
    navCustomers: "客户管理",
    navCustomerImport: "客户导入",
    navWarehouseCodes: "仓库码池",
    navInbound: "入库登记",
    navRecords: "库存记录",
    navLabels: "标签打印",

    // Home descriptions
    descCustomers: "管理客户信息，支持搜索和编辑",
    descCustomerImport: "从 Excel/CSV 批量导入客户",
    descWarehouseCodes: "生成和管理仓库码",
    descInbound: "登记包裹入库信息",
    descRecords: "查看入库记录，一键出库",
    descLabels: "预览仓库码标签，准备打印",

    // Customers page
    addCustomer: "+ 新增客户",
    searchCustomerPlaceholder: "搜索：中文名 / 拼音 / 手机号 / 尾号",
    thId: "ID",
    thName: "中文名",
    thPinyin: "拼音",
    thPhone: "手机号",
    thPhoneLast4: "尾号",
    thActions: "操作",
    editCustomer: "编辑客户",
    addCustomerTitle: "新增客户",
    labelName: "中文名",
    labelPhone: "手机号",
    labelPinyin: "拼音（留空自动生成）",
    pinyinPlaceholder: "留空则自动根据中文名生成",
    phoneInvalid: "手机号格式不正确，需 8-15 位数字（可含国际区号前缀 +）",

    // Customer import
    customerImportTitle: "客户数据导入",
    fileRequirements: "文件要求",
    fileReq1: "支持 .xlsx 和 .csv 格式",
    fileReq2_prefix: "必须包含列：",
    fileReq2_name: "姓名",
    fileReq2_phone: "手机号",
    fileReq3: "也支持列名：中文名、客户姓名、name、电话、phone、手机、联系电话",
    fileReq4: "手机号允许重复，不会去重",
    dropOrClick: "点击或拖拽文件到此处",
    selectFile: "选择文件",
    remove: "移除",
    importing: "导入中...",
    startImport: "开始导入",
    importResult: "导入结果",
    totalRows: "总行数",
    success: "成功",
    failed: "失败",
    errorDetails: "错误详情",
    importFailed: "导入失败，请检查文件格式",

    // Warehouse codes
    batchGenerate: "+ 批量生成",
    batchGenerateTitle: "批量生成仓库码",
    labelArea: "区域",
    labelStartSeq: "起始序号",
    labelEndSeq: "结束序号",
    generate: "生成",
    genCreated: (n: number) => `已创建 ${n} 个`,
    genSkipped: (n: number) => `跳过 ${n} 个（已存在）`,
    thWarehouseCode: "仓库码",
    thSeqNo: "序号",
    thStatus: "状态",
    statusUnused: "未使用",
    statusUsed: "已使用",
    statusShipped: "已出库",

    // Inbound
    inboundTitle: "入库登记",
    step1: "第一步：选择客户",
    step1Placeholder: "输入中文名 / 拼音 / 手机号 / 尾号",
    selected: "已选择：",
    step2: "第二步：输入快递单号",
    step2Placeholder: "扫码枪扫描 / 手动输入单号",
    scan: "扫码",
    step2Hint: "支持：手动输入 / 扫码枪（聚焦输入框后扫描） / 手机摄像头扫码",
    step3: "第三步：选择仓库码",
    showFirst100: (total: number) => `显示前 100 个，共 ${total} 个`,
    duplicateOrderWarning: "快递单号已存在，是否仍要入库？",
    confirmInbound: "确认入库",
    submitting: "提交中...",
    fillAllFields: "请完整填写所有字段",
    inboundFailed: "入库失败",
    inboundSuccess: (sn: number, code: string) => `入库成功！序号: ${sn}，仓库码: ${code}`,

    // Records
    recordsTitle: "库存记录",
    searchRecordPlaceholder: "搜索：单号 / 姓名 / 拼音 / 手机号 / 仓库码",
    statusUnshipped: "未出库",
    thSerialNo: "序号",
    thInboundTime: "入库时间",
    thOrderNo: "快递单号",
    thCustomerName: "姓名",
    shipBtn: "一键出库",
    exportExcel: "导出 Excel",
    exporting: "导出中...",

    // Bulk
    navBulk: "批量出库",
    descBulk: "批量查询单号并一键出库",
    bulkTitle: "批量查询 & 出库",
    bulkInputLabel: "粘贴快递单号（每行一个）",
    bulkInputPlaceholder: "SF1234567890\nYT9876543210\nJD0011223344\n...",
    bulkLookup: "批量查询",
    bulkLooking: "查询中...",
    bulkShipSelected: (n: number) => `批量出库（${n} 件）`,
    bulkShipping: "出库中...",
    bulkSelectAll: "全选可出库",
    bulkDeselectAll: "取消全选",
    bulkStatusUnshipped: "未出库 · 可选",
    bulkStatusShipped: "已出库",
    bulkStatusNotFound: "未找到",
    bulkSummary: (total: number, unshipped: number, shipped: number, notFound: number) =>
      `共 ${total} 个单号：${unshipped} 个可出库，${shipped} 个已出库，${notFound} 个未找到`,
    bulkShipSuccess: (n: number) => `成功出库 ${n} 件`,
    bulkConfirm: (n: number) => `确认将 ${n} 件包裹标记为出库？`,
    bulkEmpty: "请输入至少一个快递单号",
    bulkCopyResults: "复制结果",
    bulkCopied: "已复制到剪贴板",
    bulkExportExcel: "导出 Excel",
    bulkExportCSV: "导出 CSV",
    bulkFilterAll: "全部",
    bulkFilterFound: "已找到",
    bulkFilterUnshipped: "仅未出库",
    bulkFilterShipped: "仅已出库",
    bulkFilterNotFound: "仅未找到",
    bulkResultNotFound: "未找到",
    bulkResultShipped: "已出库",
    bulkResultUnshipped: "未出库",
    bulkShareTitle: "分享结果",

    // Labels
    labelsTitle: "标签打印",
    labelPrefix: "区域前缀",
    labelStartNo: "起始编号",
    labelEndNo: "结束编号",
    generatePreview: "生成预览",
    print: "打印",
    labelSummary: (total: number, pages: number, perPage: number) =>
      `共 ${total} 个标签，${pages} 页（每页 ${perPage} 个）`,
    labelHint: '输入区域前缀和编号范围，点击"生成预览"',
    labelSpec: "适配 100mm × 150mm 标签纸，每页 3×5 = 15 个标签",

    // Scanner
    scanTitle: "扫描条码",
    scanNotSecure:
      "当前页面不是安全上下文（非 HTTPS），浏览器禁止访问摄像头。\n请使用 https://<局域网IP>:3000 访问本页面。",
    scanNoMedia:
      "当前浏览器不支持摄像头访问（mediaDevices API 不可用）。\n请使用 HTTPS 访问，或换用 Chrome / Safari 浏览器。",
    scanPermDenied: "摄像头权限被拒绝，请在浏览器设置中允许摄像头访问。",
    scanNotFound: "未检测到摄像头设备。",
    scanNotReadable: "摄像头被其他应用占用，请关闭其他使用摄像头的应用后重试。",
    scanGenericError: "无法启动摄像头，请检查权限设置。",
    scanHintSecure: "请确保使用 HTTPS 访问并已授予摄像头权限，或使用手动输入",
    scanStarting: "正在启动摄像头…",
    scanGuide: "将条码对准框内，自动识别 · 支持 CODE128 / EAN / UPC / ITF / QR",
  },

  ko: {
    // Common
    search: "검색",
    cancel: "취소",
    save: "저장",
    delete: "삭제",
    edit: "수정",
    loading: "로딩 중...",
    noData: "데이터 없음",
    totalRecords: (n: number) => `총 ${n}건`,
    totalItems: (n: number) => `총 ${n}건`,
    prevPage: "이전",
    nextPage: "다음",
    pageOf: (p: number, t: number) => `${p} / ${t}`,
    allAreas: "전체 구역",
    areaLabel: (a: string) => `구역 ${a}`,
    allStatus: "전체 상태",
    confirmDelete: "이 고객을 삭제하시겠습니까?",
    confirmShip: "출고 처리하시겠습니까?",
    shipFailed: "출고 실패",
    available: (n: number) => `사용 가능: ${n}개`,

    // Sidebar & system
    systemName: "창고 관리 시스템",
    systemTitle: "경량 창고 관리 시스템",
    systemSubtitle: "빠른 입고 · 빠른 조회 · 효율적 관리",

    // Nav
    navCustomers: "고객 관리",
    navCustomerImport: "고객 가져오기",
    navWarehouseCodes: "창고 코드 풀",
    navInbound: "입고 등록",
    navRecords: "재고 기록",
    navLabels: "라벨 인쇄",

    // Home descriptions
    descCustomers: "고객 정보 관리, 검색 및 편집 지원",
    descCustomerImport: "Excel/CSV에서 고객 일괄 가져오기",
    descWarehouseCodes: "창고 코드 생성 및 관리",
    descInbound: "택배 입고 정보 등록",
    descRecords: "입고 기록 조회, 원클릭 출고",
    descLabels: "창고 코드 라벨 미리보기 및 인쇄",

    // Customers page
    addCustomer: "+ 고객 추가",
    searchCustomerPlaceholder: "검색: 이름 / 병음 / 전화번호 / 끝 4자리",
    thId: "ID",
    thName: "이름",
    thPinyin: "병음",
    thPhone: "전화번호",
    thPhoneLast4: "끝 4자리",
    thActions: "작업",
    editCustomer: "고객 수정",
    addCustomerTitle: "고객 추가",
    labelName: "이름",
    labelPhone: "전화번호",
    labelPinyin: "병음 (비우면 자동 생성)",
    pinyinPlaceholder: "비우면 이름에서 자동 생성",
    phoneInvalid: "전화번호 형식이 올바르지 않습니다. 8-15자리 숫자 (국제 번호 + 허용)",

    // Customer import
    customerImportTitle: "고객 데이터 가져오기",
    fileRequirements: "파일 요구사항",
    fileReq1: ".xlsx 및 .csv 형식 지원",
    fileReq2_prefix: "필수 열: ",
    fileReq2_name: "이름",
    fileReq2_phone: "전화번호",
    fileReq3: "지원 열 이름: 중문명, 고객이름, name, 전화, phone, 핸드폰, 연락처",
    fileReq4: "전화번호 중복 허용, 중복 제거 안 함",
    dropOrClick: "파일을 여기에 끌어다 놓거나 클릭하세요",
    selectFile: "파일 선택",
    remove: "제거",
    importing: "가져오는 중...",
    startImport: "가져오기 시작",
    importResult: "가져오기 결과",
    totalRows: "총 행수",
    success: "성공",
    failed: "실패",
    errorDetails: "오류 상세",
    importFailed: "가져오기 실패, 파일 형식을 확인하세요",

    // Warehouse codes
    batchGenerate: "+ 일괄 생성",
    batchGenerateTitle: "창고 코드 일괄 생성",
    labelArea: "구역",
    labelStartSeq: "시작 번호",
    labelEndSeq: "종료 번호",
    generate: "생성",
    genCreated: (n: number) => `${n}개 생성됨`,
    genSkipped: (n: number) => `${n}개 건너뜀 (이미 존재)`,
    thWarehouseCode: "창고 코드",
    thSeqNo: "일련번호",
    thStatus: "상태",
    statusUnused: "미사용",
    statusUsed: "사용 중",
    statusShipped: "출고완료",

    // Inbound
    inboundTitle: "입고 등록",
    step1: "1단계: 고객 선택",
    step1Placeholder: "이름 / 병음 / 전화번호 / 끝 4자리 입력",
    selected: "선택됨: ",
    step2: "2단계: 운송장 번호 입력",
    step2Placeholder: "스캐너로 스캔 / 수동 입력",
    scan: "스캔",
    step2Hint: "지원: 수동 입력 / 바코드 스캐너 / 모바일 카메라 스캔",
    step3: "3단계: 창고 코드 선택",
    showFirst100: (total: number) => `처음 100개 표시, 총 ${total}개`,
    duplicateOrderWarning: "운송장 번호가 이미 존재합니다. 그래도 입고하시겠습니까?",
    confirmInbound: "입고 확인",
    submitting: "제출 중...",
    fillAllFields: "모든 항목을 입력해 주세요",
    inboundFailed: "입고 실패",
    inboundSuccess: (sn: number, code: string) => `입고 완료! 일련번호: ${sn}, 창고코드: ${code}`,

    // Records
    recordsTitle: "재고 기록",
    searchRecordPlaceholder: "검색: 운송장번호 / 이름 / 병음 / 전화번호 / 창고코드",
    statusUnshipped: "미출고",
    thSerialNo: "일련번호",
    thInboundTime: "입고 시간",
    thOrderNo: "운송장 번호",
    thCustomerName: "이름",
    shipBtn: "출고 처리",
    exportExcel: "Excel 내보내기",
    exporting: "내보내는 중...",

    // Bulk
    navBulk: "일괄 출고",
    descBulk: "운송장 번호 일괄 조회 후 출고",
    bulkTitle: "일괄 조회 & 출고",
    bulkInputLabel: "운송장 번호 붙여넣기 (한 줄에 하나씩)",
    bulkInputPlaceholder: "SF1234567890\nYT9876543210\nJD0011223344\n...",
    bulkLookup: "일괄 조회",
    bulkLooking: "조회 중...",
    bulkShipSelected: (n: number) => `일괄 출고 (${n}건)`,
    bulkShipping: "출고 중...",
    bulkSelectAll: "출고 가능 전체 선택",
    bulkDeselectAll: "전체 선택 해제",
    bulkStatusUnshipped: "미출고 · 선택 가능",
    bulkStatusShipped: "출고완료",
    bulkStatusNotFound: "미발견",
    bulkSummary: (total: number, unshipped: number, shipped: number, notFound: number) =>
      `총 ${total}건: ${unshipped}건 출고 가능, ${shipped}건 출고완료, ${notFound}건 미발견`,
    bulkShipSuccess: (n: number) => `${n}건 출고 완료`,
    bulkConfirm: (n: number) => `${n}건의 택배를 출고 처리하시겠습니까?`,
    bulkEmpty: "운송장 번호를 하나 이상 입력해 주세요",
    bulkCopyResults: "결과 복사",
    bulkCopied: "클립보드에 복사됨",
    bulkExportExcel: "Excel 내보내기",
    bulkExportCSV: "CSV 내보내기",
    bulkFilterAll: "전체",
    bulkFilterFound: "찾은 것만",
    bulkFilterUnshipped: "미출고만",
    bulkFilterShipped: "출고완료만",
    bulkFilterNotFound: "미발견만",
    bulkResultNotFound: "미발견",
    bulkResultShipped: "출고완료",
    bulkResultUnshipped: "미출고",
    bulkShareTitle: "결과 공유",

    // Labels
    labelsTitle: "라벨 인쇄",
    labelPrefix: "구역 접두사",
    labelStartNo: "시작 번호",
    labelEndNo: "종료 번호",
    generatePreview: "미리보기 생성",
    print: "인쇄",
    labelSummary: (total: number, pages: number, perPage: number) =>
      `총 ${total}개 라벨, ${pages}페이지 (페이지당 ${perPage}개)`,
    labelHint: "구역 접두사와 번호 범위를 입력하고 \"미리보기 생성\"을 클릭하세요",
    labelSpec: "100mm × 150mm 라벨지 호환, 페이지당 3×5 = 15개 라벨",

    // Scanner
    scanTitle: "바코드 스캔",
    scanNotSecure:
      "이 페이지는 보안 컨텍스트가 아닙니다 (HTTPS 아님). 카메라 접근이 차단됩니다.\nhttps://<LAN-IP>:3000 으로 접속해 주세요.",
    scanNoMedia:
      "이 브라우저는 카메라 접근을 지원하지 않습니다 (mediaDevices API 없음).\nHTTPS로 접속하거나 Chrome / Safari를 사용하세요.",
    scanPermDenied: "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 접근을 허용해 주세요.",
    scanNotFound: "카메라 장치를 찾을 수 없습니다.",
    scanNotReadable: "카메라가 다른 앱에서 사용 중입니다. 다른 앱을 닫고 다시 시도해 주세요.",
    scanGenericError: "카메라를 시작할 수 없습니다. 권한 설정을 확인해 주세요.",
    scanHintSecure: "HTTPS로 접속하고 카메라 권한을 허용했는지 확인하거나, 수동 입력을 사용하세요",
    scanStarting: "카메라 시작 중…",
    scanGuide: "바코드를 프레임 안에 맞추세요 · CODE128 / EAN / UPC / ITF / QR 지원",
  },
} as const;

type TranslationsMap = typeof translations;
export type Translations = TranslationsMap[keyof TranslationsMap];

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved === "zh" || saved === "ko") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  };

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
