package logger

import (
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/apex/log"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	mu     sync.Mutex
	Writer io.Writer
}

func New(w io.Writer) *Handler {
	return &Handler{
		Writer: w,
	}
}

// HandleLog implements log.Handler.
func (h *Handler) HandleLog(e *log.Entry) error {
	names := e.Fields.Names()

	h.mu.Lock()
	defer h.mu.Unlock()

	fmt.Fprintf(h.Writer, "%-25s", e.Message)

	for _, name := range names {
		fmt.Fprintf(h.Writer, "%v", e.Fields.Get(name))
	}

	fmt.Fprintln(h.Writer)

	return nil
}

func SetLevel(l log.Level) {
	log.SetLevel(l)
}

func SetHandler(h log.Handler) {
	log.SetHandler(h)
}

func Debugf(str string, v ...interface{}) {
	res := `[%s] ` + str
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Debugf(res, v...)
}

func FiberDebugf(str string, c *fiber.Ctx, v ...interface{}) {
	res := `[%s] %s -  XXX   %s      %s - ` + str
	v = append([]interface{}{c.Path()}, v...)
	v = append([]interface{}{c.Method()}, v...)
	v = append([]interface{}{c.IP()}, v...)
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Debugf(res, v...)
}

func Errorf(str string, v ...interface{}) {
	res := `[%s] ` + str
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Errorf(res, v...)
}

func FiberErrorf(str string, c *fiber.Ctx, v ...interface{}) {
	res := `[%s] %s -  XXX   %s      %s - ` + str
	v = append([]interface{}{c.Path()}, v...)
	v = append([]interface{}{c.Method()}, v...)
	v = append([]interface{}{c.IP()}, v...)
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Errorf(res, v...)
}

func Fatalf(str string, v ...interface{}) {
	res := `[%s] ` + str
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Fatalf(res, v...)
}

func FiberFatalf(str string, c *fiber.Ctx, v ...interface{}) {
	res := `[%s] %s -  XXX   %s      %s - ` + str
	v = append([]interface{}{c.Path()}, v...)
	v = append([]interface{}{c.Method()}, v...)
	v = append([]interface{}{c.IP()}, v...)
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Fatalf(res, v...)
}

func Infof(str string, v ...interface{}) {
	res := `[%s] ` + str
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Infof(res, v...)
}

func FiberInfof(str string, c *fiber.Ctx, v ...interface{}) {
	res := `[%s] %s -  XXX   %s      %s - ` + str
	v = append([]interface{}{c.Path()}, v...)
	v = append([]interface{}{c.Method()}, v...)
	v = append([]interface{}{c.IP()}, v...)
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Infof(res, v...)
}

func Warnf(str string, v ...interface{}) {
	res := `[%s] ` + str
	v = append([]interface{}{time.Now().Format("2006-01-02 15:04:05.000000 MST")}, v...)
	log.Warnf(res, v...)
}
