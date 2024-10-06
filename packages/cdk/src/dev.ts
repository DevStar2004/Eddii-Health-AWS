import { App } from 'aws-cdk-lib';
import { EddiiBackendStack } from './stacks/app-stack';
import { Stage } from './config';

const app = new App();

// Pratik's Dev Stack
new EddiiBackendStack(
    app,
    'EddiiBackendDevPratik',
    {
        stage: Stage.dev,
        snsPlatformApplicationArn:
            'arn:aws:sns:us-east-1:478365881407:app/GCM/PratikTest',
        snsPlatformApplicationFailureCloudWatchLogArn:
            'arn:aws:logs:us-east-1:478365881407:log-group:sns/us-east-1/478365881407/app/GCM/PratikTest/Failure',
        name: 'pratik',
        pinpointOriginationNumber: '+18339876951',
        googleClientId:
            '1089191359014-9e1fk6u6h627gm2rvt97m5fjq0hs3rip.apps.googleusercontent.com',
        appleKeyId: 'ZTQ8P4Y99F',
    },
    {
        env: {
            account: '478365881407',
            region: 'us-east-1',
        },
    },
);

new EddiiBackendStack(
    app,
    'EddiiBackendDevSalman',
    {
        stage: Stage.dev,
        name: 'pod1',
    },
    {
        env: {
            account: '058264415264',
            region: 'us-east-1',
        },
    },
);

new EddiiBackendStack(
    app,
    'EddiiBackendDevChen',
    {
        stage: Stage.dev,
        name: 'chen',
    },
    {
        env: {
            account: '207567771147',
            region: 'us-east-1',
        },
    },
);
