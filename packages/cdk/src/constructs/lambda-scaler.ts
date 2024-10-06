import { Construct } from 'constructs';
import { EddiiBackendConfig } from '../config';
import { Duration } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-applicationautoscaling';

export class LambdaScaler extends Construct {
    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        lambdasAlias: lambda.Alias[],
        id: string,
    ) {
        super(scope, id);
        // Assert that the number of lambdas is <= 36
        if (lambdasAlias.length > 36) {
            throw new Error(
                `Number of lambdas (${lambdasAlias.length}) exceeds the maximum allowed (36)`,
            );
        }
        // Add provisioned concurrency and scaling for all lambdas
        if (config.stage !== 'dev') {
            lambdasAlias.forEach(lambdasAlias => {
                const scalableTarget = lambdasAlias.addAutoScaling({
                    minCapacity: 1,
                    maxCapacity: config.stage === 'prod' ? 25 : 5,
                });

                scalableTarget.scaleOnUtilization({
                    utilizationTarget: 0.7,
                    scaleInCooldown: Duration.seconds(60),
                    scaleOutCooldown: Duration.seconds(60),
                });

                scalableTarget.scaleOnSchedule('ScaleUpInMorning', {
                    schedule: Schedule.cron({ hour: '12', minute: '0' }),
                    minCapacity: config.stage === 'prod' ? 10 : 2,
                });

                scalableTarget.scaleOnSchedule('ScaleDownAtNight', {
                    schedule: Schedule.cron({ hour: '2', minute: '0' }),
                    maxCapacity: config.stage === 'prod' ? 5 : 1,
                });
            });
        }
    }
}
