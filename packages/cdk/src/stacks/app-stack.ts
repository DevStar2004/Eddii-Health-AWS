import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EddiiBackendConfig } from '../config';
import { UserApi } from '../constructs/user-api';
import { UserAuth } from '../constructs/user-auth';
import { StoreApi } from '../constructs/store-api';
import { Jobs } from '../constructs/jobs';
import { Device } from '../constructs/device';
import { GuardianApi } from '../constructs/guardian-api';
import { Email } from '../constructs/email';
import { AuthorizationApi } from '../constructs/authorization-api';
import { DataDog } from '../constructs/datadog';
import { WAF } from '../constructs/waf';
import { SubscriptionApi } from '../constructs/subscription-api';
import { GameApi } from '../constructs/game-api';
import { CareApi } from '../constructs/care-api';
import { AssetsCdn } from '../constructs/assets-cdn';
import { CgmApi } from '../constructs/cgm-api';
import { ChatApi } from '../constructs/chat-api';
import { Databases } from '../constructs/databases';
import {
    FlowLog,
    FlowLogResourceType,
    SecurityGroup,
    Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Secrets } from '../constructs/secrets';
import { Caches } from '../constructs/caches';
import { BranchApi } from '../constructs/branch-api';
import { Streams } from '../constructs/streams';
import { UserJobs } from '../constructs/user-jobs';
import { HealthieApi } from '../constructs/healthie-api';
import { CareJobs } from '../constructs/care-jobs';
import { MixpanelApi } from '../constructs/mixpanel-api';
import { MarketJsApi } from '../constructs/marketjs-api';
import { ChatBot } from '../constructs/chat-bot';
import { LambdaScaler } from '../constructs/lambda-scaler';

export class EddiiBackendStack extends Stack {
    public readonly userPoolIdCfnOutput: CfnOutput;
    public readonly userPoolClientIdCfnOutput: CfnOutput;
    public readonly daxClusterEndpointCfnOutput: CfnOutput;

    constructor(
        scope: Construct,
        id: string,
        config: EddiiBackendConfig,
        props?: StackProps,
    ) {
        super(scope, id, props);

        // VPC
        const vpc = new Vpc(this, 'Vpc');
        new FlowLog(this, 'VpcFlowLog', {
            resourceType: FlowLogResourceType.fromVpc(vpc),
        });
        const lambdaSecurityGroup = new SecurityGroup(this, 'LambdaSG', {
            vpc: vpc,
            description: 'SecurityGroup into which Lambdas will be deployed',
            // Lambdas need to be able to call APIs
            allowAllOutbound: true,
            securityGroupName: `lambda-vpc-sg-${config.stage}`,
        });
        const networkConfig = {
            vpc: vpc,
            securityGroups: [lambdaSecurityGroup],
        };

        // Cache/Databases/Streams
        const caches = new Caches(
            this,
            config,
            vpc,
            lambdaSecurityGroup,
            'Caches',
        );
        const databases = new Databases(
            this,
            config,
            vpc,
            lambdaSecurityGroup,
            'Databases',
        );
        const streams = new Streams(this, config, 'Streams');
        const assetsCdn = new AssetsCdn(this, config, 'AssetsCdn');
        const secrets = new Secrets(this, config, 'Secrets');

        const email = new Email(this, config, 'Email');

        const envConfig = {
            ENV: config.stage.toString(),
            ASSETS_DISTRIBUTION_DOMAIN_NAME: assetsCdn.distribution.domainName,
            PINPOINT_ORIGINATION_NUMBER: config.pinpointOriginationNumber,
            AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE: '1',
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            DEXCOM_STREAMING_ENABLED:
                config.dexcomStreamingEnabled?.toString() || '',
            SUPPORT_EMAIL: email?.supportEmailIdentity?.emailIdentityName
                ? email.supportEmailIdentity.emailIdentityName
                : undefined,
            CARE_EMAIL: email?.careEmailIdentity?.emailIdentityName
                ? email.careEmailIdentity.emailIdentityName
                : undefined,
            PLATFORM_APPLICATION_ARN: config.snsPlatformApplicationArn,
            DD_LOGS_CONFIG_PROCESSING_RULES:
                '[{"type": "include_at_match", "name": "include_error_and_warn_logs", "pattern": "(ERROR|WARN|error)"}]',
            ...caches.getEnvs(),
            ...databases.getEnvs(),
            ...secrets.getEnvs(),
            ...streams.getEnvs(),
        };

        const device = new Device(
            this,
            config,
            {
                envConfig,
                networkConfig,
                tableConfig: {
                    readOnlyTables: [databases.userTable],
                    readWriteTables: [databases.deviceTable],
                    streamTables: [databases.deviceTable],
                },
            },
            'Device',
        );

        const auth = new UserAuth(
            this,
            config,
            {
                tableConfig: {
                    readWriteTables: [databases.userTable],
                },
                envConfig,
                networkConfig,
            },
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.subscriptionTable,
                    ],
                },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.launchdarklySecret],
                },
            },
            email.supportEmailIdentity,
            email.emailConfig,
            'UserAuth',
        );

        this.userPoolClientIdCfnOutput = new CfnOutput(
            this,
            'UserPoolClientId',
            {
                value: auth.client.userPoolClientId,
            },
        );
        this.userPoolIdCfnOutput = new CfnOutput(this, 'UserPoolId', {
            value: auth.userPool.userPoolId,
        });

        const jobs = new Jobs(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.userSessionTable,
                        databases.guardianTable,
                    ],
                },
                envConfig,
                networkConfig,
            },
            {
                tableConfig: {
                    readWriteTables: [databases.dexcomEgvTable],
                },
                envConfig,
                networkConfig,
            },
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.userSessionTable,
                    ],
                    readWriteTables: [databases.dexcomEgvTable],
                },
                envConfig,
                networkConfig,
            },
            {
                tableConfig: {
                    readWriteTables: [databases.userSessionTable],
                },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.dexcomSecret],
                },
            },
            streams.cgmDataStream,
            'Jobs',
        );

        // APIs
        const branchApi = new BranchApi(
            this,
            config,
            {
                tableConfig: { readWriteTables: [databases.referralTable] },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.branchApiSecret],
                },
            },
            'BranchApi',
        );

        const marketjsApi = new MarketJsApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [databases.userTable],
                    readWriteTables: [databases.leaderboardTable],
                },
                envConfig,
                networkConfig,
            },
            'MarketJsApi',
        );

        const careJobs = new CareJobs(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.patientTable,
                        databases.guardianTable,
                    ],
                },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.healthieApiKey],
                },
            },
            'CareJobs',
        );

        const healthieApi = new HealthieApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.patientTable,
                        databases.guardianTable,
                    ],
                },
                envConfig: {
                    ...envConfig,
                    CARE_JOBS_LAMBDA_ROLE_ARN: careJobs.schedulerRole.roleArn,
                    CARE_JOBS_LAMBDA_ARN: careJobs.handler.functionArn,
                },
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.healthieApiKey],
                },
            },
            careJobs.schedulerRole.roleArn,
            'HealthieApi',
        );

        const subscriptionApi = new SubscriptionApi(
            this,
            config,
            {
                tableConfig: { readWriteTables: [databases.subscriptionTable] },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [
                        secrets.appleSharedSecret,
                        secrets.googlePrivateKey,
                    ],
                },
            },
            'SubscriptionApi',
        );

        const gameApi = new GameApi(
            this,
            config,
            {
                tableConfig: {
                    readWriteTables: [
                        databases.userTable,
                        databases.quizTable,
                        databases.leaderboardTable,
                    ],
                },
                envConfig,
                networkConfig,
            },
            auth.userPool,
            'GameApi',
        );

        const chatBot = new ChatBot(
            this,
            config,
            {
                tableConfig: {
                    readWriteTables: [databases.chatTable],
                },
                envConfig,
                networkConfig,
            },
            'ChatBot',
        );

        const chatApi = new ChatApi(
            this,
            config,
            {
                tableConfig: {
                    readWriteTables: [databases.chatTable],
                },
                envConfig: { ...envConfig, ...chatBot.getEnvs() },
                networkConfig,
            },
            auth.userPool,
            'ChatApi',
        );

        const userJobs = new UserJobs(
            this,
            config,
            {
                tableConfig: {
                    readWriteTables: [
                        databases.chatTable,
                        databases.dataEntryTable,
                        databases.deviceTable,
                        databases.guardianTable,
                        databases.leaderboardTable,
                        databases.missionTable,
                        databases.patientTable,
                        databases.quizTable,
                        databases.userSessionTable,
                        databases.storeTable,
                        databases.streakTable,
                        databases.subscriptionTable,
                        databases.userTable,
                    ],
                },
                envConfig: {
                    ...envConfig,
                    COGNITO_USER_POOL_ID: auth.userPool.userPoolId,
                },
                networkConfig,
            },
            'UserJobs',
        );

        const userApi = new UserApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.storeTable,
                        databases.dexcomEgvTable,
                    ],
                    readWriteTables: [
                        databases.userTable,
                        databases.userSessionTable,
                        databases.dataEntryTable,
                        databases.streakTable,
                        databases.leaderboardTable,
                        databases.deviceTable,
                        databases.guardianTable,
                        databases.missionTable,
                        databases.subscriptionTable,
                    ],
                },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [
                        secrets.dexcomSecret,
                        secrets.appleSharedSecret,
                        secrets.googlePrivateKey,
                        secrets.launchdarklySecret,
                    ],
                },
            },
            auth.userPool,
            'UserApi',
        );

        const guardianApi = new GuardianApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.userTable,
                        databases.userSessionTable,
                        databases.dataEntryTable,
                        databases.streakTable,
                        databases.deviceTable,
                        databases.storeTable,
                    ],
                    readWriteTables: [
                        databases.missionTable,
                        databases.guardianTable,
                    ],
                },
                envConfig,
                networkConfig,
            },
            auth.userPool,
            'GuardianApi',
        );

        const storeApi = new StoreApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [
                        databases.leaderboardTable,
                        databases.userSessionTable,
                        databases.referralTable,
                        databases.subscriptionTable,
                    ],
                    readWriteTables: [
                        databases.userTable,
                        databases.storeTable,
                    ],
                },
                envConfig,
                networkConfig,
            },
            auth.userPool,
            'StoreApi',
        );

        const careApi = new CareApi(
            this,
            config,
            {
                tableConfig: {
                    readOnlyTables: [databases.userTable],
                    readWriteTables: [
                        databases.patientTable,
                        databases.guardianTable,
                    ],
                },
                envConfig,
                networkConfig,
                secretConfig: { readOnlySecrets: [secrets.healthieApiKey] },
            },
            auth.userPool,
            'CareApi',
        );

        const authzApi = new AuthorizationApi(
            this,
            config,
            {
                tableConfig: { readOnlyTables: [databases.guardianTable] },
                envConfig,
                networkConfig,
                secretConfig: {
                    readOnlySecrets: [secrets.healthieApiKey],
                },
            },
            'AuthorizationApi',
        );

        const cgmApi = new CgmApi(
            this,
            config,
            {
                streamConfig: {
                    writeOnlyStreams: [streams.cgmDataStream],
                },
                envConfig,
                networkConfig,
            },
            auth.userPool,
            'CgmApi',
        );

        const mixpanelApi = new MixpanelApi(
            this,
            config,
            {
                envConfig,
                networkConfig,
                tableConfig: {
                    readWriteTables: [
                        databases.userTable,
                        databases.streakTable,
                        databases.leaderboardTable,
                    ],
                    readOnlyTables: [databases.deviceTable],
                },
                secretConfig: {
                    readOnlySecrets: [secrets.mixpanelWebhookSecret],
                },
            },
            'MixpanelApi',
        );

        // Add dependencies between APIs to avoid 429 issues with API Gateway
        // Allow 2 APIs to be deployed in parallel
        const apiDependencies = [
            userApi,
            guardianApi,
            storeApi,
            careApi,
            authzApi,
            branchApi,
            subscriptionApi,
            gameApi,
            chatApi,
            cgmApi,
            healthieApi,
            mixpanelApi,
            marketjsApi,
        ].filter(api => api.endpoint !== undefined);

        for (let i = 2; i < apiDependencies.length; i++) {
            apiDependencies[i].node.addDependency(apiDependencies[i - 2]);
        }

        const allLambdas = [
            device.handler,
            auth.postConfirmationHandler,
            auth.preTokenHandler,
            jobs.processCgmHandler,
            jobs.saveCgmHandler,
            jobs.refreshSessionHandler,
            userApi.handler,
            guardianApi.handler,
            storeApi.handler,
            careApi.handler,
            authzApi.handler,
            branchApi.handler,
            subscriptionApi.handler,
            gameApi.handler,
            chatApi.handler,
            cgmApi.handler,
            userJobs.handler,
            healthieApi.handler,
            careJobs.handler,
            chatBot.handler,
            mixpanelApi.handler,
            marketjsApi.handler,
        ].filter(handler => handler !== undefined);
        allLambdas.forEach(lambda => {
            lambda.addLayers(secrets.parametersAndSecretsExtension);
        });
        const allAliases = [
            device.alias,
            auth.postConfirmationAlias,
            auth.preTokenAlias,
            jobs.processCgmAlias,
            jobs.saveCgmAlias,
            jobs.refreshSessionAlias,
            userApi.alias,
            guardianApi.alias,
            storeApi.alias,
            careApi.alias,
            authzApi.alias,
            branchApi.alias,
            subscriptionApi.alias,
            gameApi.alias,
            chatApi.alias,
            cgmApi.alias,
            userJobs.alias,
            healthieApi.alias,
            careJobs.alias,
            chatBot.alias,
            mixpanelApi.alias,
            marketjsApi.alias,
        ].filter(alias => alias !== undefined);

        new DataDog(this, config, allLambdas, 'DataDog');

        new WAF(
            this,
            config,
            [
                authzApi.endpoint,
                guardianApi.endpoint,
                userApi.endpoint,
                storeApi.endpoint,
                careApi.endpoint,
                branchApi.endpoint,
                subscriptionApi.endpoint,
                gameApi.endpoint,
                chatApi.endpoint,
                healthieApi.endpoint,
                mixpanelApi.endpoint,
                marketjsApi.endpoint,
            ],
            auth.userPool,
            'WAF',
        );

        new LambdaScaler(this, config, allAliases, 'LambdaScaler');
    }
}
