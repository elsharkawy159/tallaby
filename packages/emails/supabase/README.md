# Supabase Auth email templates (Arabic)

Plain HTML for the Supabase dashboard (**Authentication → Email Templates**).  
These cannot use React Email — Supabase injects Go variables like `{{ .ConfirmationURL }}`.

Design matches Tallaby transactional mail: primary `#145163`, accent `#fdad28`, card + gold stripe, full-width CTA, RTL Arabic.

| File | Supabase template | Suggested subject |
|------|-------------------|-------------------|
| `confirm-signup.ar.html` | Confirm signup | تأكيد حسابك في Tallaby |
| `invite.ar.html` | Invite user | تمت دعوتك إلى Tallaby |
| `magic-link.ar.html` | Magic Link | رابط تسجيل الدخول إلى Tallaby |
| `change-email.ar.html` | Change Email Address | تأكيد تغيير البريد الإلكتروني |
| `reset-password.ar.html` | Reset Password | إعادة تعيين كلمة المرور |
| `reauthentication.ar.html` | Reauthentication | رمز التحقق من Tallaby |

## How to paste

1. Open Supabase → **Authentication** → **Email Templates**
2. Open the matching template slot
3. Copy the full HTML from the `.ar.html` file
4. Paste into the **Body** field and set the subject from the table above

## Regenerate link templates

```bash
node packages/emails/supabase/generate-ar.mjs
```

`confirm-signup.ar.html` is maintained separately (same visual system).  
`confirm-signup.en.html` is optional English reference only — production Auth emails use Arabic.
