import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "@shared-backend/utils/jwt";
import type { RegisterDto, TokensDto, LogoutedDto, RedactPersonDto, PersonDetail } from "@shared-types/types";
import { HttpError } from "@shared-backend/utils/http-error";
import { AccessTokenPayload } from "@shared-backend/utils/jwt";

type PersonWithRoleAndPosition = {
  person_id: number;
  email: string;
  last_name: string;
  first_name: string;
  patronymic: string | null;
  fired_at: Date | null;
  role: { role_name: string };
  position: { position: string };
};

export class AuthService {
  async searchUser(sub: string) {
    const users = await prisma.person.findMany({
      where: {
        fired_at: null,
        OR: [
          { last_name: { contains: sub } },
          { first_name: { contains: sub } },
          { patronymic: { contains: sub } }
        ]
      },
      include: {
        role: true,
        position: true
      }
    });

    const result: PersonDetail[] = users.map((user: PersonWithRoleAndPosition) => ({
      id: user.person_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      patronymic: user.patronymic,
      position: user.position.position,
      role: user.role.role_name,
      firedAt: user.fired_at ? user.fired_at.toISOString() : null
    }));

    return result;
  }

  async redactPerson(personData: RedactPersonDto, personId: number) {
    let findedPerson =
      await prisma.person
        .findUnique({ where: { person_id: personId } })

    if (!findedPerson)
      throw new HttpError("Пользователь не найден", 404)

    findedPerson =
      await prisma.person
        .findUnique({ where: { email: personData.email } })

    if (findedPerson)
      throw new HttpError("Пользователь с таким email уже существует", 409)

    findedPerson =
      await prisma.person
        .findUnique({ where: { phone_number: personData.phoneNumber } })

    if (findedPerson)
      throw new HttpError("Пользователь с таким номером телефона уже существует", 409)
  

    const position = await prisma.position.findUnique({
      where: { position: personData.position },
    });
    if (!position)
      throw new HttpError("Позиция не найдена", 404);

    const role = await prisma.role.findUnique({
      where: { role_name: personData.roleName },
    });
    if (!role) throw new HttpError("Роль не найдена", 404);

    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(personData.password, salt);

    const updatedPerson = await prisma.person.update({
      where: { person_id: personId },
      data: {
        email: personData.email,
        phone_number: personData.phoneNumber,
        birth: new Date(personData.birth),
        last_name: personData.lastName,
        first_name: personData.firstName,
        patronymic: personData.patronymic ?? null,
        position_id: position.position_id,
        hashed_password: hashedPassword,
        role_id: role.role_id,
        fired_at: personData.firedAt ? new Date(personData.firedAt) : null,
      },
    });

    const result: PersonDetail = {
      id: updatedPerson.person_id,
      email: updatedPerson.email,
      lastName: updatedPerson.last_name,
      firstName: updatedPerson.first_name,
      patronymic: updatedPerson.patronymic ?? null,
      position: position.position,
      role: role.role_name,
      firedAt: updatedPerson.fired_at?.toISOString() ?? null,
    };

    return result;
  }

  async getAllUsers() {
    const users = await prisma.person.findMany({
      include: {
        role: true,
        position: true
      }
    });

    const result: PersonDetail[] = users.map((user) => ({
      id: user.person_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      patronymic: user.patronymic ?? null,
      position: user.position.position,
      role: user.role.role_name,
      firedAt: user.fired_at ? user.fired_at.toISOString() : null
    }));

    return result;
  }

  async refresh(refreshToken: string) {
    let payload: AccessTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError("Не авторизован", 401);
    }

    const tokens = await prisma.refreshToken.findMany({
      where: {
        person_id: payload.personId,
      }
    });

    let findedToken = null

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.hashed_token);

      if (!isMatch) continue;

      findedToken = token

      break;
    }

    if (findedToken === null) {
      throw new HttpError("Не авторизован", 401);
    }

    if (findedToken.is_revoked) {
      throw new HttpError("Не авторизован", 401);
    }

    await prisma.refreshToken.update({
      where: {
        token_id: findedToken.token_id
      },
      data: {
        is_revoked: true
      },
    });

    const accessToken = generateAccessToken({
      personId: payload.personId,
      roleId: payload.roleId
    });

    const newRefreshToken = generateRefreshToken({
      personId: payload.personId,
      roleId: payload.roleId
    });

    const salt = await bcrypt.genSalt();
    const hashedToken =
      await bcrypt.hash(
        newRefreshToken,
        salt
      );

    await prisma.refreshToken.create({
      data: {
        hashed_token: hashedToken,
        person_id: payload.personId,
        expires:
          new Date(
            Date.now() + Number(process.env.JWT_REFRESH_EXPIRE_D) * 2400000 * 36
          ),
        is_revoked: false
      }
    });

    const response: TokensDto = {
      accessToken: accessToken,
      refreshToken: newRefreshToken
    }

    return response;
  }

  async register(data: RegisterDto) {
    let findedPerson =
      await prisma.person
        .findUnique({ where: { email: data.email } });

    if (findedPerson)
      throw new HttpError("Пользователь с таким email уже существует", 409);

    findedPerson =
      await prisma.person
        .findUnique({ where: { phone_number: data.phoneNumber } });

    if (findedPerson)
      throw new HttpError("Пользователь с таким номером телефона уже существует", 409);

    const role =
      await prisma.role
        .findUnique({ where: { role_name: data.roleName } });

    if (!role) throw new HttpError("Неизвестная роль", 404);

    const position =
      await prisma.position
        .findUnique({ where: { position: data.position } });

    if (!position) throw new HttpError("Неизвестная должность", 404);

    const salt = await bcrypt.genSalt();
    const hashedPassword =
      await bcrypt.hash(
        data.password,
        salt
      );

    const person = await prisma.person.create({
      data: {
        email: data.email,
        phone_number: data.phoneNumber,
        birth: new Date(data.birth),
        last_name: data.lastName,
        first_name: data.firstName,
        patronymic: data.patronymic ?? null,
        created_at: new Date(),
        hashed_password: hashedPassword,
        role_id: role.role_id,
        position_id: position.position_id
      }
    });

    const response: PersonDetail = {
      id: person.person_id,
      email: person.email,
      firstName: person.first_name,
      lastName: person.last_name,
      patronymic: person.patronymic,
      position: position.position,
      role: role.role_name,
      firedAt: person.fired_at ? person.fired_at.toISOString() : null
    };

    return response;
  }

  async login(email: string, password: string) {
    const person = await prisma.person.findUnique({
      where: { email }
    });

    if (!person) {
      throw new HttpError("Пользователь не зарегистрирован", 404);
    }

    const valid = await bcrypt.compare(password, person.hashed_password);

    if (!valid) {
      throw new HttpError("Неверный пароль", 401);
    }

    const accessToken = generateAccessToken({
      personId: person.person_id,
      roleId: person.role_id
    });

    const refreshToken = generateRefreshToken({
      personId: person.person_id,
      roleId: person.role_id
    });

    const salt = await bcrypt.genSalt();
    const hashedToken =
      await bcrypt.hash(
        refreshToken,
        salt
      );

    await prisma.refreshToken.create({
      data: {
        hashed_token: hashedToken,
        person_id: person.person_id,
        expires:
          new Date(
            Date.now() + Number(process.env.JWT_REFRESH_EXPIRE_D) * 2400000 * 36
          ),
        is_revoked: false
      }
    });

    const response: TokensDto = {
      accessToken: accessToken,
      refreshToken: refreshToken
    }

    return response;
  }

  async logout(refreshToken: string) {
    let payload: AccessTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError("Не авторизован", 401);
    }

    await prisma.refreshToken.updateMany({
      where: { person_id: payload.personId },
      data: { is_revoked: true }
    })

    const response: LogoutedDto = {
      personId: payload.personId
    }

    return response;
  }
}