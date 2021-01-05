## IP Geolocation configuration

### Using an offline database

#### Maxmind's GeoLite2

1. Create a free account on https://dev.maxmind.com/geoip/geoip2/geolite2/
2. Log in and go to the Download Files page under GeoIP2 / GeoLite 2
3. Right click on Download GZIP of the GeoLite2 City row and copy the link
4. Download the file using `wget --output-document geoip.gzip "<copied path>"`
5. Untar the file using `mkdir -p data/GeoLite && tar --strip=1 --directory data/GeoLite -xzvf geoip.gzip`

For evaluation, you can download test data from [maxmind/MaxMind-DB](https://github.com/maxmind/MaxMind-DB/blob/c46c33c3c598c648013e2aa7458f8492f4ecfcce/test-data/GeoIP2-City-Test.mmdb) and follow the same procedures as above.

## Contributing

### Development

_Note: due to a bug (https://gcc.gnu.org/bugzilla/show_bug.cgi?id=93082, https://bugs.llvm.org/show_bug.cgi?id=44406, https://openradar.appspot.com/radar?id=4952611266494464), clang is required when building for macOS. GCC cannot be used._

```
CC=clang make server
```
