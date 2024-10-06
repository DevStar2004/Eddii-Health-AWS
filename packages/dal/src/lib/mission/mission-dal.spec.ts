import { addMission, addTaskToMission, getMission } from './mission-dal';
import { Mission, Task, TaskLength, TaskType } from './mission-model';
import Clients from '@eddii-backend/clients';

describe('mission-dal', () => {
    const mockMission: Mission = {
        email: 'test@example.com',
        missionAt: '2022-01-01T00:00:00.000Z',
        tasks: [],
    };

    describe('addMission', () => {
        it('should add a mission', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockResolvedValue({});
            await addMission(mockMission);
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if mission is not provided', async () => {
            await expect(
                addMission({ email: '', missionAt: '', tasks: [] }),
            ).rejects.toThrow('Mission is required.');
        });

        it('should throw an error if adding mission fails', async () => {
            const calledSpy = (
                Clients.dynamo.put({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Failed to add mission'));
            await expect(addMission(mockMission)).rejects.toThrow(
                'Error adding mission.',
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('addTaskToMission', () => {
        it('should add a task to a mission', async () => {
            const mockTask: Task = {
                taskType: TaskType.dataEntry,
                amount: 1,
                taskLength: TaskLength.day,
            };
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockResolvedValue({
                Attributes: {
                    email: mockMission.email,
                    missionAt: mockMission.missionAt,
                    tasks: [mockTask],
                },
            });
            const result = await addTaskToMission(
                mockMission.email,
                mockMission.missionAt,
                mockTask,
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0]).toEqual(mockTask);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(
                addTaskToMission('', mockMission.missionAt, {} as Task),
            ).rejects.toThrow('Email is required.');
        });

        it('should throw an error if missionAt is not provided', async () => {
            await expect(
                addTaskToMission(mockMission.email, '', {} as Task),
            ).rejects.toThrow('MissionAt is required.');
        });

        it('should throw an error if task is not provided', async () => {
            await expect(
                addTaskToMission(
                    mockMission.email,
                    mockMission.missionAt,
                    {} as Task,
                ),
            ).rejects.toThrow('Task is required.');
        });

        it('should throw an error if adding task to mission fails', async () => {
            const mockTask: Task = {
                taskType: TaskType.dataEntry,
                amount: 1,
                taskLength: TaskLength.day,
            };
            const calledSpy = (
                Clients.dynamo.update({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Failed to add task to mission'));
            await expect(
                addTaskToMission(
                    mockMission.email,
                    mockMission.missionAt,
                    mockTask,
                ),
            ).rejects.toThrow('Error adding task to mission.');
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('getMission', () => {
        it('should get a mission', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockResolvedValue({ Item: mockMission });
            const result = await getMission(
                mockMission.email,
                mockMission.missionAt,
            );
            expect(calledSpy).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMission);
        });

        it('should throw an error if email is not provided', async () => {
            await expect(getMission('', mockMission.missionAt)).rejects.toThrow(
                'Email is required.',
            );
        });

        it('should throw an error if missionAt is not provided', async () => {
            await expect(getMission(mockMission.email, '')).rejects.toThrow(
                'MissionAt is required.',
            );
        });

        it('should throw an error if getting mission fails', async () => {
            const calledSpy = (
                Clients.dynamo.get({} as any).promise as jest.Mock
            ).mockRejectedValue(new Error('Failed to get mission'));
            await expect(
                getMission(mockMission.email, mockMission.missionAt),
            ).rejects.toThrow('Error getting mission.');
            expect(calledSpy).toHaveBeenCalledTimes(1);
        });
    });
});
