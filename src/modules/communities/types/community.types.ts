export interface Community {
  id: string;
  name: string;
  members: {
    userId: string;
    powerPlantId: string;
    powerPlantName: string;
    userName: string;
  };
}
