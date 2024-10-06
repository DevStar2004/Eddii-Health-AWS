import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    CodeBuildStep,
    CodePipeline,
    CodePipelineSource,
    ManualApprovalStep,
    ShellStep,
} from 'aws-cdk-lib/pipelines';
import { EddiiPipelineStage } from './pipeline-stage';
import { Stage } from '../config';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
    BuildEnvironmentVariableType,
    BuildSpec,
    ComputeType,
    LinuxBuildImage,
} from 'aws-cdk-lib/aws-codebuild';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import {
    DetailType,
    NotificationRule,
} from 'aws-cdk-lib/aws-codestarnotifications';
import { SlackChannelConfiguration } from 'aws-cdk-lib/aws-chatbot';

export class EddiiPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const code = CodePipelineSource.gitHub(
            'eddiihealth/eddii-backend',
            'main',
        );

        const dexcomSecret = new Secret(this, 'DexcomSecret', {
            description: 'Dexcom Secret',
        });
        const userCredentials = new Secret(this, 'UserCredentials', {
            description: 'User credentials for integration tests',
        });

        const appleSecret = new Secret(this, 'AppleSecret', {
            description: 'Apple Secret',
        });
        const googlePrivateKey = new Secret(this, 'GooglePrivateKey', {
            description: 'Google Private Key',
        });

        const target = new SlackChannelConfiguration(this, 'SlackChannel', {
            slackChannelConfigurationName: 'Pipeline',
            slackWorkspaceId: 'TD7P0TC93',
            slackChannelId: 'C05FH5MPNEP',
        });
        target.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['chatbot:*'],
                resources: ['*'],
            }),
        );

        const pipeline = new CodePipeline(this, 'EddiiPipeline', {
            pipelineName: 'EddiiPipeline',
            synth: new ShellStep('Synth', {
                input: code,
                commands: [
                    'node --version',
                    'corepack enable',
                    'yarn set version berry',
                    'yarn install --immutable',
                    'yarn run build-all',
                    'yarn run test-all',
                    'yarn run cdk-synth',
                ],
                primaryOutputDirectory: 'dist/packages/cdk.out',
            }),
            codeBuildDefaults: {
                buildEnvironment: {
                    buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
                    computeType: ComputeType.LARGE,
                },
                partialBuildSpec: BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        install: {
                            'runtime-versions': {
                                nodejs: '18',
                            },
                        },
                    },
                }),
            },
            synthCodeBuildDefaults: {
                buildEnvironment: {
                    buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
                    computeType: ComputeType.LARGE,
                },
                partialBuildSpec: BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        install: {
                            'runtime-versions': {
                                nodejs: '18',
                            },
                        },
                    },
                }),
            },
            crossAccountKeys: true,
            enableKeyRotation: true,
        });

        const sandboxStage = new EddiiPipelineStage(
            this,
            'EddiiSandbox',
            {
                stage: Stage.sandbox,
                snsPlatformApplicationArn:
                    'arn:aws:sns:us-east-1:831897950842:app/GCM/EddiiSandboxNotifications',
                snsPlatformApplicationFailureCloudWatchLogArn:
                    'arn:aws:logs:us-east-1:831897950842:log-group:sns/us-east-1/831897950842/app/GCM/EddiiSandboxNotifications/Failure',
                supportEmail: 'support+sandbox@eddiihealth.com',
                careEmail: 'care+sandbox@eddiihealth.com',
                dataDogSite: 'datadoghq.com',
                pinpointOriginationNumber: '+18447553635',
                dexcomStreamingEnabled: true,
                googleClientId:
                    '407578858584-seh4n4tl5p6f3f4kqekila1ai29bg3k8.apps.googleusercontent.com',
                appleKeyId: '75X32542NR',
            },
            {
                env: {
                    account: '831897950842',
                    region: 'us-east-1',
                },
                stackName: 'EddiiSandbox',
            },
        );
        const sandboxWave = pipeline.addWave('Sandbox');
        sandboxWave.addStage(sandboxStage);
        sandboxWave.addPost(
            new CodeBuildStep('Integration Tests', {
                input: code,
                commands: [
                    'corepack enable',
                    'yarn set version berry',
                    'yarn install --immutable',
                    'yarn run build-all',
                    'yarn run e2e-all',
                ],
                env: {
                    ENV: 'sandbox',
                    AUTHZ_API_ENDPOINT:
                        'https://uibjsfd2j6.execute-api.us-east-1.amazonaws.com/prod',
                    GAME_API_ENDPOINT:
                        'https://rdee58na4e.execute-api.us-east-1.amazonaws.com/prod',
                    SUBSCRIPTION_API_ENDPOINT:
                        'https://kiulfsnvph.execute-api.us-east-1.amazonaws.com/prod',
                    GUARDIAN_API_ENDPOINT:
                        'https://y0muj7gv3h.execute-api.us-east-1.amazonaws.com/prod',
                    STORE_API_ENDPOINT:
                        'https://i3uqjesrki.execute-api.us-east-1.amazonaws.com/prod',
                    USER_API_ENDPOINT:
                        'https://pbs7muzbl4.execute-api.us-east-1.amazonaws.com/prod',
                    CGM_API_ENDPOINT:
                        'https://i9juakk7wk.execute-api.us-east-1.amazonaws.com/prod',
                    CARE_API_ENDPOINT:
                        'https://5d2562pcqc.execute-api.us-east-1.amazonaws.com/prod',
                    BRANCH_API_ENDPOINT:
                        'https://0ygh2tia5j.execute-api.us-east-1.amazonaws.com/prod',
                    HEALTHIE_API_ENDPOINT:
                        'https://kgtha4mk4b.execute-api.us-east-1.amazonaws.com/prod',
                },
                envFromCfnOutputs: {
                    USER_POOL_ID: sandboxStage.userPoolIdCfnOutput,
                    USER_POOL_CLIENT_ID: sandboxStage.userPoolClientIdCfnOutput,
                },
                buildEnvironment: {
                    environmentVariables: {
                        DEXCOM_SECRET: {
                            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                            value: dexcomSecret.secretArn,
                        },
                        USER_CREDENTIALS: {
                            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                            value: userCredentials.secretArn,
                        },
                        APPLE_SHARED_SECRET: {
                            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                            value: appleSecret.secretArn,
                        },
                        GOOGLE_PRIVATE_KEY: {
                            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                            value: googlePrivateKey.secretArn,
                        },
                    },
                },
                rolePolicyStatements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['secretsmanager:GetSecretValue'],
                        resources: [
                            userCredentials.secretArn,
                            dexcomSecret.secretArn,
                            appleSecret.secretArn,
                            googlePrivateKey.secretArn,
                        ],
                    }),
                ],
            }),
        );

        const stagingStage = new EddiiPipelineStage(
            this,
            'EddiiStaging',
            {
                stage: Stage.staging,
                snsPlatformApplicationArn:
                    'arn:aws:sns:us-east-1:062467268133:app/GCM/EddiiStagingNotifications',
                snsPlatformApplicationFailureCloudWatchLogArn:
                    'arn:aws:logs:us-east-1:062467268133:log-group:sns/us-east-1/062467268133/app/GCM/EddiiStagingNotifications/Failure',
                supportEmail: 'support+staging@eddiihealth.com',
                careEmail: 'care+staging@eddiihealth.com',
                dataDogSite: 'datadoghq.com',
                pinpointOriginationNumber: '+18662898025',
                dexcomStreamingEnabled: true,
                googleClientId:
                    '544794113983-23co1fpi8m54urseu38u5qsm2m43qg85.apps.googleusercontent.com',
                appleKeyId: 'S79GCU3FD7',
            },
            {
                env: {
                    account: '062467268133',
                    region: 'us-east-1',
                },
                stackName: 'EddiiStaging',
            },
        );
        const stagingWave = pipeline.addWave('Staging');
        stagingWave.addStage(stagingStage);
        stagingWave.addPost(
            new CodeBuildStep('Integration Tests', {
                input: code,
                commands: [
                    'corepack enable',
                    'yarn set version berry',
                    'yarn install --immutable',
                    'yarn run build-all',
                    'yarn run api-e2e-all',
                ],
                envFromCfnOutputs: {
                    USER_POOL_ID: stagingStage.userPoolIdCfnOutput,
                    USER_POOL_CLIENT_ID: stagingStage.userPoolClientIdCfnOutput,
                },
                env: {
                    ENV: 'staging',
                    AUTHZ_API_ENDPOINT:
                        'https://hs12ls6pic.execute-api.us-east-1.amazonaws.com/prod',
                    GAME_API_ENDPOINT:
                        'https://2gd9xp0rql.execute-api.us-east-1.amazonaws.com/prod',
                    SUBSCRIPTION_API_ENDPOINT:
                        'https://214991vxp6.execute-api.us-east-1.amazonaws.com/prod',
                    GUARDIAN_API_ENDPOINT:
                        'https://43qep5e3m5.execute-api.us-east-1.amazonaws.com/prod',
                    STORE_API_ENDPOINT:
                        'https://66wxz8und8.execute-api.us-east-1.amazonaws.com/prod',
                    USER_API_ENDPOINT:
                        'https://ksu2098p7h.execute-api.us-east-1.amazonaws.com/prod',
                    CGM_API_ENDPOINT:
                        'https://0ye0g1iwue.execute-api.us-east-1.amazonaws.com/prod',
                    CARE_API_ENDPOINT:
                        'https://otl9g3gz4e.execute-api.us-east-1.amazonaws.com/prod',
                    BRANCH_API_ENDPOINT:
                        'https://nbmrn9kpx6.execute-api.us-east-1.amazonaws.com/prod',
                    HEALTHIE_API_ENDPOINT:
                        'https://1sqrrr3lf5.execute-api.us-east-1.amazonaws.com/prod',
                },
                buildEnvironment: {
                    environmentVariables: {
                        USER_CREDENTIALS: {
                            type: BuildEnvironmentVariableType.SECRETS_MANAGER,
                            value: userCredentials.secretArn,
                        },
                    },
                },
                rolePolicyStatements: [
                    new PolicyStatement({
                        effect: Effect.ALLOW,
                        actions: ['secretsmanager:GetSecretValue'],
                        resources: [userCredentials.secretArn],
                    }),
                ],
            }),
        );
        stagingWave.addPost(new ManualApprovalStep('Approve'));

        const prodWave = pipeline.addWave('Prod');
        prodWave.addStage(
            new EddiiPipelineStage(
                this,
                'EddiiProd',
                {
                    stage: Stage.prod,
                    snsPlatformApplicationArn:
                        'arn:aws:sns:us-east-1:035329067410:app/GCM/EddiiProdNotifications',
                    snsPlatformApplicationFailureCloudWatchLogArn:
                        'arn:aws:logs:us-east-1:035329067410:log-group:sns/us-east-1/035329067410/app/GCM/EddiiProdNotifications/Failure',
                    supportEmail: 'support@eddiihealth.com',
                    careEmail: 'care@eddiihealth.com',
                    dataDogSite: 'datadoghq.com',
                    pinpointOriginationNumber: '+18339877121',
                    dexcomStreamingEnabled: true,
                    googleClientId:
                        '183629412611-8mgfecqh3t73c23hiou5970rh63sb4l5.apps.googleusercontent.com',
                    appleKeyId: '6227V2B32L',
                },
                {
                    env: {
                        account: '035329067410',
                        region: 'us-east-1',
                    },
                    stackName: 'EddiiProd',
                },
            ),
        );

        pipeline.buildPipeline();

        new NotificationRule(this, 'Notification', {
            detailType: DetailType.BASIC,
            events: [
                'codepipeline-pipeline-pipeline-execution-started',
                'codepipeline-pipeline-pipeline-execution-failed',
                'codepipeline-pipeline-pipeline-execution-succeeded',
                'codepipeline-pipeline-pipeline-execution-canceled',
            ],
            source: pipeline.pipeline,
            targets: [target],
        });
    }
}
