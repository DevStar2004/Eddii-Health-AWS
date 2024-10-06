import { Construct } from 'constructs';
import { EddiiBackendConfig, EnvironmentConfig } from '../config';
import { RemovalPolicy, Duration, aws_kinesis } from 'aws-cdk-lib';

export class Streams extends Construct {
    public cgmDataStream: aws_kinesis.Stream;

    constructor(scope: Construct, config: EddiiBackendConfig, id: string) {
        super(scope, id);

        // Create a Kinesis Data Stream
        this.cgmDataStream = new aws_kinesis.Stream(this, 'CgmDataStream', {
            streamName: `cgm-data-stream-${config.stage.toString()}`,
            encryption: aws_kinesis.StreamEncryption.MANAGED,
            streamMode: aws_kinesis.StreamMode.ON_DEMAND,
            retentionPeriod: Duration.days(30),
            removalPolicy:
                config.stage === 'dev'
                    ? RemovalPolicy.DESTROY
                    : RemovalPolicy.RETAIN,
        });
    }

    public getEnvs(): EnvironmentConfig {
        return {
            CGM_DATA_STREAM_ARN: this.cgmDataStream.streamArn,
        };
    }
}
