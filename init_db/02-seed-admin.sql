-- Кодировка UTF-8 для кириллицы (имя/фамилия)
SET NAMES utf8mb4;

-- Единственный начальный пользователь для входа (как в примере OpenAPI)
-- Логин: admin@mail.ru  Пароль: admin-777
-- role_id 2 = Admin, position_id 1 = Программист
INSERT INTO meeting_room.persons (
    created_at, email, phone_number, birth, last_name, first_name, patronymic,
    position_id, hashed_password, role_id, fired_at
) VALUES (
    NOW(),
    'admin@mail.ru',
    '+79001234567',
    '1990-01-01',
    'Админ',
    'Системы',
    NULL,
    1,
    '$2b$10$PNeSIN.oZJsLgbZevafF4OsFKbZoAPI5M1.5nmrugvYM.CSu849oW',
    2,
    NULL
);
