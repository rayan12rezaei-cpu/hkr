export const ROOMS = 48;

export const KHANS = [
  { index: 5,  n:1, title:'خوان نخست: شیر بیشه', stage:'grass', boss:'شیر بیشه', text:'از سیستان راهی مازندران شو؛ در این راه شیر و دشمنان راه را پشت سر بگذار.' },
  { index: 11, n:2, title:'خوان دوم: بیابان تشنه', stage:'desert', boss:'بیابان', text:'بیابان گرم و تشنه است؛ دشمنان راه را پشت سر بگذار و به آب و چشمه برس.' },
  { index: 18, n:3, title:'خوان سوم: اژدها', stage:'cave', boss:'اژدها', text:'در تاریکی غار، از کمین‌ها بگذر و راه اژدها را پیدا کن.' },
  { index: 25, n:4, title:'خوان چهارم: بزم جادو', stage:'garden', boss:'زن جادو', text:'در باغ فریب، ظاهر زیبا را باور نکن و راه خود را ادامه بده.' },
  { index: 32, n:5, title:'خوان پنجم: تاریکی و اولاد', stage:'night', boss:'اولاد', text:'از تاریکی شب بگذر و راه مازندران را از اولاد پیدا کن.' },
  { index: 39, n:6, title:'خوان ششم: ارژنگ دیو', stage:'mountain', boss:'ارژنگ دیو', text:'دروازه‌ی دیوان را بشکن و به زندان کاووس نزدیک شو.' },
  { index: 47, n:7, title:'خوان هفتم: دیو سپید', stage:'fortress', boss:'دیو سپید', text:'آخرین دروازه؛ غار دیو سپید در پیش است.' },
];

export const FORGES = [3, 14, 22, 35, 43];
export const WATERS = [10, 17, 24, 31, 38, 44];

export const STAGE_INFO = {
  grass:{sky1:'#b8733c',sky2:'#2d4038',ground:'#3a4a34',accent:'#d3aa5f'},
  desert:{sky1:'#d98e49',sky2:'#62412e',ground:'#8a6239',accent:'#e3c07b'},
  cave:{sky1:'#302b36',sky2:'#0c1116',ground:'#252c31',accent:'#9cb5a8'},
  garden:{sky1:'#8b8b65',sky2:'#274638',ground:'#28483a',accent:'#d8c07a'},
  night:{sky1:'#29324b',sky2:'#070b14',ground:'#171a24',accent:'#b9a58a'},
  mountain:{sky1:'#534e51',sky2:'#182127',ground:'#31363b',accent:'#c3b17e'},
  fortress:{sky1:'#43373d',sky2:'#0b0b0d',ground:'#211c20',accent:'#d6bf8e'},
};
