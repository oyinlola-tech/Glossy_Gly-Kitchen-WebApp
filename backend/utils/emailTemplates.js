const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const appName = 'Glossy Gly Kitchen';
const supportEmail = 'support@glossygly-kitchen.com';

const themeByVariant = {
  welcome: {
    headerGradient: 'linear-gradient(135deg, #7c2d12 0%, #f59e0b 48%, #be185d 100%)',
    shellBackground: 'radial-gradient(circle at top left,#fff7ed 0%,#fff 58%,#fff1f2 100%)',
    cardBorder: '#f3e4d1',
    cardShadow: '0 18px 46px rgba(124,45,18,.16)',
    bodyBackground: 'radial-gradient(circle at 100% 0%, rgba(245,158,11,.12), transparent 34%), radial-gradient(circle at 0% 100%, rgba(190,24,93,.08), transparent 40%), #ffffff',
    label: 'Private Concierge',
    tagline: 'Curated taste. Signature hospitality.',
    titleColor: '#9a3412',
    panelBackground: 'linear-gradient(145deg,#fff8ef 0%,#fff4f5 100%)',
    panelBorder: '#f2dcc0',
  },
  security: {
    headerGradient: 'linear-gradient(135deg, #78350f 0%, #d97706 46%, #9d174d 100%)',
    shellBackground: 'radial-gradient(circle at top left,#fff7ed 0%,#fff 55%,#fff3f4 100%)',
    cardBorder: '#f2e1cf',
    cardShadow: '0 16px 42px rgba(31,41,55,.14)',
    bodyBackground: 'radial-gradient(circle at 95% 0%, rgba(245,158,11,.10), transparent 35%), radial-gradient(circle at 3% 100%, rgba(190,24,93,.08), transparent 40%), #ffffff',
    label: 'Account Security Atelier',
    tagline: 'Protection crafted with precision.',
    titleColor: '#7c2d12',
    panelBackground: 'linear-gradient(145deg,#fff8ef 0%,#fff1f2 100%)',
    panelBorder: '#f3ddc1',
  },
  critical: {
    headerGradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 46%, #9f1239 100%)',
    shellBackground: 'radial-gradient(circle at top left,#fff1f2 0%,#fff 54%,#fef2f2 100%)',
    cardBorder: '#f3d2d9',
    cardShadow: '0 20px 48px rgba(127,29,29,.18)',
    bodyBackground: 'radial-gradient(circle at 100% 0%, rgba(239,68,68,.12), transparent 35%), radial-gradient(circle at 0% 100%, rgba(190,24,93,.10), transparent 42%), #ffffff',
    label: 'Priority Security Desk',
    tagline: 'Immediate attention required.',
    titleColor: '#991b1b',
    panelBackground: 'linear-gradient(145deg,#fff1f2 0%,#ffe4e6 100%)',
    panelBorder: '#f7cbd5',
  },
};

const getTheme = (variant) => {
  if (variant && themeByVariant[variant]) return themeByVariant[variant];
  return themeByVariant.security;
};

const baseTemplate = ({ variant, title, preheader, intro, contentHtml, outro }) => {
  const theme = getTheme(variant);
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader || title);
  const safeIntro = escapeHtml(intro || '');
  const safeOutro = escapeHtml(outro || `Thanks,\n${appName} Team`).replace(/\n/g, '<br>');

  const html = `
    <div style="display:none;opacity:0;overflow:hidden;max-height:0;max-width:0;">
      ${safePreheader}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${theme.shellBackground};padding:28px 10px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:660px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid ${theme.cardBorder};box-shadow:${theme.cardShadow};">
            <tr>
              <td style="background:${theme.headerGradient};padding:26px 28px;color:#fff;font-family:Georgia,'Times New Roman',serif;">
                <p style="margin:0 0 10px;font-size:11px;opacity:.97;letter-spacing:1px;text-transform:uppercase;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;">${appName} | ${theme.label}</p>
                <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;">${safeTitle}</h1>
                <p style="margin:10px 0 0;font-size:13px;opacity:.94;font-family:'Segoe UI',Arial,sans-serif;">${theme.tagline}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;font-size:15px;line-height:1.68;background:${theme.bodyBackground};">
                ${safeIntro ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;">${safeIntro}</p>` : ''}
                ${contentHtml}
                <p style="margin:24px 0 0;color:#4b5563;">${safeOutro}</p>
                <div style="margin:20px 0 0;padding:12px 14px;border-radius:14px;background:${theme.panelBackground};border:1px solid ${theme.panelBorder};">
                  <p style="margin:0;font-size:12px;color:${theme.titleColor};">
                    Need white-glove assistance? Contact <a href="mailto:${supportEmail}" style="color:#be185d;text-decoration:none;font-weight:700;">${supportEmail}</a>
                  </p>
                </div>
                <p style="margin:14px 0 0;font-size:11px;color:#9ca3af;letter-spacing:.2px;">
                  This is an automated security and account message from ${appName}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const textParts = [title, intro, contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(), outro]
    .filter(Boolean)
    .join('\n\n');

  return { html, text: textParts };
};

const otpBlock = (otp, caption, variant) => {
  const theme = getTheme(variant);
  return `
    <div style="margin:18px 0;padding:16px 18px;background:${theme.panelBackground};border:1px solid ${theme.panelBorder};border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.75);">
      <p style="margin:0 0 8px;color:${theme.titleColor};font-weight:700;letter-spacing:.2px;">${escapeHtml(caption)}</p>
      <div style="font-size:30px;letter-spacing:10px;font-weight:800;color:#111827;text-align:center;padding:10px 0;border-radius:10px;background:#ffffff;border:1px dashed ${theme.panelBorder};">
        ${escapeHtml(otp)}
      </div>
    </div>
  `;
};

const infoList = (rows, variant) => {
  const theme = getTheme(variant);
  const items = rows
    .filter((row) => row && row.value)
    .map((row) => `<li style="margin:0 0 6px;"><strong style="color:${theme.titleColor};">${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</li>`)
    .join('');
  if (!items) return '';
  return `<ul style="margin:14px 0 0;padding:12px 16px 6px 28px;color:#374151;background:${theme.panelBackground};border:1px solid ${theme.panelBorder};border-radius:14px;">${items}</ul>`;
};

const securityTipsBlock = (tips, variant, heading = 'Security recommendations') => {
  const theme = getTheme(variant);
  if (!Array.isArray(tips) || tips.length === 0) return '';
  const items = tips
    .filter(Boolean)
    .map((tip) => `<li style="margin:0 0 6px;">${escapeHtml(tip)}</li>`)
    .join('');

  return `
    <div style="margin:18px 0 0;padding:14px 16px;background:${theme.panelBackground};border:1px solid ${theme.panelBorder};border-radius:14px;">
      <p style="margin:0 0 8px;color:${theme.titleColor};font-weight:800;">${escapeHtml(heading)}</p>
      <ul style="margin:0;padding-left:18px;color:#0f172a;">
        ${items}
      </ul>
    </div>
  `;
};

const buildSignupVerificationEmail = ({ otp }) => {
  const subject = `${appName} - Verify Your Account`;
  const body = baseTemplate({
    variant: 'welcome',
    title: 'Welcome to Glossy Gly Kitchen',
    preheader: 'Your private verification code',
    intro: 'A pleasure to host you. Confirm your email with the code below to activate your private dining account.',
    contentHtml: `
      ${otpBlock(otp, 'Verification Code', 'welcome')}
      <p style="margin:10px 0 0;">This verification code is reserved for you for 10 minutes.</p>
      ${securityTipsBlock([
        'Keep this code confidential, including from anyone claiming to be support.',
        'If this registration was not initiated by you, simply disregard this message.',
        'Use a distinct, high-strength password for your account.',
      ], 'welcome', 'Account readiness notes')}
    `,
    outro: `If you did not create this account, no action is needed.\n${appName} Concierge Security`,
  });
  return { subject, ...body };
};

const buildLoginOtpEmail = ({ otp }) => {
  const subject = `${appName} - Login OTP`;
  const body = baseTemplate({
    variant: 'security',
    title: 'Login Verification',
    preheader: 'Your secure sign-in code',
    intro: 'For your account protection, please confirm this sign-in with your one-time access code.',
    contentHtml: `
      ${otpBlock(otp, 'Login Access Code', 'security')}
      <p style="margin:10px 0 0;">This access code expires in 10 minutes.</p>
      ${securityTipsBlock([
        'Enter this code only on official Glossy Gly Kitchen properties.',
        'Never forward or share this message.',
        'If this was not initiated by you, change your password immediately.',
      ], 'security')}
    `,
    outro: `If this sign-in was not authorized by you, reset your password now.\n${appName} Concierge Security`,
  });
  return { subject, ...body };
};

const buildPasswordResetOtpEmail = ({ otp }) => {
  const subject = `${appName} - Password Reset OTP`;
  const body = baseTemplate({
    variant: 'security',
    title: 'Reset Your Password',
    preheader: 'Password reset OTP',
    intro: 'We received a password reset request for your account. Confirm with the secure code below.',
    contentHtml: `
      ${otpBlock(otp, 'Password Reset Code', 'security')}
      <p style="margin:10px 0 0;">This OTP expires in 10 minutes.</p>
      ${securityTipsBlock([
        'Choose a new password that has never been used on other services.',
        'Treat this code as confidential security material.',
        'No changes occur unless this code is used successfully.',
      ], 'security')}
    `,
    outro: `If this reset was not requested by you, your account remains safe.\n${appName} Concierge Security`,
  });
  return { subject, ...body };
};

const buildPasswordChangedEmail = ({ ip, userAgent, changedAt }) => {
  const subject = `${appName} - Password Changed`;
  const details = infoList([
    { label: 'Time', value: changedAt || new Date().toISOString() },
    { label: 'IP', value: ip || 'Unknown' },
    { label: 'Device', value: userAgent || 'Unknown' },
  ], 'security');
  const body = baseTemplate({
    variant: 'security',
    title: 'Your Password Was Changed',
    preheader: 'Security notification',
    intro: 'Your password has been successfully updated.',
    contentHtml: `
      <p style="margin:0;">If this activity was not authorized by you, secure your account immediately and contact our support desk.</p>
      ${details}
      ${securityTipsBlock([
        'Review recent account activity and remove unrecognized sessions.',
        'Avoid password reuse across services.',
        'Update your password manager records after each credential change.',
      ], 'security')}
    `,
  });
  return { subject, ...body };
};

const buildNewDeviceLoginAlertEmail = ({ ip, userAgent, loginAt }) => {
  const subject = `${appName} - New Device or IP Login Alert`;
  const details = infoList([
    { label: 'Time', value: loginAt || new Date().toISOString() },
    { label: 'IP', value: ip || 'Unknown' },
    { label: 'Device', value: userAgent || 'Unknown' },
  ], 'security');
  const body = baseTemplate({
    variant: 'security',
    title: 'New Login Detected',
    preheader: 'Security alert for your account',
    intro: 'A sign-in from a new device or network was detected for your account.',
    contentHtml: `
      <p style="margin:0;">If this was you, no action is required.</p>
      ${details}
      ${securityTipsBlock([
        'If unrecognized, change your password immediately.',
        'Sign out from all sessions in account settings.',
        'Contact support if suspicious activity persists.',
      ], 'security')}
    `,
    outro: `If this login was not yours, secure your account now.\n${appName} Concierge Security`,
  });
  return { subject, ...body };
};

const buildWelcomeEmail = ({ email }) => {
  const subject = `${appName} - Welcome`;
  const details = infoList([
    { label: 'Account', value: email || null },
    { label: 'Status', value: 'Verified and Active' },
    { label: 'Joined', value: new Date().toISOString() },
  ], 'welcome');
  const body = baseTemplate({
    variant: 'welcome',
    title: 'Welcome to Glossy Gly Kitchen',
    preheader: 'Your account is ready',
    intro: 'Your account is now verified and ready for an elevated ordering experience.',
    contentHtml: `
      <p style="margin:0;">You now have access to seamless ordering, curated meals, and refined account controls.</p>
      ${details}
      ${securityTipsBlock([
        'Complete your profile to strengthen account recovery.',
        'Use a unique and resilient password for this account.',
        'Enable login OTP whenever available for premium account safety.',
      ], 'welcome', 'Getting started beautifully')}
    `,
    outro: `We are delighted to serve you.\n${appName} Concierge Team`,
  });
  return { subject, ...body };
};

const buildAccountDeletionOtpEmail = ({ otp }) => {
  const subject = `${appName} - Confirm Account Deletion`;
  const body = baseTemplate({
    variant: 'critical',
    title: 'Confirm Account Deletion',
    preheader: 'Use this OTP to confirm account deletion',
    intro: 'A request was received to permanently remove your account and associated data.',
    contentHtml: `
      ${otpBlock(otp, 'Deletion Confirmation Code', 'critical')}
      <p style="margin:10px 0 0;"><strong>Warning:</strong> This action is permanent and cannot be undone. This code expires in 10 minutes.</p>
      ${securityTipsBlock([
        'If this was not requested by you, change your password immediately.',
        'Do not share this code under any circumstances.',
        'Review active sessions and sign out unknown devices at once.',
      ], 'critical', 'Immediate actions')}
    `,
    outro: `If this was not your request, your account remains intact unless this code is used.\n${appName} Priority Security`,
  });
  return { subject, ...body };
};

const buildAccountDeletedGoodbyeEmail = ({ email }) => {
  const subject = `${appName} - Account Deleted`;
  const details = infoList([
    { label: 'Account', value: email || null },
    { label: 'Deleted At', value: new Date().toISOString() },
  ], 'critical');
  const body = baseTemplate({
    variant: 'critical',
    title: 'Your Account Has Been Deleted',
    preheader: 'Account deletion confirmed',
    intro: 'Your Glossy Gly Kitchen account has been permanently deleted as requested.',
    contentHtml: `
      <p style="margin:0;">We are sorry to see you leave. If this action was not authorized by you, contact support immediately.</p>
      ${details}
      ${securityTipsBlock([
        'If this action was unauthorized, contact support without delay.',
        'Update any credentials that were linked to this account.',
        'You may create a new account later using the same email if available.',
      ], 'critical', 'Post-deletion guidance')}
    `,
    outro: `Thank you for being part of ${appName}.`,
  });
  return { subject, ...body };
};

module.exports = {
  buildSignupVerificationEmail,
  buildLoginOtpEmail,
  buildPasswordResetOtpEmail,
  buildPasswordChangedEmail,
  buildNewDeviceLoginAlertEmail,
  buildWelcomeEmail,
  buildAccountDeletionOtpEmail,
  buildAccountDeletedGoodbyeEmail,
};
