const dbc = require("dash-bootstrap-components");
const html = require("dash").html;
const dcc = require("dash").dcc;
const base64 = require("base64-js");
const users = require("./users");

function layout(sidebar) {
  const MAIN_STYLE = {
    "margin-left": "4rem",
    "margin-right": "2rem",
    "padding": "2rem 2rem 2rem 8rem",
  };

  // Main HTML / Bootstrap structure for front-end app
  const layout = html.Div(
    [
      sidebar,
      dbc.Container([
        dcc.Store(id="store"),
        html.H1("Plant Buddy Dashboard"),
        html.Hr(),
        // Add your new tabs here.
        dbc.Tabs(
          [
            dbc.Tab(label="Overall Light", tab_id="light"),
            dbc.Tab(label="Soil and Room Temperature", tab_id="temperature"),
            dbc.Tab(label="Room Humidity and Soil Moisture", tab_id="hum_and_moisture")
          ],
          id="tabs",
          active_tab="light",
        ),
        html.Div(id="tab-content", className="p-4"),
      ], { style: MAIN_STYLE })
    ]
  );
  return layout;
}

function createNav() {
  const name = users.get_user_name();
  
  // the style arguments for the sidebar. We use position:fixed and a fixed width
  const SIDEBAR_STYLE = {
    "position": "fixed",
    "top": 0,
    "left": 0,
    "bottom": 0,
    "width": "18rem",
    "padding": "2rem 1rem",
    "background-color": "#f8f9fa",
  };
  
  const image_filename = 'src/static/logo.png'; // replace with your own image
  const encoded_image = base64.fromByteArray(fs.readFileSync(image_filename));
  
  const sidebar = html.Div(
    [
      html.Img(src='data:image/png;base64,' + encoded_image, alt="Logo"),
      html.Hr(),
      html.P(
        "Welcome: " + name, { className: "lead" }
      ),
      dbc.Nav(
        [
          dbc.Button(
            "Regenerate graphs",
            { color: "primary", id: "button", className: "mb-3" }
          )
        ],
        { vertical: true, pills: true }
      ),
      html.Hr(),
      html.P(
        "Click here to query InfluxDB for new data", { className: "lead" }
      ),
    ],
    { style: SIDEBAR_STYLE }
  );
  
  return sidebar;
}

module.exports = { layout, createNav };