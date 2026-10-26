// 방명록: 구글 로그인(Supabase) → 로그인한 사람만 남기기 · 내 글만 지우기 → 최신순 목록을 다시 읽어 온다
// 완료 조건: 빈 칸은 안 됨 · 다른 기기에서도 같은 글 · 규칙은 guestbook-login.sql

// 아래 두 값은 「연습용 방명록」(강사 Supabase)이다. 내 Supabase로 바꾸려면 내 프로젝트 주소와 공개 키를 넣는다.
// 공개 키는 페이지에 넣어도 되는 키다. 규칙이 허락한 일(읽기·쓰기)만 할 수 있다. 비밀 키는 절대 넣지 않는다.
const SUPABASE_URL = 'https://pwvoamdnvzmkzrnclphq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5tR5j7BfmVeVnWmQhuekBA_Ldit4C8T';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let me = null;   // 로그인한 사람 (없으면 null)

function showNotice(text) {
  const notice = document.querySelector('#notice');
  notice.textContent = text;
  notice.hidden = text === '';
}

function timeText(iso) {
  const d = new Date(iso);
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function googleName(user) {
  const meta = user.user_metadata || {};
  return meta.full_name || meta.name || user.email || '이름 없음';
}

// 로그인 상태에 맞게 버튼과 글쓰기 칸을 보여 주거나 숨긴다
function renderAuth() {
  document.querySelector('#login').hidden = me !== null;
  document.querySelector('#user-box').hidden = me === null;
  document.querySelector('#write-box').hidden = me === null;
  document.querySelector('#login-hint').hidden = me !== null;
  if (me) document.querySelector('#user-name').textContent = googleName(me);
}

async function loadList() {
  const list = document.querySelector('#guestbook-list');
  const { data: rows, error } = await db
    .from('guestbook')
    .select('id,nickname,message,created_at,user_id')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다</li>';
    console.error(error);
    return;
  }
  list.innerHTML = '';
  if (rows.length === 0) {
    list.innerHTML = '<li class="empty">아직 글이 없습니다</li>';
    return;
  }
  rows.forEach((row) => {
    const li = document.createElement('li');
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = row.nickname;
    const when = document.createElement('span');
    when.className = 'when';
    when.textContent = timeText(row.created_at);
    li.append(who, when);
    if (me && row.user_id === me.id) {   // 내가 쓴 글에만 「지우기」
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.textContent = '지우기';
      del.addEventListener('click', () => remove(row.id));
      li.append(del);
    }
    const text = document.createElement('p');
    text.className = 'text';
    text.textContent = row.message;
    li.append(text);
    list.append(li);
  });
}

async function leave() {
  if (!me) {
    showNotice('먼저 구글로 로그인해 주세요.');
    return;
  }
  const message = document.querySelector('#message').value.trim();
  if (message === '') {   // 빈 칸이면 저장하지 않는다
    showNotice('한마디를 적어 주세요.');
    return;
  }
  const button = document.querySelector('#leave');
  button.disabled = true;
  // user_id는 서버가 로그인한 사람으로 채운다
  const { error } = await db.from('guestbook').insert({
    nickname: googleName(me).slice(0, 20),
    message: message,
  });
  button.disabled = false;
  if (error) {
    showNotice('저장하지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
    console.error(error);
    return;
  }
  document.querySelector('#message').value = '';
  showNotice('');
  await loadList();
}

async function remove(id) {
  if (!confirm('이 글을 지울까요?')) return;
  const { error } = await db.from('guestbook').delete().eq('id', id);
  if (error) {
    showNotice('지우지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
    console.error(error);
    return;
  }
  showNotice('');
  await loadList();
}

document.querySelector('#login').addEventListener('click', () => {
  db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
});
document.querySelector('#logout').addEventListener('click', () => db.auth.signOut());
document.querySelector('#leave').addEventListener('click', leave);

// 로그인·로그아웃이 일어날 때마다 화면과 목록을 새로 그린다 (처음 열 때도 한 번 불린다)
db.auth.onAuthStateChange((_event, session) => {
  me = session ? session.user : null;
  renderAuth();
  setTimeout(loadList, 0);
});
