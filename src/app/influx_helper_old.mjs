import {InfluxDB, Point} from '@influxdata/influxdb-client'
const { DataFrame } = require("pandas-js");
import {INFLUXDB_HOST, INFLUXDB_TOKEN, INFLUXDB_ORG, INFLUXDB_BUCKET} from './default_settings.mjs'
app.set('PLANTBUDDY_SETTINGS', process.env.PLANTBUDDY_SETTINGS);

class influxHelper {
  constructor() {
    // Ref to serial sensor samples.
    this.sensor_names = {
      LI: "light",
      HU: "humidity",
      ST: "soil_temperature",
      AT: "air_temperature",
      SM: "soil_moisture",
    };
    this.write_api = new InfluxDB({url, token}).getWriteApi(org, bucket, 'ns')
    this.query_api = new InfluxDB({url, token}).getQueryApi(org)
  }

  // The write to InfluxDB function formats the data point then writes to the database
  write_to_influx(data) {
    const p = new Point("sensor_data")
      .tag("user", data.user)
      .tag("device_id", data.device)
      .floatField(data.sensor_name, parseFloat(data.value));
    this.write_api.writePoint(p);
    console.log(p);
  }

  // The parse line function formats the data object
  parse_line(line, user_name) {
    const data = {
      device: line.substring(0, 2),
      sensor_name: this.sensor_names[line.substring(2, 4)] || "unknown",
      value: line.substring(4),
      user: user_name,
    };
    return data;
  }

  // Wrapper function used to query InfluxDB. Data query to data frame.
  async querydata(sensor_name, deviceID) {
    const query = flux`from(bucket: ${bucket}) |> range(start: -12h) |> filter(fn: (r) => r["_measurement"] == "sensor_data") |> filter(fn: (r) => r["device_id"] == ${deviceID}) |> filter(fn: (r) => r["_field"] == ${sensor_name})`
    const data = await queryApi.collectRows( query)
      data.forEach((x) => console.log(JSON.stringify(x)))
      console.log('\nCollect ROWS SUCCESS')
      return data
    }
}

module.exports = influxHelper;