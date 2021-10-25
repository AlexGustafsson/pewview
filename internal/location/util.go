package location

import "net"

// LookupPair looks up two pairs at once
func LookupPair(providers []Provider, source net.IP, destination net.IP) (*LookupResultPair, error) {
	sourceResult, err := providers[0].Lookup(source)
	if err != nil {
		return nil, err
	}

	destinationResult, err := providers[0].Lookup(destination)
	if err != nil {
		return nil, err
	}

	return &LookupResultPair{
		Source:      sourceResult,
		Destination: destinationResult,
	}, nil
}

func ProviderFromConfig(config map[string]interface{}) (Provider, error) {
	return nil, nil
}
