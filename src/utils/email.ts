import config from 'config';
import { User } from '../entities/user.entity';
import nodemailer from 'nodemailer';

const smtp = config.get<{
  host: string;
  port: number;
  user: string;
  pass: string;
}>('smtp');

export default class Email {
  username: string;
  to: string;
  from: string;
  constructor(public user: User, public url: string) {
    this.username = user.username;
    this.to = user.email;
    this.from = `Motkhss ${config.get<string>('emailFrom')}`;
  }

  private newTransport() {
    return nodemailer.createTransport({
      ...smtp,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });
  }

  private async send(template: string, subject: string) {
    const html = `<p> message html  ${this.username} ${subject} ${this.url}<p/>`;

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: 'message text',
    };

    console.log('emai.ts send ', mailOptions, template, subject);

    //send email
    const info = await this.newTransport().sendMail(mailOptions);
    console.log(nodemailer.getTestMessageUrl(info));
  }

  async sendVerificationCode() {
    console.log('sendVerificationCode ....');
    await this.send(
      'verificationCode',
      'Your account verification code'
    );
  }

  async sendPasswordResetToken() {
    await this.send('resetPassword', 'Your password teset token ...');
  }
}
