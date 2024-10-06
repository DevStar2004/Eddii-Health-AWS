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

export class MixpanelApi extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public endpoint: LambdaRestApi;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'MixpanelAPILambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/mixpanel-api'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.minutes(5),
            environment: {
                DD_SERVICE: 'mixpanel',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, 'MixpanelAPIAlias', {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);

        this.endpoint = new LambdaRestApi(this, 'MixpanelAPI', {
            restApiName: `mixpanel-api-${config.stage.toString()}`,
            handler: this.alias,
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
