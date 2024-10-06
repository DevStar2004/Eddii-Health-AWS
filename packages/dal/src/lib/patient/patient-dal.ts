import { getDynamoClient } from '../../aws';
import { Patient } from './patient-model';

export const createPatient = async (
    email: string,
    patientId: string,
    healthieApiKey?: string,
): Promise<Patient> => {
    console.log(
        `Creating new patient for email: ${email} and patientId: ${patientId}`,
    );

    const ddbDocClient = getDynamoClient();

    const now = new Date().toISOString();
    const patientModel: Patient = {
        email: email,
        patientId: patientId,
        createdAt: now,
        updatedAt: now,
        ...(healthieApiKey && { healthieApiKey: healthieApiKey }),
    };
    const params = {
        TableName: process.env['PATIENT_TABLE_NAME'] as string,
        Item: patientModel,
    };

    try {
        await ddbDocClient.put(params).promise();
        return patientModel;
    } catch (e) {
        console.error(
            `Failed to create patient with parameters: ${JSON.stringify(
                patientModel,
            )}`,
            e,
        );
        throw new Error('Error creating patient.');
    }
};

export const getPatient = async (
    email: string,
): Promise<Patient | undefined> => {
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['PATIENT_TABLE_NAME'] as string,
        Key: {
            email: email,
        },
    };

    const result = await ddbDocClient.get(params).promise();
    if (!result.Item) {
        return undefined;
    }
    return result.Item as Patient;
};

export const getPatientByPatientId = async (
    patientId: string,
): Promise<Patient | undefined> => {
    const ddbDocClient = getDynamoClient();

    const params = {
        TableName: process.env['PATIENT_TABLE_NAME'] as string,
        IndexName: 'patientIdIndex',
        KeyConditionExpression: 'patientId = :patientId',
        ExpressionAttributeValues: {
            ':patientId': patientId,
        },
    };

    const result = await ddbDocClient.query(params).promise();
    if (!result.Items || result.Items.length === 0) {
        return undefined;
    }
    return result.Items[0] as Patient;
};
