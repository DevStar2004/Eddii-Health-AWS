import { SendEmailCommand } from '@aws-sdk/client-ses';
import Clients from '@eddii-backend/clients';
import { formatAppointmentDate } from '@eddii-backend/utils';

export const sendSupportEmail = async (
    toEmail: string,
    subject: string,
    message: string,
): Promise<void> => {
    const ses = Clients.ses;

    const senderEmail = process.env['SUPPORT_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support email to ${toEmail} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: [toEmail, senderEmail],
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Text: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendGuardianSignUpEmail = async (
    guardianEmail: string,
): Promise<void> => {
    const ses = Clients.ses;

    const subject =
        'Your child has invited you to follow their health on eddii 🙌';
    const message = `<html><head>
Hey there!<br/><br/>
I'm eddii, a virtual in-app character designed to make managing diabetes more fun, and you've officially been invited to join as a guardian on my app.<br/><br/>
Now, let's get the party started with these simple steps:<br/><br/>
<ul style="list-style: none;">
  <li>📱 <b>Download the eddii app</b>: To kick things off, grab your smartphone and head over to the App Store (iOS) or Google Play Store (Android). Type "eddii" in the search bar, hit that download button, and watch the magic unfold!<br/>
    <a href="https://apps.apple.com/us/app/eddii/id6450377749?itsct=apps_box_badge&amp;itscg=30200" style="margin-bottom: 8px; display: inline-block; overflow: hidden; height: auto; width: 125px;"><img src="https://developer.apple.com/news/images/download-on-the-app-store-badge.png" alt="Download on the App Store" style="width: 125px; height: auto;"></a>
    <a href="https://play.google.com/store/apps/details?id=com.eddiihealth.eddii" style="display: inline-block; overflow: hidden; height: auto; width: 155px;"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="width: 155px; height: auto;"></a>
  </li><br/>
  <li>🔗 <b>Sign up and link to your child</b>: Once my new and shiny app is installed, open this very email on your device, click on the link below to create your eddii account, and link it to your child's profile. Voilà!<br/>
    <a href="https://www.eddiihealth.com/sign-up-guardian?email=${guardianEmail}${
        process.env['ENV'] === 'dev' || process.env['ENV'] === 'sandbox'
            ? '&sandbox=true'
            : process.env['ENV'] === 'staging'
              ? '&staging=true'
              : ''
    }" style="display: inline-block; text-decoration: none; border-radius: 50px; border: 1px solid #F26327; background: #F26327; color: white; padding: 10px 20px; margin: 8px">Invite link</a>
  </li><br/>
  <li>💥 <b>Boom! You're all set</b>: Told you it'd be a breeze!</li>
</ul>
<br/>
Thank you for trusting me to be a part of your young heroes' health journey, and for being part of mine! Together, we'll empower them to lead their happiest life possible! 🌟<br/><br/>
Should you need any help or have questions during the sign-up process, don't hesitate to reach out to my incredible support team at <a href="mailto:support@eddiihealth.com">support@eddiihealth.com</a>. They've got your back!<br/><br/>
Until next time ✌️<br/><br/>

<img src="https://static.wixstatic.com/media/a40b16_90d33f176cbf4acfaa309a3c8355645a~mv2.png" alt="eddii" style="width: 80px; height: auto; transform: scaleX(-1);"><br/>
<b>eddii the leaf</b> 🍃<br/><br/>
</body></html>`;

    const senderEmail = process.env['SUPPORT_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Sign-up email to ${guardianEmail} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: [guardianEmail],
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendUserForGuardianSignUpEmail = async (
    userEmail: string,
): Promise<void> => {
    const ses = Clients.ses;

    const subject = 'Your guardian has invited you to join eddii';
    const message = `<html><head>
Hey there!<br/><br/>
I'm eddii, a virtual in-app character designed to make managing diabetes more fun, and you've officially been invited to join as a user on my app.<br/><br/>
Now, let's get the party started with these simple steps:<br/><br/>
<ul style="list-style: none;">
  <li>📱 <b>Download the eddii app</b>: To kick things off, grab your smartphone and head over to the App Store (iOS) or Google Play Store (Android). Type "eddii" in the search bar, hit that download button, and watch the magic unfold!<br/>
    <a href="https://apps.apple.com/us/app/eddii/id6450377749?itsct=apps_box_badge&amp;itscg=30200" style="margin-bottom: 8px; display: inline-block; overflow: hidden; height: auto; width: 125px;"><img src="https://developer.apple.com/news/images/download-on-the-app-store-badge.png" alt="Download on the App Store" style="width: 125px; height: auto;"></a>
    <a href="https://play.google.com/store/apps/details?id=com.eddiihealth.eddii" style="display: inline-block; overflow: hidden; height: auto; width: 155px;"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="width: 155px; height: auto;"></a>
  </li><br/>
  <li>🔗 <b>Sign up</b>: Once my new and shiny app is installed, open this very email on your device, click on the link below to create your eddii account. Voilà!<br/>
    <a href="https://www.eddiihealth.com/user-sign-up?email=${userEmail}${
        process.env['ENV'] === 'dev' || process.env['ENV'] === 'sandbox'
            ? '&sandbox=true'
            : process.env['ENV'] === 'staging'
              ? '&staging=true'
              : ''
    }" style="display: inline-block; text-decoration: none; border-radius: 50px; border: 1px solid #F26327; background: #F26327; color: white; padding: 10px 20px; margin: 8px">Invite link</a>
  </li><br/>
  <li>💥 <b>Boom! You're all set</b>: Told you it'd be a breeze!</li>
</ul>
<br/>
Should you need any help or have questions during the sign-up process, don't hesitate to reach out to my incredible support team at <a href="mailto:support@eddiihealth.com">support@eddiihealth.com</a>. They've got your back!<br/><br/>
Until next time ✌️<br/><br/>

<img src="https://static.wixstatic.com/media/a40b16_90d33f176cbf4acfaa309a3c8355645a~mv2.png" alt="eddii" style="width: 80px; height: auto; transform: scaleX(-1);"><br/>
<b>eddii the leaf</b> 🍃<br/><br/>
</body></html>`;

    const senderEmail = process.env['SUPPORT_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Sign-up email to ${userEmail} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: [userEmail],
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendGiftCardEmail = async (
    email: string,
    giftCardName: string,
    amount: number,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'eddii gift card';
    const message = `Send $${amount} ${giftCardName} gift card to ${email}`;

    const senderEmail = process.env['SUPPORT_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support gift card email to rewards@eddiihealth.com with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: ['rewards@eddiihealth.com'],
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Text: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendAppointmentCreationEmail = async (
    emails: string[],
    name: string,
    provider: string,
    appointmentType: string,
    appointmentDate: string,
    timeZone: string,
    zoomLink: string,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'Your eddii-care appointment is confirmed!';
    const message = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background-color: #f2f2f2; padding: 10px; text-align: center; margin-top: 10px;}
                    .content { margin: 20px; }
                    .appointment-details { background-color: #e7f4e4; padding: 15px; margin-bottom: 10px; }
                    .appointment-details th { text-align: left; padding-left: 15px; padding-right: 15px; }
                    .appointment-details td { padding: 10px 0px; padding-right: 15px; }
                    .icon { vertical-align: middle; }
                    .action-links { margin-top: 20px; }
                    .action-links a { text-decoration: none; color: #007bff; margin-right: 15px; }
                    .add-to-calendar { margin-top: 10px; }
                    .add-to-calendar a { text-decoration: none; color: #ffffff; background-color: #007bff; padding: 5px 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <img src="https://static.wixstatic.com/media/a40b16_0d755028a58a4987b99a4057b5308bce~mv2.png" alt="eddii" style="width: 200px; height: auto;">
                </div>
                <div class="header">
                    <h2>Your Appointment is Confirmed!</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>${name}'s <strong>${appointmentType}</strong> has been scheduled.</p>
                    <table class="appointment-details">
                        <tr>
                            <th>Provider</th>
                            <td>${provider}</td>
                        </tr>
                        <tr>
                            <th>Appt Type</th>
                            <td>${appointmentType}</td>
                        </tr>
                        <tr>
                            <th>Date/Time</th>
                            <td>${formatAppointmentDate(appointmentDate)} ${timeZone}</td>
                        </tr>
                        <tr>
                            <th>Where</th>
                            <td>You can join directly via the eddii app or via the <a href="${zoomLink}" target="_blank">Zoom Meeting Link</a></td>
                        </tr>
                    </table>
                    <p>If you need to make any changes to this appointment you can do so via the eddii app.</p>
                    <p>Thank you!</p>
                </div>
            </body>
        </html>
    `;

    const senderEmail = process.env['CARE_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support appointment creation email to ${emails} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: emails,
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendAppointmentUpdateEmail = async (
    emails: string[],
    name: string,
    provider: string,
    appointmentType: string,
    appointmentDate: string,
    timeZone: string,
    zoomLink: string,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'Your eddii-care appointment has been updated!';
    const message = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background-color: #f2f2f2; padding: 10px; text-align: center; margin-top: 10px;}
                    .content { margin: 20px; }
                    .appointment-details { background-color: #e7f4e4; padding: 15px; margin-bottom: 10px; }
                    .appointment-details th { text-align: left; padding-left: 15px; padding-right: 15px; }
                    .appointment-details td { padding: 10px 0px; padding-right: 15px; }
                    .icon { vertical-align: middle; }
                    .action-links { margin-top: 20px; }
                    .action-links a { text-decoration: none; color: #007bff; margin-right: 15px; }
                    .add-to-calendar { margin-top: 10px; }
                    .add-to-calendar a { text-decoration: none; color: #ffffff; background-color: #007bff; padding: 5px 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <img src="https://static.wixstatic.com/media/a40b16_0d755028a58a4987b99a4057b5308bce~mv2.png" alt="eddii" style="width: 200px; height: auto;">
                </div>
                <div class="header">
                    <h2>Your Appointment Has Been Updated</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>We wanted to inform you that there has been a change to ${name}'s <strong>${appointmentType}</strong> appointment.</p>
                    <table class="appointment-details">
                        <tr>
                            <th>Provider</th>
                            <td>${provider}</td>
                        </tr>
                        <tr>
                            <th>Appt Type</th>
                            <td>${appointmentType}</td>
                        </tr>
                        <tr>
                            <th>New Date/Time</th>
                            <td>${formatAppointmentDate(appointmentDate)} ${timeZone}</td>
                        </tr>
                        <tr>
                            <th>Where</th>
                            <td>The appointment will take place via the eddii app or through the <a href="${zoomLink}" target="_blank">Zoom Meeting Link</a></td>
                        </tr>
                    </table>
                    <p>If these changes are incorrect or if you need further assistance, please update the appointment details via the eddii app or contact our support team.</p>
                </div>
            </body>
        </html>
    `;

    const senderEmail = process.env['CARE_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support appointment creation email to ${emails} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: emails,
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendAppointmentDeleteEmail = async (
    emails: string[],
    name: string,
    provider: string,
    appointmentType: string,
    appointmentDate: string,
    timeZone: string,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'Your eddii-care appointment has been cancelled';
    const message = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background-color: #f2f2f2; padding: 10px; text-align: center; margin-top: 10px;}
                    .content { margin: 20px; }
                    .appointment-details { background-color: #e7f4e4; padding: 15px; margin-bottom: 10px; }
                    .appointment-details th { text-align: left; padding-left: 15px; padding-right: 15px; }
                    .appointment-details td { padding: 10px 0px; padding-right: 15px; }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <img src="https://static.wixstatic.com/media/a40b16_0d755028a58a4987b99a4057b5308bce~mv2.png" alt="eddii" style="width: 200px; height: auto;">
                </div>
                <div class="header">
                    <h2>Your Appointment Has Been Cancelled</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>${name}'s <strong>${appointmentType}</strong> appointment scheduled for <strong>${formatAppointmentDate(appointmentDate)} ${timeZone}</strong> with ${provider} has been cancelled.</p>
                    <p>If this cancellation was not intended or if you require assistance, you can reschedule the appointment through the eddii app or reach out to our support team for help.</p>
                </div>
            </body>
        </html>
    `;

    const senderEmail = process.env['CARE_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support appointment creation email to ${emails} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: emails,
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendAppointmentCompletedEmail = async (
    emails: string[],
    name: string,
    provider: string,
    appointmentType: string,
    appointmentDate: string,
    timeZone: string,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'Your eddii-care appointment has occurred';
    const message = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background-color: #f2f2f2; padding: 10px; text-align: center; margin-top: 10px;}
                    .content { margin: 20px; }
                    .appointment-details { background-color: #e7f4e4; padding: 15px; margin-bottom: 10px; }
                    .appointment-details th { text-align: left; padding-left: 15px; padding-right: 15px; }
                    .appointment-details td { padding: 10px 0px; padding-right: 15px; }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <img src="https://static.wixstatic.com/media/a40b16_0d755028a58a4987b99a4057b5308bce~mv2.png" alt="eddii" style="width: 200px; height: auto;">
                </div>
                <div class="header">
                    <h2>Your Appointment Details Are Available</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>${name}'s <strong>${appointmentType}</strong> appointment with ${provider} on <strong>${appointmentDate} ${timeZone}</strong> has occurred.</p>
                    <p>You can view the details and notes of the appointment in the eddii app. If you require further assistance, please reach out to our support team for help.</p>
                </div>
            </body>
        </html>
    `;

    const senderEmail = process.env['CARE_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support appointment creation email to ${emails} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: emails,
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};

export const sendPatientCreationEmail = async (
    emails: string[],
    name: string,
): Promise<void> => {
    const ses = Clients.ses;
    const subject = 'Welcome to eddii-care!';
    const message = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { background-color: #f2f2f2; padding: 10px; text-align: center; margin-top: 10px;}
                    .content { margin: 20px; }
                    .welcome { background-color: #e7f4e4; padding: 15px; margin-bottom: 10px; }
                    .welcome p { margin: 10px 0; }
                    .benefits { margin-top: 20px; }
                    .benefits ul { list-style-type: none; padding: 0; }
                    .benefits li { margin-bottom: 10px; }
                    .benefits a { text-decoration: none; color: #007bff; }
                    .get-started { margin-top: 20px; }
                    .get-started a { text-decoration: none; color: #ffffff; background-color: #007bff; padding: 10px 15px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <img src="https://static.wixstatic.com/media/a40b16_0d755028a58a4987b99a4057b5308bce~mv2.png" alt="eddii" style="width: 200px; height: auto;">
                </div>
                <div class="header">
                    <h2>Welcome to eddii-care, ${name}!</h2>
                </div>
                <div class="content">
                    <div class="welcome">
                        <p>We are thrilled to have you on board and look forward to supporting your health journey.</p>
                        <p>With eddii-care, you get personalized care, easy appointment scheduling, and seamless communication with healthcare providers, all at your fingertips.</p>
                    </div>
                    <div class="benefits">
                        <h3>Benefits of eddii-care:</h3>
                        <ul>
                            <li>👩‍⚕️ Direct access to top healthcare providers.</li>
                            <li>📅 Convenient online appointment booking.</li>
                            <li>📱 Real-time health tracking and insights.</li>
                        </ul>
                    </div>
                    <div class="get-started">
                        Get started with eddii-care by finishing any onboarding steps in the app and book your first appointment today!
                    </div>
                    <p>If you have any questions or need assistance, our support team is here to help you every step of the way.</p>
                    <p>Thank you for choosing eddii-care!</p>
                </div>
            </body>
        </html>
    `;

    const senderEmail = process.env['CARE_EMAIL'];
    if (!senderEmail) {
        // Email not enabled, just log the email.
        console.log(
            `Support patient creation email to ${emails} with subject ${subject} and message ${message}`,
        );
    } else {
        const command = new SendEmailCommand({
            Destination: {
                /* required */
                CcAddresses: [
                    /* more items */
                ],
                ToAddresses: emails,
            },
            Message: {
                /* required */
                Body: {
                    /* required */
                    Html: {
                        Charset: 'UTF-8',
                        Data: message,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject,
                },
            },
            Source: senderEmail,
            ReplyToAddresses: [],
        });
        await ses.send(command);
    }
};
