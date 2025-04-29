![PROTEUS](https://github.com/user-attachments/assets/6d358692-8f27-4dd7-bf05-3eeaebbb27ce)

# PROTEUS

A [Playwright](http://playwright.dev/) implementation that assists in the analysis of web tracking, fingerprints and encryptions.\
It uses [Ray](https://myray.app/) as a display.

![Preview](https://github.com/user-attachments/assets/19371508-89a7-439e-ae16-ff471cd2ea5f)

## Installation

To install the project, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/ntanis-dev/proteus.git
   cd proteus
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Copy and edit the `env.json` file to your liking, read below for more information.
  ```sh
  cp env.json.example env.json
  nano env.json
  ```

## Usage

To run the project, use the following command:
```sh
npm start
```

To cleanup the project's storage, use the following command:
```sh
npm run cleanmup
```

## `env.json` Properties

- `proxy`:
  - `server`: The proxy server address.
  - `username`: The proxy username, which can include a session placeholder `{SESSION}`.
  - `password`: The proxy password, which can include a session placeholder `{SESSION}`.
  - `enabled`: Whether the proxy is enabled (true/false).
- `forceSession`: Force a specific browser session (null or session string).
- `startUrl`: The URL to start the browser with (null or URL string).
- `viewport`:
  - `width`: The width of the viewport.
  - `height`: The height of the viewport.
- `overrides`:
  - `regex`: The regex pattern of the request URL to match.
  - `file`: The file to use as an override.
  - `enabled`: Whether the override is enabled (true/false).
- `blocks`:
  - `regex`: The regex pattern of the request URL to match.
  - `enabled`: Whether the block is enabled (true/false).
- `devtools`: Whether to enable devtools (true/false).
