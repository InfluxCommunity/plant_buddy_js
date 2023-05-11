const { SerialPort } = require('serialport')
const http = require('http');
const { pipeline } = require('stream');
const { Transform } = require('stream');
const argparse = require('argparse');
const threading = require('worker_threads');
const connectedPorts = [];

// Function to get a list of serial ports.
async function getSerialPorts() {
    const ports = await SerialPort.list();
    return ports.map(port => port.path);
}

// Simple class to write to a http server. In this case we are writing to a Node.js server.
class HttpWriter {
    constructor(url) {
        this.url = url;
    }

    send(sensordata) {
        console.log("Sending data to Node.js server");

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(sensordata)
            }
        };

        const req = http.request(this.url, options, res => {
            res.on('data', chunk => {
                console.log(chunk.toString());
            });
        });

        req.on('error', error => {
            console.error(error);
        });

        req.write(sensordata);
        req.end();
    }
}

// Custom wrapper class for connecting and reading from serial port.
class SerialDevice {
    constructor(httpWriter, port) {
        this.port = port;
        this.ser = null;
        this.baudrate = 9600;
        this.timeout = 1000;
        this.connected = false;
        this.httpWriter = httpWriter;
    }

    async connect() {
        // Establish a connection to the serial port. Also used to reconnect if the connection is lost.
        try {
            if (this.port === null) {
                const ports = await getSerialPorts();
                for (const port of ports) {
                    if (!connectedPorts.includes(port)) {
                        this.port = port;
                        break;
                    }
                }
            }

            this.ser = new SerialPort(this.port, { baudRate: this.baudrate, autoOpen: false });
            this.ser.on('open', () => {
                this.connected = true;
                connectedPorts.push(this.port);
                console.log(`Connected to ${this.port}`);
            });
            this.ser.on('error', error => {
                console.error(`Error - could not connect to serial port: ${error.message}`);
                this.port = null;
                this.ser = null;
                this.connected = false;
            });
            this.ser.open();
        } catch (error) {
            console.error(`Error - could not get serial ports: ${error.message}`);
        }
    }

    async disconnect() {
        // Disconnect from a serial port.
        await this.ser.close();
        this.connected = false;
        return true;
    }

    read() {
        // Wait until there is data waiting in the serial buffer.
        const transformStream = new Transform({
            transform(chunk, encoding, callback) {
                if (chunk) {
                    console.log("Reading data...");
                    this.httpWriter.send(chunk.toString('ascii'));
                }
                callback();
            }
        });

        pipeline(this.ser, transformStream, error => {
            if (error) {
                console.error(`Error reading data from serial port: ${error.message}`);
                this.connected = false;
                connectedPorts.splice(connectedPorts.indexOf(this.port), 1);
                setTimeout(() => this.connect(), 5000);
            }
        });
    }
}

async function main(port, args) {
    let url = 'http://localhost:5001/write';
    if (args.url) {
      url = args.url;
    }
    const writer = new HttpWriter(url);
  
    // We create a SerialDevice class instance. Then attempt to connect and read from port.
    const sd = new SerialDevice(writer, port);
    sd.connect();
    sd.read();
  }


if (require.main === module) {
  // Create argument parser to handle command line arguments.
  const parser = new argparse.ArgumentParser({ description: 'Connection information' });
  parser.addArgument('--url', { dest: 'url', type: 'string', help: 'url of node server' });
  const args = parser.parseArgs();

  // Get list of serial ports.
  getSerialPorts((err, ports) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    // Iterate through the list of ports and attempt to connect to each USB port.
    // Start a thread for USB ports.
    for (const port of ports) {
      if (port.includes('usb')) {
        const worker = new threading.Worker(main, [port, args]);
        worker.on('error', console.error);
        worker.on('exit', (code) => {
          console.log(`Worker stopped with exit code ${code}`);
        });
      } else {
        console.log(`Port: ${port} is not a USB port so will be skipped`);
      }
    }
  });
}