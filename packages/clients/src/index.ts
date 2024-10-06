import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { PinpointSMSVoiceV2Client } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { SESClient } from '@aws-sdk/client-ses';
import { KinesisClient } from '@aws-sdk/client-kinesis';
import { RedisClientType, createClient } from 'redis';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { LexRuntimeV2Client } from '@aws-sdk/client-lex-runtime-v2';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import * as LaunchDarkly from '@launchdarkly/node-server-sdk';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const AmazonDaxClient = require('amazon-dax-client');

const AWS_CONFIG = {
    region: process.env['AWS_REGION'] || 'us-east-1',
};

class Clients {
    public readonly dynamo: DynamoDB.DocumentClient;
    public readonly dax: DynamoDB.DocumentClient | undefined;
    public readonly secretsManager: SecretsManagerClient;
    public readonly sns: SNSClient;
    public readonly sqs: SQSClient;
    public readonly pinpoint: PinpointSMSVoiceV2Client;
    public readonly ses: SESClient;
    public readonly kinesis: KinesisClient;
    public readonly cognito: CognitoIdentityProvider;
    public readonly scheduler: SchedulerClient;
    public readonly lex: LexRuntimeV2Client;
    public readonly bedrock: BedrockRuntimeClient;
    private launchDarkly: LaunchDarkly.LDClient | null;
    private _dexcomCache: RedisClientType;

    constructor() {
        this.dynamo = new DynamoDB.DocumentClient(AWS_CONFIG);
        if (process.env['DAX_CLUSTER_ENDPOINT'] !== '') {
            this.dax = new DynamoDB.DocumentClient({
                ...AWS_CONFIG,
                service: new AmazonDaxClient({
                    ...AWS_CONFIG,
                    endpoints: [process.env['DAX_CLUSTER_ENDPOINT']],
                }),
            });
        }
        this.secretsManager = new SecretsManagerClient(AWS_CONFIG);
        this.sns = new SNSClient(AWS_CONFIG);
        this.sqs = new SQSClient(AWS_CONFIG);
        this.pinpoint = new PinpointSMSVoiceV2Client(AWS_CONFIG);
        this.ses = new SESClient(AWS_CONFIG);
        this.kinesis = new KinesisClient(AWS_CONFIG);
        this.cognito = new CognitoIdentityProvider(AWS_CONFIG);
        this.scheduler = new SchedulerClient(AWS_CONFIG);
        this.lex = new LexRuntimeV2Client(AWS_CONFIG);
        this.bedrock = new BedrockRuntimeClient(AWS_CONFIG);
        this._dexcomCache = createClient({
            url: `redis://${process.env['DEXCOM_REDIS_ENDPOINT']}`,
        });
        this.launchDarkly = null;
    }

    public async getDexcomCache(): Promise<RedisClientType> {
        if (!this._dexcomCache.isReady) {
            await this._dexcomCache.connect();
        }
        return this._dexcomCache;
    }

    public async getLaunchDarkly(
        launchDarklySecret?: string,
    ): Promise<LaunchDarkly.LDClient> {
        if (!this.launchDarkly) {
            this.launchDarkly = LaunchDarkly.init(`${launchDarklySecret}`);
        }
        if (!this.launchDarkly.initialized()) {
            await this.launchDarkly.waitForInitialization({
                timeout: 10,
            });
        }

        return this.launchDarkly;
    }
}

export default new Clients();
