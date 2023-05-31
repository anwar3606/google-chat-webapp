# Google Chat - unofficial desktop application

[![latest-tag](https://badgen.net/github/release/anwar3606/google-chat-webapp)](https://github.com/anwar3606/google-chat-webapp/releases)
[![downloads](https://img.shields.io/github/downloads/anwar3606/google-chat-webapp/total?cacheSeconds=3600)](https://somsubhra.github.io/github-release-stats/?username=anwar3606&repository=google-chat-webapp&page=1&per_page=30)

An unofficial desktop application for the Google Chat built with Eletron.js

## Major features

* System tray
    - Close the app to tray when you close the app window
* Desktop notifications
    - Clicking on notification bring the app to focus and open the specific person chat/room
* Unread message counter in dock
* Unread indicator in tray
* Auto start the app when you log in to your machine

## Installation

### Windows

* You can install this app by [downloading](https://github.com/anwar3606/google-chat-webapp/releases) the (.exe)
  installer
* If there is any warning from Windows Defender just ignore it by clicking: More info -> Run anyway

### Ubuntu or Debian based linux

* You can download the latest debian package (.deb)
  from [release](https://github.com/anwar3606/google-chat-webapp/releases) section
* Install the debian package (.deb) with this command:

```bash
sudo dpkg -i ~/path/to/chat_xxx_amd64.deb
```

### RHEL/Fedora/CentOS

* You can download the latest rpm package from [release](https://github.com/anwar3606/google-chat-webapp/releases)
  section
* Install the rpm package with this command

```bash
sudo rpm -i ~/path/to/chat_xxx_amd64.rpm
```

or

```bash
sudo dnf localinstall ~/path/to/chat_xxx_amd64.rpm
```

### Mac

* Download the zip (darwin) file from [releases](https://github.com/anwar3606/google-chat-webapp/releases)
* Extract the zip file
* Move the app to your `~/Applications` folder
* Fix the permission issue with this command

```bash
sudo xattr -rd com.apple.quarantine ~/Applications/******.app
```

or

* You can also use the AppImage/dmg file for installation

## Acknowledgements

* [@anwar3606](https://github.com/anwar3606) for the whole project
* [@mdyamin007](https://github.com/mdyamin007) for some enhancements

## Disclaimer

This desktop application is simply a wrapper that launches a local web instance and runs the google chat web application
inside of it. [Google Inc.](https://en.wikipedia.org/wiki/Google) retains all ownership rights to
the [Google Chat](https://chat.google.com) service.

This application cannot access any of your data with this desktop client.

