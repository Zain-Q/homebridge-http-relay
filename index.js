const axios = require('axios');
const fs = require('fs');
const path = require('path');

let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-http-relay', 'HttpRelay', HttpRelay);
};

class HttpRelay {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.relayOnUrl = config.relayOnUrl;
    this.relayOffUrl = config.relayOffUrl;
    this.stateFile = config.stateFile || path.join(__dirname, `${this.name}_state.json`);
    this.type = config.type || 'switch'; // default type is switch

    // Create the appropriate service based on the type
    switch (this.type.toLowerCase()) {
      case 'light':
        this.service = new Service.Lightbulb(this.name);
        break;
      case 'fan':
        this.service = new Service.Fan(this.name);
        break;
      case 'switch':
      default:
        this.service = new Service.Switch(this.name);
        break;
    }

    // Create handlers for required characteristics
    this.service.getCharacteristic(Characteristic.On)
      .on('get', this.handleOnGet.bind(this))
      .on('set', this.handleOnSet.bind(this));

    // Start polling the file for updates
    this.startPolling();
  }

  /**
   * Handle requests to get the current value of the "On" characteristic
   */
  handleOnGet(callback) {
    this.log.debug('Triggered GET On');

    // Read the current state from the file
    const currentState = fs.existsSync(this.stateFile) ? fs.readFileSync(this.stateFile, 'utf8') : '0';
    const currentValue = currentState === '1';

    callback(null, currentValue);
  }

  /**
   * Handle requests to set the "On" characteristic
   */
  async handleOnSet(value, callback) {
    this.log.debug('Triggered SET On: ' + value);

    try {
      if (value) {
        await axios.get(this.relayOnUrl);
        this.log.debug('Relayed on successfully.');
      } else {
        await axios.get(this.relayOffUrl);
        this.log.debug('Relayed off successfully.');
      }

      // Save the current state to the file
      fs.writeFileSync(this.stateFile, value ? '1' : '0');
      callback(null);
    } catch (error) {
      this.log.error('Error setting relay state:', error);
      callback(error);
    }
  }

  /**
   * Start polling the state file for changes
   */
  startPolling() {
    const interval = 5000; // Poll every 5 seconds

    setInterval(() => {
      const currentState = fs.existsSync(this.stateFile) ? fs.readFileSync(this.stateFile, 'utf8') : '0';
      const currentValue = currentState === '1';

      // Update the characteristic if the state has changed
      this.service.getCharacteristic(Characteristic.On).updateValue(currentValue);
    }, interval);
  }

  /**
   * Required by Homebridge to retrieve available services for this accessory
   */
  getServices() {
    return [this.service];
  }
}
