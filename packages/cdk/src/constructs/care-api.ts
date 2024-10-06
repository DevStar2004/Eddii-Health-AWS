import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import {
    AccessLogField,
    AccessLogFormat,
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    Cors,
    LambdaRestApi,
    LogGroupLogDestination,
} from 'aws-cdk-lib/aws-apigateway';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
    getCorsDomains,
} from '../config';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class CareApi extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public endpoint: LambdaRestApi;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        userPool: UserPool,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'CareAPILambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/care-api'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'care',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `CareAPIAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);

        const authorizer = new CognitoUserPoolsAuthorizer(this, 'Authorizer', {
            cognitoUserPools: [userPool],
        });

        this.endpoint = new LambdaRestApi(this, 'CareAPI', {
            restApiName: `care-api-${config.stage.toString()}`,
            handler: this.alias,
            defaultMethodOptions: {
                apiKeyRequired: false,
                authorizationType: AuthorizationType.COGNITO,
                authorizer,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: getCorsDomains(config),
                allowHeaders: [
                    ...Cors.DEFAULT_HEADERS,
                    'app-version',
                    'platform',
                ],
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
