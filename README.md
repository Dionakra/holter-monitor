# Holter Monitor Simulator
This project aims to show in a simple way the results of a Holter Monitor data in a web app by uploading both the `.dat`and `.hea`files for its plotting.

## Usage
When in https://holter.boix.dev, drag and drop the two needed files from the same measurement or one by one. Once the app detects that there is one `.dat`and one `.hea`file, it will try to show the different channels detected in the files.

## Development
### Prerrequisites
* NodeJS 20

### Installation
```sh
git clone https://github.com/Dionakra/holter-monitor.git
cd holter-monitor
npm install
```

### Running
```sh
npm run dev -- --open
```

## References
* [SHDB-AF: a Japanese Holter ECG database of atrial fibrillation](https://physionet.org/content/shdb-af/1.0.0/)
* [Holter ECG .dat file](https://paulbourke.net/dataformats/holter/)