import { Construct } from 'constructs';
import { Duration, RemovalPolicy, aws_lambda as lambda } from 'aws-cdk-lib';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import {
    AccountRecovery,
    Mfa,
    OAuthScope,
    ProviderAttribute,
    ResourceServerScope,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolEmail,
    UserPoolIdentityProviderApple,
    UserPoolIdentityProviderGoogle,
    UserPoolResourceServer,
    VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ConfigurationSet, EmailIdentity } from 'aws-cdk-lib/aws-ses';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export class UserAuth extends Construct {
    public userPool: UserPool;
    public postConfirmationHandler: lambda.Function;
    public postConfirmationAlias: lambda.Alias;
    public preTokenHandler: lambda.Function;
    public preTokenAlias: lambda.Alias;
    public client: UserPoolClient;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        postConfirmationHandlerConfigs: HandlerConfigs,
        preTokenHandlerConfigs: HandlerConfigs,
        email: EmailIdentity | undefined,
        emailConfig: ConfigurationSet | undefined,
        id: string,
    ) {
        super(scope, id);

        this.postConfirmationHandler = new lambda.Function(
            this,
            'PostConfirmationAuthLambda',
            {
                ...postConfirmationHandlerConfigs.networkConfig,
                runtime: lambda.Runtime.NODEJS_18_X,
                code: lambda.Code.fromAsset('../../dist/packages/auth-flow'),
                handler: 'main.postConfirmationHandler',
                memorySize: 512,
                timeout: Duration.seconds(60),
                environment: {
                    DD_SERVICE: 'auth-flow-post-confirmation',
                },
                tracing: lambda.Tracing.ACTIVE,
            },
        );
        this.postConfirmationAlias = new lambda.Alias(
            this,
            'PostConfirmationAuthAlias',
            {
                aliasName: 'live',
                version: this.postConfirmationHandler.currentVersion,
            },
        );
        configureHandler(
            postConfirmationHandlerConfigs,
            this.postConfirmationHandler,
            this.postConfirmationAlias,
        );
        this.postConfirmationAlias.role?.addToPrincipalPolicy(
            new PolicyStatement({
                actions: ['sns:CreateTopic'],
                resources: ['*'],
            }),
        );

        const intercomIdentitySecret = new Secret(
            this,
            'IntercomIdentitySecret',
            {
                description: 'Intercom Identity Secret',
                secretName: `IntercomIdentity/${config.stage}`,
            },
        );

        this.preTokenHandler = new lambda.Function(this, 'PreTokenAuthLambda', {
            ...preTokenHandlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/auth-flow'),
            handler: 'main.preTokenHandler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'auth-flow-pre-token',
                INTERCOM_IDENTITY_SECRET: intercomIdentitySecret.secretFullArn,
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.preTokenAlias = new lambda.Alias(this, 'PreTokenAuthAlias', {
            aliasName: 'live',
            version: this.preTokenHandler.currentVersion,
        });
        configureHandler(
            preTokenHandlerConfigs,
            this.preTokenHandler,
            this.preTokenAlias,
        );
        intercomIdentitySecret.grantRead(this.preTokenAlias);

        this.userPool = new UserPool(this, 'EddiiUserPool', {
            userPoolName: `eddii-user-pool-${config.stage.toString()}`,
            signInAliases: {
                email: true,
            },
            selfSignUpEnabled: true,
            autoVerify: {
                email: true,
                phone: true,
            },
            keepOriginal: {
                email: true,
                phone: true,
            },
            enableSmsRole: true,
            email: email
                ? UserPoolEmail.withSES({
                      fromEmail: email.emailIdentityName,
                      fromName: 'eddii',
                      replyTo: email.emailIdentityName,
                      configurationSetName: emailConfig.configurationSetName,
                  })
                : undefined,
            userVerification: {
                emailSubject: 'You need to verify your email',
                emailBody:
                    'Thanks for signing up Your verification code is {####}', // # This placeholder is a must if code is selected as preferred verification method
                emailStyle: VerificationEmailStyle.CODE,
            },
            standardAttributes: {},
            customAttributes: {},
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            mfa: Mfa.OPTIONAL,
            mfaSecondFactor: {
                sms: true,
                otp: true,
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            lambdaTriggers: {
                postConfirmation: this.postConfirmationAlias,
                preTokenGeneration: this.preTokenAlias,
            },
            removalPolicy: RemovalPolicy.RETAIN,
        });

        let googleProvider: UserPoolIdentityProviderGoogle | undefined;
        if (config.googleClientId) {
            const googleSecret = new Secret(this, 'GoogleSSOSecret', {
                description: 'Google SSO',
                secretName: `GoogleSSO/${config.stage}`,
            });
            googleProvider = new UserPoolIdentityProviderGoogle(
                this,
                'GoogleSSO',
                {
                    userPool: this.userPool,
                    clientId: config.googleClientId,
                    clientSecretValue: googleSecret.secretValue,

                    // Email scope is required, because the default is 'profile' and that doesn't allow Cognito
                    // to fetch the user's email from his Google account after the user does an SSO with Google
                    scopes: ['email'],

                    // Map fields from the user's Google profile to Cognito user fields, when the user is auto-provisioned
                    attributeMapping: {
                        email: ProviderAttribute.GOOGLE_EMAIL,
                    },
                },
            );
        }
        let appleProvider: UserPoolIdentityProviderApple | undefined;
        if (config.appleKeyId) {
            appleProvider = new UserPoolIdentityProviderApple(
                this,
                'AppleSSO',
                {
                    userPool: this.userPool,
                    clientId:
                        config.stage === 'prod'
                            ? 'com.eddiihealth.eddii.sso'
                            : `com.eddiihealth.eddii.${config.stage}.sso`,
                    teamId: 'N97BG2DCYY',
                    keyId: config.appleKeyId,
                    privateKey: Secret.fromSecretNameV2(
                        this,
                        'ApplePrivateKey',
                        `manual-AppleSSOKey/${config.stage}`,
                    ).secretValue.toString(),
                    scopes: ['email'],
                    attributeMapping: {
                        email: ProviderAttribute.APPLE_EMAIL,
                    },
                },
            );
        }

        const scheme =
            config.stage === 'prod'
                ? 'eddii'
                : config.stage === 'dev'
                  ? 'eddii-sandbox'
                  : `eddii-${config.stage}`;

        this.client = this.userPool.addClient('eddii-app-client', {
            userPoolClientName: `eddii-app-client-${config.stage.toString()}`,
            authFlows: {
                userSrp: true,
            },
            accessTokenValidity: Duration.hours(24),
            idTokenValidity: Duration.hours(24),
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO,
                ...(config.googleClientId
                    ? [UserPoolClientIdentityProvider.GOOGLE]
                    : []),
                ...(appleProvider
                    ? [UserPoolClientIdentityProvider.APPLE]
                    : []),
            ],
            oAuth: {
                callbackUrls: [`${scheme}://login`],
                logoutUrls: [`${scheme}://logout`],
            },
        });
        if (googleProvider) {
            this.client.node.addDependency(googleProvider);
        }
        if (appleProvider) {
            this.client.node.addDependency(appleProvider);
        }

        const cgmWriteScope = new ResourceServerScope({
            scopeName: 'cgm.write',
            scopeDescription: 'cgm write scope',
        });

        const cgmResourceServer = new UserPoolResourceServer(
            this,
            'UserPoolCgmResourceServer',
            {
                identifier: 'cgm-resource-server',
                userPool: this.userPool,
                scopes: [cgmWriteScope],
            },
        );

        this.userPool.addClient('dexcom-client', {
            userPoolClientName: `dexcom-client-${config.stage.toString()}`,
            oAuth: {
                flows: {
                    clientCredentials: true, // Enable client credentials flow
                },
                scopes: [
                    OAuthScope.resourceServer(cgmResourceServer, cgmWriteScope),
                ],
            },
            generateSecret: true,
            accessTokenValidity: Duration.hours(8),
            idTokenValidity: Duration.hours(8),
            enableTokenRevocation: true,
        });

        let domainPrefix = 'eddii';
        if (config.stage !== 'prod') {
            domainPrefix += '-' + config.stage.toString();
            if (config.stage === 'dev') {
                // Add random 6 characters
                domainPrefix += '-' + config.name;
            }
        }
        this.userPool.addDomain('EddiiCognitoDomain', {
            cognitoDomain: {
                domainPrefix: domainPrefix,
            },
        });
    }
}
