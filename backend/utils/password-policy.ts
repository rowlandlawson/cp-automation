import { HttpError } from "./http-error";

export const PASSWORD_MIN_LENGTH = 12;

export function getPasswordPolicyErrors(password: string): string[] {
  const issues: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push(`be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!/[a-z]/.test(password)) {
    issues.push("include at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    issues.push("include at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    issues.push("include at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    issues.push("include at least one symbol");
  }

  return issues;
}

export function getPasswordPolicyMessage(): string {
  return `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include uppercase, lowercase, number, and symbol characters.`;
}

export function assertPasswordPolicy(password: string): void {
  const issues = getPasswordPolicyErrors(password);

  if (issues.length === 0) {
    return;
  }

  throw new HttpError(400, `Password must ${issues.join(", ")}.`);
}
