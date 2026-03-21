import { useState } from "react";
import "./LoginForm.css";

type LoginFormProps = {
  /** 一致したときに呼ばれる */
  onSuccess: () => void;
  correctPassword?: string;
};

export function LoginForm({
  onSuccess,
  correctPassword = "nexus",
}: LoginFormProps) {
  const [password, setPassword] = useState("");

  const tryLogin = () => {
    if (password === correctPassword) {
      onSuccess();
    }
  };

  return (
    <div className="login-form">
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") tryLogin();
        }}
      />
      <button type="button" onClick={tryLogin}>
        ログイン
      </button>
    </div>
  );
}
