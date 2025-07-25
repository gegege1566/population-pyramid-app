export interface Prefecture {
  code: string;
  name: string;
  region: string;
}

export const PREFECTURES: Prefecture[] = [
  { code: '00000', name: '全国（日本）', region: '全国' },
  { code: '01', name: '北海道', region: '北海道' },
  { code: '02', name: '青森県', region: '東北' },
  { code: '03', name: '岩手県', region: '東北' },
  { code: '04', name: '宮城県', region: '東北' },
  { code: '05', name: '秋田県', region: '東北' },
  { code: '06', name: '山形県', region: '東北' },
  { code: '07', name: '福島県', region: '東北' },
  { code: '08', name: '茨城県', region: '関東' },
  { code: '09', name: '栃木県', region: '関東' },
  { code: '10', name: '群馬県', region: '関東' },
  { code: '11', name: '埼玉県', region: '関東' },
  { code: '12', name: '千葉県', region: '関東' },
  { code: '13', name: '東京都', region: '関東' },
  { code: '14', name: '神奈川県', region: '関東' },
  { code: '15', name: '新潟県', region: '中部' },
  { code: '16', name: '富山県', region: '中部' },
  { code: '17', name: '石川県', region: '中部' },
  { code: '18', name: '福井県', region: '中部' },
  { code: '19', name: '山梨県', region: '中部' },
  { code: '20', name: '長野県', region: '中部' },
  { code: '21', name: '岐阜県', region: '中部' },
  { code: '22', name: '静岡県', region: '中部' },
  { code: '23', name: '愛知県', region: '中部' },
  { code: '24', name: '三重県', region: '近畿' },
  { code: '25', name: '滋賀県', region: '近畿' },
  { code: '26', name: '京都府', region: '近畿' },
  { code: '27', name: '大阪府', region: '近畿' },
  { code: '28', name: '兵庫県', region: '近畿' },
  { code: '29', name: '奈良県', region: '近畿' },
  { code: '30', name: '和歌山県', region: '近畿' },
  { code: '31', name: '鳥取県', region: '中国' },
  { code: '32', name: '島根県', region: '中国' },
  { code: '33', name: '岡山県', region: '中国' },
  { code: '34', name: '広島県', region: '中国' },
  { code: '35', name: '山口県', region: '中国' },
  { code: '36', name: '徳島県', region: '四国' },
  { code: '37', name: '香川県', region: '四国' },
  { code: '38', name: '愛媛県', region: '四国' },
  { code: '39', name: '高知県', region: '四国' },
  { code: '40', name: '福岡県', region: '九州' },
  { code: '41', name: '佐賀県', region: '九州' },
  { code: '42', name: '長崎県', region: '九州' },
  { code: '43', name: '熊本県', region: '九州' },
  { code: '44', name: '大分県', region: '九州' },
  { code: '45', name: '宮崎県', region: '九州' },
  { code: '46', name: '鹿児島県', region: '九州' },
  { code: '47', name: '沖縄県', region: '九州' }
];

export const PREFECTURE_CODES: { [key: string]: string } = PREFECTURES.reduce((acc, pref) => {
  acc[pref.code] = pref.name;
  return acc;
}, {} as { [key: string]: string });

// 時間コード（年度）
export const TIME_CODES = [
  '00400205',  // 2025年
  '00400210',  // 2030年
  '00400215',  // 2035年
  '00400220',  // 2040年
  '00400225',  // 2045年
  '00400230',  // 2050年
];

// 年齢階級コード
export const AGE_GROUP_CODES: { [key: string]: string } = {
  '00301001': '0-4',
  '00301002': '5-9',
  '00301003': '10-14',
  '00301004': '15-19',
  '00301005': '20-24',
  '00301006': '25-29',
  '00301007': '30-34',
  '00301008': '35-39',
  '00301009': '40-44',
  '00301010': '45-49',
  '00301011': '50-54',
  '00301012': '55-59',
  '00301013': '60-64',
  '00301014': '65-69',
  '00301015': '70-74',
  '00301016': '75-79',
  '00301017': '80-84',
  '00301018': '85-89',
  '00301019': '90-94',
  '00301020': '95-99'
};