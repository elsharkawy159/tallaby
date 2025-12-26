import { LoginFormClient } from "./login-form.client";
import { LoginOAuth } from "./login-oauth.client";

export function LoginFormWrapper({ redirectTo }: { redirectTo?: string }) {
  return (
    <>
      <LoginFormClient redirectTo={redirectTo} />
      <LoginOAuth />
    </>
  );
}
