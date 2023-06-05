# Plant Buddy with JS

Note: This Project is currently being worked on and improved

This demo is based of the [Plant Buddy IoT project](https://github.com/rickspencer3/plant-buddy) created by Rick Spencer. 

The goal:
This demo shows how InfluxDB can be successfully used as a storage backend for a Node server. Leverage SQL queries to filter and retrive your IoT data and then use  plotly to visualise. The below BPMN outlines the overall architecture and data flow(from the original python/flask project):
![PlantBuddy_Architecture](https://user-images.githubusercontent.com/45856600/135630864-a1d67f87-0789-47e2-b7e7-dbff583f91ea.png)

## Hardware List
List of hardware required to recreate demo: 
### Control Board
- [Arduino](https://store.arduino.cc/collections/most-popular/products/arduino-uno-rev3)

or
- [Argon / Boron](https://store.particle.io/collections/dev-kits/products/argon-kit)
### Sensor List
- [DS18B20 Temperature Sensor(Waterproof)](https://randomnerdtutorials.com/guide-for-ds18b20-temperature-sensor-with-arduino/)
- [Soil Moisture Sensor v1.2](https://how2electronics.com/interface-capacitive-soil-moisture-sensor-arduino/)
- [Photoresistor module](https://arduinomodules.info/ky-018-photoresistor-module/)
- [DH11 Temperature Humidity Sensor](https://create.arduino.cc/projecthub/pibots555/how-to-connect-dht11-sensor-with-arduino-uno-f4d239)

### Hardware Wiring
![Plant_Buddy_bb](/microcontroller/plant_buddy_arduino.png)

## Installation
```
npm install
```

## Setup
When setting up the project you will need to add your InfluxDB authentication information. You can do this by editing the copy of the `default_settings.js` file and changing the values it contains.


```
const INFLUXDB_HOST = 'http://localhost:8086';
const INFLUXDB_ORG = '<replace with your influxdb org ID>';
const INFLUXDB_BUCKET = 'plantbuddy';
const INFLUXDB_TOKEN = '<replace with your influxdb token>';
```


Later you will tell the server which settings to use with the `PLANTBUDDY_SETTINGS` environment variable.

You might need to change the port in serial_read.js depending on the device you are using:
```
port = '/dev/tty.usbmodem141101'
```

To run the project:
```
cd src/app
node app.js
```


## Troubleshooting

<img width="999" alt="Screen Shot 2022-01-13 at 10 18 28 AM" src="https://user-images.githubusercontent.com/6667389/149377837-ed3ae5c9-11e4-4a37-981a-bbd4393b9651.png">

This probably indicates that your data is not being loaded in from the IOT side. 


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
