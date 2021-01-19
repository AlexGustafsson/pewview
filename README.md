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
pewview serve \
  --consumer.netflow \
  --geoip.ipapi
```

## Table of contents

[Quickstart](#quickstart)<br/>
[Features](#features)<br />
[Installation](#installation)<br />
[Usage](#usage)<br />
[Contributing](#contributing)

<a id="features"></a>
## Features

* Intuitive web interface with a 3D visualization
* High performance and scalable consumer
* Supports NetFlow v5, Netflow v9 / IPFIX and sFlow
* Stateless and usable via a single Docker container

<a id="installation"></a>
## Installation

### Using Homebrew

```sh
brew install alexgustafsson/tap/pewview
```

### Downloading a pre-built release

Download the latest release from [here](https://github.com/AlexGustafsson/pewview/releases).

### Build from source

Clone the repository.

```sh
git clone https://github.com/AlexGustafsson/pewview.git && cd pewview
```

Optionally check out a specific version.

```sh
git checkout v0.2.0
```

Build the application and frontend.

```sh
make build
```

## Usage
<a name="usage"></a>

_Note: This project is still actively being developed. The documentation is an ongoing progress._

```
Usage: pewview [global options] command [command options] [arguments]

Visualize internet traffic

Version: v0.2.0, build 920cc38. Built Tue Jan 19 11:57:17 CET 2021 using go version go1.15.6 darwin/amd64

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
   --consumer.ipfix                      Enable IPFIX / NetFlow v9 (default: false)
   --consumer.ipfix.address value        Address to listen on for IPFIX / NetFlow v9 traffic
   --consumer.ipfix.port value           Port to consume IPFIX / NetFlow v9 on (default: 2055)
   --consumer.netflow                    Enable NetFlow v5 (default: false)
   --consumer.netflow.address value      Address to listen on for NetFlow v5 traffic
   --consumer.netflow.port value         Port to consume NetFlow v5 on (default: 2056)
   --consumer.sflow                      Enable sFlow (default: false)
   --consumer.sflow.address value        Address to listen on for sFlow traffic
   --consumer.sflow.port value           Port to consume sFlow on (default: 6343)
   --geoip.geolite                       Use GeoLite2 as a GeoIP database (default: false)
   --geoip.geolite.path value            Path to GeoLite2-City.mmdb
   --geoip.ipgeolocation                 Use ipgeolocation.io as a GeoIP database (default: false)
   --geoip.ipgeolocation.key value       API key for ipgeolocation.io
   --geoip.ipapi                         Use ip-api.com as a GeoIP database (default: false)
   --web.root value                      The directory in which the UI lies (default: "./build/frontend")
   --web.address value                   Address to listen on web traffic
   --web.port value                      The port to use for web traffic (UI / API) (default: 8080)
   --metrics.window value                The number of seconds to summarize in a block (default: 60)
   --metrics.expose.bytes                Expose number of bytes sent in a connection (default: false)
   --metrics.expose.source-address       Expose source address of a connection (default: false)
   --metrics.expose.source-port          Expose source port of a connection (default: false)
   --metrics.expose.destination-address  Expose destination address of a connection (default: false)
   --metrics.expose.destination-port     Expose destination port of a connection (default: false)
```

## IP Geolocation configuration
<a name="geoip"></a>

### MaxMind's GeoLite2 (free, paid, offline)

MaxMind's database is available offline, either free or paid. The paid version comes with more and newer data.

1. Create a free account on [https://dev.maxmind.com/geoip/geoip2/geolite2/](https://dev.maxmind.com/geoip/geoip2/geolite2/)
2. Log in and go to the Download Files page under GeoIP2 / GeoLite 2
3. Right click on Download GZIP of the GeoLite2 City row and copy the link
4. Download the file using `wget --output-document geoip.gzip "<copied path>"`
5. Untar the file using `mkdir -p data/GeoLite && tar --strip=1 --directory data/GeoLite -xzvf geoip.gzip`

For evaluation, you can download test data from [maxmind/MaxMind-DB](https://github.com/maxmind/MaxMind-DB/blob/c46c33c3c598c648013e2aa7458f8492f4ecfcce/test-data/GeoIP2-City-Test.mmdb) and follow the same procedures as above.

Specify `--geoip.geolite --geoip.geolite.path ./data/GeoLite/GeoLite2-City.mmdb` when starting PewView.

### ipgeolocation.io (free, paid, online)

The [ipgeolocation.io](https://ipgeolocation.io) service has a free tier offering 1K requests a day, 30K a month. There are alternatives for up to 20M requests a month.

1. Create an account on [https://ipgeolocation.io](https://ipgeolocation.io)
2. Log in to get your API key

Specify `--geoip.ipgeolocation --geoip.ipgeolocation.key <key>` when starting PewView.

### ip-api.com (free, online)

The [ip-api.com](https://ip-api.com) service is free, but it is served over HTTP and limited to 40 requests per minute. The paid alternative is currently not supported.

Specify `--geoip.ipapi` when starting PewView.

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

### Contributors

This project was made possible by these two projects:

* [Cloudflare's goflow](https://github.com/cloudflare/goflow) - used for consuming network traffic
* [Vasco Asturiano's globe.gl](https://github.com/vasturiano/globe.gl) (and in turn Three.js) - used for rendering the globe in the frontend
