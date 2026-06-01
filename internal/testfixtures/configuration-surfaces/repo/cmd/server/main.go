package main

import "os"

func main() {
	_ = os.Getenv("PAYMENTS_API_URL")
	_ = os.Getenv("PAYMENTS_API_TOKEN")
	_ = os.Getenv("FEATURE_FAST_CHECKOUT")
}
