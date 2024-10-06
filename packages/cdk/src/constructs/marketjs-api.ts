import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import {
    AccessLogField,
    AccessLogFormat,
    ApiKey,
    LambdaRestApi,
    LogGroupLogDestination,
    UsagePlan,
} from 'aws-cdk-lib/aws-apigateway';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class MarketJsApi extends Construct {
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

        this.handler = new lambda.Function(this, 'MarketJsAPILambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/marketjs-api'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'marketjs',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `MarketJsAPIAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);

        this.endpoint = new LambdaRestApi(this, 'MarketJsAPI', {
            restApiName: `marketjs-api-${config.stage.toString()}`,
            handler: this.alias,
            defaultMethodOptions: {
                apiKeyRequired: true,
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

        // Create API Key
        const apiKey = new ApiKey(this, 'MarketJsApiKey', {
            apiKeyName: `marketjs-api-key-${config.stage}`,
            description: `API Key for MarketJS API (${config.stage})`,
        });

        // Create Usage Plan
        const usagePlan = new UsagePlan(this, 'MarketJsUsagePlan', {
            name: `marketjs-usage-plan-${config.stage}`,
            apiStages: [
                {
                    api: this.endpoint,
                    stage: this.endpoint.deploymentStage,
                },
            ],
        });

        // Associate API Key with Usage Plan
        usagePlan.addApiKey(apiKey);
    }
}
