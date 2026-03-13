import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private normalizeLanguage(value?: string): 'fr' | 'zh' {
    return value === 'zh' ? 'zh' : 'fr';
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private buildEmailLayout(input: {
    title: string;
    brandLabel?: string;
    intro: string;
    body: string;
    buttonLabel?: string;
    buttonUrl?: string;
    footer?: string;
    logoUrl?: string;
  }) {
    const safeTitle = this.escapeHtml(input.title);
    const safeBrandLabel = this.escapeHtml(input.brandLabel ?? 'ZHAO Platform');
    const safeIntro = this.escapeHtml(input.intro);
    const safeBody = this.escapeHtml(input.body).replace(/\n/g, '<br/>');
    const safeFooter = input.footer ? this.escapeHtml(input.footer) : null;
    const buttonHtml =
      input.buttonLabel && input.buttonUrl
        ? `<p style="margin:24px 0 16px;">
            <a href="${input.buttonUrl}"
               style="display:inline-block;padding:12px 20px;background:#b51e24;color:#fff7f7;text-decoration:none;border-radius:999px;font-weight:700;">
              ${this.escapeHtml(input.buttonLabel)}
            </a>
          </p>
          <p style="font-size:13px;line-height:1.5;color:#7e5b5b;word-break:break-all;">${this.escapeHtml(input.buttonUrl)}</p>`
        : '';
    const logoHtml = input.logoUrl
      ? `<img src="${this.escapeHtml(input.logoUrl)}" alt="ZHAO" width="72" height="72"
           style="display:block;width:72px;height:72px;border-radius:12px;object-fit:cover;border:1px solid rgba(255,255,255,0.45);margin-bottom:10px;"/>`
      : '';
    const footerHtml = safeFooter
      ? `<tr>
            <td style="padding:16px 24px;border-top:1px solid #edd9cc;font-size:12px;line-height:1.6;color:#8c6f6f;">
              ${safeFooter}
            </td>
          </tr>`
      : '';

    return `
      <div style="margin:0;padding:24px;background:#f8f1eb;font-family:Arial,sans-serif;color:#472325;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#fff8f2;border:1px solid #ead4c8;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px;background:#b51e24;color:#fff5f5;">
              ${logoHtml}
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">${safeBrandLabel}</div>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#fff5f5;">${safeTitle}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#4f2c2e;">${safeIntro}</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#644346;">${safeBody}</p>
              ${buttonHtml}
            </td>
          </tr>
          ${footerHtml}
        </table>
      </div>
    `.trim();
  }

  private getMailConfig() {
    const host = this.configService.get<string>('MAIL_HOST');
    const portRaw = this.configService.get<string>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const from = this.configService.get<string>('MAIL_FROM');
    const appWebUrl = this.configService.get<string>('APP_WEB_URL');
    const logoUrl = this.configService.get<string>('MAIL_LOGO_URL');

    const port = portRaw ? Number(portRaw) : 587;

    return {
      host,
      port,
      user,
      pass,
      from,
      appWebUrl,
      logoUrl,
      enabled:
        Boolean(host) &&
        Number.isFinite(port) &&
        port > 0 &&
        Boolean(user) &&
        Boolean(pass) &&
        Boolean(from),
    };
  }

  private async sendMail(input: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const config = this.getMailConfig();

    if (!config.enabled) {
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
  }

  async sendForgotPasswordEmail(input: {
    email: string;
    resetToken: string;
    recipientName?: string | null;
    language?: 'fr' | 'zh';
  }) {
    const config = this.getMailConfig();
    if (!config.enabled) {
      return;
    }

    const resetUrl = `${config.appWebUrl ?? ''}`.replace(/\/$/, '');
    const fullResetUrl = `${resetUrl}/reset-password?token=${encodeURIComponent(input.resetToken)}`;
    const greeting = input.recipientName?.trim() || input.email;
    const language = this.normalizeLanguage(input.language);
    const brandLabel = language === 'zh' ? 'ZHAO 平台' : 'ZHAO Plateforme';
    const intro =
      language === 'zh' ? `你好 ${greeting}，` : `Bonjour ${greeting},`;
    const body =
      language === 'zh'
        ? '我们收到了你的重置密码请求。点击下面的按钮，就可以设置新密码。\n\n这个链接 30 分钟内有效。'
        : 'On a reçu une demande pour changer votre mot de passe. ' +
          'Cliquez sur le bouton ci-dessous pour en choisir un nouveau.\n\n' +
          'Ce lien reste valable 30 minutes.';
    const subject =
      language === 'zh'
        ? '重置你的密码'
        : 'Réinitialisez votre mot de passe';
    const footer =
      language === 'zh'
        ? '如果这不是你本人操作，直接忽略这封邮件就可以。'
        : 'Si vous n’avez pas demandé ce changement, vous pouvez simplement ignorer ce message.';
    const buttonLabel =
      language === 'zh' ? '重置密码' : 'Réinitialiser mon mot de passe';
    const textTail =
      language === 'zh'
        ? '如果这不是你的操作，请直接忽略此邮件。'
        : 'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement ce message.';
    const linkLabel =
      language === 'zh' ? '重置链接' : 'Lien de réinitialisation';

    await this.sendMail({
      to: input.email,
      subject,
      text:
        `${intro}\n\n` +
        `${body}\n\n` +
        `${linkLabel}: ${fullResetUrl}\n\n` +
        textTail,
      html: this.buildEmailLayout({
        title: subject,
        brandLabel,
        intro,
        body,
        buttonLabel,
        buttonUrl: fullResetUrl,
        logoUrl: config.logoUrl,
        footer,
      }),
    });
  }

  async sendAccountApprovedEmail(input: {
    email: string;
    recipientName?: string | null;
    language?: 'fr' | 'zh';
  }) {
    const config = this.getMailConfig();
    const appUrl = `${config.appWebUrl ?? ''}`.replace(/\/$/, '');
    const greeting = input.recipientName?.trim() || input.email;
    const language = this.normalizeLanguage(input.language);
    const brandLabel = language === 'zh' ? 'ZHAO 平台' : 'ZHAO Plateforme';
    const intro =
      language === 'zh' ? `你好 ${greeting}，` : `Bonjour ${greeting},`;
    const body =
      language === 'zh'
        ? '你的账号已经通过审核，现在可以登录平台了。'
        : 'Bonne nouvelle, votre compte a été validé. ' +
          'Vous pouvez maintenant vous connecter à la plateforme.';
    const subject = language === 'zh' ? '你的账号已通过审核' : 'Votre compte est validé';
    const buttonLabel =
      language === 'zh' ? '立即登录' : 'Se connecter';
    const footer =
      language === 'zh'
        ? '如有问题，请联系你的经理。'
        : 'Si vous avez une question, contactez votre manager.';
    const appUrlLabel =
      language === 'zh' ? '登录地址' : 'Connexion';

    await this.sendMail({
      to: input.email,
      subject,
      text: `${intro}\n\n${body}${appUrl ? `\n\n${appUrlLabel}: ${appUrl}` : ''}`,
      html: this.buildEmailLayout({
        title: subject,
        brandLabel,
        intro,
        body,
        buttonLabel: appUrl ? buttonLabel : undefined,
        buttonUrl: appUrl || undefined,
        logoUrl: config.logoUrl,
        footer,
      }),
    });
  }
}
