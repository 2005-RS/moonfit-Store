declare module 'nodemailer' {
  export type SendMailOptions = {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
  };

  export interface SentMessageInfo {
    messageId: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
  }

  export function createTransport(options: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
