/** 人员测试数据生成的纯逻辑，不触碰 DOM */

export const PERSON_FIELDS = [
	'name',
	'gender',
	'birthday',
	'idCard',
	'phone',
	'email',
	'address',
	'bankCard',
] as const;

export type PersonField = (typeof PERSON_FIELDS)[number];

export type Person = Partial<Record<PersonField, string>>;

export const FIELD_LABELS: Record<PersonField, string> = {
	name: '姓名',
	gender: '性别',
	birthday: '出生日期',
	idCard: '身份证号',
	phone: '手机号',
	email: '邮箱',
	address: '地址',
	bankCard: '银行卡号',
};

export const MAX_COUNT = 1000;

const SURNAMES =
	'王李张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段钱汤尹黎易常武乔贺赖龚文';
const GIVEN_NAMES =
	'伟芳娜敏静强磊军洋勇艳杰娟涛明超霞平刚桂洁梅英辉燕丽丹雪宁琳玉浩颖鑫博宇轩晨阳睿彤佳嘉禾安然';

const PROVINCES = [
	'北京市',
	'上海市',
	'广东省',
	'江苏省',
	'浙江省',
	'山东省',
	'河南省',
	'四川省',
	'湖北省',
	'福建省',
	'湖南省',
	'安徽省',
	'河北省',
	'陕西省',
	'江西省',
	'重庆市',
	'辽宁省',
	'黑龙江省',
	'山西省',
	'贵州省',
	'云南省',
	'甘肃省',
	'海南省',
	'青海省',
];

const CITY_CHARS = '北上广深成杭武南重西苏天郑长青沈宁昆合福厦济';
const STREET_SUFFIX = ['路', '街', '巷', '大道'];
const BUILDING_SUFFIX = ['大厦', '小区', '花园', '公寓', '广场'];

/** 前 6 位行政区划码，取真实存在的市辖区，避免生成校验通过但地区码不存在的号 */
const AREA_CODES = [
	'110101', '110105', '110108', '310101', '310104', '310106', '310110',
	'440103', '440104', '440106', '440305', '440306', '320102', '320105',
	'320106', '330102', '330105', '330106', '420102', '420106', '510104',
	'510107', '610103', '610113', '500103', '500105', '120101', '120102',
];

/** 三大运营商在用号段 */
const PHONE_PREFIX = [
	'134', '135', '136', '137', '138', '139', '147', '150', '151', '152',
	'157', '158', '159', '178', '182', '183', '184', '187', '188',
	'130', '131', '132', '145', '155', '156', '166', '175', '176', '185', '186',
	'133', '149', '153', '173', '177', '180', '181', '189', '199',
];

const EMAIL_DOMAINS = ['qq.com', '163.com', '126.com', 'gmail.com', 'outlook.com', 'foxmail.com'];

const BANK_BINS = [
	'622202', '622848', '622700', '621661', '622588', '622609',
	'622262', '622666', '621226', '623020',
];

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(list: readonly T[]): T {
	return list[randomInt(0, list.length - 1)];
}

function pickChar(text: string): string {
	return text.charAt(randomInt(0, text.length - 1));
}

export function randomName(): string {
	const given = Array.from({ length: randomInt(1, 2) }, () => pickChar(GIVEN_NAMES)).join('');
	return pickChar(SURNAMES) + given;
}

export function randomAddress(): string {
	const city = `${pickChar(CITY_CHARS)}${pickChar(CITY_CHARS)}市`;
	const district = `${pickChar(CITY_CHARS)}${pickChar(CITY_CHARS)}区`;
	const street = `${pickChar(CITY_CHARS)}${pickChar(CITY_CHARS)}${pick(STREET_SUFFIX)}`;
	const building = `${pickChar(CITY_CHARS)}${pickChar(CITY_CHARS)}${pick(BUILDING_SUFFIX)}`;
	return `${pick(PROVINCES)}${city}${district}${street}${randomInt(1, 999)}号${building}${randomInt(1, 20)}栋${randomInt(101, 2999)}室`;
}

function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function randomBirthday(startYear = 1960, endYear = 2005): string {
	const year = randomInt(startYear, endYear);
	const month = randomInt(1, 12);
	const day = randomInt(1, daysInMonth(year, month));
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

export function idCardCheckCode(first17: string): string {
	const sum = first17
		.split('')
		.reduce((total, char, index) => total + Number(char) * ID_WEIGHTS[index], 0);
	return ID_CHECK_CODES[sum % 11];
}

/** 第 17 位奇数为男、偶数为女，所以身份证与性别必须一起生成才不会自相矛盾 */
export function makeIdCard(birthday: string, male: boolean): string {
	const compact = birthday.replace(/-/g, '');
	const sequence = randomInt(0, 99) * 10 + (male ? randomInt(0, 4) * 2 + 1 : randomInt(0, 4) * 2);
	const first17 = pick(AREA_CODES) + compact + String(sequence).padStart(3, '0');
	return first17 + idCardCheckCode(first17);
}

export function luhnCheckDigit(prefix: string): string {
	let sum = 0;
	let double = true;
	for (let i = prefix.length - 1; i >= 0; i -= 1) {
		let digit = Number(prefix[i]);
		if (double) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
		double = !double;
	}
	return String((10 - (sum % 10)) % 10);
}

export function makeBankCard(): string {
	const length = randomInt(16, 19);
	let body = pick(BANK_BINS);
	while (body.length < length - 1) body += randomInt(0, 9);
	return body + luhnCheckDigit(body);
}

export function makePhone(): string {
	return pick(PHONE_PREFIX) + String(randomInt(0, 99999999)).padStart(8, '0');
}

export function makeEmail(): string {
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	const name = Array.from({ length: randomInt(5, 9) }, () => pickChar(letters)).join('');
	return `${name}${randomInt(1, 999)}@${pick(EMAIL_DOMAINS)}`;
}

export function generatePeople(count: number, fields: readonly PersonField[]): Person[] {
	const size = Math.min(Math.max(Math.trunc(count) || 0, 1), MAX_COUNT);
	const wanted = new Set(fields);

	return Array.from({ length: size }, () => {
		const male = Math.random() < 0.5;
		const birthday = randomBirthday();
		const person: Person = {};

		if (wanted.has('name')) person.name = randomName();
		if (wanted.has('gender')) person.gender = male ? '男' : '女';
		if (wanted.has('birthday')) person.birthday = birthday;
		if (wanted.has('idCard')) person.idCard = makeIdCard(birthday, male);
		if (wanted.has('phone')) person.phone = makePhone();
		if (wanted.has('email')) person.email = makeEmail();
		if (wanted.has('address')) person.address = randomAddress();
		if (wanted.has('bankCard')) person.bankCard = makeBankCard();

		return person;
	});
}

function csvCell(value: string): string {
	return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(people: Person[], fields: readonly PersonField[]): string {
	const header = fields.map((field) => FIELD_LABELS[field]).join(',');
	const rows = people.map((person) =>
		fields.map((field) => csvCell(person[field] ?? '')).join(','),
	);
	return [header, ...rows].join('\n');
}
