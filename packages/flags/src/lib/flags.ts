export const getFeatureFlagBool = async (
    email: string,
    featureFlag: string,
    defaultFlagValue: boolean,
): Promise<boolean> => {
    return defaultFlagValue;
};
