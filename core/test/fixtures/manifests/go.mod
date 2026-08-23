module github.com/bigtop/harbor

go 1.22

require (
	github.com/stretchr/testify v1.9.0 // indirect
	gopkg.in/yaml.v3 v3.0.1
)

require github.com/google/uuid v1.6.0

replace github.com/old/exp => github.com/new/exp v2.0.0
