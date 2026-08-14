/**
 * 都道府県コード（JIS X 0401）。
 * プロフィールの必須項目「都道府県コード」の選択肢として使用する。
 * code は "01"〜"47" のゼロ埋め2桁文字列。
 */

export interface Prefecture {
  /** JIS X 0401 の都道府県コード（"01"〜"47"） */
  code: string;
  /** 都道府県名 */
  name: string;
}

export const PREFECTURES: readonly Prefecture[] = [
  { code: '01', name: '北海道' },
  { code: '02', name: '青森県' },
  { code: '03', name: '岩手県' },
  { code: '04', name: '宮城県' },
  { code: '05', name: '秋田県' },
  { code: '06', name: '山形県' },
  { code: '07', name: '福島県' },
  { code: '08', name: '茨城県' },
  { code: '09', name: '栃木県' },
  { code: '10', name: '群馬県' },
  { code: '11', name: '埼玉県' },
  { code: '12', name: '千葉県' },
  { code: '13', name: '東京都' },
  { code: '14', name: '神奈川県' },
  { code: '15', name: '新潟県' },
  { code: '16', name: '富山県' },
  { code: '17', name: '石川県' },
  { code: '18', name: '福井県' },
  { code: '19', name: '山梨県' },
  { code: '20', name: '長野県' },
  { code: '21', name: '岐阜県' },
  { code: '22', name: '静岡県' },
  { code: '23', name: '愛知県' },
  { code: '24', name: '三重県' },
  { code: '25', name: '滋賀県' },
  { code: '26', name: '京都府' },
  { code: '27', name: '大阪府' },
  { code: '28', name: '兵庫県' },
  { code: '29', name: '奈良県' },
  { code: '30', name: '和歌山県' },
  { code: '31', name: '鳥取県' },
  { code: '32', name: '島根県' },
  { code: '33', name: '岡山県' },
  { code: '34', name: '広島県' },
  { code: '35', name: '山口県' },
  { code: '36', name: '徳島県' },
  { code: '37', name: '香川県' },
  { code: '38', name: '愛媛県' },
  { code: '39', name: '高知県' },
  { code: '40', name: '福岡県' },
  { code: '41', name: '佐賀県' },
  { code: '42', name: '長崎県' },
  { code: '43', name: '熊本県' },
  { code: '44', name: '大分県' },
  { code: '45', name: '宮崎県' },
  { code: '46', name: '鹿児島県' },
  { code: '47', name: '沖縄県' },
] as const;

/** 与えられた文字列が有効な都道府県コードかどうかを判定する。 */
export function isValidPrefectureCode(code: unknown): code is string {
  return typeof code === 'string' && PREFECTURES.some((p) => p.code === code);
}

/** コードから都道府県名を引く。存在しなければ undefined。 */
export function prefectureName(code: string): string | undefined {
  return PREFECTURES.find((p) => p.code === code)?.name;
}

/**
 * `@svg-maps/japan` のロケーションID（ローマ字）→ JIS 都道府県コードの対応表。
 * 地図の各都道府県パスとプロフィールの prefecture_code を結び付けるために使う。
 */
export const SVG_ID_TO_CODE: Readonly<Record<string, string>> = {
  hokkaido: '01',
  aomori: '02',
  iwate: '03',
  miyagi: '04',
  akita: '05',
  yamagata: '06',
  fukushima: '07',
  ibaraki: '08',
  tochigi: '09',
  gunma: '10',
  saitama: '11',
  chiba: '12',
  tokyo: '13',
  kanagawa: '14',
  niigata: '15',
  toyama: '16',
  ishikawa: '17',
  fukui: '18',
  yamanashi: '19',
  nagano: '20',
  gifu: '21',
  shizuoka: '22',
  aichi: '23',
  mie: '24',
  shiga: '25',
  kyoto: '26',
  osaka: '27',
  hyogo: '28',
  nara: '29',
  wakayama: '30',
  tottori: '31',
  shimane: '32',
  okayama: '33',
  hiroshima: '34',
  yamaguchi: '35',
  tokushima: '36',
  kagawa: '37',
  ehime: '38',
  kochi: '39',
  fukuoka: '40',
  saga: '41',
  nagasaki: '42',
  kumamoto: '43',
  oita: '44',
  miyazaki: '45',
  kagoshima: '46',
  okinawa: '47',
} as const;
