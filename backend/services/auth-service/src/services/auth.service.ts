import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../../../../shared/utils/jwt";
import { RegisterDto } from "../dto/register.dto";
import { TokensDto } from "../dto/tokens.dto";
import { HttpError } from "../../../../shared/utils/http-error";
import { AccessTokenPayload } from "../../../../shared/utils/jwt";
import { LogoutedDto } from "../dto/logouted.dto";

export class AuthService {

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
        .findUnique({ where: { email: data.email } })

    if (findedPerson)
      throw new HttpError("Пользователь с таким email уже существует", 409)

    findedPerson =
      await prisma.person
        .findUnique({ where: { phone_number: data.phoneNumber } })

    if (findedPerson)
      throw new HttpError("Пользователь с таким номером телефона уже существует", 409)

    const role =
      await prisma.role
        .findUnique({ where: { role_name: data.roleName } });

    if (!role) throw new HttpError("Неизвестная роль", 404);

    const position =
      await prisma.position
        .findUnique({ where: { position: data.position } });
    
    if (!position) throw new HttpError("Неизвестная должность", 404);

    let salt = await bcrypt.genSalt();
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
        patronymic: data.patronymic,
        created_at: new Date(),
        hashed_password: hashedPassword,
        role_id: role.role_id,
        position_id: position.position_id
      }
    });

    const accessToken = generateAccessToken({
      personId: person.person_id,
      roleId: person.role_id
    });

    const refreshToken = generateRefreshToken({
      personId: person.person_id,
      roleId: person.role_id
    });

    salt = await bcrypt.genSalt();
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