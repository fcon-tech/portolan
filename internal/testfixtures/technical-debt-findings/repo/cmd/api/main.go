package main

import (
	"os"

	_ "example.com/shared"
)

func main() {
	_ = os.Getenv("FEATURE_FAST_CHECKOUT")
}
