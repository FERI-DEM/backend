import { Client } from 'cassandra-driver';

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
  greaterThanTimestamp: number,
  lowerThanTimestamp: number,
): Promise<HistoricalData[]> => {
  const { rows, rowLength } = await client.execute(
    `SELECT *
       FROM power_plants
       WHERE power_plant_id = ?
         AND timestamp >= ?
         AND timestamp <= ?
           ALLOW FILTERING;`,
    [powerPlantId, greaterThanTimestamp, lowerThanTimestamp],
    {
      prepare: true,
    },
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
      timestamp: Number(row.get('timestamp')),
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

export const getHistoricalData = async (
  client: Client,
  powerPlantIds: string[],
  dateFrom: Date,
  dateTo: Date,
): Promise<HistoricalData[]> => {
  const result = await client.execute(
    `
        SELECT *
        FROM power_plants
        WHERE power_plant_id IN (${powerPlantIds.map((x) => '?').join(', ')})
          AND timestamp >= ?
          AND timestamp <= ?
    `,
    [...powerPlantIds, dateFrom.getTime(), dateTo.getTime()],
    { prepare: true },
  );

  const rows = [];
  for await (const row of result) {
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  return rows
    .map((row) => ({
      powerPlantId: row.get('power_plant_id'),
      power: Number(row.get('power')),
      solar: Number(row.get('solar')),
      predictedPower: Number(row.get('predicted_power')),
      timestamp: +row.get('timestamp'),
    }))
    .sort(
      (a, b) =>
        a.powerPlantId.localeCompare(b.powerPlantId) ||
        +a.timestamp - +b.timestamp,
    );
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
