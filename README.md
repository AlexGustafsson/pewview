<p align="center">
  <img src=".github/banner.png" alt="Banner">
</p>
<p align="center">
  <a href="https://github.com/AlexGustafsson/pewview/blob/master/go.mod">
    <img src="https://shields.io/github/go-mod/go-version/AlexGustafsson/pewview" alt="Go Version" />
  </a>
  <a href="https://github.com/AlexGustafsson/pewview/releases">
    <img src="https://flat.badgen.net/github/release/AlexGustafsson/pewview" alt="Latest Release" />
  </a>
  <br>
  <strong><a href="#quickstart">Quick Start</a> | <a href="#contribute">Contribute</a> </strong>
</p>

# PewView
### A self-hosted network visualization on a 3D globe with support for IPFIX, Netflow and sFlow

Note: PewView is currently being actively developed. Until it reaches v1.0.0 breaking changes may occur in minor versions.

## Quickstart
<a name="quickstart"></a>

The service comes in two parts, an optional frontend and a high-throughput server based on [Cloudflare's goflow](https://github.com/cloudflare/goflow).

Whilst the two are intended to be used together, one may provide a custom frontend or chose to deactivate it completely in order to use PewView as a high-throughput consumer of IPFIX, NetFlow and sFlow.

First, download [the latest release](https://github.com/AlexGustafsson/pewview/releases) for your architecture, the frontend and unpack them.

You'll also need a GeoIP service to enable PewView to resolve IP addresses to locations. For instructions on setting some of them up, see [IP Geolocation configuration](#geoip).

The service can then be started like so:

```
./pewview serve \
  --netflow \
  --geoip.geolite \
  --geoip.geolite.path ./GeoLite2.mmdb \
  --web.root ./frontend
```

## Table of contents

[Quickstart](#quickstart)<br/>
[Features](#features)<br />
[Usage](#usage)<br />
[Contributing](#contributing)

<a id="features"></a>
## Features

* Intuitive web interface with a 3D visualization
* High performance and scalable consumer
* Supports NetFlow v5, Netflow v9 / IPFIX and sFlow
* Stateless and usable via a single Docker container

## Usage
<a name="usage"></a>

_Note: This project is still actively being developed. The documentation is an ongoing progress._

```
Usage: pewview [global options] command [command options] [arguments]

Visualize internet traffic

Version: v0.1.0, build 14844a6. Built Tue Jan  5 16:27:00 CET 2021 using go version go1.15.6 darwin/amd64

Options:
  --verbose   Enable verbose logging (default: false)
  --help, -h  show help (default: false)

Commands:
  serve    Start the server
  version  Show the application's version
  help     Shows a list of commands or help for one command

Run 'pewview help command' for more information on a command.
```

### Serve

```
Usage: pewview serve [options] [arguments]

Start the server

Options:
   --address value             Address to listen on
   --ipfix                     Enable IPFIX / NetFlow v9 (default: false)
   --ipfix.port value          Port to consume IPFIX / NetFlow v9 on (default: 2055)
   --netflow                   Enable NetFlow v5 (default: false)
   --netflow.port value        Port to consume NetFlow v5 on (default: 2056)
   --sflow                     Enable sFlow (default: false)
   --sflow.port value          Port to consume sFlow on (default: 6343)
   --geoip.geolite             Use GeoLite2 as a GeoIP database (default: false)
   --geoip.geolite.path value  Path to GeoLite2-City.mmdb
   --web.root value            The directory in which the UI lies (default: "./build/frontend")
   --web.port value            The port to use for web traffic (UI / API) (default: 8080)
```

## IP Geolocation configuration
<a name="geoip"></a>

### Maxmind's GeoLite2 (free, offline)

1. Create a free account on https://dev.maxmind.com/geoip/geoip2/geolite2/
2. Log in and go to the Download Files page under GeoIP2 / GeoLite 2
3. Right click on Download GZIP of the GeoLite2 City row and copy the link
4. Download the file using `wget --output-document geoip.gzip "<copied path>"`
5. Untar the file using `mkdir -p data/GeoLite && tar --strip=1 --directory data/GeoLite -xzvf geoip.gzip`

For evaluation, you can download test data from [maxmind/MaxMind-DB](https://github.com/maxmind/MaxMind-DB/blob/c46c33c3c598c648013e2aa7458f8492f4ecfcce/test-data/GeoIP2-City-Test.mmdb) and follow the same procedures as above.

## Contributing
<a name="contributing"></a>

Any help with the project is more than welcome. The project is still in its infancy and not recommended for production.

### Development

```sh
# Clone the repository
https://github.com/AlexGustafsson/pewview.git && cd pewview

# Show available commands
make help

# Build the project for the native target
make build
```

_Note: due to a bug (https://gcc.gnu.org/bugzilla/show_bug.cgi?id=93082, https://bugs.llvm.org/show_bug.cgi?id=44406, https://openradar.appspot.com/radar?id=4952611266494464), clang is required when building for macOS. GCC cannot be used. Build the server like so: `CC=clang make server`._
