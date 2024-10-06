import { Construct } from 'constructs';
import { Datadog } from 'datadog-cdk-constructs-v2';
import { EddiiBackendConfig } from '../config';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { aws_lambda as lambda } from 'aws-cdk-lib';

export class DataDog extends Construct {
    constructor(
        scope: Construct,
        config: EddiiBackendConfig,
        lambdas: lambda.Function[],
        id: string,
    ) {
        super(scope, id);

        if (config.dataDogSite) {
            const datadogApiKey = new Secret(this, 'ApiKey', {
                description: 'DataDog Api Key',
                secretName: `DataDog/${config.stage}`,
            });

            const datadog = new Datadog(this, 'Datadog', {
                addLayers: true,
                nodeLayerVersion: 113,
                extensionLayerVersion: 60,
                site: config.dataDogSite,
                apiKeySecret: datadogApiKey,
                enableDatadogTracing: true,
                enableMergeXrayTraces: true,
                enableDatadogLogs: true,
                sourceCodeIntegration: true,
                injectLogContext: true,
                env: config.stage,
                enableColdStartTracing: true,
                enableProfiling: true,
                encodeAuthorizerContext: true,
                decodeAuthorizerContext: true,
            });
            datadog.addLambdaFunctions(lambdas);
        }
    }
}
