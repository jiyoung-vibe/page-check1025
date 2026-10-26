// 방명록: 남기기 → 데이터베이스(Supabase)의 guestbook 표에 한 줄 저장 → 최신순 목록을 다시 읽어 온다
// 완료 조건: 빈 칸은 안 됨 · 다른 기기에서도 같은 글

// 아래 두 값은 「연습용 방명록」(강사 Supabase)이다. 내 Supabase로 바꾸려면 내 프로젝트 주소와 공개 키를 넣는다.
// 공개 키는 페이지에 넣어도 되는 키다. 규칙이 허락한 일(읽기·쓰기)만 할 수 있다. 비밀 키는 절대 넣지 않는다.
const SUPABASE_URL = 'https://pwvoamdnvzmkzrnclphq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5tR5j7BfmVeVnWmQhuekBA_Ldit4C8T';

const TABLE_URL = SUPABASE_URL + '/rest/v1/guestbook';
const HEADERS = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };

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

async function loadList() {
  const list = document.querySelector('#guestbook-list');
  try {
    const res = await fetch(TABLE_URL + '?select=nickname,message,created_at&order=created_at.desc&limit=50', { headers: HEADERS });
    if (!res.ok) throw new Error('목록 읽기 실패 ' + res.status);
    const rows = await res.json();
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
      const text = document.createElement('p');
      text.className = 'text';
      text.textContent = row.message;
      li.append(who, when, text);
      list.append(li);
    });
  } catch (error) {
    list.innerHTML = '<li class="empty">목록을 불러오지 못했습니다</li>';
    console.error(error);
  }
}

async function leave() {
  const nickname = document.querySelector('#nickname').value.trim();
  const message = document.querySelector('#message').value.trim();
  if (nickname === '' || message === '') {   // 빈 칸이면 저장하지 않는다
    showNotice('별명과 한마디를 모두 적어 주세요.');
    return;
  }
  const button = document.querySelector('#leave');
  button.disabled = true;
  try {
    const res = await fetch(TABLE_URL, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({ nickname: nickname, message: message }),
    });
    if (!res.ok) throw new Error('저장 실패 ' + res.status);
    document.querySelector('#message').value = '';
    showNotice('');
    await loadList();   // 저장한 뒤 최신순 목록을 다시 읽어 온다 → 맨 위에 나타남
  } catch (error) {
    showNotice('저장하지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
    console.error(error);
  } finally {
    button.disabled = false;
  }
}

document.querySelector('#leave').addEventListener('click', leave);
loadList();
