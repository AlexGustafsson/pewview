package frontend

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed dist
var dist embed.FS

func NewFrontend() http.Handler {
	resources := fs.FS(dist)
	static, _ := fs.Sub(resources, "dist")
	return http.FileServer(http.FS(static))
}
