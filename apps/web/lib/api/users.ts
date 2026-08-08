import type {
  ChangePhoneDto,
  ConfirmEmailChangeDto,
  RequestEmailChangeDto,
} from "@urnight/contracts";
import { apiFetch } from "./client";

export function requestEmailChange(
  dto: RequestEmailChangeDto,
  token: string,
): Promise<void> {
  return apiFetch<void>("/users/me/email/change-request", {
    method: "POST",
    json: dto,
    token,
  });
}

export function confirmEmailChange(dto: ConfirmEmailChangeDto): Promise<void> {
  return apiFetch<void>("/users/me/email/change-confirm", {
    method: "POST",
    json: dto,
  });
}

export function changePhone(
  dto: ChangePhoneDto,
  token: string,
): Promise<void> {
  return apiFetch<void>("/users/me/phone", {
    method: "PATCH",
    json: dto,
    token,
  });
}
