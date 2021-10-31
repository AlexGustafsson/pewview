package location

import (
	"encoding/json"
	"net"
	"os"
	"regexp"

	"go.uber.org/zap"
)

// FileProvider provides the location based on a rule file. The file contains
// a map of regular expressions mapped to the resulting location
type FileProvider struct {
	patterns map[*regexp.Regexp]*Location
	log      *zap.Logger
}

// NewFileProvider creates a new file provider
func NewFileProvider(path string, log *zap.Logger) (*FileProvider, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var expressions map[string]*Location
	if err := json.NewDecoder(file).Decode(&expressions); err != nil {
		return nil, err
	}

	patterns := make(map[*regexp.Regexp]*Location)
	for expression, location := range expressions {
		pattern, err := regexp.Compile(expression)
		if err != nil {
			return nil, err
		}

		patterns[pattern] = location
	}

	return &FileProvider{
		patterns: patterns,
		log:      log.With(zap.String("provider", "file")),
	}, nil
}

// Lookup implements LocationProvider
func (provider *FileProvider) Lookup(ip net.IP) (*Location, error) {
	address := ip.String()

	for pattern, location := range provider.patterns {
		if pattern.MatchString(address) {
			return location, nil
		}
	}

	return nil, ErrNotFound
}
