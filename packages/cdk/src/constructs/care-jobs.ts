import { Construct } from 'constructs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class CareJobs extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public schedulerRole: Role;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        id: string,
    ) {
        super(scope, id);

        this.schedulerRole = new Role(this, 'CareJobsSchedulerRole', {
            assumedBy: new ServicePrincipal('scheduler.amazonaws.com'),
        });

        this.handler = new lambda.Function(this, 'CareJobsLambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/care-jobs'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'care-jobs',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `CareJobsAlias`, {
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
        this.alias.grantInvoke(this.schedulerRole);
    }
}
