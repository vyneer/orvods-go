package config

func IsPowerOfTwo(x int) bool {
	return (x != 0) && ((x & (x - 1)) == 0)
}
