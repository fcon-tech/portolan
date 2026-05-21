package main

import (
	"fmt"

	"example.com/relationship-fixture/internal/worker"
	"github.com/example/direct"
)

func main() {
	fmt.Println(worker.Name(), direct.Name())
}
