# Caption Me: Simplifying Image Captioning

**Caption Me** is designed to streamline the creation, management, and updating of image captions, empowering you to focus on what really matters.

---

<p align="center">
  <img src="assets/gen.png" alt="Caption Me Screenshot" width="400"/>
  <p align="center"><i>collage style, woman, looking at viewer, torn paper, magazine, newspaper</i></p>
</p>

---

[![Discord](https://img.shields.io/discord/1091306623819059300?color=7289da&label=Discord&logo=discord&logoColor=fff&style=for-the-badge)](https://discord.com/invite/m3TBB9XEkb)

<!-- toc -->

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  * [Automated Installer (Windows)](#automated-installer-windows)
  * [Manual Setup](#manual-setup)
- [Quickstart](#quickstart)
  * [Windows](#windows)
  * [macOS/Linux](#macoslinux)
- [Feedback & Support](#feedback--support)

<!-- tocstop -->

---

<p align="center">
  <img src="assets/screen-ui.png" alt="Caption Me Screenshot" width="600"/>
  <p align="center"><i>A modern interface dedicated to your captioning needs.</i></p>
</p>

---

## Introduction

**Caption Me** is built to simplify the image captioning process. Whether you're a professional or a hobbyist, setting up Caption Me is straightforward and intuitive.

## Prerequisites

To ensure a seamless experience, please install the following software:

- **Python 3**: Back-end operations
    - [Download Python 3](https://www.python.org/downloads/)
- **Node.js 18**: Dependency management
    - [Download Node.js 18](https://nodejs.org/en/download/)
- **Git**: Source code retrieval
    - [Download Git](https://git-scm.com/downloads)

---

## Installation

### Automated Installer (Windows)

1. **Download**: Obtain the `one-click-installer.bat` [here](https://github.com/failfa-st/caption-me/releases/tag/v0.1.0-alpha.2).
2. **Execute**: Double-click the `.bat` file.
3. **Launch**: Open `run.sh` in the newly-created `caption-me` directory.

> **Note**: Re-running `one-click-installer.bat` updates the software. Store it separately for convenience.
> ```
> ├── caption-me-root
> │   ├── one-click-installer.bat
> │   └── caption-me (auto-generated)
> ```

### Manual Setup

For Unix-based systems, follow these instructions:

1. **Clone Repository**
    ```bash
    git clone git@github.com:failfa-st/caption-me.git
    ```
2. **Enter Directory**
    ```bash
    cd caption-me
    ```
3. **Install Dependencies**
    ```bash
    npm install
    ```
4. **Compile App**
    ```bash
    npm run build
    ```
5. **Run App**
    ```bash
    npm start
    ```

---

## Quickstart

### Windows

- **Install**: Double-click `one-click-installer.bat`
- **Run**: Double-click `run.bat`

### macOS/Linux

- **One-liner**:
    ```bash
    npm install && npm run build && npm start
    ```

---

## Feedback & Support

We value your input. Reach out to us through these channels:

- **Chat**: Engage with our [Discord community](https://discord.com/invite/m3TBB9XEkb).
- **Issue Tracker**: Encountered a bug? Report it on [GitHub Issues](https://github.com/failfa-st/caption-me/issues).

---

Tailor your captioning experience with **Caption Me**. Thank you for choosing us.
