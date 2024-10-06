import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import {
    AccessLogField,
    AccessLogFormat,
    LambdaRestApi,
    LogGroupLogDestination,
} from 'aws-cdk-lib/aws-apigateway';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
    AnyPrincipal,
    Effect,
    PolicyDocument,
    PolicyStatement,
} from 'aws-cdk-lib/aws-iam';

export class HealthieApi extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public endpoint: LambdaRestApi;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        schedulerRoleArn: string,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'HealthieAPILambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/healthie-api'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'healthie',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `HealthieAPIAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(
            {
                ...handlerConfigs,
                appPermissions: { sendPush: true, sendEmail: true },
            },
            this.handler,
            this.alias,
        );
        this.alias.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    'scheduler:CreateSchedule',
                    'scheduler:DeleteSchedule',
                ],
                resources: ['*'],
            }),
        );
        this.alias.addToRolePolicy(
            new PolicyStatement({
                actions: ['iam:PassRole'],
                resources: [schedulerRoleArn],
            }),
        );

        const healthieAllowList = new PolicyDocument({
            statements: [
                new PolicyStatement({
                    actions: ['execute-api:Invoke'],
                    principals: [new AnyPrincipal()],
                    resources: ['execute-api:/*/*/*'],
                }),
                new PolicyStatement({
                    effect: Effect.DENY,
                    principals: [new AnyPrincipal()],
                    actions: ['execute-api:Invoke'],
                    resources: ['execute-api:/*/*/*'],
                    conditions: {
                        NotIpAddress: {
                            'aws:SourceIp':
                                config.stage === 'prod' ||
                                config.stage === 'staging'
                                    ? ['52.4.158.130', '3.216.152.234']
                                    : ['18.206.70.225', '44.195.8.253'],
                        },
                    },
                }),
            ],
        });

        this.endpoint = new LambdaRestApi(this, 'HealthieAPI', {
            restApiName: `healthie-api-${config.stage.toString()}`,
            handler: this.alias,
            policy: healthieAllowList,
            defaultMethodOptions: {
                apiKeyRequired: false,
            },
            deployOptions: {
                tracingEnabled: true,
                metricsEnabled: true,
                accessLogDestination: new LogGroupLogDestination(
                    new LogGroup(this, 'ApiLogGroup'),
                ),
                accessLogFormat: AccessLogFormat.custom(
                    JSON.stringify({
                        requestId: AccessLogField.contextRequestId(),
                        sourceIp: AccessLogField.contextIdentitySourceIp(),
                        method: AccessLogField.contextHttpMethod(),
                        requestTime: AccessLogField.contextRequestTime(),
                        resourcePath: AccessLogField.contextResourcePath(),
                        status: AccessLogField.contextStatus(),
                        userContext: {
                            sub: AccessLogField.contextAuthorizerClaims('sub'),
                            email: AccessLogField.contextAuthorizerClaims(
                                'email',
                            ),
                        },
                    }),
                ),
                dataTraceEnabled: config.stage !== 'prod',
                throttlingRateLimit: 250,
                throttlingBurstLimit: 500,
            },
        });
    }
}
