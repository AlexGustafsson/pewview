package commands

import (
	"fmt"
	"github.com/AlexGustafsson/pewview/version"
	"github.com/urfave/cli/v2"
)

func versionCommand(context *cli.Context) error {
	return printVersion()
}

func printVersion() error {
	fmt.Println(version.FullVersion())

	return nil
}
