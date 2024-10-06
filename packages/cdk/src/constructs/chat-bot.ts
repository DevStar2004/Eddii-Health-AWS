import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration, Stack } from 'aws-cdk-lib';
import {
    EddiiBackendConfig,
    EnvironmentConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import {
    ManagedPolicy,
    PolicyDocument,
    PolicyStatement,
    Role,
    ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { CfnBot, CfnBotAlias, CfnBotVersion } from 'aws-cdk-lib/aws-lex';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class ChatBot extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public botAlias: CfnBotAlias;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'ChatBotLambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/chat-bot'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'chat-bot',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `ChatBotAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);
        this.alias.addToRolePolicy(
            new PolicyStatement({
                actions: ['bedrock:InvokeModel'],
                resources: ['*'],
            }),
        );

        const lexLogGroup = new LogGroup(this, 'BotLogGroup');

        const lexBotRole = new Role(this, 'LexBotRole', {
            assumedBy: new ServicePrincipal('lexv2.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AmazonLexFullAccess'),
            ],
            inlinePolicies: {
                ['LexRuntimeRolePolicy']: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            resources: ['*'],
                            actions: [
                                'polly:SynthesizeSpeech',
                                'comprehend:DetectSentiment',
                            ],
                        }),
                        new PolicyStatement({
                            resources: [lexLogGroup.logGroupArn],
                            actions: [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents',
                            ],
                        }),
                    ],
                }),
            },
        });
        const lexAssetS3Bucket = new Asset(this, 'LexAssetS3Bucket', {
            path: 'src/assets/bots/eddiiChatBotFiles',
        });

        const eddiiChatBot = new CfnBot(this, 'EddiiChatBot', {
            dataPrivacy: { ChildDirected: true },
            idleSessionTtlInSeconds: 300,
            name: `eddiiChatBot-${config.stage}`,
            roleArn: lexBotRole.roleArn,
            autoBuildBotLocales: true,
            botFileS3Location: {
                s3Bucket: lexAssetS3Bucket.s3BucketName,
                s3ObjectKey: lexAssetS3Bucket.s3ObjectKey,
            },
            testBotAliasSettings: {
                botAliasLocaleSettings: [
                    {
                        localeId: 'en_US',
                        botAliasLocaleSetting: {
                            enabled: true,
                            codeHookSpecification: {
                                lambdaCodeHook: {
                                    codeHookInterfaceVersion: '1.0',
                                    lambdaArn: this.alias.functionArn,
                                },
                            },
                        },
                    },
                ],
            },
        });

        const botVersion = new CfnBotVersion(
            this,
            `BotVersion-${lexAssetS3Bucket.assetHash}`,
            {
                botId: eddiiChatBot.ref,
                botVersionLocaleSpecification: [
                    {
                        botVersionLocaleDetails: {
                            sourceBotVersion: 'DRAFT',
                        },
                        localeId: 'en_US',
                    },
                ],
            },
        );

        this.botAlias = new CfnBotAlias(this, 'EddiiChatBotProdAlias', {
            botAliasName: 'Prod',
            botId: eddiiChatBot.ref,
            botAliasLocaleSettings: [
                {
                    botAliasLocaleSetting: {
                        enabled: true,
                        codeHookSpecification: {
                            lambdaCodeHook: {
                                codeHookInterfaceVersion: '1.0',
                                lambdaArn: this.alias.functionArn,
                            },
                        },
                    },
                    localeId: 'en_US',
                },
            ],
            botVersion: botVersion.getAtt('BotVersion').toString(),
            conversationLogSettings: {
                textLogSettings: [
                    {
                        enabled: true,
                        destination: {
                            cloudWatch: {
                                cloudWatchLogGroupArn: lexLogGroup.logGroupArn,
                                logPrefix: 'eddiiChatBot',
                            },
                        },
                    },
                ],
            },
            sentimentAnalysisSettings: { DetectSentiment: true },
        });

        this.alias.addPermission('Lex Invocation', {
            principal: new ServicePrincipal('lexv2.amazonaws.com'),
            sourceArn: `arn:aws:lex:${Stack.of(this).region}:${Stack.of(this).account}:bot-alias/${eddiiChatBot.attrId}/*`,
        });
    }


    public getEnvs(): EnvironmentConfig {
        return {
            EDDII_CHAT_BOT_LEX_BOT_ID: this.botAlias.botId,
            EDDII_CHAT_BOT_LEX_BOT_ALIAS_ID: this.botAlias.attrBotAliasId,
        };
    }
}
