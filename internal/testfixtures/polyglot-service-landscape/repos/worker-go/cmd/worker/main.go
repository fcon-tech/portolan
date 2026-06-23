package main

import "fmt"

type Job struct {
	ID   string
	Kind string
}

func process(job Job) string {
	return fmt.Sprintf("%s:%s", job.Kind, job.ID)
}

func main() {
	fmt.Println(process(Job{ID: "fixture", Kind: "background"}))
}
