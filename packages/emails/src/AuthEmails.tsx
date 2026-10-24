import { getEmailMessages, interpolate } from "./i18n/index.js";
import { PLATFORM_BRAND } from "./kit/brand.js";
import {
  Block,
  Callout,
  Cta,
  CustomerFooter,
  emailFrame,
  EmailShell,
  Eyebrow,
  H1,
  HelpBlock,
  Lead,
  Text,
  type EmailFrame,
} from "./kit/components.js";
import type { BaseEmailProps } from "./kit/types.js";

/*
 * Supabase Auth mail (confirm signup, reset password). Supabase renders these
 * itself, so `supabase/generate.tsx` renders them once with Go template
 * placeholders ({{ .ConfirmationURL }}, {{ .Email }}) and the output is pasted
 * into the Supabase dashboard. They always use Tallaby's identity.
 */

interface AuthEmailProps extends BaseEmailProps {
  email: string;
  actionUrl: string;
}

function FallbackLink({ f, label, url }: { f: EmailFrame; label: string; url: string }) {
  return (
    <Text f={f} muted size={13} pad={14}>
      {label}
      <br />
      <a href={url} dir="ltr" style={{ color: f.brand.primary, wordBreak: "break-all" }}>
        {url}
      </a>
    </Text>
  );
}

export interface WelcomeVerifyEmailProps extends AuthEmailProps {
  name?: string | null | undefined;
}

/**
 * Welcome + email confirmation (Claude Design `Customer - Welcome - Verify`).
 * The design shows a 6-digit code; signup confirms by link here (no code-entry
 * screen exists), so the code box became the confirm button.
 */
export const WelcomeVerifyEmail = ({ email, actionUrl, name, locale = "ar", brand = PLATFORM_BRAND }: WelcomeVerifyEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).welcomeVerify;
  return (
    <EmailShell f={f} audience="customer" title={copy.subject} preview={copy.preview} footer={<CustomerFooter f={f} email={email} />}>
      <Block f={f} padding="36px 32px 32px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{name ? interpolate(copy.heading, { name }) : copy.headingNoName}</H1>
        <Lead f={f}>{copy.lead}</Lead>
        <Cta f={f} href={actionUrl} label={copy.confirm} />
        <Callout f={f}>{copy.linkNote}</Callout>
        <FallbackLink f={f} label={copy.fallback} url={actionUrl} />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.ignore}
        </HelpBlock>
      </Block>
    </EmailShell>
  );
};

/** Password reset (Claude Design `Customer - Password Reset`). */
export const PasswordResetEmail = ({ email, actionUrl, locale = "ar", brand = PLATFORM_BRAND }: AuthEmailProps) => {
  const f = emailFrame(brand, locale);
  const copy = getEmailMessages(locale).passwordReset;
  return (
    <EmailShell f={f} audience="customer" title={copy.subject} preview={copy.preview} footer={<CustomerFooter f={f} email={email} />}>
      <Block f={f} padding="36px 32px 32px">
        <Eyebrow f={f}>{copy.eyebrow}</Eyebrow>
        <H1 f={f}>{copy.heading}</H1>
        <Lead f={f}>{copy.lead}</Lead>
        <Cta f={f} href={actionUrl} label={copy.cta} />
        <Callout f={f}>{copy.linkNote}</Callout>
        <FallbackLink f={f} label={copy.fallback} url={actionUrl} />
      </Block>
      <Block f={f} divider padding="0 32px 32px" last>
        <HelpBlock f={f} title={null}>
          {copy.ignore}
        </HelpBlock>
      </Block>
    </EmailShell>
  );
};
