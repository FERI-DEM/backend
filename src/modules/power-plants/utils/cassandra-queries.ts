import { Client } from 'cassandra-driver';

// TODO: when writing to cassandra?

export interface HistoricalData {
  powerPlantId: string;
  power: number;
  solar: number;
  predictedPower: number;
  timestamp: string;
}

export const getHistoricalDataById = async (
  client: Client,
  powerPlantId: string,
): Promise<HistoricalData[]> => {
  const { rows, rowLength } = await client.execute(
    'SELECT * FROM power_plants WHERE power_plant_id = ? LIMIT 30 ALLOW FILTERING ',
    [powerPlantId],
  );

  if (rowLength === 0) {
    return [];
  }

  return rows.map((row) => ({
    powerPlantId: row.get('power_plant_id'),
    power: Number(row.get('power')),
    solar: Number(row.get('solar')),
    predictedPower: Number(row.get('predicted_power')),
    timestamp: row.get('timestamp'),
  }));
};
