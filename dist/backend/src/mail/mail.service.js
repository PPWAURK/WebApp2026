"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let MailService = class MailService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    normalizeLanguage(value) {
        return value === 'zh' ? 'zh' : 'fr';
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    buildEmailLayout(input) {
        const safeTitle = this.escapeHtml(input.title);
        const safeIntro = this.escapeHtml(input.intro);
        const safeBody = this.escapeHtml(input.body).replace(/\n/g, '<br/>');
        const safeFooter = this.escapeHtml(input.footer ?? 'Si vous avez une question, contactez votre manager.');
        const buttonHtml = input.buttonLabel && input.buttonUrl
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
        return `
      <div style="margin:0;padding:24px;background:#f8f1eb;font-family:Arial,sans-serif;color:#472325;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#fff8f2;border:1px solid #ead4c8;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px;background:#b51e24;color:#fff5f5;">
              ${logoHtml}
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">ZHAO Plateforme</div>
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
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #edd9cc;font-size:12px;line-height:1.6;color:#8c6f6f;">
              ${safeFooter}
            </td>
          </tr>
        </table>
      </div>
    `.trim();
    }
    getMailConfig() {
        const host = this.configService.get('MAIL_HOST');
        const portRaw = this.configService.get('MAIL_PORT');
        const user = this.configService.get('MAIL_USER');
        const pass = this.configService.get('MAIL_PASS');
        const from = this.configService.get('MAIL_FROM');
        const appWebUrl = this.configService.get('APP_WEB_URL');
        const logoUrl = this.configService.get('MAIL_LOGO_URL');
        const port = portRaw ? Number(portRaw) : 587;
        return {
            host,
            port,
            user,
            pass,
            from,
            appWebUrl,
            logoUrl,
            enabled: Boolean(host) &&
                Number.isFinite(port) &&
                port > 0 &&
                Boolean(user) &&
                Boolean(pass) &&
                Boolean(from),
        };
    }
    async sendMail(input) {
        const config = this.getMailConfig();
        if (!config.enabled) {
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
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
    async sendForgotPasswordEmail(input) {
        const config = this.getMailConfig();
        if (!config.enabled) {
            return;
        }
        const resetUrl = `${config.appWebUrl ?? ''}`.replace(/\/$/, '');
        const fullResetUrl = `${resetUrl}/reset-password?token=${encodeURIComponent(input.resetToken)}`;
        const greeting = input.recipientName?.trim() || input.email;
        const language = this.normalizeLanguage(input.language);
        const intro = language === 'zh' ? `你好 ${greeting}，` : `Bonjour ${greeting},`;
        const body = language === 'zh'
            ? '我们收到了你的密码重置请求。请点击下方按钮设置新密码。\n\n此链接30分钟内有效。'
            :
                'Nous avons recu une demande de reinitialisation de votre mot de passe. ' +
                    'Cliquez sur le bouton ci-dessous pour definir un nouveau mot de passe.\n\n' +
                    'Ce lien est valide pendant 30 minutes.';
        const subject = language === 'zh' ? '重置密码请求' : 'Reinitialisation du mot de passe';
        const footer = language === 'zh'
            ? '如果这不是你的操作，请忽略此邮件。链接将在30分钟后失效。'
            : 'Si vous n etes pas a l origine de cette demande, ignorez simplement ce message. Ce lien expire dans 30 minutes.';
        const buttonLabel = language === 'zh'
            ? '重置我的密码'
            : 'Reinitialiser mon mot de passe';
        const textTail = language === 'zh'
            ? '如果这不是你的操作，请直接忽略此邮件。'
            : 'Si vous n etes pas a l origine de cette demande, ignorez simplement ce message.';
        const linkLabel = language === 'zh' ? '重置链接' : 'Lien de reinitialisation';
        await this.sendMail({
            to: input.email,
            subject,
            text: `${intro}\n\n` +
                `${body}\n\n` +
                `${linkLabel}: ${fullResetUrl}\n\n` +
                textTail,
            html: this.buildEmailLayout({
                title: subject,
                intro,
                body,
                buttonLabel,
                buttonUrl: fullResetUrl,
                logoUrl: config.logoUrl,
                footer,
            }),
        });
    }
    async sendAccountApprovedEmail(input) {
        const config = this.getMailConfig();
        const appUrl = `${config.appWebUrl ?? ''}`.replace(/\/$/, '');
        const greeting = input.recipientName?.trim() || input.email;
        const language = this.normalizeLanguage(input.language);
        const intro = language === 'zh' ? `你好 ${greeting}，` : `Bonjour ${greeting},`;
        const body = language === 'zh'
            ? '好消息：你的账号已通过经理审核。现在你可以登录并访问平台。'
            :
                'Bonne nouvelle: votre compte a ete approuve par votre manager. ' +
                    'Vous pouvez maintenant vous connecter et acceder a votre espace.';
        const subject = language === 'zh' ? '账号审核通过' : 'Compte approuve';
        const buttonLabel = language === 'zh' ? '前往登录' : 'Acceder a la connexion';
        await this.sendMail({
            to: input.email,
            subject,
            text: `${intro}\n\n${body}${appUrl ? `\n\nConnexion: ${appUrl}` : ''}`,
            html: this.buildEmailLayout({
                title: subject,
                intro,
                body,
                buttonLabel: appUrl ? buttonLabel : undefined,
                buttonUrl: appUrl || undefined,
                logoUrl: config.logoUrl,
            }),
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map