import { PrefectureInfo } from '../types/population';

export const PREFECTURE_CODES: { [key: string]: string } = {
  '01': '北海道',   '02': '青森県',   '03': '岩手県',   '04': '宮城県',
  '05': '秋田県',   '06': '山形県',   '07': '福島県',   '08': '茨城県',
  '09': '栃木県',   '10': '群馬県',   '11': '埼玉県',   '12': '千葉県',
  '13': '東京都',   '14': '神奈川県', '15': '新潟県',   '16': '富山県',
  '17': '石川県',   '18': '福井県',   '19': '山梨県',   '20': '長野県',
  '21': '岐阜県',   '22': '静岡県',   '23': '愛知県',   '24': '三重県',
  '25': '滋賀県',   '26': '京都府',   '27': '大阪府',   '28': '兵庫県',
  '29': '奈良県',   '30': '和歌山県', '31': '鳥取県',   '32': '島根県',
  '33': '岡山県',   '34': '広島県',   '35': '山口県',   '36': '徳島県',
  '37': '香川県',   '38': '愛媛県',   '39': '高知県',   '40': '福岡県',
  '41': '佐賀県',   '42': '長崎県',   '43': '熊本県',   '44': '大分県',
  '45': '宮崎県',   '46': '鹿児島県', '47': '沖縄県'
};

export const PREFECTURES: PrefectureInfo[] = [
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

export const TIME_CODES: { [key: number]: string } = {
  2020: '1601',
  2021: '1301', 
  2022: '1701',
  2023: '1801',
  2024: '1901'
};

export const AGE_GROUP_CODES: { [key: string]: string } = {
  '01001': '0～4歳',    '01002': '5～9歳',    '01003': '10～14歳',
  '01004': '15～19歳',  '01005': '20～24歳',  '01006': '25～29歳',
  '01007': '30～34歳',  '01008': '35～39歳',  '01009': '40～44歳',
  '01010': '45～49歳',  '01011': '50～54歳',  '01012': '55～59歳',
  '01013': '60～64歳',  '01014': '65～69歳',  '01015': '70～74歳',
  '01016': '75～79歳',  '01017': '80～84歳',  '04018': '85歳以上'
};

export const GENDER_CODES: { [key: string]: string } = {
  '000': '男女計',
  '001': '男',
  '002': '女'
};