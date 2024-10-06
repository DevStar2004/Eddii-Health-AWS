import {
    createPatient,
    getPatient,
    getPatientByPatientId,
} from './patient-dal';
import Clients from '@eddii-backend/clients';

describe('Patient DAL', () => {
    describe('createPatient', () => {
        it('should create a new patient', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await createPatient('newuser@example.com', '1', 'test');
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should throw an error when creating a patient with an existing email', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Error creating patient.'));
            await expect(
                createPatient('newuser@example.com', '1', 'test'),
            ).rejects.toThrow('Error creating patient.');
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('getPatient', () => {
        it('should get an existing patient', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Item: {
                    email: 'newuser@example.com',
                },
            });
            const user = await getPatient('newuser@example.com');
            expect(user).toEqual({
                email: 'newuser@example.com',
            });
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should return undefined getting a non-existent patient', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            const user = await getPatient('nonexistent@example.com');
            expect(user).toEqual(undefined);
            expect(calledSpy).toHaveBeenCalled();
        });
    });

    describe('getPatientByPatientId', () => {
        it('should get a patient by patientId', async () => {
            const patientId = 'patient-123';
            const mockPatient = {
                patientId: patientId,
                email: 'patient@example.com',
                createdAt: '2021-01-01T00:00:00.000Z',
                updatedAt: '2021-01-01T00:00:00.000Z',
            };

            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Items: [mockPatient],
            });

            const patient = await getPatientByPatientId(patientId);
            expect(patient).toEqual(mockPatient);
            expect(calledSpy).toHaveBeenCalled();
        });

        it('should return undefined if patient does not exist', async () => {
            const patientId = 'non-existent-patient';

            const calledSpy = (
                Clients.dynamo.query({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Items: [],
            });

            const patient = await getPatientByPatientId(patientId);
            expect(patient).toBeUndefined();
            expect(calledSpy).toHaveBeenCalled();
        });
    });
});
