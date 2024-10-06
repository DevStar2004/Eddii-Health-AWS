import { Construct } from 'constructs';
import { aws_kinesis, aws_lambda as lambda } from 'aws-cdk-lib';
import {
    EddiiBackendConfig,
    HandlerConfigs,
    configureHandler,
} from '../config';
import { Duration } from 'aws-cdk-lib';
import { Code, Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
    KinesisEventSource,
    SqsEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import {
    DeduplicationScope,
    FifoThroughputLimit,
    Queue,
} from 'aws-cdk-lib/aws-sqs';

export class Jobs extends Construct {
    public processCgmHandler?: lambda.Function;
    public processCgmAlias?: lambda.Alias;
    public saveCgmHandler?: lambda.Function;
    public saveCgmAlias?: lambda.Alias;
    public backfillCgmHandler?: lambda.Function;
    public backfillCgmAlias?: lambda.Alias;
    public refreshSessionHandler?: lambda.Function;
    public refreshSessionAlias?: lambda.Alias;

    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        processCgmHandlerConfigs: HandlerConfigs,
        saveCgmHandlerConfigs: HandlerConfigs,
        backfillCgmHandlerConfigs: HandlerConfigs,
        refreshHandlerConfigs: HandlerConfigs,
        cgmDataStream: aws_kinesis.Stream,
        id: string,
    ) {
        super(scope, id);

        this.processCgmHandler = new lambda.Function(this, 'DexcomJobsLambda', {
            ...processCgmHandlerConfigs.networkConfig,
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('../../dist/packages/cgm-jobs'),
            handler: 'main.dexcomProcessCgmRecordsJobHandler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'dexcom-process-cgm',
            },
            tracing: Tracing.ACTIVE,
        });
        this.processCgmAlias = new lambda.Alias(this, 'ProcessCgmAlias', {
            aliasName: 'live',
            version: this.processCgmHandler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(
            {
                ...processCgmHandlerConfigs,
                appPermissions: { sendPush: true, sendVoice: true },
            },
            this.processCgmHandler,
            this.processCgmAlias,
        );

        this.processCgmAlias.addEventSource(
            new KinesisEventSource(cgmDataStream, {
                batchSize: 10,
                reportBatchItemFailures: true,
                startingPosition: lambda.StartingPosition.TRIM_HORIZON,
                bisectBatchOnError: true,
                retryAttempts: 10,
            }),
        );
        cgmDataStream.grantRead(this.processCgmAlias);

        this.saveCgmHandler = new lambda.Function(this, 'DexcomSaveCgmLambda', {
            ...saveCgmHandlerConfigs.networkConfig,
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('../../dist/packages/cgm-jobs'),
            handler: 'main.dexcomSaveCgmRecordsJobHandler',
            memorySize: 512,
            timeout: Duration.seconds(60),
            environment: {
                DD_SERVICE: 'dexcom-save-cgm',
            },
            tracing: Tracing.ACTIVE,
        });
        this.saveCgmAlias = new lambda.Alias(this, 'SaveCgmAlias', {
            aliasName: 'live',
            version: this.saveCgmHandler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(
            saveCgmHandlerConfigs,
            this.saveCgmHandler,
            this.saveCgmAlias,
        );

        this.saveCgmAlias.addEventSource(
            new KinesisEventSource(cgmDataStream, {
                batchSize: 10,
                reportBatchItemFailures: true,
                startingPosition: lambda.StartingPosition.TRIM_HORIZON,
                bisectBatchOnError: true,
                retryAttempts: 10,
            }),
        );
        cgmDataStream.grantRead(this.saveCgmAlias);

        const dexcomBackfillJobsQueue = new Queue(this, 'DexcomBackfillQueue', {
            queueName: `dexcom-backfill-jobs-${config.stage.toString()}.fifo`,
            fifo: true,
            deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
            enforceSSL: true,
            fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
            visibilityTimeout: Duration.minutes(10),
            retentionPeriod: Duration.days(1),
        });

        this.backfillCgmHandler = new lambda.Function(
            this,
            'DexcomBackfillCgmJobLambda',
            {
                ...backfillCgmHandlerConfigs.networkConfig,
                runtime: Runtime.NODEJS_18_X,
                code: Code.fromAsset('../../dist/packages/cgm-jobs'),
                handler: 'main.dexcomBackfillCgmRecordsJobHandler',
                memorySize: 512,
                timeout: Duration.minutes(10),
                environment: {
                    DD_SERVICE: 'dexcom-backfill-cgm',
                },
                tracing: Tracing.ACTIVE,
            },
        );
        this.backfillCgmAlias = new lambda.Alias(this, 'BackfillCgmAlias', {
            aliasName: 'live',
            version: this.backfillCgmHandler.currentVersion,
            provisionedConcurrentExecutions: 1,
        });
        configureHandler(
            backfillCgmHandlerConfigs,
            this.backfillCgmHandler,
            this.backfillCgmAlias,
        );
        const backfillSqsEventSource = new SqsEventSource(
            dexcomBackfillJobsQueue,
            {
                batchSize: 1,
                maxConcurrency: 50,
            },
        );
        this.backfillCgmAlias.addEventSource(backfillSqsEventSource);

        const dexcomRefreshJobsQueue = new Queue(this, 'DexcomRefreshQueue', {
            queueName: `dexcom-refresh-jobs-${config.stage.toString()}.fifo`,
            fifo: true,
            deduplicationScope: DeduplicationScope.MESSAGE_GROUP,
            enforceSSL: true,
            fifoThroughputLimit: FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
            visibilityTimeout: Duration.minutes(5),
            retentionPeriod: Duration.minutes(30),
        });

        this.refreshSessionHandler = new lambda.Function(
            this,
            'DexcomRefreshJobLambda',
            {
                ...refreshHandlerConfigs.networkConfig,
                runtime: Runtime.NODEJS_18_X,
                code: Code.fromAsset('../../dist/packages/cgm-jobs'),
                handler: 'main.dexcomRefreshJobHandler',
                memorySize: 512,
                timeout: Duration.minutes(5),
                environment: {
                    DEXCOM_REFRESH_QUEUE_URL: dexcomRefreshJobsQueue.queueUrl,
                    DD_SERVICE: 'dexcom-refresh',
                },
                tracing: Tracing.ACTIVE,
            },
        );
        this.refreshSessionAlias = new lambda.Alias(
            this,
            'RefreshSessionAlias',
            {
                aliasName: 'live',
                version: this.refreshSessionHandler.currentVersion,
                provisionedConcurrentExecutions: 1,
            },
        );
        configureHandler(
            refreshHandlerConfigs,
            this.refreshSessionHandler,
            this.refreshSessionAlias,
        );
        dexcomRefreshJobsQueue.grantSendMessages(this.refreshSessionAlias);
        const sqsEventSource = new SqsEventSource(dexcomRefreshJobsQueue, {
            batchSize: 10,
        });
        this.refreshSessionAlias.addEventSource(sqsEventSource);

        const rule = new Rule(this, 'DexcomRefreshJobLambdaTrigger', {
            schedule: Schedule.rate(Duration.minutes(30)),
        });
        rule.addTarget(new LambdaFunction(this.refreshSessionAlias));
    }
}
