const axios = require('axios');
const fs = require('fs');

module.exports = (api) => {
  api.registerAccessory('switchPlugin', switchAccessory);
};

class switchAccessory {

  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.switchOnUrl = config.switchOnUrl;
    this.switchOffUrl = config.switchOffUrl;
    this.stateFile = config.stateFile;
    this.api = api;

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    // extract name from config
    this.name = config.name;

    // create a new switch service
    this.service = new this.Service.switch(this.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    // start polling the file for updates
    this.startPolling();
  }

  /**
   * Handle requests to get the current value of the "On" characteristic
   */
  async handleOnGet() {
    this.log.debug('Triggered GET On');

    // Read the current state from the file
    const currentState = fs.existsSync(this.stateFile) ? fs.readFileSync(this.stateFile, 'utf8') : '0';
    const currentValue = currentState === '1';

    return currentValue;
  }

  /**
   * Handle requests to set the "On" characteristic
   */
  async handleOnSet(value) {
    this.log.debug('Triggered SET On: ' + value);

    try {
      if (value) {
        await axios.get(this.switchOnUrl);
        this.log.debug('Switched on successfully.');
      } else {
        await axios.get(this.switchOffUrl);
        this.log.debug('Switched off successfully.');
      }

      // Save the current state to the file
      fs.writeFileSync(this.stateFile, value ? '1' : '0');
    } catch (error) {
      this.log.error('Error setting light state:', error);
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
      this.service.getCharacteristic(this.Characteristic.On).updateValue(currentValue);
    }, interval);
  }

  /**
   * Required by Homebridge to retrieve available services for this accessory
   */
  getServices() {
    return [this.service];
  }
}