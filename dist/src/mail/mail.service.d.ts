import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    constructor(configService: ConfigService);
    private normalizeLanguage;
    private escapeHtml;
    private buildEmailLayout;
    private getMailConfig;
    private sendMail;
    sendForgotPasswordEmail(input: {
        email: string;
        resetToken: string;
        recipientName?: string | null;
        language?: 'fr' | 'zh';
    }): Promise<void>;
    sendAccountApprovedEmail(input: {
        email: string;
        recipientName?: string | null;
        language?: 'fr' | 'zh';
    }): Promise<void>;
}
