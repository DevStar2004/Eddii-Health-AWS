export interface Device {
    email: string;
    deviceToken: string;
    deviceType: string;
    platformEndpointArn?: string;
    userTopicSubscriptionArn?: string;
    sub?: string;
    expiresAt?: number;
}
