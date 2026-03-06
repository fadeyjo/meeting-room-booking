import prisma from "../config/prisma";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../utils/jwt";
import { RegisterDto } from "../dto/register.dto";
import { TokensDto } from "../dto/tokens.dto";
import { HttpError } from "../utils/http-error";
import { AccessTokenPayload } from "../utils/jwt";
import { LogoutedDto } from "../dto/logouted.dto";

export class AuthService {

async refresh(refreshToken: string) {
    let payload: AccessTokenPayload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new HttpError("Invalid refresh token", 401);
    }

    const tokens = await prisma.refresh_tokens.findMany({
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
      throw new HttpError("Refresh token not found", 404);
    }

    if (findedToken.is_revoked) {
      console.log(findedToken.is_revoked)
      console.log(findedToken.token_id)
      throw new HttpError("Refresh token is revoked", 401);
    }

    await prisma.refresh_tokens.update({
      where: {
        token_id: findedToken.token_id,
      },
      data: {
        is_revoked: true,
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

    await prisma.refresh_tokens.create({
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
      await prisma.persons
        .findUnique({ where: { email: data.email } })

    if (findedPerson)
      throw new HttpError("User by email already exists", 409)

    findedPerson =
      await prisma.persons
        .findUnique({ where: { phone_number: data.phoneNumber } })

    if (findedPerson)
      throw new HttpError("User by phone number already exists", 409)

    const role =
      await prisma.roles
        .findUnique({ where: { role_name: data.roleName } });

    if (!role) throw new HttpError("Role not found", 404);

    const position =
      await prisma.positions
        .findUnique({ where: { position: data.position } });
    
    if (!position) throw new HttpError("Position not found", 404);

    let salt = await bcrypt.genSalt();
    const hashedPassword =
      await bcrypt.hash(
        data.password,
        salt
      );

    const person = await prisma.persons.create({
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

    await prisma.refresh_tokens.create({
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
    const person = await prisma.persons.findUnique({
      where: { email }
    });

    if (!person) {
      throw new HttpError("User not found", 404);
    }

    const valid = await bcrypt.compare(password, person.hashed_password);

    if (!valid) {
      throw new HttpError("Invalid password", 401);
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

    await prisma.refresh_tokens.create({
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
      throw new HttpError("Invalid refresh token", 401);
    }

    await prisma.refresh_tokens.updateMany({
      where: { person_id: payload.personId },
      data: { is_revoked: true }
    })

    const response: LogoutedDto = {
      personId: payload.personId
    }

    return response;
  }
}