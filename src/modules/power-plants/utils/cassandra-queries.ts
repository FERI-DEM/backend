import { Client } from 'cassandra-driver';

// TODO: when writing to cassandra?
// Timestamp unix
export interface HistoricalData {
  powerPlantId: string;
  power: number;
  solar: number;
  predictedPower: number;
  timestamp: number;
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

  return rows
    .map((row) => ({
      powerPlantId: row.get('power_plant_id'),
      power: Number(row.get('power')),
      solar: Number(row.get('solar')),
      predictedPower: Number(row.get('predicted_power')),
      timestamp: row.get('timestamp'),
    }))
    .sort((a, b) => {
      if (a.timestamp < b.timestamp) {
        return -1;
      }
      if (a.timestamp > b.timestamp) {
        return 1;
      }
      return 0;
    });
};

export const insertHistoricPowerPlantData = async (
  client: Client,
  data: HistoricalData[],
) => {
  try {
    const BATCH_SIZE = 4_000;
    let batchCount = 1;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      console.log(
        `Inserting batch ${batchCount++}/${Math.ceil(
          data.length / BATCH_SIZE,
        )}`,
      );
      const batch = data.slice(i, i + BATCH_SIZE);
      const queries = batch.map((item) => ({
        query: `INSERT INTO power_plants (id, power_plant_id, power, solar, predicted_power, timestamp)
                VALUES (uuid(), ?, ?, ?, ?, ?)`,
        params: [
          item.powerPlantId,
          item.power,
          item.solar,
          item.predictedPower,
          item.timestamp,
        ],
      }));
      await client.batch(queries, { prepare: true });
    }
  } catch (e) {
    console.log(e);
  }
};
