SET NAMES utf8mb4;
ALTER DATABASE meeting_room CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meeting_room.positions (
    position_id tinyint unsigned auto_increment primary key,
    position varchar(50) not null unique
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO meeting_room.positions (position) VALUES
    ('Программист'),
    ('Аналитик'),
    ('Конструктор'),
    ('Технолог');

CREATE TABLE IF NOT EXISTS meeting_room.roles (
    role_id tinyint unsigned auto_increment primary key,
    role_name varchar(50) not null unique
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO meeting_room.roles (role_name) VALUES
    ('User'),
    ('Admin');

CREATE TABLE IF NOT EXISTS meeting_room.persons (
    person_id int unsigned auto_increment primary key,
    created_at datetime not null,
    email varchar(320) unique not null,
    phone_number varchar(12) unique not null,
    birth date not null,
    last_name varchar(50) not null,
    first_name varchar(50) not null,
    patronymic varchar(50),
    position_id tinyint unsigned not null,
    hashed_password varchar(600) not null,
    role_id tinyint unsigned not null,
    fired_at datetime,

    foreign key (position_id) references meeting_room.positions (position_id) on delete cascade,
    foreign key (role_id) references meeting_room.roles (role_id) on delete cascade
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meeting_room.refresh_tokens (
    token_id int unsigned auto_increment primary key,
    hashed_token varchar(600) not null unique,
    person_id int unsigned not null,
    expires datetime not null,
    is_revoked boolean not null,

    foreign key (person_id) references meeting_room.persons (person_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS meeting_room.rooms (
    room_id smallint unsigned auto_increment primary key,
    room_name varchar(50) not null unique,
    floor tinyint unsigned not null,
    room smallint unsigned not null,
    is_active boolean not null,
    capacity tinyint unsigned not null,
    has_projector boolean not null,
    has_tv boolean not null,
    has_whiteboard boolean not null,
    room_description text not null
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meeting_room.booking (
    book_id int unsigned auto_increment primary key,
    title text not null,
    organizer_id int unsigned not null,
    created_at datetime not null,
    room_id smallint unsigned not null,
    booking_date date not null,
    started_at time not null,
    ended_at time not null,
    booking_description text not null,

    foreign key (organizer_id) references meeting_room.persons (person_id) on delete cascade,
    foreign key (room_id) references meeting_room.rooms (room_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS meeting_room.booking_roles (
    role_id tinyint unsigned auto_increment primary key,
    role_name varchar(50) not null unique
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO meeting_room.booking_roles (role_name) VALUES
    ('Слушатель'),
    ('Спикер');

CREATE TABLE IF NOT EXISTS meeting_room.invitations_status (
    status_id tinyint unsigned auto_increment primary key,
    status_name varchar(50) not null unique
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO meeting_room.invitations_status (status_name) VALUES
    ('Ожидает'),
    ('Принято'),
    ('Отклонено');

CREATE TABLE IF NOT EXISTS meeting_room.invitations (
    invitation_id int unsigned auto_increment primary key,
    invitation_on datetime not null,
    initiator_id int unsigned not null,
    guest_id int unsigned not null,
    book_id int unsigned not null,
    role_id tinyint unsigned not null,
    invite_message text not null,
    status_id tinyint unsigned,

    foreign key (initiator_id) references meeting_room.persons (person_id) on delete cascade,
    foreign key (guest_id) references meeting_room.persons (person_id) on delete cascade,
    foreign key (book_id) references meeting_room.booking (book_id) on delete cascade,
    foreign key (role_id) references meeting_room.booking_roles (role_id) on delete cascade,
    foreign key (status_id) references meeting_room.invitations_status (status_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS meeting_room.invitation_requests (
    request_id int unsigned auto_increment primary key,
    book_id int unsigned not null,
    requested_by_id int unsigned not null,
    guest_id int unsigned not null,
    role_id tinyint unsigned not null,
    invite_message text not null,
    status varchar(50) not null default 'pending',
    created_at datetime not null,
    decided_at datetime null,
    decided_by_id int unsigned null,

    foreign key (book_id) references meeting_room.booking (book_id) on delete cascade,
    foreign key (requested_by_id) references meeting_room.persons (person_id) on delete cascade,
    foreign key (guest_id) references meeting_room.persons (person_id) on delete cascade,
    foreign key (role_id) references meeting_room.booking_roles (role_id) on delete cascade,
    foreign key (decided_by_id) references meeting_room.persons (person_id) on delete set null
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
