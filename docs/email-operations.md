# Email operations

Goal: people can write to `support@mystickahvezda.cz`, transactional emails can be sent from the app, and replies go to a real inbox.

## Runtime env

Set these in production:

```env
RESEND_API_KEY=re_...
FROM_EMAIL=Mysticka Hvezda <noreply@mystickahvezda.cz>
SUPPORT_EMAIL=support@mystickahvezda.cz
REPLY_TO_EMAIL=support@mystickahvezda.cz
ADMIN_EMAIL=real-team-inbox@example.com
```

If Resend receives inbound mail for the root domain, also set:

```env
RESEND_WEBHOOK_SECRET=whsec_...
SUPPORT_FORWARD_EMAIL=real-team-inbox@example.com
INBOUND_FORWARD_FROM=Mysticka Hvezda <noreply@mystickahvezda.cz>
```

`SUPPORT_FORWARD_EMAIL` must be a real mailbox outside `mystickahvezda.cz` unless `ALLOW_SAME_DOMAIN_SUPPORT_FORWARD=true` is intentionally set. Forwarding Resend inbound mail back to the same root domain can create a mail loop.

## Recommended setup: real support mailbox

Use this if `support@mystickahvezda.cz` is a mailbox at Active24, Google Workspace, Seznam, or another normal mail provider.

1. Create/verify the mailbox `support@mystickahvezda.cz`.
2. Point root-domain MX records to that mailbox provider only.
3. Keep Resend for outbound app emails.
4. Keep `REPLY_TO_EMAIL=support@mystickahvezda.cz`.

Current DNS has a higher-priority MX to `inbound-smtp.eu-west-1.amazonaws.com`, then Active24 MX records. If Active24 is meant to receive support mail, remove or lower the AWS/Resend inbound MX so it does not intercept normal user emails.

## Alternative setup: Resend inbound forwarding

Use this if Resend should receive all mail sent to `support@mystickahvezda.cz`.

1. In Resend, enable Receiving for the domain.
2. In Resend Webhooks, create a webhook:

```text
URL: https://www.mystickahvezda.cz/webhook/resend
Event: email.received
```

3. Copy the webhook signing secret to Railway as `RESEND_WEBHOOK_SECRET`.
4. Set `SUPPORT_FORWARD_EMAIL` to the real internal mailbox where support should read messages.
5. Send a real test email to `support@mystickahvezda.cz` and confirm it arrives in `SUPPORT_FORWARD_EMAIL`.

The app verifies the Resend webhook signature and uses `emails.receiving.forward()` to forward the original email with content and attachments preserved.

## DNS checklist

There must be only one SPF TXT record for `mystickahvezda.cz`. If Resend and the current mailbox provider both send mail, merge both includes into one record, for example:

```text
v=spf1 a mx include:_spf.websupport.cz include:amazonses.com -all
```

The subdomain `send.mystickahvezda.cz` is already configured for Resend SPF/MX. If you keep outbound mail on that subdomain instead of the root domain, use:

```env
FROM_EMAIL=Mysticka Hvezda <noreply@send.mystickahvezda.cz>
INBOUND_FORWARD_FROM=Mysticka Hvezda <noreply@send.mystickahvezda.cz>
```

Keep `REPLY_TO_EMAIL=support@mystickahvezda.cz` so users reply to the public support address, not to the sending subdomain.

Keep the Resend DKIM TXT record:

```text
resend._domainkey.mystickahvezda.cz
```

Keep DMARC, but after SPF/DKIM are confirmed, review whether `p=quarantine` is appropriate:

```text
_dmarc.mystickahvezda.cz TXT "v=DMARC1; p=quarantine"
```

## Smoke test

1. Send an app email and verify the recipient sees `Reply-To: support@mystickahvezda.cz`.
2. Reply to that email and confirm the reply reaches the real team inbox.
3. Send a fresh email directly to `support@mystickahvezda.cz`.
4. Submit the website contact form and confirm the admin notification reaches `ADMIN_EMAIL` or `SUPPORT_FORWARD_EMAIL`.
