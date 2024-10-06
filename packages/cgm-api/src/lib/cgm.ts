import { Request, Response } from 'lambda-api';
import { EgvsRecord, EgvsRecords } from '@eddii-backend/types';
import Clients from '@eddii-backend/clients';
import {
    PutRecordCommand,
    PutRecordCommandInput,
} from '@aws-sdk/client-kinesis';

const writeToCgmStream = async (payload: {
    cgmType: string;
    userId: string;
    record: EgvsRecord;
}): Promise<void> => {
    const params: PutRecordCommandInput = {
        StreamARN: process.env['CGM_DATA_STREAM_ARN'],
        Data: Buffer.from(JSON.stringify(payload)),
        PartitionKey: payload.userId,
    };
    try {
        const data = await Clients.kinesis.send(new PutRecordCommand(params));
        console.log('Successfully wrote to Kinesis Data Stream:', data);
    } catch (err) {
        console.error('Error writing to Kinesis Data Stream:', err);
    }
};

export const writeCgmRecord = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const cgmType = request.params.cgmType;
    if (!cgmType) {
        response.status(400).json({ message: 'CGM Type is required.' });
        return;
    }
    if (cgmType !== 'dexcom') {
        response.status(400).json({ message: `Invalid CGM Type ${cgmType}.` });
        return;
    }
    const body = request.body;
    if (!body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const records = body as EgvsRecords;
    if (!records?.records || records.records.length === 0) {
        console.warn('No records found.');
        response.status(200).json({ message: 'OK' });
        return;
    }
    try {
        for (const record of records.records) {
            await writeToCgmStream({
                cgmType: cgmType,
                userId: records.userId,
                record: record,
            });
        }
        response.status(200).json({ message: 'OK' });
        return;
    } catch (err) {
        console.error('Failed to process record.', err);
        response.status(500).json({ message: 'Failed to process record.' });
        return;
    }
};
