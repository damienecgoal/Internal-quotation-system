import { useState } from "react";
import { useTranslation } from "react-i18next";
import { login } from "./auth";
import { Icon } from "./icons";

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState("Damien");
  const [password, setPassword] = useState("12345678");
  const [error, setError] = useState(false);

  return (
    <main className="login-page">
      <form
        className="card login-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!login(username.trim(), password)) {
            setError(true);
            return;
          }
          onSuccess();
        }}
      >
        <p className="eyebrow">{t("company")}</p>
        <h1>{t("login.title")}</h1>
        <p className="lede">{t("login.hint")}</p>
        {error ? <p className="banner error">{t("login.error")}</p> : null}
        <label>
          <span>{t("login.username")}</span>
          <input value={username} autoComplete="username" onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          <span>{t("login.password")}</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <div className="actions">
          <button type="submit" className="primary">
            <Icon name="signin" />
            <span>{t("login.submit")}</span>
          </button>
          <button
            type="button"
            className="quiet"
            onClick={() => void i18n.changeLanguage(i18n.language === "zh-Hant" ? "en" : "zh-Hant")}
          >
            <Icon name="language" />
            <span>{i18n.language === "zh-Hant" ? "English" : "繁體中文"}</span>
          </button>
        </div>
      </form>
    </main>
  );
}
