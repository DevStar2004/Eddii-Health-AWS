import { Construct } from 'constructs';
import { Duration, aws_lambda as lambda } from 'aws-cdk-lib';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import {
    CfnEventSourceMapping,
    Code,
    EventSourceMapping,
    Runtime,
    StartingPosition,
    Tracing,
} from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { SqsDlq } from 'aws-cdk-lib/aws-lambda-event-sources';
import {
    FilterPattern,
    LogGroup,
    SubscriptionFilter,
} from 'aws-cdk-lib/aws-logs';
import * as destinations from 'aws-cdk-lib/aws-logs-destinations';

export class Device extends Construct {
    public handler: lambda.Function;
    public alias: lambda.Alias;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        handlerConfigs: HandlerConfigs,
        id: string,
    ) {
        super(scope, id);

        this.handler = new lambda.Function(this, 'DeviceLambda', {
            ...handlerConfigs.networkConfig,
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('../../dist/packages/device'),
            handler: 'main.deviceManagementHandler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'device',
            },
            tracing: Tracing.ACTIVE,
        });
        this.alias = new lambda.Alias(this, `DeviceAlias`, {
            aliasName: 'live',
            version: this.handler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(handlerConfigs, this.handler, this.alias);
        this.alias.role?.addToPrincipalPolicy(
            new PolicyStatement({
                actions: [
                    'sns:CreatePlatformEndpoint',
                    'sns:DeleteEndpoint',
                    'sns:Subscribe',
                    'sns:Unsubscribe',
                ],
                resources: ['*'],
            }),
        );

        const deadLetterQueue = new Queue(this, 'DeviceDeadLetterQueue', {
            queueName: `device-dlq-${config.stage.toString()}`,
        });

        handlerConfigs.tableConfig?.streamTables.forEach(table => {
            const sourceMapping = new EventSourceMapping(
                this,
                'DeviceTableEventSourceMapping',
                {
                    startingPosition: StartingPosition.LATEST,
                    target: this.alias,
                    eventSourceArn: table.tableStreamArn,
                    bisectBatchOnError: true,
                    retryAttempts: 10,
                    onFailure: new SqsDlq(deadLetterQueue),
                },
            );
            const cfnSourceMapping = sourceMapping.node
                .defaultChild as CfnEventSourceMapping;

            cfnSourceMapping.addPropertyOverride('FilterCriteria', {
                Filters: [
                    {
                        Pattern: JSON.stringify({
                            eventName: ['REMOVE', 'INSERT'],
                        }),
                    },
                ],
            });
        });

        if (config.snsPlatformApplicationFailureCloudWatchLogArn) {
            new SubscriptionFilter(this, 'DeviceFailureSubscription', {
                logGroup: LogGroup.fromLogGroupArn(
                    this,
                    'DeviceFailureGroup',
                    config.snsPlatformApplicationFailureCloudWatchLogArn,
                ),
                destination: new destinations.LambdaDestination(this.alias),
                filterPattern: FilterPattern.anyTerm('FAILURE'),
            });
        }
    }
}
