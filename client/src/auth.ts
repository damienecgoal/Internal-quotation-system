const KEY = "quotation-user";

export function currentUser(): string | null {
  return sessionStorage.getItem(KEY);
}

export function login(username: string, password: string): boolean {
  if (username === "Damien" && password === "12345678") {
    sessionStorage.setItem(KEY, username);
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(KEY);
}
