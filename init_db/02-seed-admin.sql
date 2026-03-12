SET NAMES utf8mb4;

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
