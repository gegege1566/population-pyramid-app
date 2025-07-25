import { CoopMemberData, AgeCompositionConfig } from '../types/coopMember';
import { PopulationData } from '../types/population';

export class CoopMemberService {
  private static instance: CoopMemberService;
  private ageCompositionConfig: AgeCompositionConfig;
  private prefectureMembers: Map<string, number>;

  private constructor() {
    // デフォルトの年齢構成比データ
    this.ageCompositionConfig = {
      compositions: [
        { ageGroup: '20-24', percentage: 0.66, estimatedMembers: 136000 },
        { ageGroup: '25-29', percentage: 0.74, estimatedMembers: 151000 },
        { ageGroup: '30-34', percentage: 3.95, estimatedMembers: 810000 },
        { ageGroup: '35-39', percentage: 4.45, estimatedMembers: 911000 },
        { ageGroup: '40-44', percentage: 7.31, estimatedMembers: 1497000 },
        { ageGroup: '45-49', percentage: 7.89, estimatedMembers: 1617000 },
        { ageGroup: '50-54', percentage: 10.86, estimatedMembers: 2225000 },
        { ageGroup: '55-59', percentage: 11.04, estimatedMembers: 2263000 },
        { ageGroup: '60-64', percentage: 12.37, estimatedMembers: 2534000 },
        { ageGroup: '65-69', percentage: 11.43, estimatedMembers: 2343000 },
        { ageGroup: '70-74', percentage: 11.40, estimatedMembers: 2336000 },
        { ageGroup: '75-79', percentage: 9.90, estimatedMembers: 2029000 },
        { ageGroup: '80-84', percentage: 3.85, estimatedMembers: 789000 },
        { ageGroup: '85-89', percentage: 2.47, estimatedMembers: 506000 },
        { ageGroup: '90-94', percentage: 1.20, estimatedMembers: 247000 },
        { ageGroup: '95-99', percentage: 0.38, estimatedMembers: 78000 }
      ],
      lastUpdated: new Date().toISOString()
    };

    // 都道府県別組合員数データ
    this.prefectureMembers = new Map([
      ['00000', 20491000], // 全国
      ['01', 2000000], // 北海道
      ['02', 161337], // 青森県
      ['03', 292156], // 岩手県
      ['04', 982602], // 宮城県
      ['05', 170000], // 秋田県
      ['06', 162062], // 山形県
      ['07', 346000], // 福島県
      ['08', 410000], // 茨城県
      ['09', 284000], // 栃木県
      ['10', 357000], // 群馬県
      ['11', 720000], // 埼玉県
      ['12', 610000], // 千葉県
      ['13', 2579432], // 東京都
      ['14', 1380000], // 神奈川県
      ['15', 243000], // 新潟県
      ['16', 85000], // 富山県
      ['17', 135000], // 石川県
      ['18', 360000], // 福井県
      ['19', 80000], // 山梨県
      ['20', 342000], // 長野県
      ['21', 290000], // 岐阜県
      ['22', 290000], // 静岡県
      ['23', 750000], // 愛知県
      ['24', 210000], // 三重県
      ['25', 140000], // 滋賀県
      ['26', 440000], // 京都府
      ['27', 900000], // 大阪府
      ['28', 1712578], // 兵庫県
      ['29', 265000], // 奈良県
      ['30', 140000], // 和歌山県
      ['31', 45000], // 鳥取県
      ['32', 65000], // 島根県
      ['33', 343070], // 岡山県
      ['34', 340000], // 広島県
      ['35', 200000], // 山口県
      ['36', 60000], // 徳島県
      ['37', 240000], // 香川県
      ['38', 240000], // 愛媛県
      ['39', 70000], // 高知県
      ['40', 566000], // 福岡県
      ['41', 70000], // 佐賀県
      ['42', 225000], // 長崎県
      ['43', 149000], // 熊本県
      ['44', 186000], // 大分県
      ['45', 271806], // 宮崎県
      ['46', 343000], // 鹿児島県
      ['47', 240000] // 沖縄県
    ]);

    // LocalStorageから保存された設定を読み込む
    this.loadAgeCompositionConfig();
  }

  static getInstance(): CoopMemberService {
    if (!CoopMemberService.instance) {
      CoopMemberService.instance = new CoopMemberService();
    }
    return CoopMemberService.instance;
  }

  // 年齢構成比設定を取得
  getAgeCompositionConfig(): AgeCompositionConfig {
    return this.ageCompositionConfig;
  }

  // 年齢構成比設定を更新
  updateAgeCompositionConfig(config: AgeCompositionConfig): void {
    this.ageCompositionConfig = config;
    this.saveAgeCompositionConfig();
  }

  // LocalStorageから設定を読み込む
  private loadAgeCompositionConfig(): void {
    const saved = localStorage.getItem('coopMemberAgeComposition');
    if (saved) {
      try {
        this.ageCompositionConfig = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load age composition config:', e);
      }
    }
  }

  // LocalStorageに設定を保存
  private saveAgeCompositionConfig(): void {
    try {
      localStorage.setItem('coopMemberAgeComposition', JSON.stringify(this.ageCompositionConfig));
    } catch (e) {
      console.error('Failed to save age composition config:', e);
    }
  }

  // 都道府県別の組合員データを取得（年齢階級別）
  async getCoopMemberData(prefectureCode: string, year: number = 2025): Promise<CoopMemberData[]> {
    // 2030年以降は推計データを読み込み
    if (year >= 2030) {
      return await this.loadProjectedData(year, prefectureCode);
    }
    
    // 2025年は既存の計算ロジックを使用
    const totalMembers = this.prefectureMembers.get(prefectureCode) || 0;
    if (totalMembers === 0) return [];

    const result: CoopMemberData[] = [];
    
    // 人口ピラミッドの年齢階級（0-4歳から100歳以上まで）
    const populationAgeGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99', '100歳以上'
    ];

    populationAgeGroups.forEach(ageGroup => {
      // 20歳未満と100歳以上は0として扱う
      if (ageGroup === '0-4' || ageGroup === '5-9' || ageGroup === '10-14' || ageGroup === '15-19' || ageGroup === '100歳以上') {
        result.push({
          year,
          prefecture: this.getPrefectureName(prefectureCode),
          prefectureCode,
          ageGroup,
          memberCount: 0
        });
      } else if (ageGroup === '95-99') {
        // 95-99歳の組合員数を正しく計算
        const composition = this.ageCompositionConfig.compositions.find(c => c.ageGroup === ageGroup);
        if (composition) {
          // 都道府県の総組合員数に構成比を適用して千人単位に変換
          const memberCount = (totalMembers * composition.percentage / 100) / 1000;
          result.push({
            year,
            prefecture: this.getPrefectureName(prefectureCode),
            prefectureCode,
            ageGroup,
            memberCount: Math.round(memberCount * 10) / 10 // 小数点1位まで
          });
        }
      } else if (ageGroup === '90-94') {
        // 90-94歳の組合員数を正しく計算
        const composition = this.ageCompositionConfig.compositions.find(c => c.ageGroup === ageGroup);
        if (composition) {
          // 都道府県の総組合員数に構成比を適用して千人単位に変換
          const memberCount = (totalMembers * composition.percentage / 100) / 1000;
          result.push({
            year,
            prefecture: this.getPrefectureName(prefectureCode),
            prefectureCode,
            ageGroup,
            memberCount: Math.round(memberCount * 10) / 10 // 小数点1位まで
          });
        }
      } else {
        // 対応する年齢構成比を取得
        const composition = this.ageCompositionConfig.compositions.find(c => c.ageGroup === ageGroup);
        if (composition) {
          // 都道府県の総組合員数に構成比を適用して千人単位に変換
          const memberCount = (totalMembers * composition.percentage / 100) / 1000;
          result.push({
            year,
            prefecture: this.getPrefectureName(prefectureCode),
            prefectureCode,
            ageGroup,
            memberCount: Math.round(memberCount * 10) / 10 // 小数点1位まで
          });
        }
      }
    });

    return result;
  }

  // 推計データを読み込み
  private async loadProjectedData(year: number, prefectureCode: string = '00000'): Promise<CoopMemberData[]> {
    try {
      // ファイル名を決定
      const filePrefix = prefectureCode === '00000' ? 'national' : prefectureCode;
      const response = await fetch(`/data/coop-members/coop_members_${filePrefix}_${year}.json`);
      
      if (!response.ok) {
        // 都道府県のデータが見つからない場合は空配列を返す
        if (prefectureCode !== '00000') {
          console.warn(`Prefecture projection data not found for ${this.getPrefectureName(prefectureCode)} (${year})`);
          return [];
        }
        throw new Error(`Failed to load projected data for ${year}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading projected data for ${this.getPrefectureName(prefectureCode)} (${year}):`, error);
      return [];
    }
  }

  // 複数都道府県の組合員データを合算取得（年齢階級別）
  async getMultipleCoopMemberData(prefectureCodes: string[], year: number = 2025): Promise<CoopMemberData[]> {
    if (prefectureCodes.length === 0) return [];
    
    // 単一都道府県の場合は既存メソッドを使用
    if (prefectureCodes.length === 1) {
      return await this.getCoopMemberData(prefectureCodes[0], year);
    }

    // 複数都道府県の場合は合算
    const result: CoopMemberData[] = [];
    const combinedPrefectureName = `${prefectureCodes.length}地域選択`;
    
    // 人口ピラミッドの年齢階級（0-4歳から100歳以上まで）
    const populationAgeGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99', '100歳以上'
    ];

    for (const ageGroup of populationAgeGroups) {
      let totalMemberCount = 0;

      // 各都道府県の組合員数を合算
      for (const prefCode of prefectureCodes) {
        const prefData = await this.getCoopMemberData(prefCode, year);
        const ageData = prefData.find(d => d.ageGroup === ageGroup);
        if (ageData) {
          totalMemberCount += ageData.memberCount;
        }
      }

      result.push({
        year,
        prefecture: combinedPrefectureName,
        prefectureCode: prefectureCodes.join(','), // 複数コードをカンマ区切りで保存
        ageGroup,
        memberCount: Math.round(totalMemberCount * 10) / 10 // 小数点1位まで
      });
    }

    return result;
  }

  // 都道府県コードから都道府県名を取得
  private getPrefectureName(prefectureCode: string): string {
    const prefectureMap: { [key: string]: string } = {
      '00000': '全国',
      '01': '北海道',
      '02': '青森県',
      '03': '岩手県',
      '04': '宮城県',
      '05': '秋田県',
      '06': '山形県',
      '07': '福島県',
      '08': '茨城県',
      '09': '栃木県',
      '10': '群馬県',
      '11': '埼玉県',
      '12': '千葉県',
      '13': '東京都',
      '14': '神奈川県',
      '15': '新潟県',
      '16': '富山県',
      '17': '石川県',
      '18': '福井県',
      '19': '山梨県',
      '20': '長野県',
      '21': '岐阜県',
      '22': '静岡県',
      '23': '愛知県',
      '24': '三重県',
      '25': '滋賀県',
      '26': '京都府',
      '27': '大阪府',
      '28': '兵庫県',
      '29': '奈良県',
      '30': '和歌山県',
      '31': '鳥取県',
      '32': '島根県',
      '33': '岡山県',
      '34': '広島県',
      '35': '山口県',
      '36': '徳島県',
      '37': '香川県',
      '38': '愛媛県',
      '39': '高知県',
      '40': '福岡県',
      '41': '佐賀県',
      '42': '長崎県',
      '43': '熊本県',
      '44': '大分県',
      '45': '宮崎県',
      '46': '鹿児島県',
      '47': '沖縄県'
    };
    return prefectureMap[prefectureCode] || '';
  }

  // 将来年度の組合員数を推計
  async generateFutureProjections(): Promise<void> {
    console.log('組合員数将来推計を開始します...');
    
    try {
      // 基準年(2025年)の人口データを読み込み
      const basePopulationData = await this.loadPopulationData(2025);
      const baseShareRates = await this.calculateBaseShareRates(basePopulationData);
      
      // 各年度の推計を実行
      const futureYears = [2030, 2035, 2040, 2045, 2050];
      
      for (const year of futureYears) {
        console.log(`${year}年の推計を実行中...`);
        
        // 人口データを読み込み
        const populationData = await this.loadPopulationData(year);
        const previousYearData = year === 2030 ? null : await this.loadPopulationData(year - 5);
        
        // 全都道府県の推計を実行
        const allPrefectures = Array.from(this.prefectureMembers.keys());
        
        for (const prefectureCode of allPrefectures) {
          await this.calculateFutureMembers(
            prefectureCode,
            year,
            populationData,
            previousYearData,
            baseShareRates
          );
          
          // データを保存（実際のファイル保存は省略、コンソール出力のみ）
          console.log(`${this.getPrefectureName(prefectureCode)}(${year}年)の推計完了`);
        }
      }
      
      console.log('組合員数将来推計が完了しました');
    } catch (error) {
      console.error('推計処理でエラーが発生しました:', error);
    }
  }

  // 人口データを読み込み
  private async loadPopulationData(year: number): Promise<PopulationData[]> {
    // 実際の実装では、年度に応じて適切なファイルを読み込む
    // ここでは簡易的な実装として空配列を返す
    console.log(`${year}年の人口データを読み込み中...`);
    return [];
  }

  // 基準年のシェア率を計算
  private async calculateBaseShareRates(populationData: PopulationData[]): Promise<Map<string, Map<string, number>>> {
    const shareRates = new Map<string, Map<string, number>>();
    
    // 各都道府県・年齢階層のシェア率を計算
    const prefectureCodes = Array.from(this.prefectureMembers.keys());
    
    for (const prefectureCode of prefectureCodes) {
      const prefShareRates = new Map<string, number>();
      const memberData = await this.getCoopMemberData(prefectureCode, 2025);
      
      memberData.forEach(member => {
        // 対応する人口データを検索
        const populationItem = populationData.find(p => 
          p.prefectureCode === prefectureCode && 
          p.ageGroup === member.ageGroup
        );
        
        if (populationItem) {
          // 人口データの単位調整（全国は実人数、都道府県は千人単位）
          const population = prefectureCode === '00000' 
            ? populationItem.population / 1000  // 全国データは千人単位に変換
            : populationItem.population;         // 都道府県データはそのまま
          
          const shareRate = population > 0 ? member.memberCount / population : 0;
          prefShareRates.set(member.ageGroup, shareRate);
        }
      });
      
      shareRates.set(prefectureCode, prefShareRates);
    }
    
    return shareRates;
  }

  // 将来の組合員数を計算
  private async calculateFutureMembers(
    prefectureCode: string,
    targetYear: number,
    populationData: PopulationData[],
    previousYearPopulation: PopulationData[] | null,
    baseShareRates: Map<string, Map<string, number>>
  ): Promise<CoopMemberData[]> {
    const result: CoopMemberData[] = [];
    const prefShareRates = baseShareRates.get(prefectureCode);
    
    if (!prefShareRates) return result;

    // 若年層の定義（新規加入でシェア率維持）
    const youngAgeGroups = ['20-24', '25-29', '30-34', '35-39'];
    
    // 全年齢階層について計算
    const allAgeGroups = [
      '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
      '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74',
      '75-79', '80-84', '85-89', '90-94', '95-99'
    ];

    for (const ageGroup of allAgeGroups) {
      let memberCount = 0;

      // 20歳未満は0
      if (['0-4', '5-9', '10-14', '15-19'].includes(ageGroup)) {
        memberCount = 0;
      }
      // 若年層：シェア率維持
      else if (youngAgeGroups.includes(ageGroup)) {
        const currentPopulation = this.getPopulationForAgeGroup(populationData, prefectureCode, ageGroup);
        const shareRate = prefShareRates.get(ageGroup) || 0;
        memberCount = currentPopulation * shareRate;
      }
      // 中高年層：繰り上がり + 減衰
      else {
        const previousAgeGroup = this.getPreviousAgeGroup(ageGroup);
        if (previousAgeGroup && targetYear > 2025) {
          // 前回年度の下位年齢階層の組合員数を取得（実装簡略化のため基準年データを使用）
          const previousMembers = await this.getCoopMemberData(prefectureCode, 2025);
          const previousMemberData = previousMembers.find(m => m.ageGroup === previousAgeGroup);
          
          if (previousMemberData && previousYearPopulation) {
            // 減衰率を計算
            const decayRate = this.calculateDecayRate(
              prefectureCode,
              previousAgeGroup,
              ageGroup,
              previousYearPopulation,
              populationData
            );
            
            memberCount = previousMemberData.memberCount * decayRate;
          }
        }
      }

      result.push({
        year: targetYear,
        prefecture: this.getPrefectureName(prefectureCode),
        prefectureCode,
        ageGroup,
        memberCount: Math.round(memberCount * 10) / 10
      });
    }

    return result;
  }

  // 減衰率を計算
  private calculateDecayRate(
    prefectureCode: string,
    fromAgeGroup: string,
    toAgeGroup: string,
    previousPopulation: PopulationData[],
    currentPopulation: PopulationData[]
  ): number {
    const fromPopulation = this.getPopulationForAgeGroup(previousPopulation, prefectureCode, fromAgeGroup);
    const toPopulation = this.getPopulationForAgeGroup(currentPopulation, prefectureCode, toAgeGroup);
    
    return fromPopulation > 0 ? toPopulation / fromPopulation : 0;
  }

  // 特定年齢階層の人口を取得
  private getPopulationForAgeGroup(populationData: PopulationData[], prefectureCode: string, ageGroup: string): number {
    const maleData = populationData.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === ageGroup && 
      p.gender === 'male'
    );
    
    const femaleData = populationData.find(p => 
      p.prefectureCode === prefectureCode && 
      p.ageGroup === ageGroup && 
      p.gender === 'female'
    );

    const malePopulation = maleData ? maleData.population : 0;
    const femalePopulation = femaleData ? femaleData.population : 0;
    
    // 全国データは実人数なので千人単位に変換、都道府県データはそのまま
    if (prefectureCode === '00000') {
      return (malePopulation + femalePopulation) / 1000;
    } else {
      return malePopulation + femalePopulation;
    }
  }

  // 前の年齢階層を取得
  private getPreviousAgeGroup(ageGroup: string): string | null {
    const ageGroupMap: { [key: string]: string } = {
      '25-29': '20-24',
      '30-34': '25-29',
      '35-39': '30-34',
      '40-44': '35-39',
      '45-49': '40-44',
      '50-54': '45-49',
      '55-59': '50-54',
      '60-64': '55-59',
      '65-69': '60-64',
      '70-74': '65-69',
      '75-79': '70-74',
      '80-84': '75-79',
      '85-89': '80-84',
      '90-94': '85-89',
      '95-99': '90-94'
    };
    
    return ageGroupMap[ageGroup] || null;
  }

  // 注意事項テキストを取得
  getNoticeText(): string {
    return `出典・注記:
- 日本生協連が公表する全国の組合員総数は 2024 年度で 30,802 千人（約 3,080 万人）ですが、ここには医療福祉生協・大学生協なども含まれます。購買生協だけに絞った今回の推定（約 2,050 万人）は、その 約 2/3 に当たります。
- 全国平均の世帯加入率は 39 % 前後ですが、人口ベースに置き換えると 16 % 台となり、地域差（北海道・兵庫・宮城など 30–40 % vs. 首都圏都市部 10 % 前後）が全国値を押し下げています。
- 都道府県別の組合員数は、各生協の最新公開値（2023〜25 年度）または世帯加入率からの推計値を用いています。
- 年齢階級別構成比：2024年度「全国生協組合員意識調査」回答データを人口按分で5歳刻みに再配分
- 2030年以降の推計：2025年基準の若年層シェア率維持＋既存組合員の年齢繰り上がり＋実際の人口変化率による減衰を適用`;
  }
}