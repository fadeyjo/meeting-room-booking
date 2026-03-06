create table positions (
    position_id tinyint unsigned auto_increment primary key,
    position varchar(50) not null unique
);

insert into positions (position) values
    ('Программист'),
    ('Аналитик'),
    ('Конструктор'),
    ('Технолог');

create table roles (
    role_id tinyint unsigned auto_increment primary key,
    role_name varchar(50) not null unique
);

insert into roles (role_name) values
    ('User'),
    ('Admin');

create table persons (
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

    foreign key (position_id) references positions (position_id) on delete cascade,
    foreign key (role_id) references roles (role_id) on delete cascade
);

create table refresh_tokens (
    token_id int unsigned auto_increment primary key,
    hashed_token varchar(600) not null unique,
    person_id int unsigned not null,
    expires datetime not null,
    is_revoked boolean not null,

    foreign key (person_id) references persons (person_id) on delete cascade
);

create table rooms (
    room_id smallint unsigned auto_increment primary key,
    room_name varchar(50) not null unique,
    floor tinyint unsigned not null,
    room smallint unsigned not null
);

create table booking (
    book_id int unsigned auto_increment primary key,
    organizer_id int unsigned not null,
    created_at datetime not null,
    room_id smallint unsigned not null,
    started_at datetime not null,
    ended_at datetime not null,
    booking_description text not null,

    foreign key (organizer_id) references persons (person_id) on delete cascade,
    foreign key (room_id) references rooms (room_id) on delete cascade
);

create table booking_roles (
    role_id tinyint unsigned auto_increment primary key,
    role_name varchar(50) not null unique
);

insert into booking_roles (role_name) values
    ('Слушатель'),
    ('Спикер');

create table invitations (
    invitation_id int unsigned auto_increment primary key,
    invitation_on datetime not null,
    initiator_id int unsigned not null,
    guest_id int unsigned not null,
    book_id int unsigned not null,
    role_id tinyint unsigned not null,

    foreign key (initiator_id) references persons (person_id) on delete cascade,
    foreign key (guest_id) references persons (person_id) on delete cascade,
    foreign key (book_id) references booking (book_id) on delete cascade,
    foreign key (role_id) references booking_roles (role_id) on delete cascade
);
