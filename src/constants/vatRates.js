/**
 * 海外增值税（VAT/GST）税率表
 * 数据来源：用户提供
 * 
 * 用途：计算净收入 = 毛收入 / (1 + VAT税率)
 * 影响指标：ROI、LTV、ARPU、ARPPU、ARPDAU、总收入
 */

export const VAT_RATES = {
  // 亚太
  JP: 0.10,    // 日本
  KR: 0.10,    // 韩国
  TW: 0.08,    // 中国台湾
  HK: 0,       // 中国香港（无VAT）
  SG: 0.09,    // 新加坡
  MY: 0.08,    // 马来西亚
  TH: 0.07,    // 泰国
  PH: 0.12,    // 菲律宾
  ID: 0.11,    // 印度尼西亚
  VN: 0,       // 越南（数据中未提供，默认0）
  KH: 0.10,    // 柬埔寨
  MM: 0,       // 缅甸
  NZ: 0.17,    // 新西兰
  AU: 0.10,    // 澳大利亚
  IN: 0,       // 印度（数据中未提供）

  // 北美
  US: 0,       // 美国（无联邦VAT）
  CA: 0,       // 加拿大
  MX: 0.16,    // 墨西哥

  // 南美/中美
  BR: 0.25,    // 巴西
  AR: 0,       // 阿根廷
  CL: 0.19,    // 智利
  CO: 0.19,    // 哥伦比亚
  PE: 0.18,    // 秘鲁
  UY: 0.02,    // 乌拉圭
  PA: 0,       // 巴拿马
  DO: 0,       // 多米尼加
  NI: 0,       // 尼加拉瓜

  // 欧洲
  DE: 0.19,    // 德国
  FR: 0.20,    // 法国
  GB: 0.20,    // 英国
  IT: 0.23,    // 意大利
  ES: 0.21,    // 西班牙
  NL: 0.21,    // 荷兰
  BE: 0.21,    // 比利时
  AT: 0.20,    // 奥地利
  CH: 0.08,    // 瑞士
  SE: 0.25,    // 瑞典
  NO: 0.25,    // 挪威
  DK: 0.25,    // 丹麦
  FI: 0.26,    // 芬兰
  PL: 0.23,    // 波兰
  PT: 0.23,    // 葡萄牙
  GR: 0.24,    // 希腊
  CZ: 0.21,    // 捷克
  RO: 0.21,    // 罗马尼亚
  HU: 0.48,    // 匈牙利
  BG: 0.20,    // 保加利亚
  HR: 0.25,    // 克罗地亚
  SK: 0.23,    // 斯洛伐克
  SI: 0.22,    // 斯洛文尼亚
  EE: 0.24,    // 爱沙尼亚
  LT: 0.21,    // 立陶宛
  LV: 0.21,    // 拉脱维亚
  CY: 0.19,    // 塞浦路斯
  LU: 0.17,    // 卢森堡
  MT: 0.18,    // 马耳他
  IE: 0.23,    // 爱尔兰
  RS: 0.20,    // 塞尔维亚

  // 中东/中亚
  AE: 0.05,    // 阿联酋
  SA: 0.15,    // 沙特阿拉伯
  TR: 0.27,    // 土耳其
  IL: 0,       // 以色列
  JO: 0,       // 约旦
  KW: 0,       // 科威特
  OM: 0.05,    // 阿曼
  GE: 0.18,    // 格鲁吉亚
  KZ: 0.16,    // 哈萨克斯坦
  AZ: 0.18,    // 阿塞拜疆
  UZ: 0.12,    // 乌兹别克斯坦

  // 非洲
  ZA: 0.15,    // 南非
  NG: 0.08,    // 尼日利亚
  EG: 0.14,    // 埃及
  KE: 0.16,    // 肯尼亚
  GH: 0.20,    // 加纳
  CI: 0.18,    // 科特迪瓦
  SN: 0.18,    // 塞内加尔
  UG: 0.24,    // 乌干达

  // 东欧/独联体
  RU: 0.22,    // 俄罗斯
  UA: 0.20,    // 乌克兰
  BY: 0.20,    // 白俄罗斯

  // 其他
  DZ: 0,       // 阿尔及利亚
  AO: 0,       // 安哥拉
  PK: 0,       // 巴基斯坦
}

/** 未匹配国家时的默认税率 */
export const DEFAULT_VAT_RATE = 0

/**
 * 获取国家的 VAT 税率
 * 支持多种格式：
 * - 两位 ISO 代码："US", "JP"
 * - 中文名+ISO代码："美国(US)", "日本(JP)"
 * @param {string} country - 国家字段值
 * @returns {number} 税率（如 0.1 表示 10%）
 */
export function getVATRate(country) {
  if (!country) return DEFAULT_VAT_RATE
  const str = String(country).trim()
  
  // 1. 尝试直接匹配（两位 ISO 代码）
  const directKey = str.toUpperCase()
  if (VAT_RATES[directKey] !== undefined) return VAT_RATES[directKey]
  
  // 2. 尝试从括号中提取 ISO 代码："美国(US)" -> "US"
  const match = str.match(/\(([A-Za-z]{2})\)\s*$/)
  if (match) {
    const code = match[1].toUpperCase()
    if (VAT_RATES[code] !== undefined) return VAT_RATES[code]
  }
  
  // 3. 未匹配到
  return DEFAULT_VAT_RATE
}

export default { VAT_RATES, DEFAULT_VAT_RATE, getVATRate }
