import { Construct } from 'constructs';
import { EddiiBackendConfig, EnvironmentConfig } from '../config';
import { CfnSecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { ILayerVersion, LayerVersion } from 'aws-cdk-lib/aws-lambda';

export class Secrets extends Construct {
    public dexcomSecret: Secret;
    public appleSharedSecret: Secret;
    public googlePrivateKey: Secret;
    public healthieApiKey: Secret;
    public branchApiSecret: Secret;
    public mixpanelWebhookSecret: Secret;
    public launchdarklySecret: Secret;
    public parametersAndSecretsExtension: ILayerVersion;

    constructor(scope: Construct, config: EddiiBackendConfig, id: string) {
        super(scope, id);

        this.dexcomSecret = new Secret(this, 'DexcomSecret', {
            description: 'Dexcom Secret',
            secretName: `DexcomSecret/${config.stage}`,
        });
        this.mixpanelWebhookSecret = new Secret(this, 'MixpanelWebhookSecret', {
            description: 'Mixpanel Webhook Secret',
            secretName: `MixpanelWebhookSecret/${config.stage}`,
        });
        // Hack to override the logical ID of the secret
        (this.dexcomSecret.node.defaultChild as CfnSecret).overrideLogicalId(
            'UserSessionDexcomSecret03E61BCD',
        );

        this.appleSharedSecret = new Secret(this, 'AppleSharedSecret', {
            description: 'Apple Shared Secret',
            secretName: `AppleSharedSecret/${config.stage}`,
        });
        // Hack to override the logical ID of the secret
        (
            this.appleSharedSecret.node.defaultChild as CfnSecret
        ).overrideLogicalId('SubscriptionApiAppleSharedSecret5CEFC276');

        this.googlePrivateKey = new Secret(this, 'GooglePrivateKey', {
            description: 'Google Private Key',
            secretName: `GooglePrivateKey/${config.stage}`,
        });
        // Hack to override the logical ID of the secret
        (
            this.googlePrivateKey.node.defaultChild as CfnSecret
        ).overrideLogicalId('SubscriptionApiGooglePrivateKey6270D278');

        this.healthieApiKey = new Secret(this, 'HealthieApiKey', {
            description: 'Healthie Api Key',
            secretName: `HealthieApiKey/${config.stage}`,
        });

        this.branchApiSecret = new Secret(this, 'BranchApiSecret', {
            description: 'Branch Api Secret',
            secretName: `BranchApiSecret/${config.stage}`,
        });

        this.launchdarklySecret = new Secret(this, 'LaunchDarklySecret', {
            description: 'Launch Darkly Secret',
            secretName: `LaunchDarklySecret/${config.stage}`,
        });

        this.parametersAndSecretsExtension = LayerVersion.fromLayerVersionArn(
            this,
            'ParametersAndSecretsLambdaExtension',
            'arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:11',
        );
    }

    public getEnvs(): EnvironmentConfig {
        return {
            DEXCOM_SECRET: this.dexcomSecret.secretName,
            APPLE_SHARED_SECRET: this.appleSharedSecret.secretName,
            GOOGLE_PRIVATE_KEY: this.googlePrivateKey.secretName,
            HEALTHIE_API_KEY: this.healthieApiKey.secretName,
            BRANCH_API_SECRET: this.branchApiSecret.secretName,
            MIXPANEL_WEBHOOK_SECRET: this.mixpanelWebhookSecret.secretName,
            LAUNCH_DARKLY_SECRET: this.launchdarklySecret.secretName,
        };
    }
}
