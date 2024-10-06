export enum GuardianRole {
    guardian = 'guardian',
    follower = 'follower',
}

export enum GuardianStatus {
    active = 'active',
    pending = 'pending',
}

export interface Guardian {
    guardianEmail: string;
    userEmail: string;
    role?: GuardianRole;
    status?: GuardianStatus;
    lowGlucoseAlertThreshold?: number;
    highGlucoseAlertThreshold?: number;
    createdAt?: string;
    updatedAt?: string;
}
