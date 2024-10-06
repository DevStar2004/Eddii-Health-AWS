import {
    aws_lambda as lambda,
    aws_kinesis,
    aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

/* eslint-disable no-unused-vars */
export enum Stage {
    dev = 'dev',
    sandbox = 'sandbox',
    staging = 'staging',
    prod = 'prod',
}

export interface EddiiBackendConfig {
    stage: Stage;
    snsPlatformApplicationArn?: string;
    snsPlatformApplicationFailureCloudWatchLogArn?: string;
    supportEmail?: string;
    careEmail?: string;
    dataDogSite?: string;
    name?: string;
    pinpointOriginationNumber?: string;
    dexcomStreamingEnabled?: boolean;
    googleClientId?: string;
    appleKeyId?: string;
}

export interface AppPermissions {
    sendEmail?: boolean;
    sendPush?: boolean;
    sendVoice?: boolean;
}

export interface HandlerConfigs {
    networkConfig: NetworkConfig;
    tableConfig?: TableConfig;
    streamConfig?: StreamConfig;
    secretConfig?: SecretConfig;
    envConfig?: EnvironmentConfig;
    appPermissions?: AppPermissions;
}

export interface EnvironmentConfig {
    [key: string]: string;
}

export const configureHandler = (
    configs: HandlerConfigs,
    handler: lambda.Function,
    alias: lambda.Alias,
) => {
    // Grant DAX Access.
    alias.role?.addToPrincipalPolicy(
        new PolicyStatement({
            actions: ['dax:*'],
            resources: ['*'],
        }),
    );
    if (configs.tableConfig) {
        grantTableAccess(configs.tableConfig, alias);
    }
    if (configs.streamConfig) {
        grantStreamAccess(configs.streamConfig, alias);
    }
    if (configs.secretConfig) {
        grantSecretAccess(configs.secretConfig, alias);
    }
    if (configs.envConfig) {
        for (const key in configs.envConfig) {
            handler.addEnvironment(key, configs.envConfig[key]);
        }
    }
    if (configs.appPermissions?.sendEmail) {
        alias.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    'ses:SendEmail',
                    'ses:SendRawEmail',
                    'ses:SendTemplatedEmail',
                ],
                resources: ['*'],
            }),
        );
    }
    if (configs.appPermissions?.sendPush) {
        alias.addToRolePolicy(
            new PolicyStatement({
                actions: ['sns:Publish'],
                resources: ['*'],
            }),
        );
    }
    if (configs.appPermissions?.sendVoice) {
        alias.addToRolePolicy(
            new PolicyStatement({
                actions: ['sms-voice:SendVoiceMessage'],
                resources: ['*'],
            }),
        );
    }
};

interface TableConfig {
    readOnlyTables?: dynamodb.Table[];
    readWriteTables?: dynamodb.Table[];
    streamTables?: dynamodb.Table[];
}

const grantTableAccess = (tableConfig: TableConfig, alias: lambda.Alias) => {
    tableConfig.readOnlyTables?.forEach(table => table.grantReadData(alias));
    tableConfig.readWriteTables?.forEach(table =>
        table.grantReadWriteData(alias),
    );
    tableConfig.streamTables?.forEach(table => table.grantStreamRead(alias));
};

interface StreamConfig {
    readOnlyStreams?: aws_kinesis.Stream[];
    writeOnlyStreams?: aws_kinesis.Stream[];
}

const grantStreamAccess = (streamConfig: StreamConfig, alias: lambda.Alias) => {
    streamConfig.readOnlyStreams?.forEach(stream => stream.grantRead(alias));
    streamConfig.writeOnlyStreams?.forEach(stream => stream.grantWrite(alias));
};

interface SecretConfig {
    readOnlySecrets?: Secret[];
}

const grantSecretAccess = (secretConfig: SecretConfig, alias: lambda.Alias) => {
    secretConfig.readOnlySecrets?.forEach(secret => secret.grantRead(alias));
};

interface NetworkConfig {
    vpc: Vpc;
    securityGroups: SecurityGroup[];
}

export const getCorsDomains = (config: EddiiBackendConfig): string[] => {
    const domains = [];
    if (config.stage === 'dev') {
        domains.push('http://localhost:3000');
        domains.push('https://dev.eddii.app');
        domains.push('https://dev.eddii.care');
    } else if (config.stage === 'sandbox') {
        domains.push('http://localhost:3000');
        domains.push('https://sandbox.eddii.app');
        domains.push('https://sandbox.eddii.care');
    } else if (config.stage === 'staging') {
        domains.push('http://localhost:3000');
        domains.push('https://staging.eddii.app');
        domains.push('https://staging.eddii.care');
    } else if (config.stage === 'prod') {
        domains.push('https://eddii.app');
        domains.push('https://www.eddii.app');
        domains.push('https://eddii.care');
        domains.push('https://www.eddii.care');
    }
    return domains;
};
