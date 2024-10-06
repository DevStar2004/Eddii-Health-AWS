import {
    sendGiftCardEmail,
    sendGuardianSignUpEmail,
    sendSupportEmail,
    sendUserForGuardianSignUpEmail,
} from './email';
import Clients from '@eddii-backend/clients';

describe('sendSupportEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send an email', async () => {
        const mockSend = (Clients.ses.send as jest.Mock).mockResolvedValue({});

        const toEmail = 'test@example.com';
        const subject = 'Test Subject';
        const message = 'Test Message';
        process.env['SUPPORT_EMAIL'] = 'test@example.com';

        await sendSupportEmail(toEmail, subject, message);

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should log the email if SUPPORT_EMAIL is not set', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const toEmail = 'test@example.com';
        const subject = 'Test Subject';
        const message = 'Test Message';
        process.env['SUPPORT_EMAIL'] = '';

        await sendSupportEmail(toEmail, subject, message);

        expect(consoleSpy).toHaveBeenCalledWith(
            `Support email to ${toEmail} with subject ${subject} and message ${message}`,
        );

        consoleSpy.mockRestore();
    });
});

describe('sendGuardianSignUpEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send an email', async () => {
        const mockSend = (Clients.ses.send as jest.Mock).mockResolvedValue({});

        process.env['SUPPORT_EMAIL'] = 'test@example.com';

        const guardianEmail = 'test@example.com';

        await sendGuardianSignUpEmail(guardianEmail);

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should log the email if SUPPORT_EMAIL is not set', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const toEmail = 'test@example.com';
        process.env['SUPPORT_EMAIL'] = '';

        await sendGuardianSignUpEmail(toEmail);

        expect(consoleSpy).toHaveBeenCalledWith(
            `Sign-up email to ${toEmail} with subject Your child has invited you to follow their health on eddii 🙌 and message <html><head>
Hey there!<br/><br/>
I'm eddii, a virtual in-app character designed to make managing diabetes more fun, and you've officially been invited to join as a guardian on my app.<br/><br/>
Now, let's get the party started with these simple steps:<br/><br/>
<ul style="list-style: none;">
  <li>📱 <b>Download the eddii app</b>: To kick things off, grab your smartphone and head over to the App Store (iOS) or Google Play Store (Android). Type "eddii" in the search bar, hit that download button, and watch the magic unfold!<br/>
    <a href="https://apps.apple.com/us/app/eddii/id6450377749?itsct=apps_box_badge&amp;itscg=30200" style="margin-bottom: 8px; display: inline-block; overflow: hidden; height: auto; width: 125px;"><img src="https://developer.apple.com/news/images/download-on-the-app-store-badge.png" alt="Download on the App Store" style="width: 125px; height: auto;"></a>
    <a href="https://play.google.com/store/apps/details?id=com.eddiihealth.eddii" style="display: inline-block; overflow: hidden; height: auto; width: 155px;"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="width: 155px; height: auto;"></a>
  </li><br/>
  <li>🔗 <b>Sign up and link to your child</b>: Once my new and shiny app is installed, open this very email on your device, click on the link below to create your eddii account, and link it to your child's profile. Voilà!<br/>
    <a href="https://www.eddiihealth.com/sign-up-guardian?email=${toEmail}" style="display: inline-block; text-decoration: none; border-radius: 50px; border: 1px solid #F26327; background: #F26327; color: white; padding: 10px 20px; margin: 8px">Invite link</a>
  </li><br/>
  <li>💥 <b>Boom! You're all set</b>: Told you it'd be a breeze!</li>
</ul>
<br/>
Thank you for trusting me to be a part of your young heroes' health journey, and for being part of mine! Together, we'll empower them to lead their happiest life possible! 🌟<br/><br/>
Should you need any help or have questions during the sign-up process, don't hesitate to reach out to my incredible support team at <a href="mailto:support@eddiihealth.com">support@eddiihealth.com</a>. They've got your back!<br/><br/>
Until next time ✌️<br/><br/>

<img src="https://static.wixstatic.com/media/a40b16_90d33f176cbf4acfaa309a3c8355645a~mv2.png" alt="eddii" style="width: 80px; height: auto; transform: scaleX(-1);"><br/>
<b>eddii the leaf</b> 🍃<br/><br/>
</body></html>`,
        );

        consoleSpy.mockRestore();
    });
});

describe('sendUserForGuardianSignUpEmail', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send an email', async () => {
        const mockSend = (Clients.ses.send as jest.Mock).mockResolvedValue({});

        process.env['SUPPORT_EMAIL'] = 'test@example.com';

        const userEmail = 'test@example.com';

        await sendUserForGuardianSignUpEmail(userEmail);

        expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should log the email if SUPPORT_EMAIL is not set', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const toEmail = 'test@example.com';
        process.env['SUPPORT_EMAIL'] = '';

        await sendUserForGuardianSignUpEmail(toEmail);

        expect(consoleSpy).toHaveBeenCalledWith(
            `Sign-up email to ${toEmail} with subject Your guardian has invited you to join eddii and message <html><head>
Hey there!<br/><br/>
I'm eddii, a virtual in-app character designed to make managing diabetes more fun, and you've officially been invited to join as a user on my app.<br/><br/>
Now, let's get the party started with these simple steps:<br/><br/>
<ul style="list-style: none;">
  <li>📱 <b>Download the eddii app</b>: To kick things off, grab your smartphone and head over to the App Store (iOS) or Google Play Store (Android). Type "eddii" in the search bar, hit that download button, and watch the magic unfold!<br/>
    <a href="https://apps.apple.com/us/app/eddii/id6450377749?itsct=apps_box_badge&amp;itscg=30200" style="margin-bottom: 8px; display: inline-block; overflow: hidden; height: auto; width: 125px;"><img src="https://developer.apple.com/news/images/download-on-the-app-store-badge.png" alt="Download on the App Store" style="width: 125px; height: auto;"></a>
    <a href="https://play.google.com/store/apps/details?id=com.eddiihealth.eddii" style="display: inline-block; overflow: hidden; height: auto; width: 155px;"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" style="width: 155px; height: auto;"></a>
  </li><br/>
  <li>🔗 <b>Sign up</b>: Once my new and shiny app is installed, open this very email on your device, click on the link below to create your eddii account. Voilà!<br/>
    <a href="https://www.eddiihealth.com/user-sign-up?email=${toEmail}" style="display: inline-block; text-decoration: none; border-radius: 50px; border: 1px solid #F26327; background: #F26327; color: white; padding: 10px 20px; margin: 8px">Invite link</a>
  </li><br/>
  <li>💥 <b>Boom! You're all set</b>: Told you it'd be a breeze!</li>
</ul>
<br/>
Should you need any help or have questions during the sign-up process, don't hesitate to reach out to my incredible support team at <a href="mailto:support@eddiihealth.com">support@eddiihealth.com</a>. They've got your back!<br/><br/>
Until next time ✌️<br/><br/>

<img src="https://static.wixstatic.com/media/a40b16_90d33f176cbf4acfaa309a3c8355645a~mv2.png" alt="eddii" style="width: 80px; height: auto; transform: scaleX(-1);"><br/>
<b>eddii the leaf</b> 🍃<br/><br/>
</body></html>`,
        );

        consoleSpy.mockRestore();
    });
});

it('should send a gift card email', async () => {
    const mockSend = (Clients.ses.send as jest.Mock).mockResolvedValue({});

    process.env['SUPPORT_EMAIL'] = 'test@example.com';

    const userEmail = 'test@example.com';
    const giftCardName = 'Test Gift Card';

    await sendGiftCardEmail(userEmail, giftCardName, 10);

    expect(mockSend).toHaveBeenCalledTimes(1);
});
