import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { aws_lambda as lambda, Duration } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';

export class UserJobs extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;
    public userDeletionQueue: Queue;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        id: string,
    ) {
        super(scope, id);

        const userDeleteDeadLetterQueue = new Queue(
            this,
            'UserDeletionDeadLetterQueue',
            {
                queueName: `user-deletion-dlq-${config.stage.toString()}`,
            },
        );

        this.userDeletionQueue = new Queue(this, 'UserDeletionQueue', {
            visibilityTimeout: Duration.minutes(10),
            queueName: `user-deletion-${config.stage.toString()}`,
            deadLetterQueue: {
                maxReceiveCount: 3, // Maximum retry this sqs will make inorder to complete this job
                queue: userDeleteDeadLetterQueue,
            },
        });

        this.handler = new lambda.Function(this, 'UserJobsLambda', {
            ...handlerConfigs.networkConfig,
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('../../dist/packages/user-jobs'),
            handler: 'main.handler',
            memorySize: 512,
            timeout: Duration.minutes(5),
            environment: {
                DD_SERVICE: 'user-jobs',
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, 'UserJobsAlias', {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);
        this.alias.role?.addToPrincipalPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ['cognito-idp:*', 'sns:*'],
                resources: ['*'],
            }),
        );

        this.alias.addEventSource(
            new eventSources.SqsEventSource(this.userDeletionQueue, {
                batchSize: 1,
                maxConcurrency: 2,
            }),
        );
    }
}
