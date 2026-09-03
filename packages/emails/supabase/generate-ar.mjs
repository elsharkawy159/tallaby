import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));

const styles = `    <style>
      :root {
        color-scheme: light;
      }
      @media only screen and (max-width: 600px) {
        .email-body {
          padding: 0 !important;
          background-color: #ffffff !important;
        }
        .email-shell {
          width: 100% !important;
          max-width: 100% !important;
        }
        .email-card {
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
        }
        .email-pad {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        .cta-btn {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
      }
    </style>`;

function buildLinkTemplate({
  title,
  slot,
  variables,
  eyebrow,
  heading,
  bodyHtml,
  ctaLabel,
  ctaHref,
  securityTitle,
  securityBody,
  disclaimer,
}) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${title}</title>
    <!--
      Supabase Auth → Email Templates → ${slot}
      Variables: ${variables}
      Arabic / RTL — paste into Supabase dashboard Body field.
    -->
${styles}
  </head>
  <body
    class="email-body"
    style="
      margin: 0;
      padding: 24px 12px;
      background-color: #fafaf8;
      color: #333333;
      font-family: Tahoma, Arial, 'Noto Kufi Arabic', sans-serif;
      -webkit-text-size-adjust: 100%;
    "
  >
    <table
      role="presentation"
      class="email-shell"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="margin: 0 auto; max-width: 560px; width: 100%"
    >
      <tr>
        <td>
          <table
            role="presentation"
            class="email-card"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            style="
              background-color: #ffffff;
              border: 1px solid #e2cbcb;
              border-radius: 10px;
              overflow: hidden;
            "
          >
            <tr>
              <td
                style="
                  background-color: #145163;
                  padding: 18px 24px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #fafafa;
                    line-height: 24px;
                  "
                >
                  Tallaby
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  background-color: #fdad28;
                  height: 4px;
                  font-size: 0;
                  line-height: 4px;
                "
              >
                &nbsp;
              </td>
            </tr>
            <tr>
              <td
                class="email-pad"
                style="padding: 28px 24px 8px; text-align: right"
              >
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #145163;
                  "
                >
                  ${eyebrow}
                </p>
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 26px;
                    font-weight: 700;
                    color: #333333;
                    line-height: 32px;
                  "
                >
                  ${heading}
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 15px;
                    line-height: 24px;
                    color: #808080;
                  "
                >
                  ${bodyHtml}
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding: 24px 24px 8px">
                <a
                  class="cta-btn"
                  href="${ctaHref}"
                  style="
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    background-color: #145163;
                    color: #fafafa !important;
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 20px;
                    text-decoration: none;
                    text-align: center;
                    border-radius: 8px;
                    padding: 14px 24px;
                  "
                >
                  ${ctaLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td
                class="email-pad"
                style="padding: 16px 24px 0; text-align: right"
              >
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #808080;
                  "
                >
                  أو انسخ الرابط والصقه في المتصفح:
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 18px;
                    word-break: break-all;
                    color: #145163;
                  "
                >
                  ${ctaHref}
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding: 20px 24px 0">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: #f7f7f7;
                    border: 1px solid #e2cbcb;
                    border-radius: 10px;
                  "
                >
                  <tr>
                    <td style="padding: 16px 20px; text-align: right">
                      <p
                        style="
                          margin: 0 0 6px 0;
                          font-size: 13px;
                          font-weight: 700;
                          color: #145163;
                        "
                      >
                        ${securityTitle}
                      </p>
                      <p
                        style="
                          margin: 0;
                          font-size: 13px;
                          line-height: 20px;
                          color: #333333;
                        "
                      >
                        ${securityBody}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px">
                <hr
                  style="
                    border: none;
                    border-top: 1px solid #e2cbcb;
                    margin: 0;
                  "
                />
              </td>
            </tr>
            <tr>
              <td
                class="email-pad"
                style="padding: 0 24px 28px; text-align: center"
              >
                <p
                  style="
                    margin: 0 0 6px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #333333;
                  "
                >
                  تحتاج مساعدة؟
                </p>
                <p
                  style="
                    margin: 0 0 16px 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #808080;
                  "
                >
                  تواصل معنا عبر
                  <a
                    href="mailto:tallabycommerce@gmail.com"
                    style="color: #145163; text-decoration: underline"
                    >tallabycommerce@gmail.com</a
                  >
                </p>
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    line-height: 18px;
                    color: #808080;
                  "
                >
                  © 2026 Tallaby. جميع الحقوق محفوظة.
                  ·
                  <a
                    href="https://www.tallaby.com/privacy"
                    style="color: #145163; text-decoration: underline"
                    >الخصوصية</a
                  >
                  ·
                  <a
                    href="https://www.tallaby.com/terms"
                    style="color: #145163; text-decoration: underline"
                    >الشروط</a
                  >
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 11px;
                    line-height: 16px;
                    color: #89a8b1;
                  "
                >
                  ${disclaimer}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

const linkTemplates = [
  {
    file: "invite.ar.html",
    title: "دعوة للانضمام إلى Tallaby",
    slot: "Invite user",
    variables:
      "{{ .ConfirmationURL }} {{ .SiteURL }} {{ .Email }} {{ .Token }} {{ .TokenHash }} {{ .RedirectTo }} {{ .Data }}",
    eyebrow: "دعوة للانضمام",
    heading: "تمت دعوتك إلى Tallaby",
    bodyHtml:
      'دعوتك لإنشاء حساب على <span style="color:#145163;word-break:break-all;">{{ .SiteURL }}</span>. اضغط الزر أدناه لقبول الدعوة وإكمال التسجيل.',
    ctaLabel: "قبول الدعوة",
    ctaHref: "{{ .ConfirmationURL }}",
    securityTitle: "ملاحظة أمنية",
    securityBody:
      "رابط الدعوة صالح لمدة محدودة. إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل الرسالة.",
    disclaimer: "دعوة حساب على Tallaby",
  },
  {
    file: "magic-link.ar.html",
    title: "رابط تسجيل الدخول - Tallaby",
    slot: "Magic Link",
    variables:
      "{{ .ConfirmationURL }} {{ .SiteURL }} {{ .Email }} {{ .Token }} {{ .TokenHash }} {{ .RedirectTo }}",
    eyebrow: "تسجيل الدخول",
    heading: "رابط الدخول السريع",
    bodyHtml:
      "اضغط الزر أدناه لتسجيل الدخول إلى حسابك في Tallaby دون الحاجة لكلمة مرور.",
    ctaLabel: "تسجيل الدخول",
    ctaHref: "{{ .ConfirmationURL }}",
    securityTitle: "ملاحظة أمنية",
    securityBody:
      "هذا الرابط مخصص لك ويعمل مرة واحدة. إذا لم تطلب تسجيل الدخول، تجاهل هذه الرسالة.",
    disclaimer: "رابط دخول مرسل إلى {{ .Email }}",
  },
  {
    file: "change-email.ar.html",
    title: "تأكيد تغيير البريد الإلكتروني - Tallaby",
    slot: "Change Email Address",
    variables:
      "{{ .ConfirmationURL }} {{ .SiteURL }} {{ .Email }} {{ .NewEmail }} {{ .Token }} {{ .TokenHash }} {{ .RedirectTo }}",
    eyebrow: "تغيير البريد",
    heading: "أكد تغيير بريدك الإلكتروني",
    bodyHtml:
      'طلبت تحديث البريد من <strong style="color:#333333;">{{ .Email }}</strong> إلى <strong style="color:#333333;">{{ .NewEmail }}</strong>. أكّد التغيير عبر الزر أدناه.',
    ctaLabel: "تأكيد تغيير البريد",
    ctaHref: "{{ .ConfirmationURL }}",
    securityTitle: "ملاحظة أمنية",
    securityBody:
      "إذا لم تطلب تغيير البريد الإلكتروني، تجاهل هذه الرسالة واتصل بالدعم فورًا.",
    disclaimer:
      "تأكيد تغيير البريد من {{ .Email }} إلى {{ .NewEmail }}",
  },
  {
    file: "reset-password.ar.html",
    title: "إعادة تعيين كلمة المرور - Tallaby",
    slot: "Reset Password",
    variables:
      "{{ .ConfirmationURL }} {{ .SiteURL }} {{ .Email }} {{ .Token }} {{ .TokenHash }} {{ .RedirectTo }}",
    eyebrow: "إعادة تعيين كلمة المرور",
    heading: "أنشئ كلمة مرور جديدة",
    bodyHtml:
      "تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في Tallaby. اضغط الزر أدناه لإنشاء كلمة مرور جديدة.",
    ctaLabel: "إعادة تعيين كلمة المرور",
    ctaHref: "{{ .ConfirmationURL }}",
    securityTitle: "تنبيه مهم",
    securityBody:
      "رابط إعادة التعيين صالح لمدة محدودة. إذا لم تطلب ذلك، تجاهل الرسالة أو تواصل مع الدعم فورًا. فريق Tallaby لن يطلب منك كلمة المرور أبدًا.",
    disclaimer: "طلب إعادة تعيين كلمة المرور لـ {{ .Email }}",
  },
];

for (const t of linkTemplates) {
  const { file, ...rest } = t;
  writeFileSync(join(dir, file), buildLinkTemplate(rest), "utf8");
  console.log("wrote", file);
}

const reauthHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>تأكيد إعادة المصادقة - Tallaby</title>
    <!--
      Supabase Auth → Email Templates → Reauthentication
      Variables: {{ .Token }} {{ .SiteURL }} {{ .Email }}
      Arabic / RTL — paste into Supabase dashboard Body field.
    -->
${styles}
  </head>
  <body
    class="email-body"
    style="
      margin: 0;
      padding: 24px 12px;
      background-color: #fafaf8;
      color: #333333;
      font-family: Tahoma, Arial, 'Noto Kufi Arabic', sans-serif;
      -webkit-text-size-adjust: 100%;
    "
  >
    <table
      role="presentation"
      class="email-shell"
      cellpadding="0"
      cellspacing="0"
      border="0"
      width="100%"
      style="margin: 0 auto; max-width: 560px; width: 100%"
    >
      <tr>
        <td>
          <table
            role="presentation"
            class="email-card"
            cellpadding="0"
            cellspacing="0"
            border="0"
            width="100%"
            style="
              background-color: #ffffff;
              border: 1px solid #e2cbcb;
              border-radius: 10px;
              overflow: hidden;
            "
          >
            <tr>
              <td
                style="
                  background-color: #145163;
                  padding: 18px 24px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #fafafa;
                    line-height: 24px;
                  "
                >
                  Tallaby
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  background-color: #fdad28;
                  height: 4px;
                  font-size: 0;
                  line-height: 4px;
                "
              >
                &nbsp;
              </td>
            </tr>
            <tr>
              <td
                class="email-pad"
                style="padding: 28px 24px 8px; text-align: right"
              >
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: #145163;
                  "
                >
                  إعادة المصادقة
                </p>
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 26px;
                    font-weight: 700;
                    color: #333333;
                    line-height: 32px;
                  "
                >
                  رمز التحقق الخاص بك
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 15px;
                    line-height: 24px;
                    color: #808080;
                  "
                >
                  أدخل الرمز التالي لإكمال التحقق من حسابك في Tallaby.
                </p>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding: 24px 24px 0">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: #f7f7f7;
                    border: 1px solid #e2cbcb;
                    border-radius: 10px;
                  "
                >
                  <tr>
                    <td style="padding: 24px 20px; text-align: center">
                      <p
                        style="
                          margin: 0 0 8px 0;
                          font-size: 11px;
                          font-weight: 700;
                          letter-spacing: 0.12em;
                          text-transform: uppercase;
                          color: #89a8b1;
                        "
                      >
                        رمز التحقق
                      </p>
                      <p
                        style="
                          margin: 0;
                          font-size: 32px;
                          font-weight: 700;
                          letter-spacing: 0.2em;
                          color: #145163;
                          font-family: Consolas, Monaco, monospace;
                        "
                      >
                        {{ .Token }}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-pad" style="padding: 20px 24px 0">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: #f7f7f7;
                    border: 1px solid #e2cbcb;
                    border-radius: 10px;
                  "
                >
                  <tr>
                    <td style="padding: 16px 20px; text-align: right">
                      <p
                        style="
                          margin: 0 0 6px 0;
                          font-size: 13px;
                          font-weight: 700;
                          color: #145163;
                        "
                      >
                        ملاحظة أمنية
                      </p>
                      <p
                        style="
                          margin: 0;
                          font-size: 13px;
                          line-height: 20px;
                          color: #333333;
                        "
                      >
                        لا تشارك هذا الرمز مع أي شخص. إذا لم تطلب إعادة
                        المصادقة، تجاهل هذه الرسالة.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px">
                <hr
                  style="
                    border: none;
                    border-top: 1px solid #e2cbcb;
                    margin: 0;
                  "
                />
              </td>
            </tr>
            <tr>
              <td
                class="email-pad"
                style="padding: 0 24px 28px; text-align: center"
              >
                <p
                  style="
                    margin: 0 0 6px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #333333;
                  "
                >
                  تحتاج مساعدة؟
                </p>
                <p
                  style="
                    margin: 0 0 16px 0;
                    font-size: 13px;
                    line-height: 20px;
                    color: #808080;
                  "
                >
                  تواصل معنا عبر
                  <a
                    href="mailto:tallabycommerce@gmail.com"
                    style="color: #145163; text-decoration: underline"
                    >tallabycommerce@gmail.com</a
                  >
                </p>
                <p
                  style="
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    line-height: 18px;
                    color: #808080;
                  "
                >
                  © 2026 Tallaby. جميع الحقوق محفوظة.
                  ·
                  <a
                    href="https://www.tallaby.com/privacy"
                    style="color: #145163; text-decoration: underline"
                    >الخصوصية</a
                  >
                  ·
                  <a
                    href="https://www.tallaby.com/terms"
                    style="color: #145163; text-decoration: underline"
                    >الشروط</a
                  >
                </p>
                <p
                  style="
                    margin: 0;
                    font-size: 11px;
                    line-height: 16px;
                    color: #89a8b1;
                  "
                >
                  رمز إعادة مصادقة مرسل إلى {{ .Email }}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

writeFileSync(join(dir, "reauthentication.ar.html"), reauthHtml, "utf8");
console.log("wrote reauthentication.ar.html");
