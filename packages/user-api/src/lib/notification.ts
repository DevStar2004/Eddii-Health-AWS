import { getDailyNotifications as getDailyNotificationsCall } from '@eddii-backend/notifications';
import { Request, Response } from 'lambda-api';

export const getDailyNotifications = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const notifications = getDailyNotificationsCall();
    response.status(200).json(notifications);
};
