import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import {
    AccessLogField,
    AccessLogFormat,
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    LambdaRestApi,
    LogGroupLogDestination,
} from 'aws-cdk-lib/aws-apigateway';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class CgmApi extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public endpoint: LambdaRestApi;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        cgmPool: UserPool,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'CgmAPILambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/cgm-api'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'cgm',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `CgmAPIAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);

        const authorizer = new CognitoUserPoolsAuthorizer(this, 'Authorizer', {
            cognitoUserPools: [cgmPool],
        });

        this.endpoint = new LambdaRestApi(this, 'CgmAPI', {
            restApiName: `cgm-api-${config.stage.toString()}`,
            handler: this.alias,
            defaultMethodOptions: {
                apiKeyRequired: false,
                authorizationType: AuthorizationType.COGNITO,
                authorizationScopes: ['cgm-resource-server/cgm.write'],
                authorizer,
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
                throttlingRateLimit: 500,
                throttlingBurstLimit: 1000,
            },
        });
    }
}
