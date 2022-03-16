# ACRN Configurator

This version based on tauri, WIP.

## Features

### Support Platforms

- [x] Linux (.deb, AppImage)
- [x] Windows 7,8,10 (.exe, .msi)
- [x] macOS (.app, .dmg)


## Setting Up

### 1. Install System Dependencies

Please follow [this guide](https://tauri.studio/docs/getting-started/prerequisites)
to install system dependencies **(include yarn)**.

### 2. Clone Project And Install Dependencies.

#### Linux

```bash
sudo apt install git
git clone https://github.com/projectacrn/acrn-hypervisor
cd acrn-hypervisor/misc/config_tools/configurator
python3 -m pip install -r requirements.txt
yarn
```

#### Windows && macOS

Similar as Linux. 

In macOS need install git and python3 by brew. 

In Windows need install git and python3 by chocolatey or manual and replace command-line `python3` to `py -3`.

### 3. How To Build

#### Linux

Run this command in the acrn-hypervisor directory.

```shell
make configurator
```

#### Windows/macOS

Run follow command in the 'acrn-hypervisor' directory. 

```shell
python3 misc/config_tools/scenario_config/schema_slicer.py
python3 misc/config_tools/scenario_config/xs2js.py
cd misc/config_tools/configurator
yarn build
```

### 4. How To Run

#### Linux

Run this command in the acrn-hypervisor directory.

```shell
sudo apt install ./build/acrn-configurator_*.deb
acrn-configurator
```

#### Windows/macOS

You can find msi(Windows)/dmg(macOS) folder under the 
'misc/config_tools/configurator/src-tauri/target/release/bundle'
directory, the installer in the folder.

