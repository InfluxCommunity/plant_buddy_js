const { InfluxDB } = require("@influxdata/influxdb-client");
const FlightSQLClient = require("flightsql").FlightSQLClient;
const { DataFrame } = require("pandas-js");

class influxHelper {
  constructor(org, bucket, token, host = "https://us-east-1-1.aws.cloud2.influxdata.com") {
    this.client = new InfluxDB({
      url: host,
      token: token,
      org: org,
      timeout: 30000,
    });

    // This is our flight client setup, it's how we will query from IOX
    // We need to remove the "https://" from our host
    host = host.split("://")[1];
    this.flight_client = new FlightSQLClient({
      host: host,
      token: token,
      metadata: { "bucket-name": bucket },
    });

    this.cloud_bucket = bucket;
    this.cloud_org = org;

    // Ref to serial sensor samples.
    this.sensor_names = {
      LI: "light",
      HU: "humidity",
      ST: "soil_temperature",
      AT: "air_temperature",
      SM: "soil_moisture",
    };

    this.write_api = this.client.getWriteApi(org, bucket);
    this.query_api = this.client.getQueryApi(org);
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

  // Wrapper function used to query InfluxDB. Calls SQL script with parameters. Data query to data frame.
  async querydata(sensor_name, deviceID) {
    const query = `SELECT ${sensor_name}, time FROM sensor_data WHERE time > (NOW() - INTERVAL '2 HOURS') AND device_id='${deviceID}'`;

    const result = await this.flight_client.execute(query);
    const reader = this.flight_client.getReader(result.endpoints[0].ticket);
    const table = await reader.readAll();
    console.log(table);

    // Convert to Pandas DataFrame
    const df = new DataFrame(table);
    df.sortValues("time", true, true);
    console.log(df);
    return df;
  }
}

module.exports = influxHelper;