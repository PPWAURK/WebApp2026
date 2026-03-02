import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private getMailConfig() {
    const host = this.configService.get<string>('MAIL_HOST');
    const portRaw = this.configService.get<string>('MAIL_PORT');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const from = this.configService.get<string>('MAIL_FROM');
    const appWebUrl = this.configService.get<string>('APP_WEB_URL');

    const port = portRaw ? Number(portRaw) : 587;

    return {
      host,
      port,
      user,
      pass,
      from,
      appWebUrl,
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
  }) {
    const config = this.getMailConfig();
    if (!config.enabled) {
      return;
    }

    const resetUrl = `${config.appWebUrl ?? ''}`.replace(/\/$/, '');
    const fullResetUrl = `${resetUrl}/reset-password?token=${encodeURIComponent(input.resetToken)}`;
    const greeting = input.recipientName?.trim() || input.email;

    await this.sendMail({
      to: input.email,
      subject: 'Reinitialisation du mot de passe',
      text:
        `Bonjour ${greeting},\n\n` +
        `Cliquez sur ce lien pour reinitialiser votre mot de passe:\n${fullResetUrl}\n\n` +
        'Ce lien expire dans 30 minutes.',
      html:
        `<p>Bonjour ${greeting},</p>` +
        `<p>Cliquez sur ce lien pour reinitialiser votre mot de passe:</p>` +
        `<p><a href="${fullResetUrl}">${fullResetUrl}</a></p>` +
        '<p>Ce lien expire dans 30 minutes.</p>',
    });
  }

  async sendAccountApprovedEmail(input: {
    email: string;
    recipientName?: string | null;
  }) {
    const greeting = input.recipientName?.trim() || input.email;

    await this.sendMail({
      to: input.email,
      subject: 'Compte approuve',
      text:
        `Bonjour ${greeting},\n\n` +
        'Votre compte a ete approuve par votre manager. Vous pouvez maintenant vous connecter.',
      html:
        `<p>Bonjour ${greeting},</p>` +
        '<p>Votre compte a ete approuve par votre manager. Vous pouvez maintenant vous connecter.</p>',
    });
  }
}
