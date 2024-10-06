import { Construct } from 'constructs';
import { EddiiBackendConfig } from '../config';
import * as ses from 'aws-cdk-lib/aws-ses';

export class Email extends Construct {
    public supportEmailIdentity: ses.EmailIdentity | undefined;
    public careEmailIdentity: ses.EmailIdentity | undefined;
    public emailConfig: ses.ConfigurationSet | undefined;

    constructor(scope: Construct, config: EddiiBackendConfig, id: string) {
        super(scope, id);

        if (config.supportEmail) {
            this.emailConfig = new ses.ConfigurationSet(
                this,
                'ConfigurationSet',
                {
                    configurationSetName: `email-config-${config.stage.toString()}`,
                    tlsPolicy: ses.ConfigurationSetTlsPolicy.REQUIRE,
                    reputationMetrics: true,
                    sendingEnabled: true,
                },
            );

            this.supportEmailIdentity = new ses.EmailIdentity(
                this,
                'Identity',
                {
                    identity: ses.Identity.email(config.supportEmail),
                    configurationSet: this.emailConfig,
                },
            );
            if (config.careEmail) {
                this.careEmailIdentity = new ses.EmailIdentity(
                    this,
                    'CareIdentity',
                    {
                        identity: ses.Identity.email(config.careEmail),
                        configurationSet: this.emailConfig,
                    },
                );
            }
        }
    }
}
