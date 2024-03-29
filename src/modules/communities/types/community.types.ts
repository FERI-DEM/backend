export interface Community {
  id: string;
  name: string;
  adminId: string;
  powerPlantIds: string[];
  members: {
    userId: string;
    powerPlantId: string;
    powerPlantName: string;
    userName: string;
    isAdmin: boolean;
    calibration: {
      date: string;
      value: number;
    };
  }[];
}
