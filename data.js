// ============================================================
// data.js — 纯数据：坦克表、科技树、战术、地图模板、常量
// ============================================================

const RAW = [
{n:'一号A',na:'德',ty:'light',fp:8,fd:'8x2',s:37,p:12,a:14,at:48,ac:224},{n:'一号B',na:'德',ty:'light',fp:8,fd:'8x2',s:40,p:12,a:14,at:48,ac:245},{n:'一号C',na:'德',ty:'light',fp:8,fd:'8x2',s:79,p:31,a:30,at:48,ac:283},{n:'一号F',na:'德',ty:'light',fp:8,fd:'8x2',s:25,p:12,a:80,at:48,ac:458},{n:'一歼',na:'德',ty:'td',fp:47,fd:'47/43',s:40,p:64,a:14,at:220,ac:245},
{n:'二号A',na:'德',ty:'light',fp:20,fd:'20/55',s:40,p:40,a:15,at:60,ac:300},{n:'二号C',na:'德',ty:'light',fp:20,fd:'20/55',s:40,p:40,a:35,at:60,ac:300},{n:'二号F',na:'德',ty:'light',fp:20,fd:'20/60',s:40,p:41,a:35,at:75,ac:316},{n:'二号J',na:'德',ty:'light',fp:20,fd:'20/55',s:31,p:40,a:80,at:60,ac:424},{n:'二号L',na:'德',ty:'light',fp:20,fd:'20/60',s:60,p:41,a:30,at:75,ac:361},
{n:'35t',na:'德',ty:'light',fp:37,fd:'37/40',s:34,p:51,a:25,at:102,ac:332},{n:'38tA',na:'德',ty:'light',fp:37,fd:'37/48',s:42,p:80,a:30,at:176,ac:316},{n:'38tE',na:'德',ty:'light',fp:37,fd:'37/48',s:42,p:80,a:50,at:176,ac:316},{n:'黄鼠狼',na:'德',ty:'td',fp:75,fd:'75/46',s:42,p:129,a:50,at:608,ac:332},{n:'追猎者',na:'德',ty:'td',fp:75,fd:'75/48',s:40,p:176,a:69,at:640,ac:400},
{n:'三号A',na:'德',ty:'medium',fp:37,fd:'37/45',s:40,p:64,a:15,at:136,ac:436},{n:'三号D',na:'德',ty:'medium',fp:37,fd:'37/45',s:40,p:64,a:30,at:136,ac:447},{n:'三号F',na:'德',ty:'medium',fp:50,fd:'50/42',s:40,p:94,a:30,at:250,ac:447},{n:'三号H',na:'德',ty:'medium',fp:50,fd:'50/42',s:40,p:94,a:60,at:250,ac:469},{n:'三号J',na:'德',ty:'medium',fp:50,fd:'50/60',s:42,p:130,a:52,at:302,ac:469},{n:'三号L',na:'德',ty:'medium',fp:75,fd:'75/24',s:42,p:115,a:70,at:490,ac:480,heat:1},{n:'三突',na:'德',ty:'td',fp:75,fd:'75/48',s:40,p:176,a:124,at:640,ac:490},{n:'犀牛',na:'德',ty:'td',fp:88,fd:'88/71',s:42,p:289,a:30,at:864,ac:490},{n:'埃米尔',na:'德',ty:'td',fp:128,fd:'128/61',s:25,p:286,a:51,at:1768,ac:592},
{n:'小豹',na:'德',ty:'light',fp:50,fd:'50/60',s:60,p:130,a:125,at:302,ac:510},{n:'四号A',na:'德',ty:'medium',fp:75,fd:'75/24',s:31,p:57,a:15,at:490,ac:424},{n:'四号B',na:'德',ty:'medium',fp:75,fd:'75/24',s:39,p:115,a:31,at:490,ac:400,heat:1},{n:'四号E',na:'德',ty:'medium',fp:75,fd:'75/24',s:39,p:115,a:51,at:490,ac:458,heat:1},{n:'四号G',na:'德',ty:'medium',fp:75,fd:'75/43',s:39,p:173,a:81,at:562,ac:490},{n:'四号H',na:'德',ty:'medium',fp:75,fd:'75/48',s:42,p:176,a:81,at:640,ac:500},{n:'四突',na:'德',ty:'td',fp:75,fd:'75/48',s:38,p:176,a:144,at:640,ac:480},{n:'四歼',na:'德',ty:'td',fp:75,fd:'75/70',s:35,p:265,a:124,at:722,ac:510},{n:'灰熊',na:'德',ty:'td',fp:150,fd:'150/12',s:40,p:86,a:131,at:1322,ac:529},
{n:'D.W.2',na:'德',ty:'heavy',fp:75,fd:'75/24',s:35,p:57,a:51,at:490,ac:574},{n:'豹D',na:'德',ty:'medium',fp:75,fd:'75/70',s:55,p:265,a:139,at:722,ac:671},{n:'豹G',na:'德',ty:'medium',fp:75,fd:'75/70',s:46,p:265,a:148,at:722,ac:678},{n:'猎豹',na:'德',ty:'td',fp:88,fd:'88/71',s:55,p:289,a:139,at:864,ac:678},
{n:'虎式',na:'德',ty:'heavy',fp:88,fd:'88/56',s:45,p:237,a:102,at:774,ac:755},{n:'猎虎',na:'德',ty:'td',fp:128,fd:'128/55',s:34,p:271,a:259,at:1638,ac:843},{n:'突击虎',na:'德',ty:'td',fp:380,fd:'380/5',s:40,p:255,a:220,at:7562,ac:806},{n:'虎(P)',na:'德',ty:'heavy',fp:88,fd:'88/56',s:35,p:237,a:244,at:774,ac:775},{n:'象式',na:'德',ty:'td',fp:88,fd:'88/71',s:30,p:289,a:244,at:864,ac:837},{n:'虎王',na:'德',ty:'heavy',fp:88,fd:'88/71',s:42,p:289,a:220,at:864,ac:837},{n:'鼠式',na:'德',ty:'heavy',fp:128,fd:'128/55',s:23,p:271,a:348,at:1638,ac:1371},
{n:'M1917',na:'美',ty:'light',fp:8,fd:'8',s:15,p:12,a:16,at:24,ac:265},{n:'M1',na:'美',ty:'light',fp:13,fd:'13',s:72,p:22,a:17,at:39,ac:283},{n:'M1A2',na:'美',ty:'light',fp:13,fd:'13',s:72,p:22,a:17,at:39,ac:300},{n:'M2A3',na:'美',ty:'light',fp:13,fd:'13',s:58,p:22,a:17,at:39,ac:316},{n:'M2A4',na:'美',ty:'light',fp:37,fd:'37/42',s:58,p:60,a:17,at:136,ac:346},{n:'CTLS',na:'美',ty:'light',fp:13,fd:'13',s:53,p:22,a:25,at:39,ac:283},{n:'M22蝉',na:'美',ty:'light',fp:37,fd:'37/54',s:56,p:65,a:26,at:176,ac:283},{n:'M3轻坦',na:'美',ty:'light',fp:37,fd:'37/42',s:58,p:60,a:45,at:136,ac:361},{n:'M3轻坦A1',na:'美',ty:'light',fp:37,fd:'37/54',s:58,p:65,a:45,at:176,ac:361},
{n:'M6GMC',na:'美',ty:'td',fp:37,fd:'37/54',s:72,p:38,a:6,at:176,ac:173},{n:'M1GMC',na:'美',ty:'td',fp:57,fd:'57/50',s:72,p:75,a:6,at:324,ac:300},{n:'M3GMC',na:'美',ty:'td',fp:75,fd:'75/37',s:72,p:70,a:17,at:490,ac:300},{n:'M5',na:'美',ty:'light',fp:37,fd:'37/54',s:58,p:65,a:42,at:176,ac:387},{n:'M24霞飞',na:'美',ty:'light',fp:75,fd:'75/39',s:56,p:130,a:51,at:562,ac:424},
{n:'M2中坦',na:'美',ty:'medium',fp:37,fd:'37/54',s:42,p:65,a:47,at:176,ac:436},{n:'M2中坦A1',na:'美',ty:'medium',fp:37,fd:'37/54',s:42,p:65,a:47,at:176,ac:458},{n:'M3中坦',na:'美',ty:'medium',fp:75,fd:'75/31',s:42,p:85,a:59,at:422,ac:520},{n:'M3中坦A4',na:'美',ty:'medium',fp:75,fd:'75/39',s:42,p:92,a:59,at:562,ac:539},{n:'M7',na:'美',ty:'medium',fp:75,fd:'75/39',s:48,p:102,a:59,at:562,ac:500},
{n:'M4谢尔曼',na:'美',ty:'medium',fp:75,fd:'75/39',s:42,p:102,a:91,at:562,ac:548},{n:'M4谢尔曼A4',na:'美',ty:'medium',fp:75,fd:'75/39',s:40,p:102,a:91,at:562,ac:574},{n:'M4A3E8',na:'美',ty:'medium',fp:76,fd:'76/52',s:38,p:178,a:93,at:577,ac:583},{n:'M4A3E2',na:'美',ty:'medium',fp:76,fd:'76/52',s:35,p:178,a:149,at:577,ac:616},{n:'M4A3(105)',na:'美',ty:'medium',fp:105,fd:'105/23',s:40,p:102,a:93,at:722,ac:566,heat:1},{n:'M4/T26',na:'美',ty:'medium',fp:90,fd:'90/50',s:40,p:234,a:93,at:810,ac:574},{n:'萤火虫',na:'美',ty:'medium',fp:76,fd:'76/58',s:40,p:274,a:91,at:656,ac:592},
{n:'M10狼獾',na:'美',ty:'td',fp:76,fd:'76/50',s:51,p:178,a:66,at:504,ac:539},{n:'M18地狱猫',na:'美',ty:'td',fp:76,fd:'76/52',s:88,p:178,a:29,at:577,ac:424},{n:'M36杰克逊',na:'美',ty:'td',fp:90,fd:'90/50',s:48,p:234,a:66,at:810,ac:539},{n:'M36B1',na:'美',ty:'td',fp:90,fd:'90/50',s:48,p:234,a:93,at:810,ac:557},
{n:'M6',na:'美',ty:'heavy',fp:76,fd:'76/50',s:35,p:120,a:96,at:504,ac:755},{n:'M6A2E1',na:'美',ty:'heavy',fp:105,fd:'105/65',s:29,p:240,a:210,at:1102,ac:877},{n:'M26潘兴',na:'美',ty:'heavy',fp:90,fd:'90/50',s:40,p:234,a:147,at:810,ac:648},{n:'T29',na:'美',ty:'heavy',fp:105,fd:'105/65',s:35,p:282,a:174,at:1102,ac:800},{n:'T30',na:'美',ty:'heavy',fp:155,fd:'155/41',s:43,p:250,a:174,at:2102,ac:943},{n:'T34',na:'美',ty:'heavy',fp:120,fd:'120/60',s:42,p:345,a:174,at:1440,ac:806},{n:'T32',na:'美',ty:'heavy',fp:90,fd:'90/70',s:35,p:330,a:182,at:902,ac:735},{n:'T26E4超潘',na:'美',ty:'heavy',fp:90,fd:'90/70',s:38,p:330,a:205,at:902,ac:686},{n:'T28',na:'美',ty:'td',fp:105,fd:'105/65',s:13,p:240,a:305,at:1102,ac:927},
{n:'t-38',na:'苏',ty:'light',fp:8,fd:'8',s:40,p:12,a:10,at:24,ac:173},{n:'t-38T',na:'苏',ty:'light',fp:20,fd:'20/62',s:38,p:25,a:9,at:45,ac:173},{n:'t-40',na:'苏',ty:'light',fp:13,fd:'13',s:44,p:20,a:15,at:39,ac:245},{n:'t-40S',na:'苏',ty:'light',fp:20,fd:'20/82',s:40,p:26,a:20,at:60,ac:245},{n:'t-60',na:'苏',ty:'light',fp:20,fd:'20/82',s:45,p:26,a:21,at:60,ac:245},{n:'t-60A',na:'苏',ty:'light',fp:20,fd:'20/82',s:42,p:26,a:37,at:60,ac:245},{n:'t-70',na:'苏',ty:'light',fp:45,fd:'45/46',s:45,p:51,a:40,at:202,ac:300},{n:'t-70M',na:'苏',ty:'light',fp:45,fd:'45/46',s:48,p:95,a:52,at:202,ac:316},{n:'t-80',na:'苏',ty:'light',fp:45,fd:'45/46',s:45,p:95,a:52,at:202,ac:346},
{n:'t-26A',na:'苏',ty:'light',fp:37,fd:'37/45',s:32,p:31,a:13,at:136,ac:283},{n:'t-26B',na:'苏',ty:'light',fp:45,fd:'45/46',s:32,p:51,a:15,at:202,ac:300},{n:'t-26C',na:'苏',ty:'light',fp:45,fd:'45/46',s:30,p:95,a:20,at:202,ac:316},{n:'AT-1',na:'苏',ty:'td',fp:76,fd:'76/16',s:30,p:52,a:15,at:211,ac:316},
{n:'BT-2',na:'苏',ty:'light',fp:37,fd:'37/45',s:52,p:31,a:13,at:136,ac:332},{n:'BT-5',na:'苏',ty:'light',fp:45,fd:'45/46',s:52,p:51,a:13,at:202,ac:346},{n:'BT-7',na:'苏',ty:'light',fp:45,fd:'45/46',s:53,p:51,a:17,at:202,ac:374},{n:'BT-8',na:'苏',ty:'light',fp:45,fd:'45/46',s:62,p:95,a:17,at:202,ac:387},
{n:'t-50',na:'苏',ty:'light',fp:45,fd:'45/46',s:52,p:51,a:47,at:202,ac:374},{n:'t-50A',na:'苏',ty:'light',fp:45,fd:'45/46',s:48,p:95,a:72,at:202,ac:387},{n:'ZIS-30',na:'苏',ty:'td',fp:57,fd:'57/71',s:60,p:142,a:10,at:324,ac:200},
{n:'t-28B',na:'苏',ty:'medium',fp:76,fd:'76/17',s:45,p:30,a:33,at:260,ac:529},{n:'t-28E',na:'苏',ty:'medium',fp:76,fd:'76/26',s:30,p:55,a:66,at:372,ac:566},{n:'t-34/76-40',na:'苏',ty:'medium',fp:76,fd:'76/31',s:55,p:68,a:90,at:435,ac:520},{n:'t-34/76-41',na:'苏',ty:'medium',fp:76,fd:'76/42',s:54,p:75,a:90,at:577,ac:529},{n:'t-34/76E',na:'苏',ty:'medium',fp:76,fd:'76/42',s:45,p:75,a:120,at:577,ac:548},{n:'t-34/76-43',na:'苏',ty:'medium',fp:76,fd:'76/42',s:52,p:110,a:90,at:577,ac:539},{n:'t-43',na:'苏',ty:'medium',fp:76,fd:'76/42',s:50,p:110,a:131,at:577,ac:583},
{n:'t-34/85-43',na:'苏',ty:'medium',fp:85,fd:'85/52',s:53,p:105,a:90,at:640,ac:557},{n:'t-34/85-44',na:'苏',ty:'medium',fp:85,fd:'85/55',s:55,p:115,a:90,at:722,ac:566},{n:'t-34/85-45',na:'苏',ty:'medium',fp:85,fd:'85/55',s:50,p:165,a:90,at:722,ac:566},
{n:'t-34/57-41',na:'苏',ty:'medium',fp:57,fd:'57/71',s:54,p:142,a:90,at:324,ac:529},{n:'t-34/57-43',na:'苏',ty:'medium',fp:57,fd:'57/71',s:52,p:190,a:90,at:324,ac:539},{n:'t-34/100',na:'苏',ty:'medium',fp:100,fd:'100/54',s:48,p:160,a:90,at:1000,ac:574},
{n:'SU-122',na:'苏',ty:'td',fp:122,fd:'122/23',s:55,p:90,a:90,at:1040,ac:557},{n:'SU-85',na:'苏',ty:'td',fp:85,fd:'85/52',s:50,p:105,a:90,at:640,ac:548},{n:'SU-85M',na:'苏',ty:'td',fp:85,fd:'85/52',s:50,p:105,a:150,at:640,ac:557},{n:'SU-100',na:'苏',ty:'td',fp:100,fd:'100/54',s:48,p:160,a:150,at:1000,ac:574},{n:'SU-100Y',na:'苏',ty:'td',fp:130,fd:'130/50',s:35,p:230,a:60,at:1690,ac:762},
{n:'t-44',na:'苏',ty:'medium',fp:85,fd:'85/55',s:51,p:165,a:180,at:722,ac:566},{n:'t-44B',na:'苏',ty:'medium',fp:100,fd:'100/54',s:50,p:210,a:180,at:1000,ac:600},{n:'t-35',na:'苏',ty:'heavy',fp:76,fd:'76/17',s:30,p:30,a:31,at:260,ac:721},
{n:'SU-152',na:'苏',ty:'td',fp:152,fd:'152/29',s:43,p:141,a:87,at:1742,ac:678},
{n:'KV-1-39',na:'苏',ty:'heavy',fp:76,fd:'76/31',s:35,p:68,a:87,at:435,ac:663},{n:'KV-1-42',na:'苏',ty:'heavy',fp:76,fd:'76/42',s:32,p:75,a:87,at:577,ac:693},{n:'KV-1-E',na:'苏',ty:'heavy',fp:76,fd:'76/42',s:28,p:75,a:133,at:577,ac:721},{n:'KV-1-S',na:'苏',ty:'heavy',fp:76,fd:'76/42',s:45,p:75,a:87,at:577,ac:656},{n:'KV-13',na:'苏',ty:'heavy',fp:85,fd:'85/52',s:48,p:105,a:139,at:640,ac:592},{n:'KV-85',na:'苏',ty:'heavy',fp:85,fd:'85/52',s:40,p:105,a:87,at:640,ac:678},{n:'KV-2',na:'苏',ty:'heavy',fp:152,fd:'152/24',s:26,p:75,a:87,at:1612,ac:742},{n:'KV-3',na:'苏',ty:'heavy',fp:107,fd:'107/43',s:35,p:167,a:139,at:1040,ac:825},
{n:'IS-1',na:'苏',ty:'heavy',fp:85,fd:'85/52',s:37,p:105,a:139,at:640,ac:663},{n:'IS-2',na:'苏',ty:'heavy',fp:122,fd:'122/43',s:37,p:167,a:139,at:1488,ac:686},{n:'IS-3',na:'苏',ty:'heavy',fp:122,fd:'122/43',s:40,p:217,a:197,at:1488,ac:686},{n:'IS-4',na:'苏',ty:'heavy',fp:122,fd:'122/54',s:43,p:258,a:280,at:1612,ac:775},{n:'ISU-122',na:'苏',ty:'td',fp:122,fd:'122/43',s:37,p:174,a:120,at:1488,ac:678},{n:'ISU-152',na:'苏',ty:'td',fp:152,fd:'152/29',s:37,p:159,a:120,at:2310,ac:686},{n:'SU-76M',na:'苏',ty:'td',fp:76,fd:'76/42',s:45,p:75,a:36,at:577,ac:332},{n:'SU-57',na:'苏',ty:'td',fp:57,fd:'57/52',s:72,p:110,a:13,at:220,ac:300},
];
const TANKS = {};
RAW.forEach(t => { if(!TANKS[t.n]) TANKS[t.n] = t; });

const TREES = {
德: {'一号A':{lv:1,ch:['一号B','二号A']},'一号B':{lv:1.5,ch:['一号C','一号F','一歼']},'一号C':{lv:2,ch:[]},'一号F':{lv:3.5,ch:[]},'一歼':{lv:5.5,ch:[]},'二号A':{lv:2.5,ch:['二号C','35t','三号A']},'二号C':{lv:3,ch:['二号F','二号J']},'二号F':{lv:3.5,ch:['二号L']},'二号L':{lv:4,ch:[]},'二号J':{lv:6.5,ch:[]},'35t':{lv:5,ch:['38tA']},'38tA':{lv:6,ch:['38tE']},'38tE':{lv:7,ch:['黄鼠狼']},'黄鼠狼':{lv:11,ch:['追猎者']},'追猎者':{lv:11.5,ch:[]},'三号A':{lv:5.5,ch:['三号D','四号A']},'三号D':{lv:6.5,ch:['三号F']},'三号F':{lv:8,ch:['三号H']},'三号H':{lv:9,ch:['三号J']},'三号J':{lv:10,ch:['小豹','三号L']},'小豹':{lv:11.5,ch:[]},'三号L':{lv:11,ch:['三突']},'三突':{lv:12,ch:['犀牛']},'犀牛':{lv:13,ch:['埃米尔']},'埃米尔':{lv:13.5,ch:[]},'四号A':{lv:7,ch:['D.W.2','四号B']},'D.W.2':{lv:9.5,ch:[]},'四号B':{lv:9,ch:['四号E']},'四号E':{lv:10.5,ch:['四号G']},'四号G':{lv:11.5,ch:['四突','灰熊','四号H']},'四突':{lv:12,ch:[]},'灰熊':{lv:12,ch:[]},'四号H':{lv:12,ch:['四歼','豹D','虎式']},'四歼':{lv:12.5,ch:[]},'豹D':{lv:12.5,ch:['豹G']},'豹G':{lv:13.5,ch:['猎豹']},'猎豹':{lv:14,ch:[]},'虎式':{lv:13,ch:['虎(P)','虎王','猎虎','突击虎']},'虎(P)':{lv:13.5,ch:['象式']},'象式':{lv:14,ch:[]},'虎王':{lv:14,ch:['鼠式']},'鼠式':{lv:15,ch:[]},'猎虎':{lv:14.5,ch:[]},'突击虎':{lv:15,ch:[]}},
美: {'M1917':{lv:1,ch:['M1']},'M1':{lv:2,ch:['M1A2','M2A3']},'M1A2':{lv:2.5,ch:['CTLS']},'CTLS':{lv:3.5,ch:['M22蝉','M6GMC']},'M22蝉':{lv:5,ch:[]},'M6GMC':{lv:4,ch:['M1GMC']},'M1GMC':{lv:7,ch:['M3GMC']},'M3GMC':{lv:7.5,ch:[]},'M2A3':{lv:3,ch:['M2A4']},'M2A4':{lv:4,ch:['M3轻坦','M2中坦']},'M3轻坦':{lv:5,ch:['M3轻坦A1','M5']},'M3轻坦A1':{lv:6,ch:[]},'M5':{lv:7,ch:['M24霞飞']},'M24霞飞':{lv:9,ch:['M18地狱猫']},'M18地狱猫':{lv:10.5,ch:[]},'M2中坦':{lv:6,ch:['M2中坦A1']},'M2中坦A1':{lv:7,ch:['M3中坦']},'M3中坦':{lv:8,ch:['M7','M3中坦A4']},'M7':{lv:9.5,ch:[]},'M3中坦A4':{lv:9,ch:['M4谢尔曼']},'M4谢尔曼':{lv:10,ch:['M4谢尔曼A4','M4A3(105)','M10狼獾','M6']},'M4谢尔曼A4':{lv:10.5,ch:['萤火虫']},'萤火虫':{lv:12.5,ch:[]},'M4A3(105)':{lv:11,ch:['M4A3E8','M4/T26']},'M4A3E8':{lv:11.5,ch:['M4A3E2']},'M4A3E2':{lv:12,ch:[]},'M4/T26':{lv:12.5,ch:['M26潘兴']},'M26潘兴':{lv:13.5,ch:['T26E4超潘','T32']},'T26E4超潘':{lv:15,ch:[]},'T32':{lv:15,ch:[]},'M10狼獾':{lv:10.5,ch:['M36杰克逊']},'M36杰克逊':{lv:12,ch:['M36B1']},'M36B1':{lv:13,ch:['T29']},'T29':{lv:14,ch:['T30','T34','T28']},'T30':{lv:14.5,ch:[]},'T34':{lv:15,ch:[]},'T28':{lv:14.5,ch:[]},'M6':{lv:11.5,ch:['M6A2E1']},'M6A2E1':{lv:14.5,ch:[]}},
苏: {'t-38':{lv:1,ch:['t-38T','t-40']},'t-38T':{lv:1.5,ch:['t-26A','BT-2']},'t-26A':{lv:3.5,ch:['t-26B','t-28B']},'t-26B':{lv:4.5,ch:['t-26C','t-50','AT-1']},'t-26C':{lv:5.5,ch:[]},'t-50':{lv:6,ch:['t-50A']},'t-50A':{lv:7,ch:[]},'AT-1':{lv:5,ch:[]},'t-28B':{lv:5.5,ch:['t-28E','t-35','t-34/76-40']},'t-28E':{lv:8,ch:[]},'t-35':{lv:6.5,ch:['KV-1-39','SU-100Y']},'KV-1-39':{lv:9,ch:['KV-1-42']},'KV-1-42':{lv:10,ch:['KV-1-E','KV-1-S']},'KV-1-E':{lv:11,ch:[]},'KV-1-S':{lv:11,ch:['KV-13','SU-152']},'KV-13':{lv:11.5,ch:['KV-85','KV-3']},'KV-85':{lv:12,ch:['KV-2','IS-1']},'KV-2':{lv:12.5,ch:[]},'IS-1':{lv:12.5,ch:['IS-2','ISU-122','ISU-152']},'IS-2':{lv:13.5,ch:['IS-3']},'IS-3':{lv:14,ch:['IS-4']},'IS-4':{lv:15,ch:[]},'ISU-122':{lv:13,ch:[]},'ISU-152':{lv:15,ch:[]},'KV-3':{lv:13,ch:[]},'SU-152':{lv:11.5,ch:[]},'SU-100Y':{lv:12.5,ch:[]},'t-34/76-40':{lv:7.5,ch:['t-34/76-41']},'t-34/76-41':{lv:8.5,ch:['t-34/76E','t-34/76-43','t-34/57-41','t-34/85-43','SU-122']},'t-34/76E':{lv:9,ch:['t-43']},'t-34/76-43':{lv:9.5,ch:[]},'t-43':{lv:11,ch:[]},'t-34/57-41':{lv:9,ch:['t-34/57-43']},'t-34/57-43':{lv:10,ch:[]},'t-34/85-43':{lv:10.5,ch:['t-34/85-44']},'t-34/85-44':{lv:11,ch:['t-34/85-45']},'t-34/85-45':{lv:12,ch:['t-34/100','t-44']},'t-34/100':{lv:13,ch:[]},'t-44':{lv:13,ch:['t-44B']},'t-44B':{lv:15,ch:[]},'SU-122':{lv:9,ch:['SU-85']},'SU-85':{lv:9.5,ch:['SU-85M']},'SU-85M':{lv:10,ch:['SU-100']},'SU-100':{lv:11.5,ch:[]},'BT-2':{lv:3,ch:['BT-5']},'BT-5':{lv:4,ch:['BT-7']},'BT-7':{lv:4.5,ch:['BT-8']},'BT-8':{lv:5.5,ch:[]},'t-40':{lv:2.5,ch:['t-40S']},'t-40S':{lv:3.5,ch:['t-60']},'t-60':{lv:4.5,ch:['t-60A']},'t-60A':{lv:5.5,ch:['t-70']},'t-70':{lv:6.5,ch:['t-70M','t-80','SU-57','ZIS-30']},'t-70M':{lv:7.5,ch:['SU-76M']},'SU-76M':{lv:8.5,ch:[]},'t-80':{lv:8,ch:[]},'SU-57':{lv:8,ch:[]},'ZIS-30':{lv:7.5,ch:[]}}
};

const TY_CN = {light:'轻坦',medium:'中坦',heavy:'重坦',td:'坦歼'};
const TY_ICON = {light:'⚡',medium:'🔫',heavy:'🛡️',td:'🎯'};
const NAT_NAME = {德:'德国',美:'美国',苏:'苏联'};
const NAT_COLOR = {
  德:{c1:'rgba(255,215,110,.18)',c2:'rgba(255,215,110,.03)',c:'#ffd76e'},
  美:{c1:'rgba(77,208,255,.18)',c2:'rgba(77,208,255,.03)',c:'#4dd0ff'},
  苏:{c1:'rgba(255,77,77,.18)',c2:'rgba(255,77,77,.03)',c:'#ff6b6b'}
};

const STG = [{n:'3km',d:3000},{n:'2km',d:2000},{n:'1km',d:1000},{n:'100m',d:100},{n:'0m',d:0}];
const RNG = fp => fp <= 50 ? 1000 : fp <= 100 ? 2000 : 3000;
const canAtk = (a, d) => d <= RNG(a.fp);

const TACTICALS = [
  { id:'volley',   name:'集火',     tier:1, desc:'本回合我方尚未行动坦克攻击 +20%',  icon:'🎯' },
  { id:'apround',  name:'穿甲指令', tier:1, desc:'本回合我方尚未行动坦克穿深 +30%',  icon:'🎯' },
  { id:'smoke',    name:'烟雾弹',   tier:1, desc:'本回合双方尚未行动攻击 -30%',      icon:'💨' },
  { id:'repair',   name:'紧急维修', tier:1, desc:'血量最低的我方坦克恢复 30% 血量',  icon:'❤️' },
  { id:'iron',     name:'铁幕',     tier:1, desc:'本回合我方全体受到伤害 -50%',      icon:'🛡️' },
  { id:'cover',    name:'紧急掩体', tier:1, desc:'本回合我方全体装甲 +30%',          icon:'🛡️' },
  { id:'artillery',name:'炮火支援', tier:2, desc:'对敌方血量最低的单位造成 150×距离系数 伤害', icon:'💥' },
  { id:'pierce',   name:'必穿',     tier:2, desc:'我方下一次攻击必定满伤',           icon:'⚡' },
  { id:'jam',      name:'电子干扰', tier:2, desc:'敌方本回合随机 1 辆未行动坦克跳过行动', icon:'📡' },
  { id:'fieldfix', name:'战场修复', tier:2, desc:'我方尚未行动坦克各恢复 10% 血量',  icon:'❤️' },
  { id:'desperate',name:'破釜沉舟', tier:3, desc:'本回合我方尚未行动攻击 +50%，但受到伤害 +50%', icon:'🔥' },
  { id:'suppress', name:'压制射击', tier:3, desc:'本回合敌方尚未行动攻击 -50%，但敌方装甲 +20%', icon:'💢' },
];
const INITIAL_TACTICALS = ['volley','apround','smoke','repair'];

const VET_THRESHOLD = [0, 300, 900, 2000];
const VET_FLOAT = [
  { min: 0.90, max: 1.10 },
  { min: 0.92, max: 1.10 },
  { min: 0.92, max: 1.12 },
  { min: 0.95, max: 1.13 },
];
const VET_STAT_BONUS = 0.04;
const CREW_POOL_MAX = 60;
const CREW_SELL_PRICE = [0, 200, 500, 1000];

const AI_ELITE_LV = 10.5;
const AI_HQ_LV = 13;
const AI_REINFORCE_FIRST = 3;
const DEFAULT_AI_CONFIG = { growthRate: 0.15, maxLevel: 12, reinforceInterval: 5, reinforceMax: 5 };
const AI_SLOTS_TABLE = [1,2,2,3,3,3,4,4,4,4,5];

const MAP_SIZES = {
  small:   { cols: 7,  rows: 5 },
  medium:  { cols: 10, rows: 7 },
  largeB:  { cols: 12, rows: 9 },
  largeC:  { cols: 12, rows: 9 },
};
const MAP_ID_INFO = {
  small:  { key:'small',  size:'small',  name:'小型 · 边境',     desc:'7×5 入门地图，无地形' },
  medium: { key:'medium', size:'medium', name:'中型 · 平原',     desc:'10×7 十字路网 + 沼泽' },
  largeB: { key:'largeB', size:'largeB', name:'大型 · 双河防线', desc:'12×9 双桥争夺 + 山地/沼泽' },
  largeC: { key:'largeC', size:'largeC', name:'大型 · 群山隘口', desc:'12×9 三关夹击 + 道路机动' },
};
const TERRAIN_INFO = {
  plain:    { mp:1,   pass:true,  cls:'ter-plain' },
  road:     { mp:0.5, pass:true,  cls:'ter-road' },
  bridge:   { mp:1,   pass:true,  cls:'ter-bridge' },
  mountain: { mp:0,   pass:false, cls:'ter-mountain' },
  river:    { mp:0,   pass:false, cls:'ter-river' },
  swamp:    { mp:0,   pass:false, cls:'ter-swamp' },
};
const CELL_TYPE_INFO = {
  start:{icon:'🏠',label:'起始'}, neutral:{icon:'',label:''},
  city:{icon:'🏙️',label:'城市'}, supply:{icon:'📦',label:'补给'},
  village:{icon:'🏘️',label:'村庄'}, elite:{icon:'⚔️',label:'精锐'},
  hq:{icon:'🎯',label:'总部'}, ai_spawn:{icon:'🔴',label:'AI出生'},
};
const MAP_TEMPLATES = {
  small: [ '..c.EA.', '.u....H', '.......', 'P..c.u.', 'P.c...A' ],
  medium: [ 'A...H....A', '..C....C..', 's..rrrr..s', 'C.rr..rr.C', 's..rrrr..s', '..C....C..', 'P...E....P' ],
  largeB: [ 'A...H......A', '..C...v..C..', '.....s.s....', '~~b~~~~~~b~~', '............', '.C...u.u..C.', '....s...s...', '......E.....', 'P..........P' ],
  largeC: [ 'A..MMHMM...A', '.C.M...M.C..', '...M.v.M....', '...M...M....', 'rrrr...rrrrr', '...M...M....', '...M.v.M....', '.C.M...M.C..', 'P..M...M...P' ],
};

const COMMANDERS = [
  {id:'rommel', name:'隆美尔', nation:'德', desc:'全体速度 +10%', effect:{spd:.10}},
  {id:'guderian', name:'古德里安', nation:'德', desc:'中坦攻击 +20%', effect:{medium_type:'medium', atk:.20}},
  {id:'manstein', name:'曼施坦因', nation:'德', desc:'坦歼穿深 +15%', effect:{td_type:'td', pen:.15}},
  {id:'zhukov', name:'朱可夫', nation:'苏', desc:'全体速度 +10%', effect:{spd:.10}},
  {id:'rokossovsky', name:'罗科索夫斯基', nation:'苏', desc:'重坦装甲 +20%', effect:{heavy_type:'heavy', armor:.20}},
  {id:'timoshenko', name:'铁木辛哥', nation:'苏', desc:'全体活度 +10%', effect:{hp:.10}},
  {id:'patton', name:'巴顿', nation:'美', desc:'全体速度 +10%', effect:{spd:.10}},
  {id:'bradley', name:'布莱德雷', nation:'美', desc:'中坦装甲 +15%', effect:{medium_type:'medium', armor:.15}},
  {id:'macarthur', name:'麦克阿瑟', nation:'美', desc:'坦歼攻击 +20%', effect:{td_type:'td', atk:.20}},
];
const NATION_COMMANDERS = {
  德: { initial: 'rommel',     second: 'guderian',    elite: 'manstein' },
  苏: { initial: 'zhukov',     second: 'rokossovsky', elite: 'timoshenko' },
  美: { initial: 'patton',     second: 'bradley',     elite: 'macarthur' },
};
const NATION_ELITE = {
  德: ['E-100', '猎虎88'],
  苏: ['IS-7', 'T-44/100'],
  美: ['T95', 'M26E5'],
};
const ELITE_TANKS = {
  'E-100':   {n:'E-100',na:'德',ty:'heavy',fp:128,fd:'128/55',s:22,p:271,a:380,at:1638,ac:1450},
  'IS-7':    {n:'IS-7',na:'苏',ty:'heavy',fp:130,fd:'130/54',s:50,p:320,a:320,at:1612,ac:900},
  'T95':     {n:'T95',na:'美',ty:'td',fp:105,fd:'105/65',s:12,p:240,a:350,at:1102,ac:900},
  '猎虎88':   {n:'猎虎88',na:'德',ty:'td',fp:88,fd:'88/71',s:34,p:350,a:259,at:864,ac:843},
  'T-44/100':{n:'T-44/100',na:'苏',ty:'medium',fp:100,fd:'100/54',s:50,p:260,a:200,at:1000,ac:650},
  'M26E5':   {n:'M26E5',na:'美',ty:'heavy',fp:90,fd:'90/70',s:38,p:330,a:240,at:902,ac:700},
};
const ELITE_PRICES = { 'E-100':3000, 'IS-7':2800, 'T95':2600, '猎虎88':2800, 'T-44/100':2400, 'M26E5':2200 };

const VERSION = '0.4.2';
const SAVE_KEY = 'tank_campaign_v8';
const MAP_SAVE_KEY = 'tank_map_v7';
const TUTORIAL_KEY = 'tank_map_tutorial_v1';
const CAMP_TUTORIAL_KEY = 'tank_campaign_tutorial_v1';
const SETTINGS_KEY = 'tank_settings_v7';