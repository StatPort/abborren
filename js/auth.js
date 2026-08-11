const ABBORREN_USER = "abborren";
const ABBORREN_PASS = "backyard";
const AUTH_KEY = "abborren_authed";

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === "yes";
}

function requireAuth(loginPagePath) {
  if (!isLoggedIn()) {
    window.location.href = loginPagePath;
  }
}

function tryLogin(username, password) {
  if (username.trim().toLowerCase() === ABBORREN_USER && password === ABBORREN_PASS) {
    sessionStorage.setItem(AUTH_KEY, "yes");
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
