// stages.js — 30스테이지 표 + 방해 요소 설명 (docs/SPEC-stages-30.md 진행표 기준, 난이도 맞춤 숫자는 §11)
// rows: 짝수 줄 10칸, 홀수 줄 9칸. 소문자 = 거품 색, 대문자 = 친구가 갇힌 거품, '.' = 빈칸, 'x' = kinds 로 정하는 특수 칸
// 색: r 분홍 · y 노랑 · g 초록 · b 파랑 · p 보라 · o 주황
// kinds (rows 와 같은 모양, '.' = 보통 거품):
//   s 끈적 시럽(두 번 맞혀야 터짐) · i 얼음(옆이 터지면 녹음) · m 버섯(터지면 옆 거품이 같은 색) · u 흔들 푸딩(옆에 붙으면 색이 바뀜)
//   g 선물 상자(터지면 무지개 거품) · f 반딧불(터지면 3발 동안 조준선이 길게) · c 수정(아무 색과 짝) · k 쿠키 블록(안 터짐, 떨어뜨려야 없어짐)
// hz: 방해 요소
//   drop N(N발마다 천장) · miss N(헛방 N번마다 천장) · dropSec N(N초마다 천장) · cloud {first, every, last, look}
//   aim 'short'|'blink'|'none' · clock {sec, hard} · shotTimer N(한 발 N초) · caramel N · conveyor {every, rows} · dark
//   nom {first, every, acts:['steal'|'block'|'take'|'junk']}
window.JellyStages = (() => {
  const WORLDS = ['젤리마을', '시럽 숲', '푸딩 동굴', '디저트 공장', '노놈의 성'];
  const S = [
    // ---------------- 월드 1 · 젤리마을 ----------------
    { id: 1, name: '마을 광장', theme: 'plaza', shots: 20, colors: 'ryb',
      friends: [{ name: '몽실', color: '#ff5f8a' }],
      tip: '<b>대포 근처를 좌우로 끌어</b> 대포를 돌리고, 손을 떼면 발사! 같은 색 3개를 붙여 봐요',
      rows: ['ryyrbbryyb', 'bbryyrbrb', 'rrybrbyryy', 'bybrBybbr', 'brryyrryyr'] },   // 0.6.1: 4줄 큰 덩어리 → 5줄 2개씩 섞인 판 (Owner: 너무 쉬움)
    { id: 2, name: '젤리 분수', theme: 'fountain', shots: 22, colors: 'rybg',
      friends: [{ name: '퐁당', color: '#4fb4ff' }],
      tip: '<b>벽에 튕겨서</b> 구석의 친구를 노려 봐요',
      rows: ['bbyyrrggGg', 'byyrrggbb', 'yyrrggbbyy', 'rrgg..bbyy', 'rgg...byy'] },
    { id: 3, name: '꽃밭 언덕', theme: 'flowers', shots: 20, colors: 'rybg',
      friends: [{ name: '꽃잎', color: '#ff9f7a' }],
      tip: '위쪽 <b>줄기를 끊으면</b> 매달린 거품이 한꺼번에 떨어져요',
      rows: ['rr..bb..gg', 'r...b...g', '...ryyg...', '..rrYgg..', '..bbrrgg..', '..bbyygg.'] },
    { id: 4, name: '폭포 다리', theme: 'falls', shots: 26, colors: 'rybgp',
      friends: [{ name: '찰랑', color: '#ffd23f' }, { name: '살랑', color: '#4fdcc4' }],
      tip: '이번엔 <b>친구가 두 명</b> 갇혀 있어요',
      rows: ['ppyybbrrgg', 'pyybbrrgg', 'yyBbrrgPgg', 'ybbrrggpp', 'bbrrggppyy'] },
    { id: 5, name: '노을 지붕', theme: 'sunset', shots: 28, colors: 'rybgp', hz: { drop: 6 },
      friends: [{ name: '포도알', color: '#a76bff' }],
      tip: '6번 쏠 때마다 <b>천장이 한 칸 내려와요</b>. 바닥 선을 조심!',
      rows: ['rrggbbyypp', 'rggbbyypp', 'ggbbyypprr', 'gbbyPpprr', 'bbyypprrgg'] },
    { id: 6, name: '마을 입구', theme: 'gate', shots: 30, colors: 'rybgp', boss: { name: '뭉치', kind: 'mungchi', hp: 36, every: 5 },
      friends: [{ name: '뭉게', color: '#ffb3e0' }],
      tip: '<b>보스 뭉치!</b> 거품을 터뜨리고 떨어뜨릴수록 뭉치가 약해져요',
      rows: ['rryybbggpp', 'ryybbggpp', 'yybbggpprr', 'ybbggpprr', 'bbggpprryy'] },

    // ---------------- 월드 2 · 시럽 숲 ----------------
    { id: 7, name: '시럽 오솔길', theme: 'w2-path', shots: 26, colors: 'rybgp',
      friends: [{ name: '곰찡', color: '#a8e05f' }],
      tip: '노란 <b>시럽 거품</b>은 처음엔 시럽만 벗겨져요. 한 번 더 터뜨려요!',
      rows: ['bgrryypprr', 'ygppbbrbp', 'rbbggyybpy', 'prrpBggrb', 'rbypyybbrb', 'bpgbrryyp', 'yypgbpprpr'],
      kinds: ['.....s..s.', '.s...s...', '...s.....s', '.....s...', '.s........', '.........', '..........'] },
    { id: 8, name: '솜사탕 나무', theme: 'w2-cotton', shots: 26, colors: 'rybgp', hz: { cloud: { first: 2, every: 7, last: 4 } },
      friends: [{ name: '솜솜', color: '#ffc4ea' }],
      tip: '<b>솜사탕 안개</b>가 위쪽을 가려요. 안개 속 거품을 터뜨리면 그 자리가 걷혀요',
      rows: ['yyppggbggb', 'pgyybYppb', 'pgrrgbyrrp', 'ybpgppgbb', 'brpbbgrgrp', 'ryygygrbr', 'bbpgrrbggy'] },
    { id: 9, name: '메이플 시냇물', theme: 'w2-stream', shots: 28, colors: 'rybgp', hz: { miss: 3 },
      friends: [{ name: '메이', color: '#e0a050' }],
      tip: '<b>헛방</b>(아무것도 못 터뜨린 발사) 3번이면 천장이 내려와요',
      rows: ['gbbrryggpp', 'rygbgyrry', 'ryprgppgby', 'pbprbbgyp', 'pbgypYrypb', 'rgyrrgrgy', 'ryrbbgybgb'],
      kinds: ['ssssssssss', '...s.....', '.s.s....s.', '.........', '..........', '.........', '..........'] },
    { id: 10, name: '버섯 젤리촌', theme: 'w2-mushroom', shots: 28, colors: 'rybgp', hz: { cloud: { first: 3, every: 8, last: 3 } },
      friends: [{ name: '톡이', color: '#4fdcc4' }],
      tip: '<b>버섯 거품</b>이 터지면 옆 거품들이 버섯 색으로 바뀌어요',
      rows: ['ppyybbggyy', 'bbprrppbr', 'ypyyggyrby', 'ypbpprYry', 'bgbgygrbpp', 'bppbppbrb', 'pybybryyrb'],
      kinds: ['...m......', '....m....', '..m.....m.', '.........', 'm.........', '.........', '..........'] },
    { id: 11, name: '반딧불 밤숲', theme: 'w2-night', shots: 28, colors: 'rybgp', hz: { aim: 'short' },
      friends: [{ name: '반짝', color: '#ffe14d' }],
      tip: '밤이라 <b>조준선이 첫 벽까지만</b> 보여요. 반딧불 거품을 터뜨리면 3발 동안 길게!',
      rows: ['ggyygppbbp', 'rrbgrrgrr', 'ppbrbygyyb', 'ggrpPypbr', 'ybpyrrbpby', 'bgrppbggy', 'grgrbrprrb', 'yyppyypby'],
      kinds: ['..........', '.........', '..........', '.........', '.f........', '....f....', '......f...', '.........'] },
    { id: 12, name: '숲의 심장', theme: 'w2-heart', shots: 32, colors: 'rybgp',
      boss: { name: '찐득이', kind: 'syrup', hp: 60, every: 5, sticky: .3, phases: [{ at: .5, cloud: { every: 7, last: 3 } }] },
      friends: [{ name: '달콩', color: '#ff6f8f' }],
      tip: '<b>보스 찐득이!</b> 끈적 거품을 던지고, 약해지면 구름을 뿜어요',
      rows: ['ggppybbrrp', 'ryrgppggp', 'rgygryyrbb', 'grbybpryp', 'yybgypbgyb', 'gryrggbpp'],
      kinds: ['..........', '.s....ss.', '...s.....s', '.........', '........s.', '.........'] },

    // ---------------- 월드 3 · 푸딩 동굴 ----------------
    { id: 13, name: '동굴 입구', theme: 'w3-gate', shots: 26, colors: 'rybgp', hz: { miss: 3 },
      friends: [{ name: '탱글', color: '#ffe9a8' }],
      tip: '<b>흔들 푸딩</b> 옆에 붙이면 푸딩 색이 바뀌어요',
      rows: ['bbyyrryygb', 'grrbppbgp', 'gyyggybpbp', 'bpprPypyb', 'gybbrgrbgg', 'yrrygryby', 'gppbbpyrrg'],
      kinds: ['..........', '.........', '..........', '.........', '..u.....u.', '....u...u', '.u........'] },
    { id: 14, name: '캐러멜 종유석', theme: 'w3-stalactite', shots: 28, colors: 'rybgp', hz: { caramel: 4 },
      friends: [{ name: '캬라', color: '#d98c3a' }],
      tip: '4발마다 <b>캐러멜 방울</b>이 떨어져 거품 판에 붙어요',
      rows: ['rpbbggrrbb', 'gyyrrppgr', 'grppbByyrb', 'ryyrppbpp', 'pbbpryybrr', 'pyrggbpgg', 'gyryyrrbby', 'gbbggppyg'] },
    { id: 15, name: '푸딩 호수', theme: 'w3-lake', shots: 30, colors: 'rybgp', hz: { clock: { sec: 90, hard: false } },
      friends: [{ name: '출렁', color: '#6fd0ff' }],
      tip: '<b>90초 타임 어택!</b> 시간이 끝나면 천장이 쿵쿵 내려와요',
      rows: ['yybbggrrgg', 'ppgrypgbb', 'rgbgyprppg', 'ypbPbbggy', 'yrpggyrypg', 'rgrrpyrbg', 'yygyggbgbr', 'gppbpbpgp'] },
    { id: 16, name: '수정 광산', theme: 'w3-crystal', shots: 30, colors: 'rybgp', hz: { nom: { first: 3, every: 5, acts: ['steal'] } },
      friends: [{ name: '반들', color: '#6a7dff' }],
      tip: '<b>꼬마 놈놈</b>이 거품을 훔쳐 가요! 날아다니는 놈놈을 맞혀 쫓아내요',
      rows: ['bbyppbbrrb', 'ryrrgrggp', 'rggybgrpyp', 'byrbxPyxg', 'byryyrgygp', 'gppbgbppr', 'brbgybgbbp', 'rbgyryygr'],
      kinds: ['..........', '.........', '..........', '....c..c.', '..........', '.........', '..........', '.........'] },
    { id: 17, name: '어둠 미로', theme: 'w3-dark', shots: 30, colors: 'rybgp', hz: { dark: true, aim: 'short' },
      friends: [{ name: '깜빡', color: '#9b6bff' }],
      tip: '<b>캄캄한 동굴</b>! 조준한 곳만 손전등처럼 밝아져요',
      rows: ['ppbbggrrgp', 'byprrpygb', 'bpbbggYpyy', 'rrprrbbgg', 'ypypggrrpr', 'yrrbbpyyg', 'bggyypgbgp', 'byrrgbybp'],
      kinds: ['..........', '.........', '..........', '.........', '...f......', '...f.....', '.f........', '.........'] },
    { id: 18, name: '동굴 깊은 곳', theme: 'w3-heart', shots: 34, colors: 'rybgp', hz: { cloud: { first: 4, every: 8, last: 3 } },
      boss: { name: '푸딩 골렘', kind: 'pudding', hp: 85, every: 5 },
      friends: [{ name: '푸디', color: '#ffaa85' }],
      tip: '<b>보스 푸딩 골렘!</b> 거품 줄과 구름을 함께 조심해요',
      rows: ['yyggyypggy', 'gpbppgpyp', 'pgpbrgrgyg', 'rbyppygrg', 'rgbrbybbpp', 'yyrbppyyg'],
      kinds: ['u...u....u', '.........', '..........', '.........', '..........', '.........'] },

    // ---------------- 월드 4 · 디저트 공장 ----------------
    { id: 19, name: '정문 컨베이어', theme: 'w4-belt', shots: 32, colors: 'rybgp', hz: { conveyor: { every: 4, rows: [1, 3] } },
      friends: [{ name: '톡톡', color: '#5fe0c0' }],
      tip: '4발마다 <b>컨베이어</b> 줄이 한 칸씩 옆으로 움직여요',
      rows: ['rppbryyggp', 'ggrgrgppr', 'rryrbpgyrp', 'bbppGyrbp', 'rprrypbryy', 'pbbybpggp', 'ygrrbrrprg', 'ygpgppyrb'] },
    { id: 20, name: '쿠키 굽는 방', theme: 'w4-oven', shots: 32, colors: 'rybgpo', hz: { shotTimer: 7 },
      friends: [{ name: '쿠키', color: '#c98a4a' }],
      tip: '<b>7초 안에</b> 쏘지 않으면 자동으로 발사돼요. 쿠키 블록은 떨어뜨려야 없어져요',
      rows: ['oyyprrggrr', 'obrbbppbb', 'ggryxggrrx', 'rppbbRbgg', 'xorggrbxop', 'oprbbgyrp', 'yryoogrybg', 'ypyryygrb'],
      kinds: ['..........', '.........', '....k....k', '.........', 'k......k..', '.........', '..........', '.........'] },
    { id: 21, name: '아이스크림 냉동실', theme: 'w4-freezer', shots: 32, colors: 'rybgpo', hz: { cloud: { first: 2, every: 7, last: 4, look: 'frost' } },
      friends: [{ name: '얼음이', color: '#bfe9ff' }],
      tip: '<b>얼음 거품</b>은 옆 거품이 터지면 녹아요. 서리가 위쪽을 가려요',
      rows: ['yyggpprroo', 'rpbbrggyy', 'prggrBbopp', 'pbbyyogyy', 'gryorrogbb', 'gyropproy', 'probbyrgog', 'roggyoppg'],
      kinds: ['..........', '.........', '.......i..', '.i..i...i', 'i.........', '.........', '.i....i...', '.........'] },
    { id: 22, name: '초콜릿 강', theme: 'w4-choco', shots: 36, colors: 'rybgpo', hz: { dropSec: 14 },
      friends: [{ name: '초코', color: '#8a5a3a' }],
      tip: '<b>14초마다</b> 천장이 내려와요. 빨리빨리!',
      rows: ['yybrrogrrb', 'popbobogg', 'gpobppgryy', 'yrpogoRpp', 'yprbygyyrr', 'robppbrbb', 'ropobyrprr'] },
    { id: 23, name: '포장 공장', theme: 'w4-wrap', shots: 36, colors: 'rybgpo', hz: { nom: { first: 2, every: 5, acts: ['block', 'steal'] } },
      friends: [{ name: '리본', color: '#ff5f8a' }],
      tip: '놈놈이 <b>대포를 막으면</b> 맨 앞 친구를 눌러 간지럼 공격! 선물 상자는 무지개 거품을 줘요',
      rows: ['brroobbggy', 'boyrppooy', 'orgbRgyypb', 'ogoyoropb', 'rrbyggoggp', 'ybgppbbpy', 'rrgrroyybb', 'pybygpoor'],
      kinds: ['..........', '.........', '..........', '...g.....', '......g...', '.........', '.........g', '.........'] },
    { id: 24, name: '공장장실', theme: 'w4-boss', shots: 36, colors: 'rybgpo', hz: { conveyor: { every: 4, rows: [2] }, aim: 'blink' },
      boss: { name: '철컹이', kind: 'robot', hp: 64, every: 5 },
      friends: [{ name: '무지', color: '#5b6dff' }],
      tip: '<b>보스 철컹이!</b> 고장 난 조준기가 깜빡여요',
      rows: ['ooybrrooby', 'bbybgbbry', 'yygrgpgrpr', 'pprbbpgpr', 'obbpggoyyo'] },

    // ---------------- 월드 5 · 노놈의 성 ----------------
    { id: 25, name: '성문 다리', theme: 'w5-bridge', shots: 27, colors: 'rybgpo', hz: { miss: 3, nom: { first: 3, every: 6, acts: ['junk'] } },
      friends: [{ name: '별사탕', color: '#ffe066' }],
      tip: '놈놈이 <b>회색 거품</b>을 던져요. 위쪽 줄기를 끊어 떨어뜨려요',
      rows: ['grrbboppop', 'gporryogo', 'yoybbPpgbp', 'ybopryrro', 'pbpoybpbbo'],
      kinds: ['s.........', '.s.......', 'u.........', '.s...s...', '.....u...u'] },
    { id: 26, name: '거품 감옥', theme: 'w5-jail', shots: 50, colors: 'rybgpo', hz: { cloud: { first: 3, every: 8, last: 3 }, nom: { first: 4, every: 6, acts: ['take'] } },
      friends: [{ name: '방울', color: '#5fc8ff' }, { name: '보글', color: '#7fd8ff' }, { name: '송이', color: '#ffd0a0' }],
      tip: '<b>친구 3명</b>을 구해요! 놈놈이 줄 선 친구를 데려가면 맞혀서 되찾아요',
      rows: ['ooygyryygg', 'pgpyggrbo', 'prObpoBpby', 'rgbpoprpy', 'pogoYrgybb'] },
    { id: 27, name: '거울 복도', theme: 'w5-mirror', shots: 50, colors: 'rybgpo', hz: { aim: 'none' },
      friends: [{ name: '똑딱', color: '#4fe0b0' }],
      tip: '거울 때문에 <b>조준선이 안 보여요</b>! 반딧불 거품이 길을 비춰 줘요',
      rows: ['ooyybbyyoo', 'rgororogr', 'rbypbbpybr', 'bygrYrgyb', 'oorgoogroo', 'prpryrprp'],
      kinds: ['..........', '.........', '..........', '.........', '..f....f..', '.........'] },
    { id: 28, name: '왕관 탑', theme: 'w5-tower', shots: 30, colors: 'rybgpo', hz: { conveyor: { every: 4, rows: [3] }, cloud: { first: 3, every: 8, last: 3, look: 'night' }, shotTimer: 8 },
      friends: [{ name: '왕관', color: '#a070ff' }],
      tip: '컨베이어 + 얼음 + 밤 구름 + <b>8초 초침</b>. 침착하게!',
      rows: ['rpyybyyoob', 'pgoorbbgp', 'yygrGgrgpr', 'bprpporbb', 'rgyoorogyp', 'gypygygpb', 'proogypbpb', 'ryyppopyg'],
      kinds: ['..........', '...i...i.', '..i.......', '.........', '..........', 'ii.......', '..........', '.........'] },
    { id: 29, name: '노놈의 부엌', theme: 'w5-kitchen', shots: 34, colors: 'rybgpo', hz: { clock: { sec: 85, hard: true }, nom: { first: 3, every: 5, acts: ['steal'] } },
      friends: [{ name: '마카롱', color: '#ffb8e6' }],
      tip: '<b>85초 안에</b> 구하지 못하면 실패! 진짜 타임 어택이에요',
      rows: ['pprooyyoyg', 'gbpggrbbg', 'pbgbOoryro', 'prrbyypro', 'bggppbggyr', 'bryyboory'] },
    { id: 30, name: '왕좌의 방', theme: 'w5-throne', shots: 40, colors: 'rybgpo',
      boss: { name: '노놈', kind: 'nomnom', hp: 95, every: 5, phases: [
        { at: .67, nom: { first: 1, every: 4, acts: ['steal', 'block'] }, cloud: { every: 7, last: 3 }, say: '부하들아, 나와라!' },
        { at: .34, dropSec: 12, aim: 'short', red: true, off: ['nom', 'cloud'], say: '이제 진짜 화났다!' }] },
      friends: [{ name: '촌장님', color: '#9ad85a' }],
      tip: '<b>최종 보스 노놈!</b> 체력이 줄수록 더 세게 방해해요',
      rows: ['pprrggpgoo', 'oobbypyyp', 'rppggyrrpo', 'oorrpogyo', 'rryooyoygg'] },
  ];
  S.forEach(s => { s.world = Math.floor((s.id - 1) / 6) + 1; s.hz = s.hz || {}; });

  // 새 방해 요소가 처음 나올 때 보여 주는 설명 카드 (art: 카드 그림 종류)
  const INFO = {
    s: { title: '끈적 시럽 거품', text: '노란 시럽에 싸인 거품(숫자 2)은 같은 색으로 터뜨려도 처음엔 시럽만 벗겨지고 그대로 남아요.', how: '시럽이 벗겨지면 보통 거품! 한 번 더 터뜨려요.', art: 's' },
    m: { title: '버섯 거품', text: '버섯 거품이 터지면 옆 거품들이 버섯과 같은 색이 돼요.', how: '색을 모아 한꺼번에!', art: 'm' },
    cloud: { title: '솜사탕 안개', text: '안개가 위쪽을 덮어요. 맨 위는 안 보이고 아래로 갈수록 살짝 보여요. 몇 발 지나면 걷혀요.', how: '안개 속 거품을 터뜨리면 그 자리가 걷혀요. 친구는 반짝여서 보여요.', art: 'cloud' },
    miss: { title: '헛방 천장', text: '아무것도 못 터뜨린 발사가 3번 쌓이면 천장이 한 칸 내려와요.', how: '왼쪽 아래 ●●● 표시를 보세요.', art: 'miss' },
    'aim-short': { title: '짧은 조준선', text: '조준선이 첫 벽에 닿는 곳까지만 보여요.', how: '반딧불 거품을 터뜨리면 3발 동안 길게!', art: 'aim' },
    f: { title: '반딧불 거품', text: '터뜨리거나 떨어뜨리면 3발 동안 조준선이 끝까지 보여요.', how: '어두울 땐 반딧불부터!', art: 'f' },
    u: { title: '흔들 푸딩', text: '푸딩 옆에 거품을 붙였는데 안 터지면 푸딩 색이 바뀌어요.', how: '바뀐 색을 잘 보고 맞혀요.', art: 'u' },
    caramel: { title: '캐러멜 방울', text: '몇 발마다 캐러멜 방울이 떨어져 거품 판 아래에 붙어요.', how: '떨어지기 전에 깜빡이는 표시를 봐요.', art: 'caramel' },
    'clock-soft': { title: '타임 어택', text: '시간이 끝나면 천장이 2칸 내려오고, 그 뒤로 15초마다 1칸씩!', how: '남은 시간이 많으면 별이 늘어나요.', art: 'clock' },
    'clock-hard': { title: '진짜 타임 어택', text: '시간이 끝나기 전에 친구를 구하지 못하면 실패예요.', how: '망설이지 말고 빨리!', art: 'clock' },
    c: { title: '수정 거품', text: '무지개 수정은 아무 색과도 짝이 돼요.', how: '묶음에 끼워 넣어 크게 터뜨려요.', art: 'c' },
    'nom-steal': { title: '꼬마 놈놈 — 거품 도둑', text: '놈놈이 거품을 하나 들고 날아가요. 판 모양이 바뀌어요.', how: '날아다니는 놈놈을 맞히면 쫓아내고 점수!', art: 'nom' },
    dark: { title: '캄캄한 동굴', text: '판이 어두워서 조준하는 곳 주변만 밝아요.', how: '친구 거품은 반짝여서 보여요.', art: 'dark' },
    conveyor: { title: '컨베이어', text: '몇 발마다 화살표가 붙은 줄이 한 칸씩 옆으로 움직여요.', how: '움직인 뒤 모양을 예상해요.', art: 'conveyor' },
    k: { title: '쿠키 블록', text: '쿠키는 색이 없어 터지지 않아요.', how: '위쪽을 끊어 떨어뜨려요.', art: 'k' },
    shotTimer: { title: '한 발 초침', text: '정해진 초 안에 쏘지 않으면 지금 방향으로 자동 발사돼요.', how: '대포 둘레의 시계를 보세요.', art: 'clock' },
    i: { title: '얼음 거품', text: '얼음 거품은 짝이 되지 않아요. 옆 거품이 터지면 녹아요.', how: '옆을 먼저 터뜨려요.', art: 'i' },
    dropSec: { title: '시간 천장', text: '몇 초마다 천장이 한 칸씩 내려와요.', how: '빨리 쏠수록 유리해요.', art: 'clock' },
    g: { title: '선물 상자', text: '터뜨리거나 떨어뜨리면 다음 거품이 무지개 거품이 돼요.', how: '무지개 거품은 붙은 곳에서 가장 좋은 색이 돼요.', art: 'g' },
    'nom-block': { title: '꼬마 놈놈 — 대포 막기', text: '놈놈이 대포 앞을 막으면 쏜 거품이 막혀요.', how: '맨 앞 친구(또는 대포)를 눌러 간지럼 공격!', art: 'nom' },
    'aim-blink': { title: '깜빡 조준선', text: '고장 난 조준기 때문에 조준선이 깜빡여요.', how: '보일 때 방향을 기억해요.', art: 'aim' },
    'nom-junk': { title: '꼬마 놈놈 — 방해 거품', text: '놈놈이 색 없는 회색 거품을 던져 붙여요.', how: '위쪽 줄기를 끊어 떨어뜨려요.', art: 'nom' },
    'nom-take': { title: '꼬마 놈놈 — 친구 데려가기', text: '놈놈이 줄 선 친구를 데려가면 남은 발사가 1 줄어요.', how: '3발 안에 놈놈을 맞히면 되찾아요.', art: 'nom' },
    'aim-none': { title: '조준선 없음', text: '거울 때문에 조준선이 보이지 않아요. 대포 앞 화살표만 보여요.', how: '반딧불 거품이 3발 동안 길을 비춰 줘요.', art: 'aim' },
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
    if (st.boss && st.boss.sticky) add('s');
    if (st.boss && st.boss.phases) st.boss.phases.forEach(fromHz);
    return out;
  }
  return { STAGES: S, WORLDS, INFO, keysOf };
})();
