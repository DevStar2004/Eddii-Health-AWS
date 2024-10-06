export interface EgvsRecord {
    recordId: string;
    systemTime: string;
    displayTime: string;
    transmitterId?: string;
    transmitterTicks: number;
    value?: number;
    status?: string;
    trend?: string;
    trendRate?: number;
    unit: string;
    rateUnit: string;
    displayDevice: string;
    transmitterGeneration: string;
}

export interface EgvsRecords {
    recordType: string;
    recordVersion: string;
    userId: string;
    records: EgvsRecord[];
}

export interface AlertSettings {
    alertName: string;
    value?: number;
    unit?: string;
    snooze?: number;
    enabled: boolean;
    systemTime?: string;
    displayTime?: string;
    delay?: number;
    secondaryTriggerCondition?: number;
    soundTheme?: string;
    soundOutputMode?: string;
}

export interface AlertSchedule {
    alertSettings: AlertSettings[];
}

export interface DeviceRecord {
    lastUploadDate: string;
    transmitterId?: string;
    transmitterGeneration: string;
    displayDevice: string;
    displayApp?: string;
    alertSchedules: AlertSchedule[];
}

export interface DeviceRecords {
    recordType: string;
    recordVersion: string;
    userId: string;
    records: DeviceRecord[];
}

export interface StreamingState {
    active: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
}
