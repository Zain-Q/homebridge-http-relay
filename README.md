# homebridge-http-relay

Run "npm install" in the plugin directory.

Configuration example;

{
  "accessories": [
    {
      "accessory": "switchPlugin",
      "name": "Relay 1",
      "swirchOnUrl": "http://example.com/on/relay1",
      "swirchOffUrl": "http://example.com/off/relay1",
      "stateFile": "/path/to/relay1_state.st"
    },
    {
      "accessory": "switchPlugin",
      "name": "Relay 2",
      "swirchOnUrl": "http://example.com/on/relay2",
      "swirchOffUrl": "http://example.com/off/relay2",
      "stateFile": "/path/to/relay2_state.st"
    }
  ]
}