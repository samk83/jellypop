// stages.js — 30스테이지 표 + 방해 요소 설명 (docs/SPEC-stages-30.md 진행표 기준, 난이도 맞춤 숫자는 §11)
// rows: 짝수 줄 10칸, 홀수 줄 9칸. 소문자 = 거품 색, 대문자 = 친구가 갇힌 거품, '.' = 빈칸, 'x' = kinds 로 정하는 특수 칸
// 색: r 분홍 · y 노랑 · g 초록 · b 파랑 · p 보라 · o 주황
// kinds (rows 와 같은 모양, '.' = 보통 거품):
//   s 끈적 시럽(두 번 맞혀야 터짐) · i 얼음(옆이 터지면 녹음) · m 버섯(터지면 옆 거품이 같은 색) · u 흔들 푸딩(옆에 붙으면 색이 바뀜)
//   g 선물 상자(터지면 다음 거품이 무지개 60% / 폭탄 40%) · f 반딧불(터지면 3발 동안 조준선이 길게) · c 수정(아무 색과 짝) · k 쿠키 블록(안 터짐, 떨어뜨려야 없어짐)
//   z 폭탄(쏜 거품이 닿으면 1.8칸 안이 색 상관없이 펑, 폭탄끼리 연쇄) · q 랜덤(닿으면 터지며 좋은 효과 60% / 나쁜 효과 40%)
// hz: 방해 요소
// fall: 천장이 한 칸 내려오는 간격(초). 모든 스테이지 기본 (0.8.0 타임어택: 발사 수 제한 없음, shots 는 별 기준)
//   drop N(N발마다 천장) · miss N(헛방 N번마다 천장) · dropSec N(이 스테이지만 더 빠른 하강 간격) · cloud {first, every, last, look}
//   aim 'short'|'blink'|'none' · clock {sec, hard} · shotTimer N(한 발 N초) · caramel N · conveyor {every, rows} · dark
//   nom {first, every, acts:['steal'|'block'|'take'|'junk']}
// boss: {name, kind, hp, every, sticky, lucky, phases, sub(월드 마지막 부두목), minions(처음부터 나오는 놈놈 부하 = nom 과 같은 모양)}
// kinds 'h' = 보너스 젤리 (0.15.0: 터뜨리거나 떨어뜨리고 판을 깨면 보너스 스테이지)
// obs: 지형 장애물 (0.14.0) [{t, x, y, len, a, spin}] — 판 아래 빈 곳(논리 좌표 360×620)에 놓는다
//   t 'branch' 나뭇가지(튕김) · 'web' 솜사탕 거미줄(한 발을 붙잡고 찢어짐) · 'fan' 풍차 날개(spin°/초로 돌며 튕김) · a 기울기°
window.JellyStages = (() => {
  const WORLDS = [T('젤리마을'), T('시럽 숲'), T('푸딩 동굴'), T('디저트 공장'), T('노놈의 성')];
  const S = [
    // ---------------- 월드 1 · 젤리마을 ----------------
    { id: 1, name: T('마을 광장'), theme: 'plaza', shots: 20, colors: 'ryb', fall: 26,   // 0.14.0: 첫 판은 천장을 느긋하게 (기본 19초)
      friends: [{ name: T('몽실'), color: '#ff5f8a' }],
      tip: T('<b>대포 근처를 좌우로 끌어</b> 대포를 돌리고, 손을 떼면 발사! 같은 색 3개를 붙여 봐요'),
      rows: ['ryyrbbryyb', 'bbryyrbrb', 'rrybrbyryy', 'bybrBybbr', 'brryyrryyr'] },   // 0.6.1: 4줄 큰 덩어리 → 5줄 2개씩 섞인 판 (Owner: 너무 쉬움)
    { id: 2, name: T('젤리 분수'), theme: 'fountain', shots: 22, colors: 'rybg', fall: 23,
      friends: [{ name: T('퐁당'), color: '#4fb4ff' }],
      tip: T('<b>벽에 튕겨서</b> 구석의 친구를 노려 봐요'),
      rows: ['bbyyrrggGg', 'byyrrggbb', 'yyrrggbbyy', 'rrgg..bbyy', 'rgg...byy'] },
    { id: 3, name: T('꽃밭 언덕'), theme: 'flowers', shots: 20, colors: 'rybg',
      friends: [{ name: T('꽃잎'), color: '#ff9f7a' }],
      tip: T('위쪽 <b>줄기를 끊으면</b> 매달린 거품이 한꺼번에 떨어져요'),
      rows: ['rr..bb..gg', 'r...b...g', '...ryyg...', '..rrYgg..', '..bbrrgg..', '..bbyygg.'],
      kinds: ['..........', '.........', '..........', '.........', '....h.....', '.........'] },
    { id: 4, name: T('폭포 다리'), theme: 'falls', shots: 26, colors: 'rybgp',
      friends: [{ name: T('찰랑'), color: '#ffd23f' }, { name: T('살랑'), color: '#4fdcc4' }],
      tip: T('이번엔 <b>친구가 두 명</b> 갇혀 있어요'),
      rows: ['ppyybbrrgg', 'pyybbrrgg', 'yyBbrrgPgg', 'ybbrrggpp', 'bbrrggppyy'],
      kinds: ['..........', '.........', '..........', '.........', '.z......z.'] },
    { id: 5, name: T('노을 지붕'), theme: 'sunset', shots: 28, colors: 'rybgp', fall: 12,
      friends: [{ name: T('포도알'), color: '#a76bff' }],
      tip: T('위쪽 <b>시간 게이지</b>가 다 닳으면 천장이 한 칸 내려와요. 이번엔 더 빨라요!'),
      rows: ['rrggbbyypp', 'rggbbyypp', 'ggbbyypprr', 'gbbyPpprr', 'bbyypprrgg'] },
    { id: 6, name: T('마을 입구'), theme: 'gate', shots: 30, colors: 'rybgp', boss: { name: T('뭉치'), kind: 'mungchi', hp: 36, every: 5, sub: true, minions: { first: 3, every: 6, acts: ['steal'] } },
      friends: [{ name: T('뭉게'), color: '#ffb3e0' }],
      tip: T('<b>부두목 뭉치!</b> 놈놈 부하가 거품을 훔쳐 가요. 날아다니는 부하를 맞혀 쫓아내요'),
      rows: ['rryybbggpp', 'ryybbggpp', 'yybbggpprr', 'ybbggpprr', 'bbggpprryy'] },

    // ---------------- 월드 2 · 시럽 숲 ----------------
    { id: 7, name: T('시럽 오솔길'), theme: 'w2-path', shots: 26, colors: 'rybgp',
      friends: [{ name: T('곰찡'), color: '#a8e05f' }],
      tip: T('노란 <b>시럽 거품</b>은 처음엔 시럽만 벗겨져요. 한 번 더 터뜨려요!'),
      rows: ['bgrryypprr', 'ygppbbrbp', 'rbbggyybpy', 'prrpBggrb', 'rbypyybbrb', 'bpgbrryyp', 'yypgbpprpr'],
      kinds: ['.....s..s.', '.s...s...', '...s.....s', '.....s...', '.s........', '.........', '..........'] },
    { id: 8, name: T('솜사탕 나무'), theme: 'w2-cotton', shots: 26, colors: 'rybgp', hz: { cloud: { first: 2, every: 7, last: 4 } },
      friends: [{ name: T('솜솜'), color: '#ffc4ea' }],
      tip: T('<b>솜사탕 안개</b>가 위쪽을 가려요. 안개 속 거품을 터뜨리면 그 자리가 걷혀요'),
      rows: ['yyppggbggb', 'pgyybYppb', 'pgrrgbyrrp', 'ybpgppgbb', 'brpbbgrgrp', 'ryygygrbr', 'bbpgrrbggy'],
      kinds: ['..........', '.........', '..........', '..h......', '..........', '.........', '..........'] },
    { id: 9, name: T('메이플 시냇물'), theme: 'w2-stream', shots: 28, colors: 'rybgp', hz: { miss: 3 }, obs: [{ t: 'branch', x: 92, y: 362, len: 110, a: -18 }],
      friends: [{ name: T('메이'), color: '#e0a050' }],
      tip: T('<b>헛방</b>(아무것도 못 터뜨린 발사) 3번이면 천장이 내려와요'),
      rows: ['gbbrryggpp', 'rygbgyrry', 'ryprgppgby', 'pbprbbgyp', 'pbgypYrypb', 'rgyrrgrgy', 'ryrbbgybgb'],
      kinds: ['ssssssssss', '...s.....', '.s.s....s.', '.........', '..........', '.........', '..........'] },
    { id: 10, name: T('버섯 젤리촌'), theme: 'w2-mushroom', shots: 28, colors: 'rybgp', hz: { cloud: { first: 3, every: 8, last: 3 } }, obs: [{ t: 'branch', x: 74, y: 344, len: 100, a: 22 }, { t: 'branch', x: 288, y: 372, len: 100, a: -22 }],
      friends: [{ name: T('톡이'), color: '#4fdcc4' }],
      tip: T('<b>버섯 거품</b>이 터지면 옆 거품들이 버섯 색으로 바뀌어요'),
      rows: ['ppyybbggyy', 'bbprrppbr', 'ypyyggyrby', 'ypbpprYry', 'bgbgygrbpp', 'bppbppbrb', 'pybybryyrb'],
      kinds: ['...m......', '....m....', '..m.....m.', '.........', 'm.........', '..z......', '.......z..'] },
    { id: 11, name: T('반딧불 밤숲'), theme: 'w2-night', shots: 28, colors: 'rybgp', hz: { aim: 'short' }, obs: [{ t: 'branch', x: 256, y: 336, len: 104, a: 16 }],
      friends: [{ name: T('반짝'), color: '#ffe14d' }],
      tip: T('밤이라 <b>조준선이 첫 벽까지만</b> 보여요. 반딧불 거품을 터뜨리면 3발 동안 길게!'),
      rows: ['ggyygppbbp', 'rrbgrrgrr', 'ppbrbygyyb', 'ggrpPypbr', 'ybpyrrbpby', 'bgrppbggy', 'grgrbrprrb', 'yyppyypby'],
      kinds: ['..........', '.........', '..........', '.........', '.f........', '....f....', '......f...', '.........'] },
    { id: 12, name: T('숲의 심장'), theme: 'w2-heart', shots: 32, colors: 'rybgp', fall: 30,
      boss: { name: T('찐득이'), kind: 'syrup', hp: 60, every: 5, sticky: .3, sub: true, minions: { first: 3, every: 6, acts: ['junk', 'steal'] }, phases: [{ at: .5, cloud: { every: 7, last: 3 } }] },
      friends: [{ name: T('달콩'), color: '#ff6f8f' }],
      tip: T('<b>부두목 찐득이!</b> 끈적 거품을 던지고, 놈놈 부하들이 회색 거품을 붙여요'),
      rows: ['ggppybbrrp', 'ryrgppggp', 'rgygryyrbb', 'grbybpryp', 'yybgypbgyb', 'gryrggbpp'],
      kinds: ['..........', '.s....ss.', '...s.....s', '.........', '........s.', '.........'] },

    // ---------------- 월드 3 · 푸딩 동굴 ----------------
    { id: 13, name: T('동굴 입구'), theme: 'w3-gate', shots: 26, colors: 'rybgp', hz: { miss: 3 }, obs: [{ t: 'web', x: 118, y: 336, len: 92 }],
      friends: [{ name: T('탱글'), color: '#ffe9a8' }],
      tip: T('<b>흔들 푸딩</b> 옆에 붙이면 푸딩 색이 바뀌어요'),
      rows: ['bbyyrryygb', 'grrbppbgp', 'gyyggybpbp', 'bpprPypyb', 'gybbrgrbgg', 'yrrygryby', 'gppbbpyrrg'],
      kinds: ['..........', '.........', '..........', '.........', '..u.....u.', '....u...u', '.u........'] },
    { id: 14, name: T('캐러멜 종유석'), theme: 'w3-stalactite', shots: 28, colors: 'rybgp', hz: { caramel: 4 },
      friends: [{ name: T('캬라'), color: '#d98c3a' }],
      tip: T('4발마다 <b>캐러멜 방울</b>이 떨어져 거품 판에 붙어요'),
      rows: ['rpbbggrrbb', 'gyyrrppgr', 'grppbByyrb', 'ryyrppbpp', 'pbbpryybrr', 'pyrggbpgg', 'gyryyrrbby', 'gbbggppyg'],
      kinds: ['..........', '.........', '..........', '.........', '.......h..', '..q......', '......q...', '....q....'] },
    { id: 15, name: T('푸딩 호수'), theme: 'w3-lake', shots: 30, colors: 'rybgp', hz: { clock: { sec: 90, hard: false } }, obs: [{ t: 'web', x: 84, y: 344, len: 84, a: 8 }, { t: 'web', x: 278, y: 326, len: 84, a: -8 }],
      friends: [{ name: T('출렁'), color: '#6fd0ff' }],
      tip: T('<b>90초 타임 어택!</b> 시간이 끝나면 천장이 쿵쿵 내려와요'),
      rows: ['yybbggrrgg', 'ppgrypgbb', 'rgbgyprppg', 'ypbPbbggy', 'yrpggyrypg', 'rgrrpyrbg', 'yygyggbgbr', 'gppbpbpgp'] },
    { id: 16, name: T('수정 광산'), theme: 'w3-crystal', shots: 30, colors: 'rybgp', hz: { nom: { first: 3, every: 5, acts: ['steal'] } },
      friends: [{ name: T('반들'), color: '#6a7dff' }],
      tip: T('<b>꼬마 놈놈</b>이 거품을 훔쳐 가요! 날아다니는 놈놈을 맞혀 쫓아내요'),
      rows: ['bbyppbbrrb', 'ryrrgrggp', 'rggybgrpyp', 'byrbxPyxg', 'byryyrgygp', 'gppbgbppr', 'brbgybgbbp', 'rbgyryygr'],
      kinds: ['..........', '.........', '..........', '....c..c.', '..........', '.........', '..........', '.........'] },
    { id: 17, name: T('어둠 미로'), theme: 'w3-dark', shots: 30, colors: 'rybgp', hz: { dark: true, aim: 'short' }, obs: [{ t: 'web', x: 180, y: 318, len: 80 }],
      friends: [{ name: T('깜빡'), color: '#9b6bff' }],
      tip: T('<b>캄캄한 동굴</b>! 조준한 곳만 손전등처럼 밝아져요'),
      rows: ['ppbbggrrgp', 'byprrpygb', 'bpbbggYpyy', 'rrprrbbgg', 'ypypggrrpr', 'yrrbbpyyg', 'bggyypgbgp', 'byrrgbybp'],
      kinds: ['..........', '.........', '..........', '.........', '...f......', '...f.....', '.f...q....', '..q......'] },
    { id: 18, name: T('동굴 깊은 곳'), theme: 'w3-heart', shots: 34, colors: 'rybgp', hz: { cloud: { first: 4, every: 8, last: 3 } },
      boss: { name: T('푸딩 골렘'), kind: 'pudding', hp: 85, every: 5, lucky: .5, sub: true, minions: { first: 3, every: 6, acts: ['steal', 'block'] } },
      friends: [{ name: T('푸디'), color: '#ffaa85' }],
      tip: T('<b>부두목 푸딩 골렘!</b> 놈놈 부하가 대포를 막으면 맨 앞 친구를 눌러요'),
      rows: ['yyggyypggy', 'gpbppgpyp', 'pgpbrgrgyg', 'rbyppygrg', 'rgbrbybbpp', 'yyrbppyyg'],
      kinds: ['u...u....u', '.........', '..........', '.........', '..........', '.........'] },

    // ---------------- 월드 4 · 디저트 공장 ----------------
    { id: 19, name: T('정문 컨베이어'), theme: 'w4-belt', shots: 32, colors: 'rybgp', hz: { conveyor: { every: 4, rows: [1, 3] } }, obs: [{ t: 'fan', x: 180, y: 352, len: 100, spin: 60 }],
      friends: [{ name: T('톡톡'), color: '#5fe0c0' }],
      tip: T('4발마다 <b>컨베이어</b> 줄이 한 칸씩 옆으로 움직여요'),
      rows: ['rppbryyggp', 'ggrgrgppr', 'rryrbpgyrp', 'bbppGyrbp', 'rprrypbryy', 'pbbybpggp', 'ygrrbrrprg', 'ygpgppyrb'] },
    { id: 20, name: T('쿠키 굽는 방'), theme: 'w4-oven', shots: 32, colors: 'rybgpo', hz: { shotTimer: 7 },
      friends: [{ name: T('쿠키'), color: '#c98a4a' }],
      tip: T('<b>7초 안에</b> 쏘지 않으면 자동으로 발사돼요. 쿠키 블록은 떨어뜨려야 없어져요'),
      rows: ['oyyprrggrr', 'obrbbppbb', 'ggryxggrrx', 'rppbbRbgg', 'xorggrbxop', 'oprbbgyrp', 'yryoogrybg', 'ypyryygrb'],
      kinds: ['..........', '.........', '....k....k', '..h......', 'k......k..', '.z.......', '......z...', '.........'] },
    { id: 21, name: T('아이스크림 냉동실'), theme: 'w4-freezer', shots: 32, colors: 'rybgpo', hz: { cloud: { first: 2, every: 7, last: 4, look: 'frost' } }, obs: [{ t: 'fan', x: 100, y: 350, len: 90, spin: -70 }],
      friends: [{ name: T('얼음이'), color: '#bfe9ff' }],
      tip: T('<b>얼음 거품</b>은 옆 거품이 터지면 녹아요. 서리가 위쪽을 가려요'),
      rows: ['yyggpprroo', 'rpbbrggyy', 'prggrBbopp', 'pbbyyogyy', 'gryorrogbb', 'gyropproy', 'probbyrgog', 'roggyoppg'],
      kinds: ['..........', '.........', '.......i..', '.i..i...i', 'i.........', '.........', '.i....i...', '.........'] },
    { id: 22, name: T('초콜릿 강'), theme: 'w4-choco', shots: 36, colors: 'rybgpo', hz: { dropSec: 9 }, obs: [{ t: 'fan', x: 92, y: 362, len: 80, spin: 80 }, { t: 'fan', x: 268, y: 340, len: 80, spin: -80 }],
      friends: [{ name: T('초코'), color: '#8a5a3a' }],
      tip: T('<b>9초마다</b> 천장이 내려와요. 빨리빨리!'),
      rows: ['yybrrogrrb', 'popbobogg', 'gpobppgryy', 'yrpogoRpp', 'yprbygyyrr', 'robppbrbb', 'ropobyrprr'],
      kinds: ['..........', '.........', '..........', '.........', '..........', '...q.....', '.......q..'] },
    { id: 23, name: T('포장 공장'), theme: 'w4-wrap', shots: 36, colors: 'rybgpo', fall: 18, hz: { nom: { first: 2, every: 5, acts: ['block', 'steal'] } },
      friends: [{ name: T('리본'), color: '#ff5f8a' }],
      tip: T('놈놈이 <b>대포를 막으면</b> 맨 앞 친구를 눌러 간지럼 공격! 선물 상자는 무지개 거품을 줘요'),
      rows: ['brroobbggy', 'boyrppooy', 'orgbRgyypb', 'ogoyoropb', 'rrbyggoggp', 'ybgppbbpy', 'rrgrroyybb', 'pybygpoor'],
      kinds: ['..........', '.........', '..........', '...g.....', '......g...', '.........', '.........g', '.........'] },
    { id: 24, name: T('공장장실'), theme: 'w4-boss', shots: 36, colors: 'rybgpo', hz: { conveyor: { every: 4, rows: [2] }, aim: 'blink' },
      boss: { name: T('철컹이'), kind: 'robot', hp: 64, every: 5, lucky: .6, sub: true, minions: { first: 3, every: 6, acts: ['block', 'take'] } },
      friends: [{ name: T('무지'), color: '#5b6dff' }],
      tip: T('<b>부두목 철컹이!</b> 조준기가 깜빡이고, 놈놈 부하가 친구를 데려가요'),
      rows: ['ooybrrooby', 'bbybgbbry', 'yygrgpgrpr', 'pprbbpgpr', 'obbpggoyyo'] },

    // ---------------- 월드 5 · 노놈의 성 ----------------
    { id: 25, name: T('성문 다리'), theme: 'w5-bridge', shots: 27, colors: 'rybgpo', hz: { miss: 3, nom: { first: 3, every: 6, acts: ['junk'] } },
      friends: [{ name: T('별사탕'), color: '#ffe066' }],
      tip: T('놈놈이 <b>회색 거품</b>을 던져요. 위쪽 줄기를 끊어 떨어뜨려요'),
      rows: ['grrbboppop', 'gporryogo', 'yoybbPpgbp', 'ybopryrro', 'pbpoybpbbo'],
      kinds: ['s.........', '.s.......', 'u.........', '.s...s...', '..z..u...u'] },
    { id: 26, name: T('거품 감옥'), theme: 'w5-jail', shots: 50, colors: 'rybgpo', fall: 16, hz: { cloud: { first: 3, every: 8, last: 3 }, nom: { first: 4, every: 6, acts: ['take'] } },
      friends: [{ name: T('방울'), color: '#5fc8ff' }, { name: T('보글'), color: '#7fd8ff' }, { name: T('송이'), color: '#ffd0a0' }],
      tip: T('<b>친구 3명</b>을 구해요! 놈놈이 줄 선 친구를 데려가면 맞혀서 되찾아요'),
      rows: ['ooygyryygg', 'pgpyggrbo', 'prObpoBpby', 'rgbpoprpy', 'pogoYrgybb'],
      kinds: ['..........', '......h..', '..........', '......q..', '.q........'] },
    { id: 27, name: T('거울 복도'), theme: 'w5-mirror', shots: 50, colors: 'rybgpo', fall: 16, hz: { aim: 'none' }, obs: [{ t: 'web', x: 250, y: 360, len: 84 }],
      friends: [{ name: T('똑딱'), color: '#4fe0b0' }],
      tip: T('거울 때문에 <b>조준선이 안 보여요</b>! 반딧불 거품이 길을 비춰 줘요'),
      rows: ['ooyybbyyoo', 'rgororogr', 'rbypbbpybr', 'bygrYrgyb', 'oorgoogroo', 'prpryrprp'],
      kinds: ['..........', '.........', '..........', '.........', '..f....f..', '.........'] },
    { id: 28, name: T('왕관 탑'), theme: 'w5-tower', shots: 30, colors: 'rybgpo', hz: { conveyor: { every: 4, rows: [3] }, cloud: { first: 3, every: 8, last: 3, look: 'night' }, shotTimer: 8 }, obs: [{ t: 'branch', x: 272, y: 362, len: 92, a: -20 }, { t: 'fan', x: 96, y: 372, len: 80, spin: 70 }],
      friends: [{ name: T('왕관'), color: '#a070ff' }],
      tip: T('컨베이어 + 얼음 + 밤 구름 + <b>8초 초침</b>. 침착하게!'),
      rows: ['rpyybyyoob', 'pgoorbbgp', 'yygrGgrgpr', 'bprpporbb', 'rgyoorogyp', 'gypygygpb', 'proogypbpb', 'ryyppopyg'],
      kinds: ['..........', '...i...i.', '..i.......', '.........', '..........', 'ii.......', '...z......', '.......z.'] },
    { id: 29, name: T('노놈의 부엌'), theme: 'w5-kitchen', shots: 34, colors: 'rybgpo', hz: { clock: { sec: 85, hard: true }, nom: { first: 3, every: 5, acts: ['steal'] } },
      friends: [{ name: T('마카롱'), color: '#ffb8e6' }],
      tip: T('<b>85초 안에</b> 구하지 못하면 실패! 진짜 타임 어택이에요'),
      rows: ['pprooyyoyg', 'gbpggrbbg', 'pbgbOoryro', 'prrbyypro', 'bggppbggyr', 'bryyboory'],
      kinds: ['..........', '.........', '..........', '.........', '..q.......', '......q..'] },
    { id: 30, name: T('왕좌의 방'), theme: 'w5-throne', shots: 40, colors: 'rybgpo',
      boss: { name: T('노놈'), kind: 'nomnom', hp: 95, every: 5, lucky: .7, minions: { first: 4, every: 7, acts: ['steal'] }, phases: [
        { at: .67, nom: { first: 1, every: 4, acts: ['steal', 'block'] }, cloud: { every: 7, last: 3 }, say: T('부하들아, 나와라!') },
        { at: .34, dropSec: 18, aim: 'short', red: true, off: ['nom', 'cloud'], say: T('이제 진짜 화났다!') }] },
      friends: [{ name: T('촌장님'), color: '#9ad85a' }],
      tip: T('<b>최종 보스 노놈!</b> 체력이 줄수록 더 세게 방해해요'),
      rows: ['pprrggpgoo', 'oobbypyyp', 'rppggyrrpo', 'oorrpogyo', 'rryooyoygg'] },
  ];
  S.forEach(s => {
    s.world = Math.floor((s.id - 1) / 6) + 1; s.hz = s.hz || {};
    // 천장 하강 간격: 1스테이지 19초 → 30스테이지 12초, 보스는 거품 공격이 따로 있어 +10초
    if (!s.fall) s.fall = Math.round(19 - (s.id - 1) * 0.25) + (s.boss ? 10 : 0);
  });

  // 새 방해 요소가 처음 나올 때 보여 주는 설명 카드 (art: 카드 그림 종류)
  const INFO = {
    s: { title: T('끈적 시럽 거품'), text: T('노란 시럽에 싸인 거품(숫자 2)은 같은 색으로 터뜨려도 처음엔 시럽만 벗겨지고 그대로 남아요.'), how: T('시럽이 벗겨지면 보통 거품! 한 번 더 터뜨려요.'), art: 's' },
    m: { title: T('버섯 거품'), text: T('버섯 거품이 터지면 옆 거품들이 버섯과 같은 색이 돼요.'), how: T('색을 모아 한꺼번에!'), art: 'm' },
    cloud: { title: T('솜사탕 안개'), text: T('안개가 위쪽을 덮어요. 맨 위는 안 보이고 아래로 갈수록 살짝 보여요. 몇 발 지나면 걷혀요.'), how: T('안개 속 거품을 터뜨리면 그 자리가 걷혀요. 친구는 반짝여서 보여요.'), art: 'cloud' },
    miss: { title: T('헛방 천장'), text: T('아무것도 못 터뜨린 발사가 3번 쌓이면 천장이 한 칸 내려와요.'), how: T('왼쪽 아래 ●●● 표시를 보세요.'), art: 'miss' },
    'aim-short': { title: T('짧은 조준선'), text: T('조준선이 첫 벽에 닿는 곳까지만 보여요.'), how: T('반딧불 거품을 터뜨리면 3발 동안 길게!'), art: 'aim' },
    f: { title: T('반딧불 거품'), text: T('터뜨리거나 떨어뜨리면 3발 동안 조준선이 끝까지 보여요.'), how: T('어두울 땐 반딧불부터!'), art: 'f' },
    u: { title: T('흔들 푸딩'), text: T('푸딩 옆에 거품을 붙였는데 안 터지면 푸딩 색이 바뀌어요.'), how: T('바뀐 색을 잘 보고 맞혀요.'), art: 'u' },
    caramel: { title: T('캐러멜 방울'), text: T('몇 발마다 캐러멜 방울이 떨어져 거품 판 아래에 붙어요.'), how: T('떨어지기 전에 깜빡이는 표시를 봐요.'), art: 'caramel' },
    'clock-soft': { title: T('타임 어택'), text: T('시간이 끝나면 천장이 2칸 내려오고, 그 뒤로는 천장이 두 배 빨리 내려와요!'), how: T('남은 시간이 많으면 별이 늘어나요.'), art: 'clock' },
    'clock-hard': { title: T('진짜 타임 어택'), text: T('시간이 끝나면 생명 1개를 잃고 20초가 더 생겨요. 생명을 다 쓰면 실패!'), how: T('망설이지 말고 빨리!'), art: 'clock' },
    z: { title: T('폭탄 거품'), text: T('심지 달린 폭탄 거품에 거품을 붙이면 펑! 둘레 두 칸까지 색 상관없이 한꺼번에 터져요.'), how: T('친구 옆 폭탄을 노려요. 폭탄끼리는 연쇄 폭발!'), art: 'z' },
    q: { title: T('랜덤 거품'), text: T('물음표 거품에 거품을 붙이면 터지면서 무언가 나와요. 폭탄·무지개·반딧불·시간 충전이 나오면 행운!'), how: T('가끔은 안개·천장 한 칸·색 섞기 같은 꽝도 있어요. 운을 걸어 봐요!'), art: 'q' },
    h: { title: T('보너스 젤리'), text: T('별이 달린 금빛 젤리를 터뜨리거나 떨어뜨린 뒤 판을 깨면 보너스 스테이지가 열려요.'), how: T('보너스 스테이지에서 젤리를 8명 이상 구하면 생명 +1!'), art: 'h' },
    c: { title: T('수정 거품'), text: T('무지개 수정은 아무 색과도 짝이 돼요.'), how: T('묶음에 끼워 넣어 크게 터뜨려요.'), art: 'c' },
    'nom-steal': { title: T('꼬마 놈놈 — 거품 도둑'), text: T('놈놈이 거품을 하나 들고 날아가요. 판 모양이 바뀌어요.'), how: T('날아다니는 놈놈을 맞히면 쫓아내고 점수!'), art: 'nom' },
    dark: { title: T('캄캄한 동굴'), text: T('판이 어두워서 조준하는 곳 주변만 밝아요.'), how: T('친구 거품은 반짝여서 보여요.'), art: 'dark' },
    conveyor: { title: T('컨베이어'), text: T('몇 발마다 화살표가 붙은 줄이 한 칸씩 옆으로 움직여요.'), how: T('움직인 뒤 모양을 예상해요.'), art: 'conveyor' },
    k: { title: T('쿠키 블록'), text: T('쿠키는 색이 없어 터지지 않아요.'), how: T('위쪽을 끊어 떨어뜨려요.'), art: 'k' },
    shotTimer: { title: T('한 발 초침'), text: T('정해진 초 안에 쏘지 않으면 지금 방향으로 자동 발사돼요.'), how: T('대포 둘레의 시계를 보세요.'), art: 'clock' },
    i: { title: T('얼음 거품'), text: T('얼음 거품은 짝이 되지 않아요. 옆 거품이 터지면 녹아요.'), how: T('옆을 먼저 터뜨려요.'), art: 'i' },
    dropSec: { title: T('시간 천장'), text: T('이 스테이지는 천장이 평소보다 훨씬 자주 내려와요.'), how: T('위쪽 시간 게이지를 보며 빨리빨리!'), art: 'clock' },
    g: { title: T('선물 상자'), text: T('터뜨리거나 떨어뜨리면 다음 거품이 무지개 거품이나 폭탄 거품이 돼요.'), how: T('무지개는 붙은 곳에서 가장 좋은 색으로, 폭탄은 붙은 자리에서 펑!'), art: 'g' },
    'nom-block': { title: T('꼬마 놈놈 — 대포 막기'), text: T('놈놈이 대포 앞을 막으면 쏜 거품이 막혀요.'), how: T('맨 앞 친구(또는 대포)를 눌러 간지럼 공격!'), art: 'nom' },
    'aim-blink': { title: T('깜빡 조준선'), text: T('고장 난 조준기 때문에 조준선이 깜빡여요.'), how: T('보일 때 방향을 기억해요.'), art: 'aim' },
    'nom-junk': { title: T('꼬마 놈놈 — 방해 거품'), text: T('놈놈이 색 없는 회색 거품을 던져 붙여요.'), how: T('위쪽 줄기를 끊어 떨어뜨려요.'), art: 'nom' },
    'nom-take': { title: T('꼬마 놈놈 — 친구 데려가기'), text: T('놈놈이 줄 선 친구를 데려가면 천장 시간이 4초 줄어요.'), how: T('3발 안에 놈놈을 맞히면 되찾고 4초도 돌려받아요.'), art: 'nom' },
    'ob-branch': { title: T('나뭇가지'), text: T('판 아래에 나뭇가지가 걸려 있어요. 거품이 닿으면 통! 하고 튕겨 나가요.'), how: T('가지에 튕겨 구석을 노려 봐요. 판이 내려와 닿으면 부러져요.'), art: 'branch' },
    'ob-web': { title: T('솜사탕 거미줄'), text: T('거미줄에 닿은 거품은 대롱대롱 걸려서 판까지 못 가요(헛방 1번).'), how: T('한 번 걸리면 찢어져요. 피해서 쏘거나 일부러 걷어 내요.'), art: 'web' },
    'ob-fan': { title: T('풍차 날개'), text: T('빙글빙글 도는 날개에 닿으면 거품이 튕겨요.'), how: T('날개가 비켜 갈 때를 기다렸다 쏴요.'), art: 'fan' },
    'aim-none': { title: T('조준선 없음'), text: T('거울 때문에 조준선이 보이지 않아요. 대포 앞 화살표만 보여요.'), how: T('반딧불 거품이 3발 동안 길을 비춰 줘요.'), art: 'aim' },
  };
  // 스테이지에 나오는 방해 요소 열쇠 목록 (설명 카드용)
  function keysOf(st) {
    const out = [], add = k => { if (INFO[k] && !out.includes(k)) out.push(k); };
    (st.kinds || []).join('').split('').forEach(add);
    const hz = st.hz;
    const fromHz = h => {
      if (!h) return;
      if (h.cloud) add('cloud'); if (h.miss) add('miss'); if (h.aim) add('aim-' + h.aim);
      if (h.clock) add(h.clock.hard ? 'clock-hard' : 'clock-soft');
      if (h.shotTimer) add('shotTimer'); if (h.dropSec) add('dropSec'); if (h.caramel) add('caramel');
      if (h.conveyor) add('conveyor'); if (h.dark) add('dark');
      if (h.nom) h.nom.acts.forEach(a => add('nom-' + a));
    };
    fromHz(hz);
    (st.obs || []).forEach(o => add('ob-' + o.t));
    if (st.boss && st.boss.sticky) add('s');
    if (st.boss && st.boss.lucky) add('q');
    if (st.boss && st.boss.minions) fromHz({ nom: st.boss.minions });   // 부두목전: 놈놈 부하
    if (st.boss && st.boss.phases) st.boss.phases.forEach(fromHz);
    return out;
  }
  return { STAGES: S, WORLDS, INFO, keysOf };
})();
