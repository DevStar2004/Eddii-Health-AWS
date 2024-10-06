import { Request, Response } from 'lambda-api';
import * as dal from '@eddii-backend/dal';
import * as email from '@eddii-backend/email';
import * as notifications from '@eddii-backend/notifications';
import * as utils from '@eddii-backend/utils';
import {
    createFollower,
    acceptFollower,
    listFollowers,
    deleteFollower,
    requestToFollow,
    listFollowing,
    deleteFollowing,
    updateGuardianNotificationSettings,
} from './guardian';

jest.mock('@eddii-backend/dal');
jest.mock('@eddii-backend/email');
jest.mock('@eddii-backend/notifications');
jest.mock('@eddii-backend/utils');

describe('Guardian functions', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRequest = {
            userEmail: 'user@example.com',
            params: {},
            body: {},
        };
        mockResponse = {
            status: statusMock,
            json: jsonMock,
        };
    });

    describe('createFollower', () => {
        it('should create a follower successfully and send email if follower user does not exist', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.createGuardian as jest.Mock).mockResolvedValue({ id: '123' });
            (dal.getUser as jest.Mock)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ nickname: 'User' });
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ id: '123' });
            expect(email.sendGuardianSignUpEmail).toHaveBeenCalledWith(
                'follower@example.com',
            );
        });

        it('should create a follower successfully and send push notification if follower user exists', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.createGuardian as jest.Mock).mockResolvedValue({ id: '123' });
            (dal.getUser as jest.Mock)
                .mockResolvedValueOnce({
                    userTopicArn:
                        'arn:aws:sns:us-east-1:123456789012:app/GCM/MyApplication',
                })
                .mockResolvedValueOnce({ nickname: 'User' });
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ id: '123' });
            expect(
                notifications.publishPushNotificationToUserTopicArn,
            ).toHaveBeenCalled();
        });

        it('should return 400 if max followers limit is reached', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue(
                Array(1000).fill({ userEmail: 'user@example.com' }),
            );
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Follower.',
            });
        });

        it('should return 400 if max following limit is reached', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue(
                Array(1000).fill({ guardianEmail: 'guardian@example.com' }),
            );

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Follower.',
            });
        });

        it('should return 400 if follower email is invalid', async () => {
            mockRequest.params = { followerEmail: 'invalid-email' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                null,
            );

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Valid Follower Email is required.',
            });
        });

        it('should return 400 if follower email is the same as user email', async () => {
            mockRequest.params = { followerEmail: 'user@example.com' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'user@example.com',
            );

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Follower Email cannot be your own email.',
            });
        });

        it('should return 400 if role is invalid', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'invalid-role' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Role value.',
            });
        });

        it('should return 400 if follower already exists', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue({
                id: '123',
            });

            await createFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Already a follower.',
            });
        });
    });

    describe('acceptFollower', () => {
        it('should accept a follower successfully', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.userEmail = 'user@example.com';
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue({
                status: dal.GuardianStatus.pending,
            });
            (dal.updateGuardianStatus as jest.Mock).mockResolvedValue({
                id: '123',
                status: dal.GuardianStatus.active,
            });

            await acceptFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                id: '123',
                status: dal.GuardianStatus.active,
            });
        });

        it('should return 400 if follower email is invalid', async () => {
            mockRequest.params = { followerEmail: 'invalid-email' };
            mockRequest.userEmail = 'user@example.com';
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                null,
            );

            await acceptFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Valid Follower Email is required.',
            });
        });

        it('should return 404 if follower pair does not exist', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.userEmail = 'user@example.com';
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);

            await acceptFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Follower pair does not exist.',
            });
        });

        it('should return 400 if follower is already accepted', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.userEmail = 'user@example.com';
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue({
                status: dal.GuardianStatus.active,
            });

            await acceptFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Follower is already accepted.',
            });
        });
    });

    describe('listFollowers', () => {
        it('should list followers successfully', async () => {
            const mockFollowers = [
                {
                    id: '123',
                    userEmail: 'follower@example.com',
                    guardianEmail: 'guardian@example.com',
                },
            ];
            mockRequest.userEmail = 'user@example.com';
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue(
                mockFollowers,
            );
            (dal.batchGetUserProfiles as jest.Mock).mockResolvedValue([
                { email: 'follower@example.com', name: 'Follower' },
                { email: 'guardian@example.com', name: 'Guardian' },
                { email: 'user@example.com', name: 'User' },
            ]);

            await listFollowers(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: '123',
                        userEmail: 'follower@example.com',
                        guardianEmail: 'guardian@example.com',
                        userProfile: expect.objectContaining({
                            name: 'Follower',
                        }),
                        guardianProfile: expect.objectContaining({
                            name: 'Guardian',
                        }),
                    }),
                ]),
            );
        });

        it('should return an empty array when no followers exist', async () => {
            mockRequest.userEmail = 'user@example.com';
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await listFollowers(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it('should handle null response from listGuardiansForUser', async () => {
            mockRequest.userEmail = 'user@example.com';
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue(null);

            await listFollowers(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(null);
        });

        it('should handle missing user profiles', async () => {
            const mockFollowers = [
                {
                    id: '123',
                    userEmail: 'follower@example.com',
                    guardianEmail: 'guardian@example.com',
                },
            ];
            mockRequest.userEmail = 'user@example.com';
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue(
                mockFollowers,
            );
            (dal.batchGetUserProfiles as jest.Mock).mockResolvedValue([]);

            await listFollowers(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: '123',
                        userEmail: 'follower@example.com',
                        guardianEmail: 'guardian@example.com',
                        userProfile: undefined,
                        guardianProfile: undefined,
                    }),
                ]),
            );
        });
    });

    describe('deleteFollower', () => {
        beforeEach(() => {
            mockRequest.userEmail = 'user@example.com';
            mockRequest.params = { followerEmail: 'follower@example.com' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
        });

        it('should delete a follower successfully', async () => {
            (dal.deleteGuardian as jest.Mock).mockResolvedValue(undefined);

            await deleteFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(dal.deleteGuardian).toHaveBeenCalledWith(
                'follower@example.com',
                'user@example.com',
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Follower deleted.',
            });
        });

        it('should return 400 if follower email is invalid', async () => {
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                null,
            );

            await deleteFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Valid Follower Email is required.',
            });
        });

        it('should return 400 if follower email is the same as user email', async () => {
            mockRequest.params.followerEmail = 'user@example.com';
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'user@example.com',
            );

            await deleteFollower(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Follower Email cannot be your own email.',
            });
        });
    });

    describe('requestToFollow', () => {
        it('should create a following request successfully and send email if follower user does not exist', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.createGuardian as jest.Mock).mockResolvedValue({ id: '123' });
            (dal.getUser as jest.Mock).mockResolvedValue(null);
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ id: '123' });
            expect(email.sendUserForGuardianSignUpEmail).toHaveBeenCalledWith(
                'follower@example.com',
            );
        });

        it('should create a following request successfully and send push notification if follower user exists', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.createGuardian as jest.Mock).mockResolvedValue({ id: '123' });
            (dal.getUser as jest.Mock)
                .mockResolvedValueOnce({
                    userTopicArn:
                        'arn:aws:sns:us-east-1:123456789012:app/GCM/MyApplication',
                })
                .mockResolvedValueOnce({ nickname: 'User' });
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ id: '123' });
            expect(
                notifications.publishPushNotificationToUserTopicArn,
            ).toHaveBeenCalled();
        });

        it('should return 400 if max followers limit is reached', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue(
                Array(1000).fill({ userEmail: 'user@example.com' }),
            );
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue([]);

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Follower.',
            });
        });

        it('should return 400 if max following limit is reached', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue(null);
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);
            (dal.listGuardiansForUser as jest.Mock).mockResolvedValue(
                Array(1000).fill({ guardianEmail: 'guardian@example.com' }),
            );

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Follower.',
            });
        });

        it('should return 400 if follower email is invalid', async () => {
            mockRequest.params = { followerEmail: 'invalid-email' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                null,
            );

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Valid Following Email is required.',
            });
        });

        it('should return 400 if follower email is the same as user email', async () => {
            mockRequest.params = { followerEmail: 'user@example.com' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'user@example.com',
            );

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Following Email cannot be your own email.',
            });
        });

        it('should return 400 if role is invalid', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'invalid-role' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid Role value.',
            });
        });

        it('should return 400 if follower already exists', async () => {
            mockRequest.params = { followerEmail: 'follower@example.com' };
            mockRequest.body = { role: 'follower' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'follower@example.com',
            );
            (dal.getGuardianForUser as jest.Mock).mockResolvedValue({
                id: '123',
            });

            await requestToFollow(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Already following.',
            });
        });
    });

    describe('listFollowing', () => {
        it('should list following successfully', async () => {
            const mockFollowing = [
                {
                    id: '123',
                    userEmail: 'following@example.com',
                    guardianEmail: 'user@example.com',
                },
            ];
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue(
                mockFollowing,
            );
            (dal.batchGetUserProfiles as jest.Mock).mockResolvedValue([
                { email: 'following@example.com', name: 'Following' },
                { email: 'user@example.com', name: 'User' },
            ]);

            await listFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: '123',
                        userEmail: 'following@example.com',
                        guardianEmail: 'user@example.com',
                        userProfile: expect.objectContaining({
                            name: 'Following',
                        }),
                        guardianProfile: expect.objectContaining({
                            name: 'User',
                        }),
                    }),
                ]),
            );
        });

        it('should return an empty array when no following exists', async () => {
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue([]);

            await listFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it('should handle missing user profiles', async () => {
            const mockFollowing = [
                {
                    id: '123',
                    userEmail: 'following@example.com',
                    guardianEmail: 'user@example.com',
                },
            ];
            (dal.listUsersForGuardian as jest.Mock).mockResolvedValue(
                mockFollowing,
            );
            (dal.batchGetUserProfiles as jest.Mock).mockResolvedValue([]);

            await listFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: '123',
                        userEmail: 'following@example.com',
                        guardianEmail: 'user@example.com',
                        userProfile: undefined,
                        guardianProfile: undefined,
                    }),
                ]),
            );
        });
    });

    describe('deleteFollowing', () => {
        it('should delete following successfully', async () => {
            mockRequest.params = { followingEmail: 'following@example.com' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'following@example.com',
            );
            (dal.deleteGuardian as jest.Mock).mockResolvedValue(undefined);

            await deleteFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Following deleted.',
            });
        });

        it('should return 400 if followingEmail is missing', async () => {
            mockRequest.params = {};
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                null,
            );

            await deleteFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Valid Following Email is required.',
            });
        });

        it('should return 400 if followingEmail is the same as userEmail', async () => {
            mockRequest.params = { followingEmail: 'user@example.com' };
            (utils.validateAndNormalizeEmail as jest.Mock).mockReturnValue(
                'user@example.com',
            );

            await deleteFollowing(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Following Email cannot be your own email.',
            });
        });
    });

    describe('updateGuardianNotificationSettings', () => {
        it('should update guardian notification settings successfully', async () => {
            mockRequest.guardianEmail = 'guardian@example.com';
            mockRequest.userEmail = 'user@example.com';
            mockRequest.body = {
                lowGlucoseAlertThreshold: 70,
                highGlucoseAlertThreshold: 180,
            };
            (dal.isGuardianForUser as jest.Mock).mockResolvedValue(true);
            (
                dal.updateGuardianNotificationSettings as jest.Mock
            ).mockResolvedValue({
                id: '123',
                lowGlucoseAlertThreshold: 70,
                highGlucoseAlertThreshold: 180,
            });

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                id: '123',
                lowGlucoseAlertThreshold: 70,
                highGlucoseAlertThreshold: 180,
            });
        });

        it('should return 400 if body is missing', async () => {
            mockRequest.body = undefined;

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Missing body.' });
        });

        it('should return 400 if lowGlucoseAlertThreshold is invalid', async () => {
            mockRequest.body = { lowGlucoseAlertThreshold: -1 };

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid lowGlucoseAlertThreshold value.',
            });
        });

        it('should return 400 if lowGlucoseAlertThreshold is greater than 80', async () => {
            mockRequest.body = { lowGlucoseAlertThreshold: 81 };

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Low Glucose Alert must be <=80.',
            });
        });

        it('should return 400 if highGlucoseAlertThreshold is invalid', async () => {
            mockRequest.body = { highGlucoseAlertThreshold: -1 };

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Invalid highGlucoseAlertThreshold value.',
            });
        });

        it('should return 400 if highGlucoseAlertThreshold is less than 120', async () => {
            mockRequest.body = { highGlucoseAlertThreshold: 119 };

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'High Glucose Alert must be >=120.',
            });
        });

        it('should return 404 if guardian pair does not exist', async () => {
            mockRequest.guardianEmail = 'guardian@example.com';
            mockRequest.userEmail = 'user@example.com';
            mockRequest.body = {
                lowGlucoseAlertThreshold: 70,
                highGlucoseAlertThreshold: 180,
            };
            (dal.isGuardianForUser as jest.Mock).mockResolvedValue(false);

            await updateGuardianNotificationSettings(
                mockRequest as Request,
                mockResponse as Response,
            );

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Guardian pair does not exist.',
            });
        });
    });
});
