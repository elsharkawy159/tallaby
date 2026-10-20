/**
 * Default photos for section designs (owner request 2026-10-19): free Pexels
 * photos (https://www.pexels.com/license/, no attribution needed) picked per
 * store industry, so a new section already looks like the seller's kind of
 * store. Each is a path under `https://images.pexels.com/photos/`; designs read
 * them through `t.photo(i)` / `t.person(i)` and the seller replaces them.
 * Industry ids match the dashboard's `STORE_INDUSTRIES`.
 */

const PEXELS = "https://images.pexels.com/photos/";
const SIZE = "?auto=compress&cs=tinysrgb&w=1280";

const INDUSTRY_PHOTOS = {
  general: [
    "6214472/pexels-photo-6214472.jpeg",
    "1502219/pexels-photo-1502219.jpeg",
    "6567651/pexels-photo-6567651.jpeg",
    "6919423/pexels-photo-6919423.jpeg",
    "11952304/pexels-photo-11952304.jpeg",
    "12969358/pexels-photo-12969358.jpeg",
    "6567204/pexels-photo-6567204.jpeg",
    "9212993/pexels-photo-9212993.jpeg",
    "6214362/pexels-photo-6214362.jpeg",
    "25361524/pexels-photo-25361524.jpeg",
  ],
  fashion: [
    "6461400/pexels-photo-6461400.jpeg",
    "6833756/pexels-photo-6833756.jpeg",
    "8311880/pexels-photo-8311880.jpeg",
    "5236997/pexels-photo-5236997.jpeg",
    "12700583/pexels-photo-12700583.jpeg",
    "7778906/pexels-photo-7778906.jpeg",
    "8387127/pexels-photo-8387127.jpeg",
    "2680272/pexels-photo-2680272.jpeg",
    "8386651/pexels-photo-8386651.jpeg",
    "1343522/pexels-photo-1343522.jpeg",
  ],
  "shoes-bags": [
    "5560288/pexels-photo-5560288.jpeg",
    "9327162/pexels-photo-9327162.jpeg",
    "6650001/pexels-photo-6650001.jpeg",
    "7857501/pexels-photo-7857501.jpeg",
    "4901935/pexels-photo-4901935.jpeg",
    "37114398/pexels-photo-37114398.jpeg",
    "36933246/pexels-photo-36933246.jpeg",
    "37510228/pexels-photo-37510228.jpeg",
    "8117154/pexels-photo-8117154.jpeg",
    "27954772/pexels-photo-27954772.jpeg",
  ],
  electronics: [
    "16888144/pexels-photo-16888144.jpeg",
    "210927/pexels-photo-210927.jpeg",
    "4792720/pexels-photo-4792720.jpeg",
    "22307556/pexels-photo-22307556.jpeg",
    "10357005/pexels-photo-10357005.jpeg",
    "5650531/pexels-photo-5650531.jpeg",
    "1128207/pexels-photo-1128207.jpeg",
    "24346971/pexels-photo-24346971.jpeg",
    "38555192/pexels-photo-38555192.jpeg",
    "5269699/pexels-photo-5269699.jpeg",
  ],
  "mobile-accessories": [
    "33797659/pexels-photo-33797659.jpeg",
    "19557532/pexels-photo-19557532.jpeg",
    "374140/pexels-photo-374140.jpeg",
    "4072683/pexels-photo-4072683.jpeg",
    "3921817/pexels-photo-3921817.jpeg",
    "1670768/pexels-photo-1670768.jpeg",
    "3921707/pexels-photo-3921707.jpeg",
    "30981655/pexels-photo-30981655.jpeg",
    "215581/pexels-photo-215581.jpeg",
    "19557526/pexels-photo-19557526.jpeg",
  ],
  beauty: [
    "4482931/pexels-photo-4482931.jpeg",
    "3736398/pexels-photo-3736398.jpeg",
    "6148/brush-makeup-make-up-brushes.jpg",
    "10873814/pexels-photo-10873814.jpeg",
    "6159660/pexels-photo-6159660.jpeg",
    "10221846/pexels-photo-10221846.jpeg",
    "324656/pexels-photo-324656.jpeg",
    "14490634/pexels-photo-14490634.jpeg",
    "39200939/pexels-photo-39200939.jpeg",
    "4239013/pexels-photo-4239013.jpeg",
  ],
  home: [
    "19836830/pexels-photo-19836830.jpeg",
    "6492395/pexels-photo-6492395.jpeg",
    "6580377/pexels-photo-6580377.jpeg",
    "276746/pexels-photo-276746.jpeg",
    "36777507/pexels-photo-36777507.jpeg",
    "9566051/pexels-photo-9566051.jpeg",
    "8082211/pexels-photo-8082211.jpeg",
    "7546648/pexels-photo-7546648.jpeg",
    "6970052/pexels-photo-6970052.jpeg",
    "18436011/pexels-photo-18436011.jpeg",
  ],
  kitchen: [
    "18071814/pexels-photo-18071814.jpeg",
    "15245005/pexels-photo-15245005.jpeg",
    "7166645/pexels-photo-7166645.jpeg",
    "6612594/pexels-photo-6612594.jpeg",
    "7168051/pexels-photo-7168051.jpeg",
    "29462835/pexels-photo-29462835.jpeg",
    "7045356/pexels-photo-7045356.jpeg",
    "4820811/pexels-photo-4820811.jpeg",
    "6527057/pexels-photo-6527057.jpeg",
    "16770951/pexels-photo-16770951.png",
  ],
  food: [
    "19811257/pexels-photo-19811257.jpeg",
    "7363085/pexels-photo-7363085.jpeg",
    "2101261/pexels-photo-2101261.jpeg",
    "18656839/pexels-photo-18656839.jpeg",
    "1656664/pexels-photo-1656664.jpeg",
    "8900035/pexels-photo-8900035.jpeg",
    "1192031/pexels-photo-1192031.jpeg",
    "39353245/pexels-photo-39353245.jpeg",
    "3987257/pexels-photo-3987257.jpeg",
    "7677886/pexels-photo-7677886.jpeg",
  ],
  sweets: [
    "18784859/pexels-photo-18784859.jpeg",
    "459489/pexels-photo-459489.jpeg",
    "8927931/pexels-photo-8927931.jpeg",
    "37588429/pexels-photo-37588429.jpeg",
    "15794013/pexels-photo-15794013.jpeg",
    "997670/pexels-photo-997670.jpeg",
    "4113305/pexels-photo-4113305.jpeg",
    "34587985/pexels-photo-34587985.jpeg",
    "31132630/pexels-photo-31132630.jpeg",
    "111159/pexels-photo-111159.jpeg",
  ],
  kids: [
    "6974751/pexels-photo-6974751.jpeg",
    "5275834/pexels-photo-5275834.jpeg",
    "32950999/pexels-photo-32950999.jpeg",
    "19599235/pexels-photo-19599235.jpeg",
    "19916130/pexels-photo-19916130.jpeg",
    "3661452/pexels-photo-3661452.jpeg",
    "32950998/pexels-photo-32950998.jpeg",
    "691125/pexels-photo-691125.jpeg",
    "189530/pexels-photo-189530.jpeg",
    "39485366/pexels-photo-39485366.jpeg",
  ],
  sports: [
    "25596879/pexels-photo-25596879.jpeg",
    "6740821/pexels-photo-6740821.jpeg",
    "3838705/pexels-photo-3838705.jpeg",
    "19146676/pexels-photo-19146676.jpeg",
    "40006615/pexels-photo-40006615.jpeg",
    "4931355/pexels-photo-4931355.jpeg",
    "32610333/pexels-photo-32610333.jpeg",
    "17979564/pexels-photo-17979564.jpeg",
    "8032748/pexels-photo-8032748.jpeg",
    "18618012/pexels-photo-18618012.jpeg",
  ],
  jewelry: [
    "5301351/pexels-photo-5301351.jpeg",
    "30094119/pexels-photo-30094119.jpeg",
    "7509916/pexels-photo-7509916.jpeg",
    "17261921/pexels-photo-17261921.jpeg",
    "13155693/pexels-photo-13155693.jpeg",
    "1697570/pexels-photo-1697570.jpeg",
    "9888084/pexels-photo-9888084.jpeg",
    "10421147/pexels-photo-10421147.jpeg",
    "7314460/pexels-photo-7314460.jpeg",
    "28697832/pexels-photo-28697832.jpeg",
  ],
  books: [
    "8762862/pexels-photo-8762862.jpeg",
    "12914430/pexels-photo-12914430.jpeg",
    "6001451/pexels-photo-6001451.jpeg",
    "11124936/pexels-photo-11124936.jpeg",
    "8045884/pexels-photo-8045884.jpeg",
    "34511907/pexels-photo-34511907.jpeg",
    "4866043/pexels-photo-4866043.jpeg",
    "5861185/pexels-photo-5861185.jpeg",
    "32046500/pexels-photo-32046500.jpeg",
    "5412111/pexels-photo-5412111.jpeg",
  ],
  health: [
    "7615558/pexels-photo-7615558.jpeg",
    "14797864/pexels-photo-14797864.jpeg",
    "8436608/pexels-photo-8436608.jpeg",
    "16903641/pexels-photo-16903641.jpeg",
    "21759177/pexels-photo-21759177.jpeg",
    "3873139/pexels-photo-3873139.jpeg",
    "14253964/pexels-photo-14253964.jpeg",
    "34930123/pexels-photo-34930123.jpeg",
    "3683049/pexels-photo-3683049.jpeg",
    "33394245/pexels-photo-33394245.jpeg",
  ],
  pets: [
    "144608/pexels-photo-144608.jpeg",
    "33585484/pexels-photo-33585484.jpeg",
    "8434633/pexels-photo-8434633.jpeg",
    "38333259/pexels-photo-38333259.jpeg",
    "20680840/pexels-photo-20680840.jpeg",
    "39495643/pexels-photo-39495643.jpeg",
    "6568950/pexels-photo-6568950.jpeg",
    "5264088/pexels-photo-5264088.jpeg",
    "30917362/pexels-photo-30917362.jpeg",
    "34345889/pexels-photo-34345889.jpeg",
  ],
  auto: [
    "34442582/pexels-photo-34442582.jpeg",
    "32560104/pexels-photo-32560104.jpeg",
    "4713816/pexels-photo-4713816.jpeg",
    "17029940/pexels-photo-17029940.jpeg",
    "39934707/pexels-photo-39934707.jpeg",
    "19477337/pexels-photo-19477337.jpeg",
    "40046439/pexels-photo-40046439.jpeg",
    "39993827/pexels-photo-39993827.jpeg",
    "39934744/pexels-photo-39934744.jpeg",
    "39813049/pexels-photo-39813049.jpeg",
  ],
  handmade: [
    "27782862/pexels-photo-27782862.jpeg",
    "1303087/pexels-photo-1303087.jpeg",
    "27837173/pexels-photo-27837173.jpeg",
    "17796/christmas-xmas-gifts-presents.jpg",
    "20362433/pexels-photo-20362433.jpeg",
    "1666070/pexels-photo-1666070.jpeg",
    "4898085/pexels-photo-4898085.jpeg",
    "6334697/pexels-photo-6334697.jpeg",
    "35996127/pexels-photo-35996127.jpeg",
    "3873488/pexels-photo-3873488.jpeg",
  ],
} as const;

/** Shop owners, teams and packing: the same for every industry. */
const PEOPLE_PHOTOS = [
  "39910848/pexels-photo-39910848.jpeg",
  "39351270/pexels-photo-39351270.jpeg",
  "34674788/pexels-photo-34674788.jpeg",
  "7709141/pexels-photo-7709141.jpeg",
  "8475169/pexels-photo-8475169.jpeg",
  "7289724/pexels-photo-7289724.jpeg",
  "3933017/pexels-photo-3933017.jpeg",
  "8867198/pexels-photo-8867198.jpeg",
  "5934226/pexels-photo-5934226.jpeg",
  "7674972/pexels-photo-7674972.jpeg",
] as const;

export type StockIndustry = keyof typeof INDUSTRY_PHOTOS;
export const STOCK_INDUSTRIES = Object.keys(INDUSTRY_PHOTOS) as StockIndustry[];

const full = (path: string) => `${PEXELS}${path}${SIZE}`;

function isIndustry(value: string | undefined): value is StockIndustry {
  return !!value && value in INDUSTRY_PHOTOS;
}

/** Photo `index` of the industry's set (`general` for an unknown industry); wraps around. */
export function stockPhoto(industry: string | undefined, index: number): string {
  const set = INDUSTRY_PHOTOS[isIndustry(industry) ? industry : "general"];
  return full(set[Math.abs(index) % set.length]!);
}

/** A people photo (owner, team, packing); wraps around. */
export function peoplePhoto(index: number): string {
  return full(PEOPLE_PHOTOS[Math.abs(index) % PEOPLE_PHOTOS.length]!);
}
