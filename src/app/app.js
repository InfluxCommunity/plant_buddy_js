const express = require('express');
const app = express();
const { json } = require('express');
const path = require('path');
const axios = require('axios');
const influxHelper = require('./influx_helper.js');

const dash = require('dash');
const dbc = require('dash-bootstrap-components');
const px = require('plotly.js');

// Load configurations
app.set('default_settings', require('./default_settings.json'));
app.set('PLANTBUDDY_SETTINGS', process.env.PLANTBUDDY_SETTINGS);

// Dashboard is built using plotly's dash package. This also includes bootstap styles from dash_bootstrap
const server = app.listen(process.env.PORT || 5001, () => {
  console.log(`Server running on port ${server.address().port}`);
});
const dashboard = dash.Dash({
  external_stylesheets: [dbc.themes.BOOTSTRAP],
  suppress_callback_exceptions: true,
  server: server
});

const cloud_host = app.get('PLANTBUDDY_SETTINGS').INFLUXDB_HOST;
const cloud_org = app.get('PLANTBUDDY_SETTINGS').INFLUXDB_ORG;
const cloud_bucket = app.get('PLANTBUDDY_SETTINGS').INFLUXDB_BUCKET;
const cloud_token = app.get('PLANTBUDDY_SETTINGS').INFLUXDB_TOKEN;

const graph_default = {"deviceID": "eui-323932326d306512"};

const influx = influxHelper(host=cloud_host, org=cloud_org, bucket=cloud_bucket, token=cloud_token);

// Get user. Currently static refrence. Used to filter sensor data in InfluxDB
// TODO change this to login in page.
const users = require('./users.js');
const authorizeAndGetUser = users.authorize_and_get_user;

// This is our html snippets from the main_html file
const main_html = require('./main_html.js');
const sidebar = main_html.createNav();
dashboard.layout = main_html.layout(sidebar);

dashboard.callback(
    ({Output, Input}) => [
      Output("tab-content", "children"),
      Input("tabs", "active_tab"), Input("store", "data")
    ],
    (active_tab, data) => {
      /*
      This callback takes the 'active_tab' property as input, as well as the
      stored graphs, and renders the tab content depending on what the value of
      'active_tab' is.
      */
      if (active_tab && data != null) {
        if (active_tab == "temperature") {
          return dbc.Row(
            [
              dbc.Col(dbc.Card([dcc.Graph({figure: data.soil_temp_graph})],{style: {"width": "auto"}}), md=6),
              dbc.Col(dbc.Card([dcc.Graph({figure: data.air_temp_graph})],{style: {"width": "auto"}}), md=6),
            ]
          );
        } else if (active_tab == "hum_and_moisture") {
          return dbc.Row(
            [
              dbc.Col(dbc.Card([dcc.Graph({figure: data.humidity_graph})],{style: {"width": "auto"}}), md=6),
              dbc.Col(dbc.Card([dcc.Graph({figure: data.soil_moisture})],{style: {"width": "auto"}}), md=6),
            ]
          );
        } else if (active_tab == "light") {
          return dbc.Row(
            [
              dbc.Col(dbc.Card([dcc.Graph({figure: data.light_graph})],{style: {"width": "auto"}}), md=6),
              dbc.Col(dbc.Card([dcc.Graph({figure: data.light_graph})],{style: {"width": "auto"}}), md=6),
            ]
          );
        }
      }
      return "No tab selected";
    }
  );
  
  dashboard.callback(
    ({Output, Input}) => [Output("store", "data")],
    (n) => {
      /*
      Generate graphs based upon pandas data frame.
      */
      const df_st = influx.querydata("soil_temperature", graph_default.deviceID);
      const soil_temp_graph = px.line(df_st, {x: "time", y: "soil_temperature", title: "Soil Temperature"});
  
      const df_at = influx.querydata("air_temperature", graph_default.deviceID);
      const air_temp_graph = px.line(df_at, {x: "time", y: "air_temperature", title: "Air Temperature"});
  
      const df_hu = influx.querydata("humidity", graph_default.deviceID);
      const humidity_graph = px.line(df_hu, {x: "time", y: "humidity", title: "humidity"});
  
      const df_sm = influx.querydata("soil_moisture", graph_default.deviceID);
      const soil_moisture = px.line(df_sm, {x: "time", y: "soil_moisture", title: "Soil Moisture"});
  
      const df_li = influx.querydata("light", graph_default.deviceID);
      const light_graph = px.line(df_li, {x: "time", y: "light", title: "light"});
  
      // Save figures in a dictionary for sending to the dcc.Store
      return {
        soil_temp_graph: soil_temp_graph,
        air_temp_graph: air_temp_graph,
        humidity_graph: humidity_graph,
        soil_moisture: soil_moisture,
        light_graph: light_graph
      };
    }
  );
  
  app.post("/write", async (req, res) => {
    /*
    Server call used to write sensor data to InfluxDB
    */
    const user = authorizeAndGetUser(req);
    const d = influx.parse_line(req.body.toString('utf-8'), user.user_name);
    influx.write_to_influx(d);
    res.json({result: "OK"});
  });
  
  app.post("/notify", async (req, res) => {
    console.log("notification received");
    console.log(req.body);
    res.json({result: "OK"});
  });