import {
    KinesisStreamBatchResponse,
    KinesisStreamEvent,
    SQSEvent,
    ScheduledEvent,
} from 'aws-lambda';
import { handler as saveCgmRecords } from './lib/save-cgm-records';
import { handler as processCgmRecords } from './lib/process-cgm-records';
import { handler as backfillCgmRecords } from './lib/backfill-cgm-records';
import {
    refreshDexcomSessions,
    searchDexcomSessions,
} from './lib/refresh-dexcom-sessions';
// Import the Clients to setup outside of the handler
// eslint-disable-next-line no-unused-vars
import Clients from '@eddii-backend/clients';

export const dexcomSaveCgmRecordsJobHandler = async (
    event: KinesisStreamEvent,
): Promise<KinesisStreamBatchResponse> => {
    if (event.Records[0].eventSource === 'aws:kinesis') {
        return saveCgmRecords(event as KinesisStreamEvent);
    } else {
        throw new Error('Unsupported event source.');
    }
};

export const dexcomProcessCgmRecordsJobHandler = async (
    event: KinesisStreamEvent,
): Promise<KinesisStreamBatchResponse> => {
    if (event.Records[0].eventSource === 'aws:kinesis') {
        return processCgmRecords(event as KinesisStreamEvent);
    } else {
        throw new Error('Unsupported event source.');
    }
};

export const dexcomBackfillCgmRecordsJobHandler = async (
    event: SQSEvent,
): Promise<void> => {
    if ('Records' in event && event.Records[0].eventSource === 'aws:sqs') {
        await backfillCgmRecords(event as SQSEvent);
    } else {
        throw new Error('Unsupported event source.');
    }
};

export const dexcomRefreshJobHandler = async (
    event: ScheduledEvent | SQSEvent,
): Promise<void> => {
    if ('source' in event && event.source === 'aws.events') {
        await searchDexcomSessions();
    } else if (
        'Records' in event &&
        event.Records[0].eventSource === 'aws:sqs'
    ) {
        await refreshDexcomSessions(event as SQSEvent);
    } else {
        throw new Error('Unsupported event source.');
    }
};
