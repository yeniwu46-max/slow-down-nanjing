const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveLoginEmail(usernameOrEmail: string): string {
  const trimmed = usernameOrEmail.trim();
  if (trimmed.includes("@")) return normalizeEmail(trimmed);
  return `${trimmed}@slowdown.local`;
}

export function validateRegisterInput(input: {
  email: string;
  password: string;
  confirmPassword?: string;
  name: string;
}): string | null {
  const email = normalizeEmail(input.email);
  if (!email) return "\u8BF7\u586B\u5199\u90AE\u7BB1";
  if (!EMAIL_RE.test(email)) return "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u90AE\u7BB1";

  const name = input.name.trim();
  if (!name) return "\u8BF7\u586B\u5199\u6635\u79F0";

  const password = input.password;
  if (!password) return "\u8BF7\u586B\u5199\u5BC6\u7801";
  if (password.length < 8) return "\u5BC6\u7801\u81F3\u5C11 8 \u4F4D";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "\u5BC6\u7801\u987B\u540C\u65F6\u5305\u542B\u5B57\u6BCD\u4E0E\u6570\u5B57";
  }

  if (input.confirmPassword !== undefined && password !== input.confirmPassword) {
    return "\u4E24\u6B21\u5BC6\u7801\u4E0D\u4E00\u81F4";
  }

  return null;
}

export function validateLoginInput(input: { email: string; password: string }): string | null {
  if (!input.email.trim()) return "\u8BF7\u586B\u5199\u7528\u6237\u540D\u6216\u90AE\u7BB1";
  if (!input.password) return "\u8BF7\u586B\u5199\u5BC6\u7801";
  return null;
}
