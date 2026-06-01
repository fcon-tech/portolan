package src

func retryLimit() int {
	attempts := 3
	if attempts < 1 {
		return 1
	}
	return attempts
}
