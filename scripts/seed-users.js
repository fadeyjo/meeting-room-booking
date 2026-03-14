#!/usr/bin/env node

const AUTH_BASE = process.env.AUTH_SERVICE_URL || 'http://auth-service:5000';
const BOOKINGS_BASE = process.env.BOOKINGS_SERVICE_URL || 'http://bookings-service:5000';
const ROOMS_BASE = process.env.ROOMS_SERVICE_URL || 'http://rooms-service:5000';
const INVITATIONS_BASE = process.env.INVITATIONS_SERVICE_URL || 'http://invitations-service:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mail.ru';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-777';

const DEMO_MEETING = {
  organizerEmail: 'nizami@mail.ru',
  organizerPassword: 'nizami-777',
  title: 'обсуждение обновления для нового айфона',
  description: 'быть обязательно всем!',
  start_time: '10:00',
  end_time: '11:00',
};

const SEED_USERS = [
  {
    email: 'nizami@mail.ru',
    password: 'nizami-777',
    lastName: 'Алекперов',
    firstName: 'Низами',
    patronymic: 'Джасурович',
    phoneNumber: '+79666777333',
    birth: '2004-07-23',
    position: 'Руководитель',
    roleName: 'User',
  },
  {
    email: 'egor@mail.ru',
    password: 'egor-777',
    lastName: 'Губин',
    firstName: 'Егор',
    patronymic: 'Вячеславович',
    phoneNumber: '+79222111333',
    birth: '2004-08-02',
    position: 'Программист',
    roleName: 'User',
  },
  {
    email: 'maxim@mail.ru',
    password: 'maxim-777',
    lastName: 'Валявкин',
    firstName: 'Максим',
    patronymic: 'Александрович',
    phoneNumber: '+79888444222',
    birth: '2003-10-07',
    position: 'Конструктор',
    roleName: 'User',
  },
  {
    email: 'artem@mail.ru',
    password: 'artem-777',
    lastName: 'Боков',
    firstName: 'Артем',
    patronymic: 'Алексеевич',
    phoneNumber: '+79000999555',
    birth: '2002-12-24',
    position: 'Аналитик',
    roleName: 'User',
  },
  {
    email: 'maria@mail.ru',
    password: 'maria-777',
    lastName: 'Кузнецова',
    firstName: 'Мария',
    patronymic: 'Сергеевна',
    phoneNumber: '+77777777777',
    birth: '2006-03-19',
    position: 'Менеджер',
    roleName: 'User',
  },
];

function getYesterdayMSK() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
  const d = new Date(today + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request(base, path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.title || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

async function login(email, password) {
  const data = await request(AUTH_BASE, '/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.accessToken;
}

async function getUsers(token) {
  return request(AUTH_BASE, '/api/auth/users', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createUser(token, body) {
  return request(AUTH_BASE, '/api/auth/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function getRooms(token) {
  return request(ROOMS_BASE, '/api/rooms?is_active=true', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getMyMeetings(token) {
  return request(BOOKINGS_BASE, '/api/bookings/my-meetings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function createBooking(token, body) {
  return request(BOOKINGS_BASE, '/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function createInvitation(token, body) {
  return request(INVITATIONS_BASE, '/api/invitations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function acceptInvitation(invitationId, token) {
  return request(INVITATIONS_BASE, `/api/invitations/${invitationId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getInvitationsByBooking(bookingId, token) {
  return request(INVITATIONS_BASE, `/api/invitations/booking/${bookingId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function main() {
  const maxAttempts = 20;
  let token;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      token = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
      break;
    } catch (e) {
      if (e.status === 401 || e.status === 403) {
        console.error('неверные креды админа, пропиши ADMIN_EMAIL и ADMIN_PASSWORD как в бд');
        process.exit(1);
      }
      if (i === maxAttempts - 1) {
        console.error('auth ещё не поднялся:', e.message);
        process.exit(1);
      }
      await sleep(2000);
    }
  }

  let users;
  try {
    users = await getUsers(token);
  } catch (e) {
    console.error('не получилось подтянуть юзеров:', e.message);
    process.exit(1);
  }

  if (!Array.isArray(users)) {
    console.error('от auth прилетел не тот формат юзеров');
    process.exit(1);
  }

  const onlyAdmin = users.length <= 1;
  if (onlyAdmin) {
    console.log('создаю пятерых юзеров...');
    for (const u of SEED_USERS) {
      try {
        await createUser(token, u);
        console.log('создан:', u.email);
      } catch (e) {
        if (e.status === 409 || (e.body && (e.body.title || '').includes('уже'))) {
          console.log('уже есть:', u.email);
        } else {
          console.error('не создался', u.email, e.message);
        }
      }
    }
  } else {
    console.log('юзеры уже есть, скип');
  }

  const yesterdayMSK = getYesterdayMSK();
  let nizamiToken;
  try {
    nizamiToken = await login(DEMO_MEETING.organizerEmail, DEMO_MEETING.organizerPassword);
  } catch (e) {
    console.log('организатор не найден или auth падает, скип демо-встречи');
    process.exit(0);
  }

  let meetings = [];
  try {
    meetings = await getMyMeetings(nizamiToken);
  } catch (e) {
    console.log('встречи не подтянулись, скип демо');
    process.exit(0);
  }

  const hasDemo = Array.isArray(meetings) && meetings.some(
    (m) => m.title === DEMO_MEETING.title && m.date === yesterdayMSK
  );
  if (hasDemo) {
    console.log('демо-встреча уже есть, скип');
    process.exit(0);
  }

  {
    let rooms = [];
    try {
      rooms = await getRooms(nizamiToken);
    } catch (e) {
      console.log('комнаты не подтянулись, скип');
      process.exit(0);
    }
    if (!Array.isArray(rooms) || rooms.length === 0) {
      console.log('комнат нет, скип');
      process.exit(0);
    }
    const roomId = rooms[0].id;
    try {
      await createBooking(nizamiToken, {
        room_id: roomId,
        title: DEMO_MEETING.title,
        description: DEMO_MEETING.description,
        date: yesterdayMSK,
        start_time: DEMO_MEETING.start_time,
        end_time: DEMO_MEETING.end_time,
      });
      console.log('создало демо-встречу на вчера:', DEMO_MEETING.title, yesterdayMSK);
    } catch (e) {
      console.error('не создало демо-встречу:', e.message);
      process.exit(1);
    }
  }

  console.log('сид готов');
}

main().catch((e) => {
  console.error('ошибка', e?.message ?? e);
  process.exit(1);
});
